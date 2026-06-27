import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/endpoints.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/widgets.dart';

// ─── Plans Provider ───────────────────────────────────────────────────────────

final plansProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final client = ref.read(apiClientProvider);
  final res = await client.dio.get(ApiEndpoints.plans);
  final data = res.data;
  if (data is List) return data.cast<Map<String, dynamic>>();
  return [];
});

// ─── Landing Screen ───────────────────────────────────────────────────────────

class LandingScreen extends ConsumerStatefulWidget {
  const LandingScreen({super.key});

  @override
  ConsumerState<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends ConsumerState<LandingScreen>
    with TickerProviderStateMixin {
  final _scrollController = ScrollController();
  bool _isScrolled = false;
  String _billing = 'monthly';

  // Keys for scroll-to
  final _featuresKey = GlobalKey();
  final _processKey = GlobalKey();
  final _pricingKey = GlobalKey();

  // Animation controllers for floating icons
  late final AnimationController _floatCtrl1;
  late final AnimationController _floatCtrl2;
  late final AnimationController _floatCtrl3;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      final scrolled = _scrollController.offset > 20;
      if (scrolled != _isScrolled) setState(() => _isScrolled = scrolled);
    });

    _floatCtrl1 = AnimationController(vsync: this, duration: const Duration(seconds: 6))..repeat(reverse: true);
    _floatCtrl2 = AnimationController(vsync: this, duration: const Duration(seconds: 7))..repeat(reverse: true);
    _floatCtrl3 = AnimationController(vsync: this, duration: const Duration(seconds: 5))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _floatCtrl1.dispose();
    _floatCtrl2.dispose();
    _floatCtrl3.dispose();
    super.dispose();
  }

  void _scrollTo(GlobalKey key) {
    final ctx = key.currentContext;
    if (ctx == null) return;
    Scrollable.ensureVisible(ctx, duration: const Duration(milliseconds: 500), curve: Curves.easeInOut);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final plansAsync = ref.watch(plansProvider);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0a0f1e) : const Color(0xFFf8faff),
      body: Stack(
        children: [
          CustomScrollView(
            controller: _scrollController,
            slivers: [
              // Top spacer for navbar
              const SliverToBoxAdapter(child: SizedBox(height: 64)),

              // ── Hero ───────────────────────────────────────────────────
              SliverToBoxAdapter(child: _buildHero(isDark)),

              // ── Preview ────────────────────────────────────────────────
              SliverToBoxAdapter(child: _buildPreview(isDark)),

              // ── Features ───────────────────────────────────────────────
              SliverToBoxAdapter(
                child: _buildSection(
                  key: _featuresKey,
                  isDark: isDark,
                  kicker: 'FEATURES',
                  titleNormal: 'Everything You Need to Create ',
                  titleAccent: 'Exceptional Courses',
                  child: _buildFeaturesGrid(isDark),
                ),
              ),

              // ── How It Works ────────────────────────────────────────────
              SliverToBoxAdapter(
                child: _buildSection(
                  key: _processKey,
                  isDark: isDark,
                  kicker: 'PROCESS',
                  titleNormal: 'Simple ',
                  titleAccent: '4-Step',
                  titleSuffix: ' Course Creation',
                  child: _buildSteps(isDark),
                ),
              ),

              // ── Testimonials ────────────────────────────────────────────
              SliverToBoxAdapter(
                child: _buildSection(
                  isDark: isDark,
                  kicker: 'REVIEWS',
                  titleNormal: 'Trusted by ',
                  titleAccent: 'Educators & Learning Professionals',
                  child: _buildTestimonials(isDark),
                ),
              ),

              // ── Pricing ────────────────────────────────────────────────
              SliverToBoxAdapter(
                child: _buildSection(
                  key: _pricingKey,
                  isDark: isDark,
                  kicker: 'PRICING',
                  titleNormal: 'Simple, ',
                  titleAccent: 'Transparent',
                  subtitle: 'Choose the plan that works best for your needs.',
                  child: plansAsync.when(
                    data: (plans) => _buildPricing(plans, isDark),
                    loading: () => const Padding(
                      padding: EdgeInsets.all(32),
                      child: NvLoading(message: 'Loading plans...'),
                    ),
                    error: (_, __) => _buildPricing([], isDark),
                  ),
                ),
              ),

              // ── CTA Bottom ─────────────────────────────────────────────
              SliverToBoxAdapter(child: _buildCTA(isDark)),

              const SliverToBoxAdapter(child: SizedBox(height: 40)),
            ],
          ),

          // ── Sticky Navbar ──────────────────────────────────────────────
          _buildNavbar(isDark),
        ],
      ),
    );
  }

  // ─── Navbar ─────────────────────────────────────────────────────────────────

  Widget _buildNavbar(bool isDark) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: _isScrolled
            ? (isDark ? const Color(0xFF0a0f1e).withAlpha(230) : Colors.white.withAlpha(230))
            : Colors.transparent,
        border: _isScrolled
            ? Border(bottom: BorderSide(color: isDark ? Colors.white12 : Colors.black12))
            : const Border(),
      ),
      child: SafeArea(
        child: SizedBox(
          height: 56,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                // Logo
                GestureDetector(
                  onTap: () => _scrollController.animateTo(0,
                      duration: const Duration(milliseconds: 400), curve: Curves.easeOut),
                  child: Row(children: [
                    Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.gradientStart, AppColors.gradientEnd]),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.auto_awesome, color: Colors.white, size: 18),
                    ),
                    const SizedBox(width: 8),
                    Text('NOVAIS',
                        style: TextStyle(
                          fontFamily: 'PlusJakartaSans',
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                          color: isDark ? Colors.white : const Color(0xFF0f172a),
                        )),
                  ]),
                ),

                const Spacer(),

                // Nav links (compact on mobile)
                TextButton(
                  onPressed: () => _scrollTo(_featuresKey),
                  style: TextButton.styleFrom(minimumSize: const Size(0, 36)),
                  child: Text('Features',
                      style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : Colors.black54)),
                ),
                TextButton(
                  onPressed: () => _scrollTo(_pricingKey),
                  style: TextButton.styleFrom(minimumSize: const Size(0, 36)),
                  child: Text('Pricing',
                      style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : Colors.black54)),
                ),

                const SizedBox(width: 4),

                // Auth buttons
                TextButton(
                  onPressed: () => context.go('/signin'),
                  style: TextButton.styleFrom(minimumSize: const Size(0, 32)),
                  child: Text('Login',
                      style: TextStyle(fontSize: 13, color: isDark ? Colors.white70 : Colors.black54)),
                ),
                const SizedBox(width: 4),
                _PrimaryButton(
                  label: 'Sign Up',
                  small: true,
                  onTap: () => context.go('/signup'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ─── Hero ────────────────────────────────────────────────────────────────────

  Widget _buildHero(bool isDark) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1e293b) : Colors.white,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: isDark ? Colors.white12 : Colors.black12),
              boxShadow: [BoxShadow(color: Colors.black.withAlpha(13), blurRadius: 12)],
            ),
            child: Text(
              'AI-POWERED COURSE CREATION',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white : const Color(0xFF0f172a),
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(height: 28),

          // Title
          RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
              style: const TextStyle(
                fontFamily: 'PlusJakartaSans',
                fontWeight: FontWeight.w800,
                fontSize: 38,
                height: 1.1,
              ),
              children: [
                TextSpan(
                  text: 'Transform Text into\n',
                  style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0f172a)),
                ),
                const WidgetSpan(
                  child: _GradientText(
                    text: ' Complete Courses',
                    fontSize: 38,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Subtitle
          Text(
            'Easily create personalized courses tailored to your needs. Interact with NOVAIS (your AI Learning Coach), generate courses in 23+ languages, and master skills through practice.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              height: 1.7,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
          ),
          const SizedBox(height: 32),

          // CTA
          _PrimaryButton(
            label: 'Start Creating Now',
            icon: Icons.arrow_forward,
            onTap: () => context.go('/signup'),
          ),
        ],
      ),
    );
  }

  // ─── App Preview ─────────────────────────────────────────────────────────────

  Widget _buildPreview(bool isDark) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 60),
      child: SizedBox(
        height: 260,
        child: Stack(
          children: [
            // Main screenshot
            ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Image.asset(
                'assets/images/slideOne.png',
                width: double.infinity,
                height: 240,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  width: double.infinity,
                  height: 240,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.primary.withAlpha(40),
                        AppColors.gradientEnd.withAlpha(40),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
                  ),
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.laptop_mac, size: 48, color: AppColors.primary.withAlpha(150)),
                    const SizedBox(height: 8),
                    Text('NOVAIS Platform Preview',
                        style: TextStyle(color: AppColors.primary.withAlpha(180), fontWeight: FontWeight.w600)),
                  ]),
                ),
              ),
            ),

            // Floating icon 1 — top left (Sparkles / blue)
            Positioned(
              top: 0,
              left: 0,
              child: _FloatingIcon(
                controller: _floatCtrl1,
                icon: Icons.auto_awesome,
                borderColor: const Color(0xFF3b82f6),
                iconColor: AppColors.primary,
                delay: 0,
              ),
            ),

            // Floating icon 2 — mid right (BarChart / purple)
            Positioned(
              top: 80,
              right: -8,
              child: _FloatingIcon(
                controller: _floatCtrl2,
                icon: Icons.bar_chart,
                borderColor: const Color(0xFF9333ea),
                iconColor: const Color(0xFF9333ea),
                delay: 0.33,
              ),
            ),

            // Floating icon 3 — bottom left (Language / cyan)
            Positioned(
              bottom: 0,
              left: 48,
              child: _FloatingIcon(
                controller: _floatCtrl3,
                icon: Icons.language,
                borderColor: const Color(0xFF06b6d4),
                iconColor: const Color(0xFF06b6d4),
                delay: 0.66,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Section wrapper ─────────────────────────────────────────────────────────

  Widget _buildSection({
    GlobalKey? key,
    required bool isDark,
    required String kicker,
    required String titleNormal,
    required String titleAccent,
    String? titleSuffix,
    String? subtitle,
    required Widget child,
  }) {
    return Container(
      key: key,
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 60),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Kicker pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.primary.withAlpha(20),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              kicker,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
                letterSpacing: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Title
          RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
              style: TextStyle(
                fontFamily: 'PlusJakartaSans',
                fontWeight: FontWeight.w800,
                fontSize: 26,
                height: 1.2,
                color: isDark ? Colors.white : const Color(0xFF0f172a),
              ),
              children: [
                TextSpan(text: titleNormal),
                WidgetSpan(child: _GradientText(text: titleAccent, fontSize: 26, fontWeight: FontWeight.w800)),
                if (titleSuffix != null) TextSpan(text: titleSuffix),
              ],
            ),
          ),

          if (subtitle != null) ...[
            const SizedBox(height: 10),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: isDark ? Colors.grey[400] : Colors.grey[600], height: 1.6),
            ),
          ],
          const SizedBox(height: 32),

          child,
        ],
      ),
    );
  }

  // ─── Features Grid ───────────────────────────────────────────────────────────

  Widget _buildFeaturesGrid(bool isDark) {
    final features = [
      (Icons.auto_awesome, 'AI-Powered Generation', 'Advanced AI algorithms analyze your inputs to generate comprehensive courses.'),
      (Icons.bar_chart, 'Course Type Preferences', 'Choose between Image + Theory or Video + Theory formats for a personalized learning journey.'),
      (Icons.check_circle_outline, 'Quiz Creation', 'Generate relevant quizzes and assessments to reinforce learning outcomes.'),
      (Icons.language, 'Multilanguage Courses', 'Generate AI image, video, or textual courses in 23+ multiple languages.'),
      (Icons.chat_bubble_outline, 'Talk to NOVAIS', 'Chat with your AI Learning Coach to get answers and guidance while learning.'),
      (Icons.download_outlined, 'Export Course', 'Download your generated course in various formats for offline access.'),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.85,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: features.length,
      itemBuilder: (context, i) {
        final (icon, title, desc) = features[i];
        return _FeatureCard(icon: icon, title: title, desc: desc, isDark: isDark);
      },
    );
  }

  // ─── Steps ──────────────────────────────────────────────────────────────────

  Widget _buildSteps(bool isDark) {
    final steps = [
      (Icons.chat_bubble_outline, '01', 'Enter Topics', 'Begin the course creation journey by entering your desired topics and a list of subtopics.'),
      (Icons.bar_chart, '02', 'Choose Preferences', 'Choose between Image + Theory or Video + Theory formats for a personalized learning journey.'),
      (Icons.language, '03', 'Choose Course Language', 'Choose from 23+ languages in which you want to create a course.'),
      (Icons.auto_awesome, '04', 'AI Magic', 'Watch as our AI processes your inputs to generate a customized course.'),
    ];

    return Stack(
      alignment: Alignment.center,
      children: [
        // Vertical spine
        Positioned(
          top: 40,
          bottom: 40,
          left: 0,
          right: 0,
          child: Center(
            child: Container(
              width: 3,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    AppColors.primary.withAlpha(100),
                    AppColors.primary.withAlpha(100),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
        ),

        Column(
          children: steps.asMap().entries.map((e) {
            final idx = e.key;
            final (icon, num, title, desc) = e.value;
            final isLeft = idx.isEven; // content left on odd steps (1, 3), right on even (2, 4)
            return _StepCard(
              icon: icon,
              stepNum: num,
              title: title,
              desc: desc,
              contentOnLeft: isLeft,
              isDark: isDark,
            );
          }).toList(),
        ),
      ],
    );
  }

  // ─── Testimonials ────────────────────────────────────────────────────────────

  Widget _buildTestimonials(bool isDark) {
    final testimonials = [
      ('SJ', 'Sarah Johnson', 'Content Creator, EdTech', 'NOVAIS created complex course content in minutes that would have taken 40 hours of manual work. The quality is remarkably better.'),
      ('DC', 'Prof. David Chen', 'Computer Science Department', 'As a university professor, I was skeptical about AI-generated courses. But NOVAIS perfectly structured my research into a comprehensive course for my students.'),
      ('MR', 'Michael Rodriguez', 'Head of L&D, TechCorp', 'The learning tool reduced our onboarding content creation time by 80% while improving engagement metrics significantly.'),
      ('AW', 'Anna Wilson', 'Lead Instructional Designer', 'The quiz generation feature alone is worth the subscription. It creates thoughtful assessments that actually test understanding, not just memorization.'),
    ];
    return Column(
      children: testimonials
          .map((t) => _TestimonialCard(
                initials: t.$1,
                name: t.$2,
                role: t.$3,
                quote: t.$4,
                isDark: isDark,
              ))
          .toList(),
    );
  }

  // ─── Pricing ─────────────────────────────────────────────────────────────────

  Widget _buildPricing(List<Map<String, dynamic>> plans, bool isDark) {
    Map<String, dynamic> getP(String slug) =>
        plans.firstWhere((p) => p['slug'] == slug, orElse: () => {});

    final free = getP('free');
    final pro = getP('pro');
    final elite = getP('elite');

    return Column(
      children: [
        // Billing toggle
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1e293b) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
            boxShadow: [BoxShadow(color: Colors.black.withAlpha(13), blurRadius: 12)],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: ['monthly', 'yearly'].map((cycle) {
              final active = _billing == cycle;
              return GestureDetector(
                onTap: () => setState(() => _billing = cycle),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  decoration: BoxDecoration(
                    color: active ? AppColors.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: active ? [BoxShadow(color: AppColors.primary.withAlpha(80), blurRadius: 8)] : [],
                  ),
                  child: Row(children: [
                    Text(
                      cycle == 'monthly' ? 'Monthly' : 'Yearly',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: active ? Colors.white : (isDark ? Colors.white60 : Colors.black54),
                      ),
                    ),
                    if (cycle == 'yearly') ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF22c55e).withAlpha(40),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: const Color(0xFF22c55e).withAlpha(80)),
                        ),
                        child: const Text('SAVE 30%',
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Color(0xFF22c55e))),
                      ),
                    ],
                  ]),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 24),

        // Plan cards
        _PlanCard(
          name: _planName(free, 'Free Plan'),
          price: '0',
          currency: 'EGP',
          period: '',
          features: _planFeatures(free, 'free'),
          isPrimary: false,
          badge: null,
          isDark: isDark,
          onTap: () => context.go('/signup'),
        ),
        const SizedBox(height: 12),
        _PlanCard(
          name: _planName(pro, 'Pro Plan'),
          price: _billing == 'monthly'
              ? (pro['price_egp'] ?? 149).toString()
              : ((pro['price_egp'] ?? 149) * 10).toString(),
          currency: 'EGP',
          period: _billing == 'monthly' ? '/mo' : '/yr',
          features: _planFeatures(pro, 'pro'),
          isPrimary: true,
          badge: 'Best Seller',
          isDark: isDark,
          onTap: () => context.go('/signup'),
        ),
        const SizedBox(height: 12),
        _PlanCard(
          name: _planName(elite, 'Elite Plan'),
          price: _billing == 'monthly'
              ? (elite['price_egp'] ?? 80).toString()
              : ((elite['price_egp'] ?? 80) * 10).toString(),
          currency: 'EGP',
          period: _billing == 'monthly' ? '/mo' : '/yr',
          features: _planFeatures(elite, 'elite'),
          isPrimary: false,
          badge: null,
          isDark: isDark,
          onTap: () => context.go('/signup'),
        ),
      ],
    );
  }

  String _planName(Map<String, dynamic> plan, String fallback) {
    final rawName = plan['name'];
    if (rawName is String && rawName.trim().isNotEmpty) {
      return rawName;
    }
    if (rawName is Map) {
      final translated = rawName['en'] ?? rawName['ar'];
      if (translated != null && translated.toString().trim().isNotEmpty) {
        return translated.toString();
      }
    }
    return fallback;
  }

  List<String> _planFeatures(Map<String, dynamic> plan, String slug) {
    final rawFeatures = plan['features'];
    if (rawFeatures is Map && rawFeatures['en'] is List) {
      return (rawFeatures['en'] as List).map((feature) => feature.toString()).toList();
    }
    final limit = plan['course_limit'];
    if (slug == 'free') {
      return [
        '${limit ?? 1} Course',
        'Lifetime access',
        'Theory & Image Course',
        'Chat with NOVAIS',
      ];
    } else if (slug == 'pro') {
      return [
        limit == -1 ? 'Unlimited Courses' : '${limit ?? 10} Courses/mo',
        'Theory & Image Course',
        'Chat with NOVAIS',
        'Course In 23+ Languages',
        'Video & Theory Course',
      ];
    } else {
      return [
        limit == -1 ? 'Unlimited Courses' : '${limit ?? 20} Courses/mo',
        'Theory & Image Course',
        'Chat with NOVAIS',
        'Course In 23+ Languages',
        'Video & Theory Course',
        'Full Platform Access',
      ];
    }
  }

  // ─── Bottom CTA ──────────────────────────────────────────────────────────────

  Widget _buildCTA(bool isDark) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0f172a) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
          boxShadow: [BoxShadow(color: AppColors.primary.withAlpha(20), blurRadius: 40, spreadRadius: -5)],
        ),
        child: Column(
          children: [
            Text(
              'Transform your content into engaging courses today',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'PlusJakartaSans',
                fontWeight: FontWeight.w800,
                fontSize: 22,
                color: isDark ? Colors.white : const Color(0xFF0f172a),
                height: 1.3,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Join thousands of educators, trainers, and content creators who are saving time and creating better learning experiences with NOVAIS.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: isDark ? Colors.grey[400] : Colors.grey[600], height: 1.6),
            ),
            const SizedBox(height: 24),
            _PrimaryButton(
              label: 'Start Creating Now',
              icon: Icons.arrow_forward,
              onTap: () => context.go('/signup'),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Gradient Text ────────────────────────────────────────────────────────────

class _GradientText extends StatelessWidget {
  final String text;
  final double fontSize;
  final FontWeight fontWeight;

  const _GradientText({required this.text, required this.fontSize, required this.fontWeight});

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      blendMode: BlendMode.srcIn,
      shaderCallback: (bounds) => const LinearGradient(
        colors: [AppColors.gradientStart, AppColors.gradientEnd],
      ).createShader(bounds),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: 'PlusJakartaSans',
          fontWeight: fontWeight,
          fontSize: fontSize,
          height: 1.2,
        ),
      ),
    );
  }
}

