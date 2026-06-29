import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/api/endpoints.dart';
import '../../core/theme/app_theme.dart';
import '../../core/l10n/app_localizations.dart';
import '../../models/user.dart';
import '../../widgets/widgets.dart';

class QuizScreen extends ConsumerStatefulWidget {
  final int courseId;
  const QuizScreen({super.key, required this.courseId});
  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  List<QuizQuestion> _questions = [];
  int _current = 0;
  int? _selected;
  bool _answered = false;
  int _score = 0;
  bool _loading = true;
  bool _generating = false;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    _loadQuiz();
  }

  Future<void> _loadQuiz() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.get(ApiEndpoints.getQuizzes(widget.courseId));
      final list = (res.data as List? ?? []);
      setState(() {
        _questions = list.map((q) => QuizQuestion.fromJson(q)).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _generateQuiz() async {
    setState(() => _generating = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.dio.post(ApiEndpoints.createQuiz(widget.courseId));
      await _loadQuiz();
    } catch (_) {}
    if (mounted) setState(() => _generating = false);
  }

  void _answer(int idx) {
    if (_answered) return;
    setState(() {
      _selected = idx;
      _answered = true;
      if (idx == _questions[_current].correctIndex) _score++;
    });
  }

  void _next() {
    if (_current < _questions.length - 1) {
      setState(() {
        _current++;
        _selected = null;
        _answered = false;
      });
    } else {
      setState(() => _done = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    if (_loading) {
      return const Scaffold(body: NvLoading(message: 'Loading quiz...'));
    }

    if (_questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.t('quiz'))),
        body: NvEmptyState(
          icon: Icons.quiz_outlined,
          title: 'No quiz available',
          subtitle: 'Generate a quiz for this course',
          action: NvButton(
            label: 'Generate Quiz',
            loading: _generating,
            width: 200,
            onTap: _generateQuiz,
            icon: const Icon(Icons.auto_awesome, size: 16),
          ),
        ),
      );
    }

    if (_done) {
      return _buildResults(context, l10n);
    }

    final q = _questions[_current];

    return Scaffold(
      appBar: AppBar(
        title: Text(
            '${l10n.t('question')} ${_current + 1} ${l10n.t('of')} ${_questions.length}'),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: Column(
        children: [
          // Progress bar
          LinearProgressIndicator(
            value: (_current + 1) / _questions.length,
            backgroundColor: AppColors.primary.withAlpha(25),
            color: AppColors.primary,
            minHeight: 4,
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Score chip
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      NvBadge(
                        label:
                            '${l10n.t('score')}: $_score/${_questions.length}',
                        color: AppColors.success,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Question
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [
                        AppColors.gradientStart,
                        AppColors.gradientEnd
                      ], begin: Alignment.topLeft, end: Alignment.bottomRight),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(q.question,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w600,
                            height: 1.5)),
                  ),
                  const SizedBox(height: 24),
                  // Options
                  ...q.options.asMap().entries.map((e) {
                    final idx = e.key;
                    final opt = e.value;
                    Color? bg;
                    Color? border;
                    if (_answered) {
                      if (idx == q.correctIndex) {
                        bg = AppColors.success.withAlpha(25);
                        border = AppColors.success;
                      } else if (idx == _selected && idx != q.correctIndex) {
                        bg = AppColors.error.withAlpha(25);
                        border = AppColors.error;
                      }
                    } else if (_selected == idx) {
                      bg = AppColors.primary.withAlpha(25);
                      border = AppColors.primary;
                    }
                    return GestureDetector(
                      onTap: () => _answer(idx),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: bg ?? Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: border ?? Theme.of(context).dividerColor,
                              width: 1.5),
                        ),
                        child: Row(children: [
                          CircleAvatar(
                            radius: 14,
                            backgroundColor:
                                (border ?? Theme.of(context).dividerColor)
                                    .withAlpha(38),
                            child: Text(String.fromCharCode(65 + idx),
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: border ??
                                        Theme.of(context)
                                            .colorScheme
                                            .onSurface)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                              child: Text(opt,
                                  style: const TextStyle(
                                      fontSize: 14, height: 1.4))),
                          if (_answered && idx == q.correctIndex)
                            const Icon(Icons.check_circle,
                                color: AppColors.success, size: 20),
                          if (_answered &&
                              idx == _selected &&
                              idx != q.correctIndex)
                            const Icon(Icons.cancel,
                                color: AppColors.error, size: 20),
                        ]),
                      ),
                    );
                  }),
                  if (_answered && q.explanation != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.lightbulb_outlined,
                                color: AppColors.primary, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                                child: Text(q.explanation!,
                                    style: const TextStyle(
                                        fontSize: 13, height: 1.5))),
                          ]),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (_answered)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              child: NvButton(
                label: _current < _questions.length - 1
                    ? l10n.t('next')
                    : l10n.t('finish'),
                onTap: _next,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildResults(BuildContext context, AppLocalizations l10n) {
    final pct = (_score / _questions.length * 100).round();
    final passed = pct >= 70;
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: (passed ? AppColors.success : AppColors.error)
                      .withAlpha(25),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  passed ? Icons.emoji_events : Icons.refresh,
                  size: 50,
                  color: passed ? AppColors.success : AppColors.error,
                ),
              ),
              const SizedBox(height: 24),
              Text(passed ? '🎉 Well Done!' : 'Keep Practicing',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontFamily: 'PlusJakartaSans',
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text('$_score/${_questions.length} correct ($pct%)',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: passed ? AppColors.success : AppColors.error)),
              const SizedBox(height: 32),
              if (passed)
                NvButton(
                  label: l10n.t('certificate'),
                  onTap: () => context
                      .pushReplacement('/certificate/${widget.courseId}'),
                  icon: const Icon(Icons.workspace_premium, size: 16),
                ),
              const SizedBox(height: 12),
              NvButton(
                label: 'Back to Course',
                primary: false,
                onTap: () => context.go('/course/${widget.courseId}'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
