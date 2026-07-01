import 'dart:async';

import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../api/api_client.dart';
import '../cache/api_cache.dart';
import '../debug/novais_diagnostics.dart';
import '../../models/user.dart';

const Duration _secureStorageTimeout = Duration(seconds: 2);

// ─── Singleton providers ────────────────────────────────────────────────────

final storageProvider = Provider<FlutterSecureStorage>(
  (_) => const FlutterSecureStorage(),
);

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(storageProvider);
  return ApiClient(storage: storage);
});

// ─── Theme ───────────────────────────────────────────────────────────────────

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>(
  (ref) => ThemeModeNotifier(),
);

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.system) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final mode = prefs.getString('theme_mode');
    if (mode == 'dark') {
      state = ThemeMode.dark;
      return;
    }
    if (mode == 'light') {
      state = ThemeMode.light;
      return;
    }

    final legacyDark = prefs.getBool('dark_mode');
    if (legacyDark != null) {
      state = legacyDark ? ThemeMode.dark : ThemeMode.light;
      return;
    }

    state = ThemeMode.system;
  }

  Future<void> toggle() async {
    final prefs = await SharedPreferences.getInstance();
    final newDark = state != ThemeMode.dark;
    state = newDark ? ThemeMode.dark : ThemeMode.light;
    await prefs.setBool('dark_mode', newDark);
    await prefs.setString('theme_mode', newDark ? 'dark' : 'light');
  }
}

