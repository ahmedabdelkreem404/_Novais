import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';

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

    // Determine title based on route logic or just generic
    // Actually DashboardNavbar just shows logo + generic icons.
    // We can show Logo in center or left.

    return Scaffold(
      key: _scaffoldKey,
      drawer: const AppSidebar(),
      appBar: AppBar(
        leading: IconButton(
          key: const Key('shell_menu_button'),
          icon: const Icon(Icons.menu),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.white.withAlpha(10)
                    : Colors.blue.withAlpha(20),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(Icons.auto_awesome,
                  color: AppColors.primary, size: 16),
            ),
            const SizedBox(width: 8),
            // On larger screens, maybe show title? For now just logo like web mobile.
          ],
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.home_outlined),
            onPressed: () => context.go('/dashboard'),
          ),
          IconButton(
            icon: const Icon(Icons.language),
            onPressed: () {
              // TODO: Toggle Language logic (via provider)
            },
          ),
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode_outlined),
            onPressed: () {
              // TODO: Toggle Theme logic (via provider)
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
