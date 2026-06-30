import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/content_blueprint.dart';
import '../auth/auth_provider.dart';
import 'endpoints.dart';

final contentBlueprintsProvider =
    FutureProvider<List<ContentBlueprint>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.contentBlueprints);
  final data = res.data;
  if (data is List) {
    return data
        .whereType<Map>()
        .map((item) =>
            ContentBlueprint.fromJson(Map<String, dynamic>.from(item)))
        .where((item) => item.enabled)
        .toList();
  }
  return const [];
});
