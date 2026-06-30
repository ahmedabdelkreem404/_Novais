import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/app_notification.dart';
import '../auth/auth_provider.dart';
import 'endpoints.dart';

final notificationsProvider = FutureProvider<NotificationInbox>((ref) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.notifications);
  final data = res.data is Map
      ? Map<String, dynamic>.from(res.data)
      : <String, dynamic>{};
  return NotificationInbox.fromJson(data);
});

final notificationActionsProvider = Provider<NotificationActions>((ref) {
  return NotificationActions(ref);
});

class NotificationActions {
  final Ref _ref;

  NotificationActions(this._ref);

  Future<void> markRead(int id) async {
    final api = _ref.read(apiClientProvider);
    await api.dio.post(ApiEndpoints.readNotification(id));
    _ref.invalidate(notificationsProvider);
  }

  Future<void> markAllRead() async {
    final api = _ref.read(apiClientProvider);
    await api.dio.post(ApiEndpoints.readAllNotifications);
    _ref.invalidate(notificationsProvider);
  }

  Future<void> registerDevice({String? pushToken}) async {
    final api = _ref.read(apiClientProvider);
    await api.dio.post(ApiEndpoints.notificationDevices, data: {
      'platform': 'android',
      'push_token': pushToken,
    });
  }
}
