import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/l10n/app_localizations.dart';

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

    return Scaffold(
      key: _scaffoldKey,
      drawerScrimColor: Colors.black.withAlpha(isDark ? 170 : 110),
      drawer: const AppSidebar(),
      appBar: AppBar(
        leading: IconButton(
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
}
