class AppNotification {
  final int id;
  final String title;
  final String body;
  final String type;
  final Map<String, dynamic> data;
  final DateTime? readAt;
  final DateTime? createdAt;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.data,
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
      data: Map<String, dynamic>.from(json['data'] ?? {}),
      readAt: DateTime.tryParse(json['read_at']?.toString() ?? ''),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? ''),
    );
  }

  String titleFor(String languageCode) {
    final localized = data['localized'];
    if (localized is Map && localized[languageCode] is Map) {
      final value = Map<String, dynamic>.from(localized[languageCode] as Map);
      return value['title']?.toString() ?? title;
    }
    return title;
  }

  String bodyFor(String languageCode) {
    final localized = data['localized'];
    if (localized is Map && localized[languageCode] is Map) {
      final value = Map<String, dynamic>.from(localized[languageCode] as Map);
      return value['body']?.toString() ?? body;
    }
    return body;
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
