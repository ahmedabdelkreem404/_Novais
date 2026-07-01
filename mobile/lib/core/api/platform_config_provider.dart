import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/platform_config.dart';
import '../auth/auth_provider.dart';
import 'endpoints.dart';

final platformConfigProvider = FutureProvider<PlatformConfig>((ref) async {
  final timer = Timer.periodic(const Duration(seconds: 15), (_) {
    ref.invalidateSelf();
  });
  ref.onDispose(timer.cancel);

  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.platformConfig);
  final data = res.data ?? {};
  return PlatformConfig.fromJson(data);
});
