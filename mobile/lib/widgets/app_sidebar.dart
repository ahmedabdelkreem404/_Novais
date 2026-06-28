import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/theme/app_theme.dart';
import '../core/auth/auth_provider.dart';

class AppSidebar extends ConsumerWidget {
  const AppSidebar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF0F0F0F) : Colors.white;
    final border = isDark ? const Color(0xFF2A2A2A) : Colors.grey[200]!;

    return Drawer(
      backgroundColor: bg,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
      child: Column(
        children: [
          // Logo Area
          Container(
            height:
                64, // h-14 * 4 = 56, adjusted for status bar padding if needed
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: border)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            alignment: Alignment.centerLeft,
            child: SafeArea(
              bottom: false,
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.white.withAlpha(10)
                          : Colors.blue.withAlpha(20),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.auto_awesome,
                        color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'NOVAIS',
                    style: TextStyle(
                      fontFamily: 'PlusJakartaSans',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : Colors.black,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const Spacer(),
                  SizedBox(
                    width: 48,
                    height: 48,
                    child: IconButton(
                      tooltip: 'Close menu',
                      icon: Icon(Icons.close,
                          color: isDark ? Colors.white70 : Colors.black54),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Scale for mobile drawer width usually 304, but web sidebar is 255.
          // Drawer fills width. We let it fill.

          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
              children: [
                const _NavItem(
                  icon: Icons.home_outlined,
                  label: 'Home',
                  path: '/dashboard',
                  selectedIcon: Icons.home,
                ),
                const _NavItem(
                  icon: Icons.headphones_outlined,
                  label: 'Audio Courses',
                  path: '/audio',
                  selectedIcon: Icons.headphones,
                ),
                const _NavItem(
                  icon: Icons.person_outline,
                  label: 'Profile',
                  path: '/profile',
                  selectedIcon: Icons.person,
                ),
                const _NavItem(
                  icon: Icons.monetization_on_outlined,
                  label: 'Pricing',
                  path: '/pricing',
                  selectedIcon: Icons.monetization_on,
                ),

                const SizedBox(height: 16),

                // Generate Course Button
                ElevatedButton(
                  onPressed: () {
                    final router = GoRouter.of(context);
                    Navigator.of(context).pop();
                    Future.microtask(() {
                      router.go('/create');
                    });
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.auto_awesome, size: 16),
                      SizedBox(width: 8),
                      Text('Generate Course',
                          style: TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Usage Stats
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withAlpha(isDark ? 30 : 15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.primary.withAlpha(50)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.bolt, size: 14, color: AppColors.primary),
                          SizedBox(width: 6),
                          Text('COURSES LIMIT',
                              style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.5)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('1',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : Colors.black,
                                height: 1,
                              )),
                          Text(' / ∞',
                              style: TextStyle(
                                fontSize: 14,
                                color: isDark
                                    ? Colors.grey[500]
                                    : Colors.grey[400],
                                fontWeight: FontWeight.w500,
                              )), // Mock data for now
                          const Spacer(),
                          Text('COURSE',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: isDark
                                    ? Colors.grey[500]
                                    : Colors.grey[500],
                              )),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Progress Bar
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: const LinearProgressIndicator(
                          value: 0.2, // Mock value
                          backgroundColor: Colors.transparent, // Fix visible bg
                          valueColor: AlwaysStoppedAnimation(AppColors.primary),
                          minHeight: 4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Bottom Actions
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: border)),
            ),
            child: Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: TextButton.icon(
                    style: TextButton.styleFrom(
                      alignment: Alignment.centerLeft,
                      foregroundColor: isDark ? Colors.white70 : Colors.black87,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: const Icon(Icons.logout, size: 20),
                    label: const Text('Logout',
                        style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w500)),
                    onPressed: () {
                      Navigator.of(context).pop();
                      ref.read(authProvider.notifier).logout();
                      context.go('/signin');
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final String path;

  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.path,
  });

  @override
  Widget build(BuildContext context) {
    // Current path check for selection
    final currentPath = GoRouterState.of(context).uri.path;
    final isSelected = currentPath == path ||
        (path != '/dashboard' && currentPath.startsWith(path));
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      child: ListTile(
        dense: true,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        tileColor: isSelected
            ? (isDark ? Colors.white.withAlpha(25) : Colors.grey[100])
            : null,
        leading: Icon(
          isSelected ? selectedIcon : icon,
          size: 20,
          color: isSelected
              ? (isDark ? Colors.white : Colors.black)
              : (isDark ? Colors.grey[400] : Colors.grey[600]),
        ),
        title: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            color: isSelected
                ? (isDark ? Colors.white : Colors.black)
                : (isDark ? Colors.grey[400] : Colors.grey[600]),
          ),
        ),
        onTap: () {
          final router = GoRouter.of(context);
          Navigator.of(context).pop();
          Future.microtask(() {
            router.go(path);
          });
        },
      ),
    );
  }
}
