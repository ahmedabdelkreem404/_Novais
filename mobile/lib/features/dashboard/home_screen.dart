import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/api/endpoints.dart';
import '../../core/theme/app_theme.dart';
import '../../core/l10n/app_localizations.dart';
import '../../models/course.dart';
import '../../widgets/widgets.dart';

final _coursesProvider = FutureProvider<List<Course>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.courses);
  final data = res.data as List? ?? [];
  return data.map((e) => Course.fromJson(e)).toList();
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final coursesAsync = ref.watch(_coursesProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: isDark ? const Color(0xFF050816) : const Color(0xFFF8FAFC),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [
                          AppColors.gradientStart,
                          AppColors.gradientEnd
                        ],
                      ).createShader(bounds),
                      child: Text(
                        l10n.t('my_courses'),
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          fontFamily: 'PlusJakartaSans',
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      l10n.t('manage_subscription'),
                      style: TextStyle(
                        fontSize: 14,
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withAlpha(150),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                key: const Key('dashboard_create_button'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                onPressed: () => _openCreate(context),
                icon: const Icon(Icons.auto_awesome, size: 18),
                label: Text(l10n.t('create_course'),
                    style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 26),
          _UsageCard(isDark: isDark),
          const SizedBox(height: 32),
          coursesAsync.when(
            loading: () => const SizedBox(
                height: 360, child: NvLoading(message: 'Loading courses...')),
            error: (e, _) => SizedBox(
              height: 420,
              child: NvEmptyState(
                icon: Icons.error_outline,
                title: l10n.t('failed_load_courses'),
                subtitle: e.toString(),
                action: NvButton(
                  label: l10n.t('retry'),
                  width: 140,
                  onTap: () => ref.refresh(_coursesProvider.future),
                ),
              ),
            ),
            data: (courses) {
              if (courses.isEmpty) {
                return SizedBox(
                  height: 520,
                  child: NvEmptyState(
                    icon: Icons.school_outlined,
                    title: l10n.t('no_courses'),
                    subtitle: l10n.t('start_generating'),
                    action: NvButton(
                      key: const Key('dashboard_empty_create_button'),
                      label: l10n.t('create_course'),
                      width: 220,
                      onTap: () => _openCreate(context),
                    ),
                  ),
                );
              }

              return Column(
                children: courses.asMap().entries.map((entry) {
                  final index = entry.key;
                  final course = entry.value;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: 1),
                      duration: Duration(milliseconds: 280 + (index * 70)),
                      curve: Curves.easeOutCubic,
                      builder: (context, value, child) {
                        return Opacity(
                          opacity: value,
                          child: Transform.translate(
                            offset: Offset(0, 18 * (1 - value)),
                            child: child,
                          ),
                        );
                      },
                      child: AspectRatio(
                        aspectRatio: 0.92,
                        child: NvCourseCard(
                          course: course,
                          onTap: () => context.push('/course/${course.id}'),
                          onDelete: () =>
                              _deleteCourse(context, ref, course.id),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  void _openCreate(BuildContext context) {
    context.go('/create');
  }

  Future<void> _deleteCourse(BuildContext ctx, WidgetRef ref, int id) async {
    final confirmed = await showDialog<bool>(
      context: ctx,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Delete course?'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogCtx, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx, true),
            child:
                const Text('Delete', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      try {
        final api = ref.read(apiClientProvider);
        await api.dio.delete(ApiEndpoints.deleteCourse(id));
        ref.invalidate(_coursesProvider);
      } catch (_) {
        if (ctx.mounted) showSnack(ctx, 'Failed to delete', error: true);
      }
    }
  }
}

class _UsageCard extends StatelessWidget {
  final bool isDark;

  const _UsageCard({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: isDark ? Colors.white24 : const Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withAlpha(30),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.bar_chart,
                      size: 18, color: AppColors.primary),
                ),
                const SizedBox(width: 10),
                Text(
                  context.l10n.t('courses_limit'),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
              ]),
              Text(
                '2 / 5',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).disabledColor),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: const LinearProgressIndicator(
              value: 0.4,
              minHeight: 8,
              backgroundColor: Colors.transparent,
              valueColor: AlwaysStoppedAnimation(AppColors.primary),
            ),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              context.l10n.t('remaining_courses').replaceFirst('{count}', '3'),
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: Theme.of(context).disabledColor),
            ),
          ),
        ],
      ),
    );
  }
}
