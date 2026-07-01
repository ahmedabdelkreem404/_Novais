import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import '../debug/novais_diagnostics.dart';

class ApiCache {
  static const _prefix = 'api_cache';

  final SharedPreferences _prefs;
  final String userId;

  ApiCache(this._prefs, {required this.userId});

  static Future<ApiCache> create({String userId = 'anonymous'}) async {
    return ApiCache(await SharedPreferences.getInstance(), userId: userId);
  }

  String _key(String key) => '$_prefix:$userId:$key';

  Future<void> writeJson(
    String key,
    Object? value, {
    Duration ttl = const Duration(minutes: 5),
  }) async {
    final watch = NovaisDiagnostics.start('Cache', 'writeJson $key');
    await _prefs.setString(
      _key(key),
      jsonEncode({
        'expires_at': DateTime.now().add(ttl).millisecondsSinceEpoch,
        'value': value,
      }),
    );
    NovaisDiagnostics.finish('Cache', 'writeJson $key', watch);
  }

  Future<dynamic> readJson(String key) async {
    final watch = NovaisDiagnostics.start('Cache', 'readJson $key');
    final raw = _prefs.getString(_key(key));
    if (raw == null) {
      NovaisDiagnostics.finish('Cache', 'readJson $key', watch, status: 'miss');
      return null;
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) {
        NovaisDiagnostics.finish(
          'Cache',
          'readJson $key',
          watch,
          status: 'invalid',
        );
        return null;
      }

      final expiresAt = decoded['expires_at'];
      if (expiresAt is! int ||
          DateTime.now().millisecondsSinceEpoch >= expiresAt) {
        await _prefs.remove(_key(key));
        NovaisDiagnostics.finish(
          'Cache',
          'readJson $key',
          watch,
          status: 'expired',
        );
        return null;
      }

      NovaisDiagnostics.finish('Cache', 'readJson $key', watch, status: 'hit');
      return decoded['value'];
    } catch (_) {
      await _prefs.remove(_key(key));
      NovaisDiagnostics.finish('Cache', 'readJson $key', watch,
          status: 'error');
      return null;
    }
  }

  Future<void> clear() async {
    final watch = NovaisDiagnostics.start('Cache', 'clear user=$userId');
    final userPrefix = '$_prefix:$userId:';
    final keys = _prefs.getKeys().where((key) => key.startsWith(userPrefix));
    for (final key in keys.toList()) {
      await _prefs.remove(key);
    }
    NovaisDiagnostics.finish('Cache', 'clear user=$userId', watch);
  }

  static Future<void> clearAll() async {
    final watch = NovaisDiagnostics.start('Cache', 'clearAll');
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys().where((key) => key.startsWith('$_prefix:'));
    for (final key in keys.toList()) {
      await prefs.remove(key);
    }
    NovaisDiagnostics.finish('Cache', 'clearAll', watch);
  }
}