// ─── Primary Button ───────────────────────────────────────────────────────────

class _PrimaryButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback onTap;
  final bool small;

  const _PrimaryButton({required this.label, required this.onTap, this.icon, this.small = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: small ? 16 : 24, vertical: small ? 8 : 14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [AppColors.gradientStart, AppColors.gradientEnd]),
          borderRadius: BorderRadius.circular(small ? 10 : 14),
          boxShadow: [BoxShadow(color: AppColors.primary.withAlpha(80), blurRadius: 16, offset: const Offset(0, 4))],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: small ? 13 : 15,
              ),
            ),
            if (icon != null) ...[
              const SizedBox(width: 8),
              Icon(icon, color: Colors.white, size: small ? 14 : 16),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Floating Icon ────────────────────────────────────────────────────────────

class _FloatingIcon extends StatelessWidget {
  final AnimationController controller;
  final IconData icon;
  final Color borderColor;
  final Color iconColor;
  final double delay;

  const _FloatingIcon({
    required this.controller,
    required this.icon,
    required this.borderColor,
    required this.iconColor,
    required this.delay,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return AnimatedBuilder(
      animation: controller,
      builder: (_, __) {
        final offset = math.sin((controller.value + delay) * 2 * math.pi) * 10;
        return Transform.translate(
          offset: Offset(0, offset),
          child: Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1e293b) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: borderColor.withAlpha(150), width: 1.5),
              boxShadow: [BoxShadow(color: borderColor.withAlpha(60), blurRadius: 16)],
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
        );
      },
    );
  }
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

class _FeatureCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;
  final bool isDark;

  const _FeatureCard({required this.icon, required this.title, required this.desc, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0f172a) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(8), blurRadius: 12)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary.withAlpha(40), AppColors.primary.withAlpha(15)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.primary, size: 22),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : const Color(0xFF0f172a),
              height: 1.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            desc,
            style: TextStyle(
              fontSize: 12,
              height: 1.5,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Step Card ────────────────────────────────────────────────────────────────

class _StepCard extends StatelessWidget {
  final IconData icon;
  final String stepNum;
  final String title;
  final String desc;
  final bool contentOnLeft;
  final bool isDark;

  const _StepCard({
    required this.icon,
    required this.stepNum,
    required this.title,
    required this.desc,
    required this.contentOnLeft,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final content = Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0f172a) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : const Color(0xFF0f172a),
          ),
        ),
        const SizedBox(height: 6),
        Text(desc, style: TextStyle(fontSize: 12, height: 1.5, color: isDark ? Colors.grey[400] : Colors.grey[600])),
      ]),
    );

    final iconWidget = Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0f172a) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white.withAlpha(50) : Colors.black12, width: 2),
        boxShadow: [BoxShadow(color: AppColors.primary.withAlpha(30), blurRadius: 12)],
      ),
      child: Icon(icon, color: AppColors.primary, size: 24),
    );

    // Center node
    final node = Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0a0f1e) : const Color(0xFFf8faff),
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.primary, width: 2.5),
        boxShadow: [BoxShadow(color: AppColors.primary.withAlpha(60), blurRadius: 8)],
      ),
    );

    return Padding(
      padding: const EdgeInsets.only(bottom: 32),
      child: IntrinsicHeight(
        child: Row(
          children: contentOnLeft
              ? [
                  Expanded(child: content),
                  const SizedBox(width: 12),
                  Column(mainAxisAlignment: MainAxisAlignment.center, children: [node]),
                  const SizedBox(width: 12),
                  Expanded(child: Center(child: iconWidget)),
                ]
              : [
                  Expanded(child: Center(child: iconWidget)),
                  const SizedBox(width: 12),
                  Column(mainAxisAlignment: MainAxisAlignment.center, children: [node]),
                  const SizedBox(width: 12),
                  Expanded(child: content),
                ],
        ),
      ),
    );
  }
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────

