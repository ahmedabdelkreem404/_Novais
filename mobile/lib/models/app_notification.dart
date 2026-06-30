class AppNotification {
  final int id;
  final String title;
  final String body;
  final String type;
  final DateTime? readAt;
  final DateTime? createdAt;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    this.readAt,
    this.createdAt,
  });

  bool get isRead => readAt != null;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] is int ? json['id'] : int.tryParse('${json['id']}') ?? 0,
      title: json['title']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
      type: json['type']?.toString() ?? 'info',
      readAt: DateTime.tryParse(json['read_at']?.toString() ?? ''),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? ''),
    );
  }
}

class NotificationInbox {
  final List<AppNotification> items;
  final int unreadCount;

  const NotificationInbox({
    required this.items,
    required this.unreadCount,
  });

  factory NotificationInbox.fromJson(Map<String, dynamic> json) {
    final rawItems = json['data'];
    return NotificationInbox(
      items: rawItems is List
          ? rawItems
              .whereType<Map>()
              .map((item) =>
                  AppNotification.fromJson(Map<String, dynamic>.from(item)))
              .toList()
          : const [],
      unreadCount: json['unread_count'] is int
          ? json['unread_count']
          : int.tryParse('${json['unread_count']}') ?? 0,
    );
  }
}
