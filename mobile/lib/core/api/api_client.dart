import 'package:dio/dio.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:uuid/uuid.dart';

const String _kDeviceIdKey = 'device_id';

Future<String?> _safeRead(FlutterSecureStorage storage, String key) async {
  try {
    return await storage.read(key: key);
  } on PlatformException {
    await storage.deleteAll();
    return null;
  }
}

Future<void> _safeWrite(FlutterSecureStorage storage, String key, String value) async {
  try {
    await storage.write(key: key, value: value);
  } on PlatformException {
    await storage.deleteAll();
    await storage.write(key: key, value: value);
  }
}

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
    ]);
  }
}

class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  _AuthInterceptor(this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _safeRead(_storage, 'jwt_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    final lang = await _safeRead(_storage, 'language') ?? 'en';
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

class _DeviceInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  _DeviceInterceptor(this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    String? deviceId = await _safeRead(_storage, _kDeviceIdKey);
    if (deviceId == null) {
      deviceId = const Uuid().v4();
      await _safeWrite(_storage, _kDeviceIdKey, deviceId);
    }
    options.headers['X-Device-ID'] = deviceId;
    handler.next(options);
  }
}