class _TestimonialCard extends StatelessWidget {
  final String initials;
  final String name;
  final String role;
  final String quote;
  final bool isDark;

  const _TestimonialCard({
    required this.initials,
    required this.name,
    required this.role,
    required this.quote,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0f172a) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(8), blurRadius: 12)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stars
          const Text('★★★★★', style: TextStyle(color: Color(0xFFfbbf24), fontSize: 14, letterSpacing: 2)),
          const SizedBox(height: 10),
          // Quote
          Text(
            '"$quote"',
            style: TextStyle(
              fontSize: 14,
              height: 1.7,
              color: isDark ? Colors.white : const Color(0xFF0f172a),
            ),
          ),
          const SizedBox(height: 16),
          Divider(color: isDark ? Colors.white12 : Colors.black12, height: 1),
          const SizedBox(height: 14),
          // Author
          Row(children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                gradient: LinearGradient(colors: [AppColors.gradientStart, AppColors.gradientEnd]),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(initials,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
              ),
            ),
            const SizedBox(width: 12),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: isDark ? Colors.white : const Color(0xFF0f172a))),
              Text(role, style: TextStyle(fontSize: 12, color: isDark ? Colors.grey[500] : Colors.grey[600])),
            ]),
          ]),
        ],
      ),
    );
  }
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