// ─── Locale ──────────────────────────────────────────────────────────────────

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>(
  (ref) => LocaleNotifier(),
);

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(_deviceLocale()) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final lang = prefs.getString('language');
    if (lang == null) return;
    state = Locale(lang);
  }

  Future<void> setLanguage(String lang) async {
    final prefs = await SharedPreferences.getInstance();
    state = Locale(lang);
    await prefs.setString('language', lang);
    const storage = FlutterSecureStorage();
    await storage.write(key: 'language', value: lang);
  }

  static Locale _deviceLocale() {
    final deviceLang =
        WidgetsBinding.instance.platformDispatcher.locale.languageCode;
    return Locale(deviceLang == 'ar' ? 'ar' : 'en');
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) {
    final storage = ref.watch(storageProvider);
    final apiClient = ref.watch(apiClientProvider);
    return AuthNotifier(storage: storage, apiClient: apiClient);
  },
);

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final AppUser? user;
  final String? error;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
  });

  AuthState copyWith({AuthStatus? status, AppUser? user, String? error}) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final FlutterSecureStorage _storage;
  final ApiClient _apiClient;

  AuthNotifier(
      {required FlutterSecureStorage storage, required ApiClient apiClient})
      : _storage = storage,
        _apiClient = apiClient,
        super(const AuthState()) {
    _checkToken();
  }

  Future<void> _checkToken() async {
    final watch = NovaisDiagnostics.start('Auth', 'bootstrap token check');
    _debugAuth('bootstrap token check started');
    final token = await _safeRead('jwt_token');
    if (token == null) {
      _debugAuth('bootstrap token missing');
      state = state.copyWith(status: AuthStatus.unauthenticated);
      NovaisDiagnostics.finish(
        'Auth',
        'bootstrap token check',
        watch,
        status: 'missing',
      );
      return;
    }
    try {
      final user = await _fetchAndPersistUser();
      _debugAuth('bootstrap profile loaded user=${user.id}');
      state = state.copyWith(status: AuthStatus.authenticated, user: user);
      NovaisDiagnostics.finish(
        'Auth',
        'bootstrap token check',
        watch,
        status: 'authenticated',
      );
    } catch (e) {
      _debugAuth('bootstrap profile failed: ${_debugError(e)}');
      await _clearSensitiveSession();
      state = const AuthState(
        status: AuthStatus.unauthenticated,
        error: 'Session expired. Please sign in again.',
      );
      NovaisDiagnostics.finish(
        'Auth',
        'bootstrap token check',
        watch,
        status: 'failed',
      );
    }
  }

  Future<String> _getDeviceId() async {
    final watch = NovaisDiagnostics.start('Auth', 'device id load');
    String? deviceId = await _safeRead('device_id');
    if (deviceId == null) {
      deviceId = const Uuid().v4();
      await _safeWrite('device_id', deviceId);
    }
    NovaisDiagnostics.finish('Auth', 'device id load', watch);
    return deviceId;
  }

  Future<bool> login(String email, String password) async {
    final watch = NovaisDiagnostics.start('Auth', 'login flow');
    try {
      _debugAuth('login started for email=${_maskedEmail(email)}');
      final deviceId = await _getDeviceId();
      final res = await _apiClient.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
        'device_id': deviceId,
      });
      final token = res.data['token'] ?? res.data['access_token'];
      if (token == null || token.toString().isEmpty) {
        throw const FormatException('Login response did not include a token.');
      }
      await _safeWrite('jwt_token', token.toString());
      final user = await _fetchAndPersistUser(
        fallback: res.data is Map ? res.data['user'] : null,
      );
      await _safeWrite('user_id', user.id.toString());
      _debugAuth('login completed user=${user.id}');
      state = state.copyWith(status: AuthStatus.authenticated, user: user);
      NovaisDiagnostics.finish('Auth', 'login flow', watch, status: 'ok');
      return true;
    } on Exception catch (e) {
      _debugAuth('login failed: ${_debugError(e)}');
      await _safeDelete('jwt_token');
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: _friendlyAuthError(e),
      );
      NovaisDiagnostics.finish('Auth', 'login flow', watch, status: 'failed');
      return false;
    }
  }

  Future<bool> register(Map<String, dynamic> data) async {
    try {
      final deviceId = await _getDeviceId();
      final payload = Map<String, dynamic>.from(data);
      payload['device_id'] = deviceId;

      final res = await _apiClient.dio.post('/auth/register', data: payload);
      final token = res.data['token'] ?? res.data['access_token'];
      if (token != null) {
        await _safeWrite('jwt_token', token.toString());
        final user = AppUser.fromJson(res.data['user'] ?? {});
        await _safeWrite('user_id', user.id.toString());
        state = state.copyWith(status: AuthStatus.authenticated, user: user);
      } else {
        // Needs email verification
        state = state.copyWith(status: AuthStatus.unauthenticated);
      }
      return true;
    } on Exception catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<void> loginWithGoogle() async {
    // Placeholder for Google Sign-In.
    // In a real app, use google_sign_in package to get token, then backend.
    // For now, we just simulate a delay or throw.
    await Future.delayed(const Duration(seconds: 1));
    throw UnimplementedError('Google Sign-In not configured yet');
  }

  Future<void> logout() async {
    final watch = NovaisDiagnostics.start('Auth', 'logout flow');
    _debugAuth('logout started');
    try {
      await _apiClient.dio.post('/auth/logout');
    } catch (_) {}
    await _clearSensitiveSession();
    _debugAuth('logout completed');
    state = const AuthState(status: AuthStatus.unauthenticated);
    NovaisDiagnostics.finish('Auth', 'logout flow', watch);
  }

  Future<void> refreshUser() async {
    try {
      final user = await _fetchAndPersistUser();
      state = state.copyWith(user: user);
    } catch (e) {
      _debugAuth('refresh profile failed: ${_debugError(e)}');
      state = state.copyWith(error: _friendlyAuthError(e));
    }
  }

  Future<AppUser> _fetchAndPersistUser({dynamic fallback}) async {
    final watch = NovaisDiagnostics.start('Auth', 'profile fetch');
    try {
      final res = await _apiClient.dio.get('/auth/user-profile');
      final user = AppUser.fromJson(res.data['user'] ?? res.data);
      if (user.id <= 0 || user.email.isEmpty) {
        throw const FormatException('Profile response is incomplete.');
      }
      await _safeWrite('user_id', user.id.toString());
      NovaisDiagnostics.finish('Auth', 'profile fetch', watch, status: 'api');
      return user;
    } catch (_) {
      if (fallback is Map && fallback.isNotEmpty) {
        final user = AppUser.fromJson(Map<String, dynamic>.from(fallback));
        if (user.id > 0 && user.email.isNotEmpty) {
          await _safeWrite('user_id', user.id.toString());
          NovaisDiagnostics.finish(
            'Auth',
            'profile fetch',
            watch,
            status: 'fallback',
          );
          return user;
        }
      }
      NovaisDiagnostics.finish('Auth', 'profile fetch', watch,
          status: 'failed');
      rethrow;
    }
  }

  Future<void> _clearSensitiveSession() async {
    await ApiCache.clearAll();
    await _safeDeleteAll();
  }

  Future<String?> _safeRead(String key) async {
    try {
      return await _storage.read(key: key).timeout(_secureStorageTimeout);
    } on TimeoutException {
      _debugAuth('secure storage read timed out for $key');
      return null;
    } on PlatformException catch (error) {
      _debugAuth('secure storage read failed for $key: ${error.code}');
      unawaited(_safeDeleteAll());
      return null;
    }
  }

  Future<void> _safeWrite(String key, String value) async {
    try {
      await _storage
          .write(key: key, value: value)
          .timeout(_secureStorageTimeout);
    } on TimeoutException {
      _debugAuth('secure storage write timed out for $key');
      rethrow;
    } on PlatformException catch (error) {
      _debugAuth('secure storage write failed for $key: ${error.code}');
      unawaited(_safeDeleteAll());
      rethrow;
    }
  }

  Future<void> _safeDelete(String key) async {
    try {
      await _storage.delete(key: key).timeout(_secureStorageTimeout);
    } on TimeoutException {
      _debugAuth('secure storage delete timed out for $key');
    } on PlatformException catch (error) {
      _debugAuth('secure storage delete failed for $key: ${error.code}');
      unawaited(_safeDeleteAll());
    }
  }

  Future<void> _safeDeleteAll() async {
    try {
      await _storage.deleteAll().timeout(_secureStorageTimeout);
    } on TimeoutException {
      _debugAuth('secure storage deleteAll timed out');
    } on PlatformException catch (error) {
      _debugAuth('secure storage deleteAll failed: ${error.code}');
    }
  }

  String _friendlyAuthError(Object error) {
    if (error is DioException) {
      final status = error.response?.statusCode;
      final data = error.response?.data;
      if (data is Map) {
        final message = data['message'] ?? data['error'];
        if (message is String && message.trim().isNotEmpty) {
          return message;
        }
        final errors = data['errors'];
        if (errors is Map && errors.isNotEmpty) {
          final first = errors.values.first;
          if (first is List && first.isNotEmpty) return first.first.toString();
          return first.toString();
        }
      }
      if (status == 401 || status == 422) {
        return 'Invalid email or password.';
      }
      if (status != null && status >= 500) {
        return 'Server error. Please try again shortly.';
      }
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.sendTimeout) {
        return 'Connection timed out. Please try again.';
      }
      return 'Could not connect to NOVAIS. Please check your connection.';
    }
    if (error is FormatException) {
      return 'Sign in could not be completed. Please try again.';
    }
    return 'Login failed. Please try again.';
  }

  String _maskedEmail(String email) {
    final parts = email.split('@');
    if (parts.length != 2 || parts.first.length <= 2) return '***';
    return '${parts.first.substring(0, 2)}***@${parts.last}';
  }

  String _debugError(Object error) {
    if (error is DioException) {
      return 'DioException(status=${error.response?.statusCode}, type=${error.type.name})';
    }
    return error.runtimeType.toString();
  }

  void _debugAuth(String message) {
    NovaisDiagnostics.log('Auth', message);
  }
}
