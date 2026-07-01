import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:uuid/uuid.dart';
import '../cache/api_cache.dart';
import '../debug/novais_diagnostics.dart';
import 'safe_json.dart';

const String _kDeviceIdKey = 'device_id';
const Duration _secureStorageTimeout = Duration(seconds: 2);

class ApiClient {
  static const String _baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8000/api', // Android emulator → localhost
  );

  static String resolveMediaUrl(String url) {
    final parsed = Uri.tryParse(url);
    if (parsed == null || parsed.hasScheme) return url;

    final base = Uri.parse(_baseUrl);
    final origin = '${base.scheme}://${base.authority}';
    return Uri.parse(origin).resolve(url).toString();
  }

  late final Dio dio;
  final FlutterSecureStorage _storage;

  ApiClient({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage() {
    dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 60),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
    dio.transformer = SyncTransformer(jsonDecodeCallback: decodeNovaisJson);

    dio.interceptors.addAll([
      _AuthInterceptor(_storage),
      _DeviceInterceptor(_storage),
      _DevApiTraceInterceptor(),
      _GetCacheInterceptor(_storage),
    ]);
  }
}

class _DevApiTraceInterceptor extends Interceptor {
  bool _shouldTrace(RequestOptions options) {
    return kDebugMode &&
        (options.path.startsWith('/auth/') ||
            options.path == '/auth/user-profile' ||
            options.path == '/platform-settings');
  }

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    options.extra['novaisStartedAt'] = DateTime.now().microsecondsSinceEpoch;
    if (_shouldTrace(options)) {
      NovaisDiagnostics.log(
        'API',
        'request ${options.method} ${options.path} '
            'hasAuth=${options.headers.containsKey('Authorization')} '
            'hasDevice=${options.headers.containsKey('X-Device-ID')}',
      );
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (_shouldTrace(response.requestOptions)) {
      NovaisDiagnostics.log(
        'API',
        'response ${response.statusCode} '
            '${response.requestOptions.method} ${response.requestOptions.path} '
            'duration=${_durationMs(response.requestOptions)}ms',
      );
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (_shouldTrace(err.requestOptions)) {
      NovaisDiagnostics.log(
        'API',
        'error ${err.response?.statusCode ?? 'network'} '
            '${err.requestOptions.method} ${err.requestOptions.path}: '
            '${err.type.name} duration=${_durationMs(err.requestOptions)}ms',
      );
    }
    handler.next(err);
  }

  int _durationMs(RequestOptions options) {
    final startedAt = options.extra['novaisStartedAt'];
    if (startedAt is! int) return -1;
    final elapsed = DateTime.now().microsecondsSinceEpoch - startedAt;
    return (elapsed / 1000).round();
  }
}

class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  _AuthInterceptor(this._storage);

  @override
  void onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    if (options.extra['skipAuth'] == true) {
      handler.next(options);
      return;
    }
    final watch = NovaisDiagnostics.start('Auth', 'request credentials read');
    final token = await _safeRead('jwt_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    final lang = await _safeRead('language') ?? 'en';
    options.headers['Accept-Language'] = lang;
    NovaisDiagnostics.finish('Auth', 'request credentials read', watch);
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      await _safeDelete('jwt_token');
      // Auth state will react to token being gone
    }
    handler.next(err);
  }

  Future<String?> _safeRead(String key) async {
    try {
      return await _storage.read(key: key).timeout(_secureStorageTimeout);
    } on TimeoutException {
      NovaisDiagnostics.log('Auth', 'secure storage read timed out for $key');
      return null;
    } on PlatformException catch (error) {
      if (kDebugMode) {
        NovaisDiagnostics.log(
          'Auth',
          'secure storage read failed for $key: ${error.code}',
        );
      }
      return null;
    }
  }

  Future<void> _safeDelete(String key) async {
    try {
      await _storage.delete(key: key).timeout(_secureStorageTimeout);
    } on TimeoutException {
      NovaisDiagnostics.log('Auth', 'secure storage delete timed out for $key');
    } on PlatformException catch (error) {
      if (kDebugMode) {
        NovaisDiagnostics.log(
          'Auth',
          'secure storage delete failed for $key: ${error.code}',
        );
      }
    }
  }
}

