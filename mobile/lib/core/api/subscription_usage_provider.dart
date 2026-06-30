import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/user.dart';
import '../auth/auth_provider.dart';

final subscriptionUsageProvider =
    FutureProvider<SubscriptionUsage>((ref) async {
  final api = ref.watch(apiClientProvider);
  debugPrint('[NOVAIS parity] mobile usage endpoint: /auth/user-profile');
  final res = await api.dio.get('/auth/user-profile');
  final data = res.data is Map
      ? Map<String, dynamic>.from(res.data)
      : <String, dynamic>{};
  final usage = data['subscription_usage'] is Map
      ? SubscriptionUsage.fromJson(
          Map<String, dynamic>.from(data['subscription_usage'] as Map),
        )
      : (() {
          final rawLimit =
              data['course_limit'] is int ? data['course_limit'] as int : 1;
          final limit = rawLimit == -1 ? -1 : rawLimit.clamp(1, 999999);
          return SubscriptionUsage(limit: limit, used: 0, remaining: limit);
        })();
  debugPrint(
    '[NOVAIS parity] mobile usage response: used=${usage.used}, limit=${usage.limit}, remaining=${usage.remaining}',
  );
  return usage;
});
