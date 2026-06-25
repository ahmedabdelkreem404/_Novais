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

    return Scaffold(
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () => ref.refresh(_coursesProvider.future),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ── Header ──────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 60, 20, 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ShaderMask(
                          shaderCallback: (bounds) => const LinearGradient(
                            colors: [AppColors.gradientStart, AppColors.gradientEnd],
                          ).createShader(bounds),
                          child: Text(l10n.t('my_courses'), // "My Courses"
                              style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                  fontFamily: 'PlusJakartaSans')),
                        ),
                        const SizedBox(height: 4),
                        Text(l10n.t('manage_subscription'), // Using as subtitle placeholder
                            style: TextStyle(
                              fontSize: 14, 
                              color: Theme.of(context).colorScheme.onSurface.withAlpha(150))),
                      ],
                    ),
                    
                    // Generate New Button
                    Container(
                      decoration: BoxDecoration(
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withAlpha(80),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        onPressed: () => context.go('/create'),
                        child: Row(
                          children: [
                             const Icon(Icons.auto_awesome, size: 18),
                             const SizedBox(width: 8),
                             Text(l10n.t('create_course'), 
                               style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Usage Stats (Mobile View) ──────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF161616) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFE5E7EB)),
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
                              child: const Icon(Icons.bar_chart, size: 18, color: AppColors.primary),
                            ),
                            const SizedBox(width: 10),
                            const Text('COURSES LIMIT', 
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                          ]),
                          // Mock usage data for now - match mock 1/5 or similar
                          Text('2 / 5', 
                             style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Theme.of(context).disabledColor)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: const LinearProgressIndicator(
                          value: 0.4, // 2/5
                          minHeight: 8,
                          backgroundColor: Colors.transparent, 
                          // In a real stats card we'd use a container bg, but here letting theme handle it
                          valueColor: AlwaysStoppedAnimation(AppColors.primary),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text('Remaining courses: 3', 
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Theme.of(context).disabledColor)),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ── Courses Grid ─────────────────────────────────────────────
            coursesAsync.when(
              loading: () => const SliverFillRemaining(
                child: NvLoading(message: 'Loading courses...'),
              ),
              error: (e, _) => SliverFillRemaining(
                child: NvEmptyState(
                  icon: Icons.error_outline,
                  title: 'Failed to load courses',
                  subtitle: e.toString(),
                  action: NvButton(
                    label: 'Retry',
                    width: 140,
                    onTap: () => ref.refresh(_coursesProvider.future),
                  ),
                ),
              ),
              data: (courses) {
                if (courses.isEmpty) {
                  return SliverFillRemaining(
                    child: NvEmptyState(
                      icon: Icons.school_outlined,
                      title: l10n.t('no_courses'),
                      subtitle: l10n.t('start_generating'),
                      action: NvButton(
                        label: l10n.t('create_course'),
                        width: 200,
                        onTap: () => context.go('/create'),
                      ),
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.all(20),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 1, // Single column on small screens looks better with detailed cards
                      mainAxisSpacing: 20,
                      childAspectRatio: 1.1, // Taller cards
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (_, i) {
                        final c = courses[i];
                        return NvCourseCard(
                          course: c,
                          onTap: () => context.push('/course/${c.id}'),
                          onDelete: () => _deleteCourse(context, ref, c.id),
                        );
                      },
                      childCount: courses.length,
                    ),
                  ),
                );
              },
            ),
             const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteCourse(BuildContext ctx, WidgetRef ref, int id) async {
    final confirmed = await showDialog<bool>(
      context: ctx,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Delete course?'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogCtx, false), child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(dialogCtx, true),
              child: const Text('Delete', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (confirmed == true) {
      try {
        final api = ref.read(apiClientProvider);
        await api.dio.delete(ApiEndpoints.deleteCourse(id));
        ref.invalidate(_coursesProvider);
      } catch (e) {
        if (ctx.mounted) showSnack(ctx, 'Failed to delete', error: true);
      }
    }
  }
}
