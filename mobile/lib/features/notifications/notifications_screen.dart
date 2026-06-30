import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/notifications_provider.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/widgets.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inboxAsync = ref.watch(notificationsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l10n = context.l10n;
    final languageCode = Localizations.localeOf(context).languageCode;

    return Scaffold(
      backgroundColor:
          isDark ? const Color(0xFF050816) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(l10n.t('notifications')),
        actions: [
          TextButton(
            onPressed: () =>
                ref.read(notificationActionsProvider).markAllRead(),
            child: Text(l10n.t('mark_all_read')),
          ),
        ],
      ),
      body: inboxAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: NvEmptyState(
            icon: Icons.notifications_off_outlined,
            title: l10n.t('failed_load_notifications'),
            subtitle: l10n.t('pull_to_retry'),
            action: NvButton(
              label: l10n.t('retry'),
              width: 150,
              onTap: () => ref.invalidate(notificationsProvider),
            ),
          ),
        ),
        data: (inbox) {
          if (inbox.items.isEmpty) {
            return Center(
              child: Text(
                l10n.t('no_notifications'),
                style:
                    TextStyle(color: isDark ? Colors.white70 : Colors.black54),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(notificationsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: inbox.items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = inbox.items[index];
                return InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: item.isRead
                      ? null
                      : () => ref
                          .read(notificationActionsProvider)
                          .markRead(item.id),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: item.isRead
                            ? (isDark ? Colors.white10 : Colors.grey[200]!)
                            : AppColors.primary.withAlpha(120),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: AppColors.primary
                                .withAlpha(item.isRead ? 25 : 45),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.notifications_outlined,
                              color: AppColors.primary, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.titleFor(languageCode),
                                style: TextStyle(
                                  fontWeight: item.isRead
                                      ? FontWeight.w600
                                      : FontWeight.w800,
                                  color: isDark ? Colors.white : Colors.black,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                item.bodyFor(languageCode),
                                style: TextStyle(
                                  fontSize: 13,
                                  height: 1.35,
                                  color:
                                      isDark ? Colors.white60 : Colors.black54,
                                ),
                              ),
                              if (item.createdAt != null) ...[
                                const SizedBox(height: 8),
                                Text(
                                  item.createdAt!
                                      .toLocal()
                                      .toString()
                                      .split('.')
                                      .first,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (!item.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            margin: const EdgeInsets.only(top: 4),
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
