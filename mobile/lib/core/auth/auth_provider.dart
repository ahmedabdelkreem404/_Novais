import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../api/api_client.dart';
import '../../models/user.dart';

// ─── Singleton providers ────────────────────────────────────────────────────

final storageProvider = Provider<FlutterSecureStorage>(
  (_) => const FlutterSecureStorage(),
);

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(storageProvider);
  return ApiClient(storage: storage);
});

Future<String?> _safeRead(FlutterSecureStorage storage, String key) async {
  try {
    return await storage.read(key: key);
  } on PlatformException {
    await storage.deleteAll();
    return null;
  }
}

Future<void> _safeWrite(
    FlutterSecureStorage storage, String key, String value) async {
  try {
    await storage.write(key: key, value: value);
  } on PlatformException {
    await storage.deleteAll();
    await storage.write(key: key, value: value);
  }
}

// ─── Theme ───────────────────────────────────────────────────────────────────

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>(
  (ref) => ThemeModeNotifier(),
);

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.dark) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final dark = prefs.getBool('dark_mode') ?? true;
    state = dark ? ThemeMode.dark : ThemeMode.light;
  }

  Future<void> toggle() async {
    final prefs = await SharedPreferences.getInstance();
    final newDark = state != ThemeMode.dark;
    state = newDark ? ThemeMode.dark : ThemeMode.light;
    await prefs.setBool('dark_mode', newDark);
  }
}

// ─── Locale ──────────────────────────────────────────────────────────────────

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>(
  (ref) => LocaleNotifier(),
);

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('en')) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final lang = prefs.getString('language') ?? 'en';
    state = Locale(lang);
  }

  Future<void> setLanguage(String lang) async {
    final prefs = await SharedPreferences.getInstance();
    state = Locale(lang);
    await prefs.setString('language', lang);
    const storage = FlutterSecureStorage();
    await _safeWrite(storage, 'language', lang);
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
    final token = await _safeRead(_storage, 'jwt_token');
    if (token == null) {
      state = state.copyWith(status: AuthStatus.unauthenticated);
      return;
    }
    try {
      final res = await _apiClient.dio.get('/auth/user-profile');
      final user = AppUser.fromJson(res.data['user'] ?? res.data);
      state = state.copyWith(status: AuthStatus.authenticated, user: user);
    } catch (_) {
      await _storage.delete(key: 'jwt_token');
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  Future<String> _getDeviceId() async {
    String? deviceId = await _safeRead(_storage, 'device_id');
    if (deviceId == null) {
      deviceId = const Uuid().v4();
      await _safeWrite(_storage, 'device_id', deviceId);
    }
    return deviceId;
  }

  Future<bool> login(String email, String password) async {
    try {
      final deviceId = await _getDeviceId();
      final res = await _apiClient.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
        'device_id': deviceId,
      });
      final token = res.data['token'] ?? res.data['access_token'];
      await _safeWrite(_storage, 'jwt_token', token.toString());
      final userData = res.data['user'];
      if (userData is Map<String, dynamic> && userData.isNotEmpty) {
        final user = AppUser.fromJson(userData);
        state = state.copyWith(status: AuthStatus.authenticated, user: user);
      }
      await refreshUser();
      if (state.user == null) {
        state = state.copyWith(status: AuthStatus.authenticated);
      }
      return true;
    } on Exception catch (e) {
      state = state.copyWith(error: e.toString());
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
        await _safeWrite(_storage, 'jwt_token', token.toString());
        final user = AppUser.fromJson(res.data['user'] ?? {});
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
    try {
      await _apiClient.dio.post('/auth/logout');
    } catch (_) {}
    await _storage.deleteAll();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  Future<void> refreshUser() async {
    try {
      final res = await _apiClient.dio.get('/auth/user-profile');
      final user = AppUser.fromJson(res.data['user'] ?? res.data);
      state = state.copyWith(status: AuthStatus.authenticated, user: user);
    } catch (_) {}
  }
}
