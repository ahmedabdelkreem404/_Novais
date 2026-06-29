import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/auth/auth_provider.dart';
import '../core/l10n/app_localizations.dart';
import '../core/theme/app_theme.dart';

class AppSidebar extends ConsumerWidget {
  const AppSidebar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l10n = context.l10n;
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    final bg = isDark ? const Color(0xFF0F0F0F) : Colors.white;
    final border = isDark ? const Color(0xFF2A2A2A) : Colors.grey[200]!;
    final drawerWidth = (MediaQuery.sizeOf(context).width * 0.84)
        .clamp(300.0, 360.0)
        .toDouble();
    const edgeRadius = Radius.circular(18);

    return Drawer(
      width: drawerWidth,
      backgroundColor: bg,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(
          left: isAr ? edgeRadius : Radius.zero,
          right: isAr ? Radius.zero : edgeRadius,
        ),
      ),
      child: Column(
        children: [
          Container(
            height: 86,
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: border)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            alignment: Alignment.centerLeft,
            child: SafeArea(
              bottom: false,
              child: Row(
                children: [
                  Image.asset(
                    'assets/images/logo.png',
                    width: 32,
                    height: 32,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const SizedBox(
                      width: 32,
                      height: 32,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'NOVAIS',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : Colors.black,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
              children: [
                const _NavItem(
                  icon: Icons.home_outlined,
                  selectedIcon: Icons.home,
                  labelKey: 'dashboard',
                  path: '/dashboard',
                ),
                const _NavItem(
                  icon: Icons.headphones_outlined,
                  selectedIcon: Icons.headphones,
                  labelKey: 'audio_courses',
                  path: '/audio',
                ),
                const _NavItem(
                  icon: Icons.person_outline,
                  selectedIcon: Icons.person,
                  labelKey: 'profile',
                  path: '/profile',
                ),
                const _NavItem(
                  icon: Icons.monetization_on_outlined,
                  selectedIcon: Icons.monetization_on,
                  labelKey: 'pricing',
                  path: '/pricing',
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  key: const Key('drawer_create_button'),
                  onPressed: () {
                    Navigator.of(context).pop();
                    try {
                      context.push('/create');
                    } catch (_) {}
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    minimumSize: const Size.fromHeight(46),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.auto_awesome, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        l10n.t('generate_course'),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                _UsageCard(isDark: isDark),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: border)),
            ),
            child: Column(
              children: [
                _ActionItem(
                  key: const Key('drawer_language_button'),
                  icon: Icons.language,
                  label: isAr ? 'English' : 'العربية',
                  onTap: () {
                    ref
                        .read(localeProvider.notifier)
                        .setLanguage(isAr ? 'en' : 'ar');
                  },
                ),
                _ActionItem(
                  key: const Key('drawer_theme_button'),
                  icon: isDark ? Icons.light_mode : Icons.dark_mode,
                  label: l10n.t('toggle_theme'),
                  onTap: () {
                    ref.read(themeModeProvider.notifier).toggle();
                  },
                ),
                _ActionItem(
                  icon: Icons.logout,
                  label: l10n.t('logout'),
                  onTap: () {
                    ref.read(authProvider.notifier).logout();
                    Navigator.of(context).pop();
                    try {
                      context.go('/signin');
                    } catch (_) {}
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _UsageCard extends StatelessWidget {
  final bool isDark;

  const _UsageCard({required this.isDark});

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Container(
      key: const Key('drawer_usage_card'),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.primary.withAlpha(isDark ? 30 : 15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.primary.withAlpha(50)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.bolt, size: 14, color: AppColors.primary),
              const SizedBox(width: 6),
              Text(
                l10n.t('courses_limit'),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '1',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : Colors.black,
                  height: 1,
                ),
              ),
              Text(
                ' / ∞',
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? Colors.grey[500] : Colors.grey[400],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              Text(
                l10n.t('course'),
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.grey[500] : Colors.grey[500],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: const LinearProgressIndicator(
              value: 0.2,
              backgroundColor: Colors.transparent,
              valueColor: AlwaysStoppedAnimation(AppColors.primary),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ActionItem({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ListTile(
      dense: true,
      minVerticalPadding: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      leading: Icon(icon, size: 20),
      title: Text(
        label,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: isDark ? Colors.white70 : Colors.black87,
        ),
      ),
      onTap: onTap,
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData selectedIcon;
  final String labelKey;
  final String path;

  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.labelKey,
    required this.path,
  });

  @override
  Widget build(BuildContext context) {
    String currentPath = '';
    try {
      currentPath = GoRouterState.of(context).uri.path;
    } catch (_) {}

    final isSelected = currentPath == path ||
        (path != '/dashboard' && currentPath.startsWith(path));
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final label = context.l10n.t(labelKey);

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      child: ListTile(
        dense: true,
        minVerticalPadding: 8,
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
          Navigator.of(context).pop();
          try {
            context.go(path);
          } catch (_) {}
        },
      ),
    );
  }
}
