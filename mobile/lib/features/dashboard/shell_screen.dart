import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/api/platform_config_provider.dart';

import '../../widgets/app_sidebar.dart';

class ShellScreen extends ConsumerStatefulWidget {
  final Widget child;
  const ShellScreen({super.key, required this.child});

  @override
  ConsumerState<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends ConsumerState<ShellScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l10n = context.l10n;

    // Determine title based on route logic or just generic
    // Actually DashboardNavbar just shows logo + generic icons.
    // We can show Logo in center or left.

    final configAsync = ref.watch(platformConfigProvider);
    final showThemeToggle = !configAsync.hasValue ||
        (configAsync.value!.systemThemeMode != 'light_only' &&
            configAsync.value!.systemThemeMode != 'dark_only');

    bool canPop = false;
    try {
      canPop = GoRouter.of(context).canPop();
    } catch (_) {}

    return Scaffold(
      key: _scaffoldKey,
      drawerScrimColor: Colors.black.withAlpha(isDark ? 170 : 110),
      drawer: const AppSidebar(),
      appBar: AppBar(
        leading: canPop
            ? IconButton(
                key: const Key('shell_back_button'),
                icon: const Icon(Icons.arrow_back),
                onPressed: () => context.pop(),
              )
            : IconButton(
                key: const Key('shell_menu_button'),
                icon: const Icon(Icons.menu),
                onPressed: () => _scaffoldKey.currentState?.openDrawer(),
              ),
        title: Row(
          children: [
            Image.asset(
              'assets/images/logo.png',
              width: 28,
              height: 28,
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 8),
            const Text(
              'NOVAIS',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
          ],
        ),
        centerTitle: false,
        actions: [
          IconButton(
            key: const Key('shell_notification_button'),
            tooltip: 'Notifications',
            icon: const Icon(Icons.notifications_none_outlined),
            onPressed: () => _showNotificationsDialog(context),
          ),
          IconButton(
            icon: const Icon(Icons.home_outlined),
            onPressed: () => context.go('/dashboard'),
          ),
          IconButton(
            key: const Key('shell_language_button'),
            tooltip: l10n.t('language'),
            icon: const Icon(Icons.language),
            onPressed: () {
              final current = ref.read(localeProvider).languageCode;
              ref
                  .read(localeProvider.notifier)
                  .setLanguage(current == 'ar' ? 'en' : 'ar');
            },
          ),
          if (showThemeToggle)
            IconButton(
              key: const Key('shell_theme_button'),
              tooltip: l10n.t('toggle_theme'),
              icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode_outlined),
              onPressed: () {
                ref.read(themeModeProvider.notifier).toggle();
              },
            ),
          const SizedBox(width: 8),
        ],
        backgroundColor: isDark ? const Color(0xFF0F0F0F) : Colors.white,
        surfaceTintColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: isDark ? const Color(0xFF2A2A2A) : Colors.grey[200],
            height: 1,
          ),
        ),
      ),
      body: widget.child,
    );
  }

  void _showNotificationsDialog(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? const Color(0xFF0F0F0F) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      Localizations.localeOf(context).languageCode == 'ar'
                          ? 'الإشعارات'
                          : 'Notifications',
                      style: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const Divider(),
                const SizedBox(height: 10),
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFF3B82F6),
                    child:
                        Icon(Icons.auto_awesome, color: Colors.white, size: 18),
                  ),
                  title: Text(
                    Localizations.localeOf(context).languageCode == 'ar'
                        ? 'مرحباً بك في نوفايس!'
                        : 'Welcome to NOVAIS!',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  subtitle: Text(
                    Localizations.localeOf(context).languageCode == 'ar'
                        ? 'ابدأ بإنشاء دورتك التعليمية الأولى بالذكاء الاصطناعي الآن.'
                        : 'Start generating your first AI-powered course today.',
                    style: const TextStyle(fontSize: 11),
                  ),
                  trailing: const Text('Just now',
                      style: TextStyle(fontSize: 9, color: Colors.grey)),
                ),
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Colors.green,
                    child: Icon(Icons.check, color: Colors.white, size: 18),
                  ),
                  title: Text(
                    Localizations.localeOf(context).languageCode == 'ar'
                        ? 'تم تحديث إعدادات المنصة'
                        : 'Platform Config Synced',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  subtitle: Text(
                    Localizations.localeOf(context).languageCode == 'ar'
                        ? 'تمت مزامنة تفضيلات المظهر والخطوط مع الخادم بنجاح.'
                        : 'Branding and theme overrides synchronized with server.',
                    style: const TextStyle(fontSize: 11),
                  ),
                  trailing: const Text('5m ago',
                      style: TextStyle(fontSize: 9, color: Colors.grey)),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        );
      },
    );
  }
}
