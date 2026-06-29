import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/l10n/app_localizations.dart';
import '../../widgets/widgets.dart';
import '../../core/api/platform_config_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final user = ref.watch(authProvider).user;
    final themeMode = ref.watch(themeModeProvider);
    final locale = ref.watch(localeProvider);
    final isDark = themeMode == ThemeMode.dark;
    final isAr = locale.languageCode == 'ar';
    final configAsync = ref.watch(platformConfigProvider);
    final showThemeToggle = !configAsync.hasValue ||
        (configAsync.value!.systemThemeMode != 'light_only' &&
            configAsync.value!.systemThemeMode != 'dark_only');

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.gradientStart, AppColors.gradientEnd],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircleAvatar(
                        radius: 42,
                        backgroundColor: Colors.white24,
                        backgroundImage: user?.photoUrl != null ? NetworkImage(user!.photoUrl!) : null,
                        child: user?.photoUrl == null
                            ? Text((user?.name.isNotEmpty == true) ? user!.name[0].toUpperCase() : 'U',
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 32, fontWeight: FontWeight.w700))
                            : null,
                      ),
                      const SizedBox(height: 10),
                      Text(user?.name ?? '',
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                      Text(user?.email ?? '',
                          style: const TextStyle(color: Colors.white70, fontSize: 13)),
                      const SizedBox(height: 8),
                      if (user?.subscriptionType != null)
                        NvBadge(
                          label: user!.subscriptionType!.toUpperCase(),
                          color: AppColors.success,
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                // ── Settings Card ─────────────────────────────────────
                _section(context, 'Preferences', [
                  if (showThemeToggle)
                    _switchTile(context,
                      icon: isDark ? Icons.dark_mode : Icons.light_mode,
                      title: isDark ? l10n.t('dark_mode') : l10n.t('light_mode'),
                      value: isDark,
                      onChanged: (_) => ref.read(themeModeProvider.notifier).toggle(),
                    ),
                  _switchTile(context,
                    icon: Icons.translate,
                    title: 'العربية / Arabic',
                    value: isAr,
                    onChanged: (_) =>
                        ref.read(localeProvider.notifier).setLanguage(isAr ? 'en' : 'ar'),
                  ),
                ]),
                const SizedBox(height: 12),

                // ── Account Card ──────────────────────────────────────
                _section(context, 'Account', [
                  _tile(context, icon: Icons.payments_outlined, title: l10n.t('pricing'),
                      onTap: () => context.push('/pricing')),
                  _tile(context, icon: Icons.manage_accounts_outlined, title: l10n.t('manage_subscription'),
                      onTap: () => context.push('/subscription')),
                ]),
                const SizedBox(height: 12),

                // ── Info Card ─────────────────────────────────────────
                _section(context, 'Legal', [
                  _tile(context, icon: Icons.description_outlined, title: l10n.t('terms'),
                      onTap: () => context.push('/policy/terms')),
                  _tile(context, icon: Icons.privacy_tip_outlined, title: l10n.t('privacy'),
                      onTap: () => context.push('/policy/privacy')),
                ]),
                const SizedBox(height: 12),

                // ── Logout ────────────────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                      side: const BorderSide(color: AppColors.error),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    icon: const Icon(Icons.logout),
                    label: Text(l10n.t('logout')),
                    onPressed: () async {
                      await ref.read(authProvider.notifier).logout();
                      if (context.mounted) context.go('/signin');
                    },
                  ),
                ),
                const SizedBox(height: 40),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _section(BuildContext ctx, String title, List<Widget> children) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        child: Text(title,
            style: TextStyle(
                fontSize: 12, fontWeight: FontWeight.w600,
                color: Theme.of(ctx).colorScheme.onSurface.withAlpha(128),
                letterSpacing: 0.8)),
      ),
      Card(child: Column(children: children)),
    ]);
  }

  Widget _tile(BuildContext ctx,
      {required IconData icon, required String title, required VoidCallback onTap}) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary, size: 22),
      title: Text(title, style: const TextStyle(fontSize: 14)),
      trailing: const Icon(Icons.chevron_right, size: 18),
      onTap: onTap,
      dense: true,
    );
  }

  Widget _switchTile(BuildContext ctx,
      {required IconData icon,
      required String title,
      required bool value,
      required ValueChanged<bool> onChanged}) {
    return SwitchListTile(
      secondary: Icon(icon, color: AppColors.primary, size: 22),
      title: Text(title, style: const TextStyle(fontSize: 14)),
      value: value,
      activeColor: AppColors.primary,
      onChanged: onChanged,
      dense: true,
    );
  }
}
