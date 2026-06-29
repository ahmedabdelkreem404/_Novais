import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/platform_config.dart';
import '../auth/auth_provider.dart';
import 'endpoints.dart';

final platformConfigProvider = FutureProvider<PlatformConfig>((ref) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.platformConfig);
  final data = res.data ?? {};
  return PlatformConfig.fromJson(data);
});
