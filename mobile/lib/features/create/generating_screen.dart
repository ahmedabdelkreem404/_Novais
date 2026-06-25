import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/api/endpoints.dart';
import '../../core/theme/app_theme.dart';
import '../../core/l10n/app_localizations.dart';

class GeneratingScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> courseData;
  const GeneratingScreen({super.key, required this.courseData});
  @override
  ConsumerState<GeneratingScreen> createState() => _GeneratingScreenState();
}

class _GeneratingScreenState extends ConsumerState<GeneratingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;
  late Animation<double> _pulse;
  String _status = 'Initializing AI...';
  int _step = 0;
  int? _courseId;

  final _steps = [
    'Analyzing your topic...',
    'Creating course structure...',
    'Generating lesson content...',
    'Adding images...',
    'Finalizing course...',
  ];

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
    _pulse = Tween<double>(begin: 0.8, end: 1.0).animate(
        CurvedAnimation(parent: _animCtrl, curve: Curves.easeInOut));
    _pollOrSave();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _pollOrSave() async {
    // If courseData has an id already (server already generated), go directly
    if (widget.courseData['id'] != null) {
      final id = widget.courseData['id'] as int;
      if (mounted) context.go('/course/$id');
      return;
    }

    // Animate steps while waiting
    for (int i = 0; i < _steps.length; i++) {
      if (!mounted) return;
      setState(() { _step = i; _status = _steps[i]; });
      await Future.delayed(const Duration(seconds: 2));
    }

    // Save the course
    try {
      final api = ref.read(apiClientProvider);
      // Use generateCourse endpoint to trigger AI generation
      final res = await api.dio.post(ApiEndpoints.generateCourse, data: widget.courseData);
      _courseId = res.data['id'];
      if (mounted && _courseId != null) {
        context.go('/course/$_courseId');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _status = 'Something went wrong. Please try again.');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF020617), Color(0xFF0f172a)],
            begin: Alignment.topCenter, end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Animated orb
              ScaleTransition(
                scale: _pulse,
                child: Container(
                  width: 120, height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(colors: [
                      AppColors.primary.withAlpha(25),
                      AppColors.gradientEnd.withAlpha(25),
                    ]),
                    boxShadow: [
                      BoxShadow(
                          color: AppColors.primary.withAlpha(25),
                          blurRadius: 40, spreadRadius: 10),
                    ],
                  ),
                  child: const Icon(Icons.auto_awesome, color: Colors.white, size: 52),
                ),
              ),
              const SizedBox(height: 40),
              Text(l10n.t('generating'),
                  style: const TextStyle(
                      color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700,
                      fontFamily: 'PlusJakartaSans')),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(_status,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white60, fontSize: 14)),
              ),
              const SizedBox(height: 40),
              // Step indicators
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_steps.length, (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: i == _step ? 24 : 8,
                  height: 8,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  decoration: BoxDecoration(
                    color: i <= _step ? AppColors.primary : Colors.white24,
                    borderRadius: BorderRadius.circular(4),
                  ),
                )),
              ),
              const SizedBox(height: 32),
              const CircularProgressIndicator(
                  color: AppColors.primary, strokeWidth: 2),
            ],
          ),
        ),
      ),
    );
  }
}
