import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/api/platform_config_provider.dart';
import '../../core/api/notifications_provider.dart';

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
  void initState() {
    super.initState();
    Future.microtask(() async {
      try {
        await ref.read(notificationActionsProvider).registerDevice();
      } catch (_) {
        // Notification device registration should never block the shell.
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final isAuthenticated = auth.status == AuthStatus.authenticated;
    final location = _location(context);
    final canPop = _canPop(context);
    final canGoHome = location != '/' && location != '/dashboard';

    final configAsync = ref.watch(platformConfigProvider);
    final showThemeToggle = !configAsync.hasValue ||
        (configAsync.value!.systemThemeMode != 'light_only' &&
            configAsync.value!.systemThemeMode != 'dark_only');

    return Scaffold(
      key: _scaffoldKey,
      drawerScrimColor: Colors.black.withAlpha(isDark ? 170 : 110),
      drawer: const AppSidebar(),
      appBar: AppBar(
        leading: canPop
            ? IconButton(
                key: const Key('shell_back_button'),
                tooltip: l10n.t('go_back'),
                icon: const Icon(Icons.arrow_back),
                onPressed: () => context.pop(),
              )
            : IconButton(
                key: const Key('shell_menu_button'),
                tooltip: l10n.t('menu'),
                icon: const Icon(Icons.menu),
                onPressed: () => _scaffoldKey.currentState?.openDrawer(),
              ),
        titleSpacing: 0,
        title: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: () => context.go(isAuthenticated ? '/dashboard' : '/'),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
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
          ),
        ),
        centerTitle: false,
        actions: [
          if (isAuthenticated)
            IconButton(
              key: const Key('shell_notification_button'),
              tooltip: l10n.t('notifications'),
              icon: const Icon(Icons.notifications_none_outlined),
              onPressed: () => context.go('/notifications'),
            ),
          if (isAuthenticated && canGoHome)
            IconButton(
              key: const Key('shell_home_button'),
              tooltip: l10n.t('dashboard'),
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
              onPressed: () => ref.read(themeModeProvider.notifier).toggle(),
            ),
          const SizedBox(width: 6),
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

  bool _canPop(BuildContext context) {
    try {
      return GoRouter.of(context).canPop();
    } catch (_) {
      return false;
    }
  }

  String _location(BuildContext context) {
    try {
      return GoRouterState.of(context).uri.path;
    } catch (_) {
      return '/dashboard';
    }
  }
}