class _PlanCard extends StatelessWidget {
  final String name;
  final String price;
  final String currency;
  final String period;
  final List<String> features;
  final bool isPrimary;
  final String? badge;
  final bool isDark;
  final VoidCallback onTap;

  const _PlanCard({
    required this.name,
    required this.price,
    required this.currency,
    required this.period,
    required this.features,
    required this.isPrimary,
    required this.badge,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0f172a) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isPrimary ? AppColors.primary : (isDark ? Colors.white10 : Colors.black12),
          width: isPrimary ? 2 : 1,
        ),
        boxShadow: [
          if (isPrimary) BoxShadow(color: AppColors.primary.withAlpha(40), blurRadius: 20),
          BoxShadow(color: Colors.black.withAlpha(8), blurRadius: 12),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Badge
            if (badge != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.gradientStart, AppColors.gradientEnd]),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(badge!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 11)),
              ),
              const SizedBox(height: 10),
            ],

            // Plan name
            Text(name, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF0f172a))),
            const SizedBox(height: 8),

            // Price
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  price,
                  style: TextStyle(
                    fontFamily: 'PlusJakartaSans',
                    fontWeight: FontWeight.w900,
                    fontSize: 32,
                    color: isDark ? Colors.white : const Color(0xFF0f172a),
                  ),
                ),
                const SizedBox(width: 4),
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(currency,
                      style: TextStyle(fontSize: 14, color: isDark ? Colors.grey[400] : Colors.grey[600])),
                ),
                if (period.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(period,
                        style: TextStyle(fontSize: 13, color: isDark ? Colors.grey[500] : Colors.grey[500])),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            // Features
            ...features.map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(children: [
                    const Icon(Icons.check_circle, color: AppColors.primary, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(f, style: TextStyle(fontSize: 13, color: isDark ? Colors.grey[300] : Colors.grey[700])),
                    ),
                  ]),
                )),
            const SizedBox(height: 16),

            // CTA
            SizedBox(
              width: double.infinity,
              child: isPrimary
                  ? GestureDetector(
                      onTap: onTap,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [AppColors.gradientStart, AppColors.gradientEnd]),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Center(
                          child: Text('Get Started',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                        ),
                      ),
                    )
                  : OutlinedButton(
                      onPressed: onTap,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: isDark ? Colors.white : const Color(0xFF0f172a),
                        side: BorderSide(color: isDark ? Colors.white.withAlpha(50) : Colors.black26),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Get Started', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