class _GetCacheInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;

  _GetCacheInterceptor(this._storage);

  String _cacheKey(RequestOptions options) {
    final query = options.queryParameters.entries
        .map((entry) => '${entry.key}=${entry.value}')
        .join('&');
    return query.isEmpty ? options.path : '${options.path}?$query';
  }

  Future<ApiCache> _cache() async {
    final userId = await _safeReadUserId();
    return ApiCache.create(userId: userId);
  }

  Future<String> _safeReadUserId() async {
    try {
      return await _storage
              .read(key: 'user_id')
              .timeout(_secureStorageTimeout) ??
          'anonymous';
    } on TimeoutException {
      NovaisDiagnostics.log('Cache', 'secure storage user_id read timed out');
      return 'anonymous';
    } on PlatformException catch (error) {
      if (kDebugMode) {
        NovaisDiagnostics.log(
          'Cache',
          'secure storage user_id read failed: ${error.code}',
        );
      }
      return 'anonymous';
    }
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) async {
    if (response.requestOptions.extra['skipCache'] == true) {
      handler.next(response);
      return;
    }
    if (response.requestOptions.method.toUpperCase() == 'GET' &&
        response.statusCode != null &&
        response.statusCode! >= 200 &&
        response.statusCode! < 300) {
      final watch = NovaisDiagnostics.start(
          'Cache', 'write ${response.requestOptions.path}');
      final cache = await _cache();
      await cache.writeJson(_cacheKey(response.requestOptions), response.data);
      NovaisDiagnostics.finish(
          'Cache', 'write ${response.requestOptions.path}', watch);
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.requestOptions.extra['skipCache'] == true) {
      handler.next(err);
      return;
    }
    if (err.requestOptions.method.toUpperCase() == 'GET') {
      final watch = NovaisDiagnostics.start(
          'Cache', 'fallback ${err.requestOptions.path}');
      final cache = await _cache();
      final cached = await cache.readJson(_cacheKey(err.requestOptions));
      if (cached != null) {
        NovaisDiagnostics.finish(
            'Cache', 'fallback ${err.requestOptions.path}', watch,
            status: 'hit');
        handler.resolve(Response(
          requestOptions: err.requestOptions,
          statusCode: 200,
          data: cached,
          extra: {'from_cache': true},
        ));
        return;
      }
      NovaisDiagnostics.finish(
          'Cache', 'fallback ${err.requestOptions.path}', watch,
          status: 'miss');
    }
    handler.next(err);
  }
}

class _DeviceInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  _DeviceInterceptor(this._storage);

  @override
  void onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    if (options.extra['skipDevice'] == true) {
      handler.next(options);
      return;
    }
    String? deviceId = await _safeReadDeviceId();
    if (deviceId == null) {
      deviceId = const Uuid().v4();
      await _safeWriteDeviceId(deviceId);
    }
    options.headers['X-Device-ID'] = deviceId;
    handler.next(options);
  }

  Future<String?> _safeReadDeviceId() async {
    try {
      return await _storage
          .read(key: _kDeviceIdKey)
          .timeout(_secureStorageTimeout);
    } on TimeoutException {
      NovaisDiagnostics.log('Auth', 'secure storage device_id read timed out');
      return null;
    } on PlatformException catch (error) {
      if (kDebugMode) {
        NovaisDiagnostics.log(
          'Auth',
          'secure storage device_id read failed: ${error.code}',
        );
      }
      return null;
    }
  }

  Future<void> _safeWriteDeviceId(String deviceId) async {
    try {
      await _storage
          .write(key: _kDeviceIdKey, value: deviceId)
          .timeout(_secureStorageTimeout);
    } on TimeoutException {
      NovaisDiagnostics.log('Auth', 'secure storage device_id write timed out');
    } on PlatformException catch (error) {
      if (kDebugMode) {
        NovaisDiagnostics.log(
          'Auth',
          'secure storage device_id write failed: ${error.code}',
        );
      }
    }
  }
}
