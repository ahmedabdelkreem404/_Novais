import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/platform_config.dart';
import '../auth/auth_provider.dart';
import '../debug/novais_diagnostics.dart';
import 'endpoints.dart';

final platformConfigProvider = FutureProvider<PlatformConfig>((ref) async {
  Timer? refreshTimer;
  ref.onDispose(() => refreshTimer?.cancel());

  final api = ref.watch(apiClientProvider);
  final watch = NovaisDiagnostics.start('Startup', 'platform settings fetch');
  final res = await api.dio.get(
    ApiEndpoints.platformConfig,
    options: Options(extra: {
      'skipAuth': true,
      'skipDevice': true,
      'skipCache': true,
    }),
  );
  final data = res.data ?? {};
  NovaisDiagnostics.finish(
    'Startup',
    'platform settings fetch',
    watch,
    status: '${res.statusCode}',
  );
  final config = PlatformConfig.fromJson(data);
  refreshTimer = Timer(const Duration(seconds: 15), ref.invalidateSelf);
  return config;
});
