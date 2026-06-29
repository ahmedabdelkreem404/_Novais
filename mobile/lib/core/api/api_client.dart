import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:uuid/uuid.dart';
import '../cache/api_cache.dart';

const String _kDeviceIdKey = 'device_id';

class ApiClient {
  static const String _baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8000/api', // Android emulator → localhost
  );

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

    dio.interceptors.addAll([
      _AuthInterceptor(_storage),
      _DeviceInterceptor(_storage),
      _GetCacheInterceptor(_storage),
    ]);
  }
}

class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  _AuthInterceptor(this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.read(key: 'jwt_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    final lang = await _storage.read(key: 'language') ?? 'en';
    options.headers['Accept-Language'] = lang;
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      await _storage.delete(key: 'jwt_token');
      // Auth state will react to token being gone
    }
    handler.next(err);
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
    final userId = await _storage.read(key: 'user_id') ?? 'anonymous';
    return ApiCache.create(userId: userId);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) async {
    if (response.requestOptions.method.toUpperCase() == 'GET' &&
        response.statusCode != null &&
        response.statusCode! >= 200 &&
        response.statusCode! < 300) {
      final cache = await _cache();
      await cache.writeJson(_cacheKey(response.requestOptions), response.data);
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.requestOptions.method.toUpperCase() == 'GET') {
      final cache = await _cache();
      final cached = await cache.readJson(_cacheKey(err.requestOptions));
      if (cached != null) {
        handler.resolve(Response(
          requestOptions: err.requestOptions,
          statusCode: 200,
          data: cached,
          extra: {'from_cache': true},
        ));
        return;
      }
    }
    handler.next(err);
  }
}

class _DeviceInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  _DeviceInterceptor(this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    String? deviceId = await _storage.read(key: _kDeviceIdKey);
    if (deviceId == null) {
      deviceId = const Uuid().v4();
      await _storage.write(key: _kDeviceIdKey, value: deviceId);
    }
    options.headers['X-Device-ID'] = deviceId;
    handler.next(options);
  }
}
