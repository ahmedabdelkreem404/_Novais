import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/api/api_client.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/api/endpoints.dart';
import '../../core/theme/app_theme.dart';
import '../../core/l10n/app_localizations.dart';
import '../../models/course.dart';
import '../../widgets/widgets.dart';

final _courseDetailProvider =
    FutureProvider.family<Course, String>((ref, id) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.course(id));
  return Course.fromJson(res.data);
});

class CourseScreen extends ConsumerStatefulWidget {
  final String courseId;
  const CourseScreen({super.key, required this.courseId});

  @override
  ConsumerState<CourseScreen> createState() => _CourseScreenState();
}

class _CourseScreenState extends ConsumerState<CourseScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  int _currentLesson = 0;
  bool _drawerOpen = false;
  Course? _course;
  bool _preparingLesson = false;
  final Set<String> _requestedLessons = {};

  String _getDynamicLabel(String key, String? blueprintSlug, bool isAr) {
    if (key == 'lessons') {
      switch (blueprintSlug) {
        case 'book':
        case 'story':
          return isAr ? 'فصول' : 'Chapters';
        case 'exam':
        case 'exam-builder':
        case 'question-bank':
          return isAr ? 'أسئلة' : 'Questions';
        case 'research-paper':
        case 'master-thesis':
        case 'academic-lecture':
        case 'academic-course':
          return isAr ? 'أقسام' : 'Sections';
        case 'graduation-project':
        case 'project-based-learning':
          return isAr ? 'مراحل' : 'Phases';
        case 'study-review':
          return isAr ? 'موضوعات' : 'Topics';
        case 'lesson-plan':
          return isAr ? 'خطوات' : 'Steps';
        case 'assignment-builder':
          return isAr ? 'مهام' : 'Tasks';
        default:
          return isAr ? 'دروس' : 'Lessons';
      }
    }
    if (key == 'previous') {
      switch (blueprintSlug) {
        case 'book':
        case 'story':
          return isAr ? 'الفصل السابق' : 'Previous Chapter';
        case 'exam':
        case 'exam-builder':
        case 'question-bank':
          return isAr ? 'السؤال السابق' : 'Previous Question';
        case 'research-paper':
        case 'master-thesis':
        case 'academic-lecture':
        case 'academic-course':
          return isAr ? 'القسم السابق' : 'Previous Section';
        case 'graduation-project':
        case 'project-based-learning':
          return isAr ? 'المرحلة السابقة' : 'Previous Phase';
        case 'study-review':
          return isAr ? 'الموضوع السابق' : 'Previous Topic';
        case 'lesson-plan':
          return isAr ? 'الخطوة السابقة' : 'Previous Step';
        case 'assignment-builder':
          return isAr ? 'المهمة السابقة' : 'Previous Task';
        default:
          return isAr ? 'الدرس السابق' : 'Previous Lesson';
      }
    }
    if (key == 'next') {
      switch (blueprintSlug) {
        case 'book':
        case 'story':
          return isAr ? 'الفصل التالي' : 'Next Chapter';
        case 'exam':
        case 'exam-builder':
        case 'question-bank':
          return isAr ? 'السؤال التالي' : 'Next Question';
        case 'research-paper':
        case 'master-thesis':
        case 'academic-lecture':
        case 'academic-course':
          return isAr ? 'القسم التالي' : 'Next Section';
        case 'graduation-project':
        case 'project-based-learning':
          return isAr ? 'المرحلة التالية' : 'Next Phase';
        case 'study-review':
          return isAr ? 'الموضوع التالي' : 'Next Topic';
        case 'lesson-plan':
          return isAr ? 'الخطوة التالية' : 'Next Step';
        case 'assignment-builder':
          return isAr ? 'المهمة التالية' : 'Next Task';
        default:
          return isAr ? 'الدرس التالي' : 'Next Lesson';
      }
    }
    return key;
  }

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final courseAsync = ref.watch(_courseDetailProvider(widget.courseId));

    return courseAsync.when(
      loading: () => const Scaffold(
        body: NvLoading(message: 'Loading course...'),
      ),
      error: (e, _) => Scaffold(
        body: NvEmptyState(
          icon: Icons.error_outline,
          title: l10n.t('failed_load_course'),
          subtitle: e.toString(),
          action: NvButton(
            label: l10n.t('retry'),
            width: 140,
            onTap: () => ref.invalidate(_courseDetailProvider(widget.courseId)),
          ),
        ),
      ),
      data: (course) {
        if (_course == null || _course!.id != course.id) {
          _course = course;
        }
        return _buildCourse(context, l10n, _course!);
      },
    );
  }

  Widget _buildCourse(
      BuildContext context, AppLocalizations l10n, Course course) {
    final lessons = course.lessons;
    final lesson = lessons.isNotEmpty ? lessons[_currentLesson] : null;
    _scheduleLessonPreparation(course, lesson);

    final blueprintSlug = course.blueprintSlug;
    final documentSlugs = ['book', 'graduation-project', 'master-thesis'];
    final questionSlugs = ['question-bank', 'exam-builder', 'assignment-builder'];
    final storySlugs = ['story'];
    final isDocument = documentSlugs.contains(blueprintSlug);
    final isQuestion = questionSlugs.contains(blueprintSlug);
    final isStory = storySlugs.contains(blueprintSlug);
    final isCourse = !isDocument && !isQuestion && !isStory;

    return Scaffold(
      appBar: AppBar(
        title: Text(course.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        leading: BackButton(onPressed: () => context.pop()),
        actions: [
          if (isCourse) ...[
            IconButton(
              icon: const Icon(Icons.quiz_outlined),
              tooltip: l10n.t('quiz'),
              onPressed: () => context.push('/quiz/${course.id}'),
            ),
            IconButton(
              icon: const Icon(Icons.workspace_premium_outlined),
              tooltip: l10n.t('certificate'),
              onPressed: () => context.push('/certificate/${course.id}'),
            ),
          ],
          IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => setState(() => _drawerOpen = !_drawerOpen),
          ),
        ],
        bottom: TabBar(
          controller: _tabCtrl,
          tabs: [
            Tab(text: _getDynamicLabel('lessons', course.blueprintSlug, l10n.isAr)),
            Tab(text: l10n.t('chat')),
            Tab(text: l10n.t('notes_tab')),
          ],
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
        ),
      ),
      body: Stack(
        children: [
          TabBarView(
            controller: _tabCtrl,
            children: [
              // ── Lesson Content ────────────────────────────────────
              Column(
                children: [
                  Expanded(
                    child: lesson == null
                        ? const NvEmptyState(
                            icon: Icons.menu_book_outlined,
                            title: 'No lessons available')
                        : SingleChildScrollView(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(lesson.title,
                                    style: Theme.of(context)
                                        .textTheme
                                        .headlineSmall
                                        ?.copyWith(
                                            fontFamily: 'PlusJakartaSans',
                                            fontWeight: FontWeight.w700)),
                                const SizedBox(height: 16),
                                if (lesson.videoUrl != null) ...[
                                  _LessonVideoCard(url: lesson.videoUrl!),
                                  const SizedBox(height: 16),
                                ] else ...[
                                  _LessonImageCard(
                                    url: lesson.imageUrl ?? course.imageUrl,
                                  ),
                                  const SizedBox(height: 16),
                                ],
                                if (_preparingLesson &&
                                    (lesson.content == null ||
                                        lesson.content!.isEmpty)) ...[
                                  const SizedBox(height: 12),
                                  NvLoading(
                                      message: l10n.t('preparing_lesson')),
                                ] else if (lesson.content != null &&
                                    lesson.content!.isNotEmpty)
                                  MarkdownBody(
                                    data: lesson.content!,
                                    styleSheet: MarkdownStyleSheet(
                                      p: Theme.of(context)
                                          .textTheme
                                          .bodyLarge
                                          ?.copyWith(height: 1.7),
                                      h2: Theme.of(context)
                                          .textTheme
                                          .titleLarge
                                          ?.copyWith(
                                              fontFamily: 'PlusJakartaSans',
                                              fontWeight: FontWeight.w700),
                                      code: TextStyle(
                                          backgroundColor:
                                              AppColors.primary.withAlpha(25),
                                          fontFamily: 'monospace'),
                                    ),
                                  ),
                                if (!_preparingLesson &&
                                    (lesson.content == null ||
                                        lesson.content!.isEmpty)) ...[
                                  const SizedBox(height: 12),
                                  NvEmptyState(
                                    icon: Icons.auto_awesome,
                                    title: l10n.t('lesson_not_ready'),
                                    subtitle: l10n.t('lesson_not_ready_desc'),
                                    action: NvButton(
                                      label: l10n.t('retry'),
                                      width: 140,
                                      onTap: () => _prepareLesson(
                                        course,
                                        lesson,
                                        force: true,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                  ),
                  // Lesson nav
                  if (lessons.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        border: Border(
                          top:
                              BorderSide(color: Theme.of(context).dividerColor),
                        ),
                      ),
                      child: Row(children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _currentLesson > 0
                                ? () => setState(() => _currentLesson--)
                                : null,
                            icon: const Icon(Icons.arrow_back, size: 16),
                            label: Text(_getDynamicLabel('previous', course.blueprintSlug, l10n.isAr)),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text('${_currentLesson + 1}/${lessons.length}',
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w600)),
                        ),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _currentLesson < lessons.length - 1
                                ? () => setState(() => _currentLesson++)
                                : null,
                            icon: const Icon(Icons.arrow_forward, size: 16),
                            label: Text(_getDynamicLabel('next', course.blueprintSlug, l10n.isAr)),
                          ),
                        ),
                      ]),
                    ),
                ],
              ),

              // ── AI Chat ────────────────────────────────────────────
              _ChatTab(
                courseId: course.apiId,
                topic: course.title,
                context: lesson?.content ?? '',
              ),

              // ── Notes ──────────────────────────────────────────────
              _NotesTab(courseId: course.id),
            ],
          ),

          // ── Lesson Drawer (right side) ─────────────────────────────
          if (_drawerOpen && course.lessons.isNotEmpty)
            Positioned(
              top: 0,
              right: 0,
              bottom: 0,
              width: MediaQuery.of(context).size.width * 0.75,
              child: GestureDetector(
                onTap: () {}, // prevent close on tap inside
                child: Container(
                  color: Theme.of(context).colorScheme.surface,
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 48, 16, 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(_getDynamicLabel('lessons', course.blueprintSlug, l10n.isAr),
                                style: Theme.of(context).textTheme.titleLarge),
                            IconButton(
                              icon: const Icon(Icons.close),
                              onPressed: () =>
                                  setState(() => _drawerOpen = false),
                            ),
                          ],
                        ),
                      ),
                      const Divider(),
                      Expanded(
                        child: ListView.builder(
                          padding: EdgeInsets.zero,
                          itemCount: course.lessons.length,
                          itemBuilder: (_, i) {
                            final l = course.lessons[i];
                            final isActive = i == _currentLesson;
                            return ListTile(
                              selected: isActive,
                              selectedTileColor:
                                  AppColors.primary.withAlpha(25),
                              leading: CircleAvatar(
                                radius: 14,
                                backgroundColor: isActive
                                    ? AppColors.primary
                                    : AppColors.primary.withAlpha(25),
                                child: Text('${i + 1}',
                                    style: TextStyle(
                                        color: isActive
                                            ? Colors.white
                                            : AppColors.primary,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700)),
                              ),
                              title: Text(l.title,
                                  maxLines: 2,
                                  style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: isActive
                                          ? FontWeight.w700
                                          : FontWeight.w400)),
                              onTap: () {
                                setState(() {
                                  _currentLesson = i;
                                  _drawerOpen = false;
                                  _tabCtrl.animateTo(0);
                                });
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  bool _lessonNeedsPreparation(Lesson? lesson) {
    if (lesson == null) return false;
    final hasContent =
        lesson.content != null && lesson.content!.trim().isNotEmpty;
    final hasMedia = lesson.videoUrl != null || lesson.imageUrl != null;
    return !hasContent || !hasMedia;
  }

  void _scheduleLessonPreparation(Course course, Lesson? lesson) {
    if (!_lessonNeedsPreparation(lesson) || _preparingLesson) return;
    final key = '${lesson!.topicTitle}/${lesson.title}';
    if (_requestedLessons.contains(key)) return;
    _requestedLessons.add(key);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _prepareLesson(course, lesson);
    });
  }

  Future<void> _prepareLesson(
    Course course,
    Lesson lesson, {
    bool force = false,
  }) async {
    final key = '${lesson.topicTitle}/${lesson.title}';
    if (_preparingLesson) return;
    if (!force && !_lessonNeedsPreparation(lesson)) return;

    setState(() => _preparingLesson = true);
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.post(ApiEndpoints.generateLesson, data: {
        'course_id': course.apiId,
        'chapter_title': lesson.topicTitle,
        'subtopic_title': lesson.title,
        'language': course.language ?? 'English',
      });

      final data = res.data['data'];
      if (data is Map) {
        final generated = Lesson.fromJson({
          ...Map<String, dynamic>.from(data),
          'id': lesson.id,
          'course_id': lesson.courseId,
          'topic_title': lesson.topicTitle,
          'title': lesson.title,
        });
        final updatedLessons = [...course.lessons];
        final index = updatedLessons.indexWhere(
          (item) =>
              item.title == lesson.title &&
              item.topicTitle == lesson.topicTitle,
        );
        if (index >= 0) {
          updatedLessons[index] = lesson.copyWith(
            content: generated.content,
            mediaUrl: generated.mediaUrl,
            mediaType: generated.mediaType,
            metadata: generated.metadata,
            completed: true,
          );
          if (mounted) {
            setState(() => _course = course.copyWith(lessons: updatedLessons));
          }
        }
      }
    } catch (_) {
      _requestedLessons.remove(key);
    } finally {
      if (mounted) setState(() => _preparingLesson = false);
    }
  }
}

class _LessonImageCard extends StatelessWidget {
  final String? url;

  const _LessonImageCard({required this.url});

  @override
  Widget build(BuildContext context) {
    final resolvedUrl = url == null ? null : ApiClient.resolveMediaUrl(url!);
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: resolvedUrl == null || resolvedUrl.isEmpty
            ? const _MediaFallback(icon: Icons.image_outlined)
            : Image.network(
                resolvedUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    const _MediaFallback(icon: Icons.broken_image_outlined),
              ),
      ),
    );
  }
}

class _LessonVideoCard extends StatelessWidget {
  final String url;

  const _LessonVideoCard({required this.url});

  @override
  Widget build(BuildContext context) {
    final uri = Uri.tryParse(url);
    final embedUrl = _youtubeEmbedUrl(url);

    if (embedUrl != null) {
      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..loadRequest(Uri.parse(embedUrl));

      return ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: WebViewWidget(controller: controller),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: uri == null
              ? null
              : () => launchUrl(uri, mode: LaunchMode.externalApplication),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child:
                    const Icon(Icons.play_arrow, color: Colors.white, size: 34),
              ),
              const SizedBox(height: 12),
              Text(
                uri == null ? 'Video unavailable' : 'Open lesson video',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String? _youtubeEmbedUrl(String raw) {
    final uri = Uri.tryParse(raw);
    if (uri == null) return null;

    String? id;
    if (uri.host.contains('youtube.com')) {
      id = uri.queryParameters['v'];
      if (id == null && uri.pathSegments.contains('embed')) {
        final index = uri.pathSegments.indexOf('embed');
        if (uri.pathSegments.length > index + 1) {
          id = uri.pathSegments[index + 1];
        }
      }
    } else if (uri.host.contains('youtu.be') && uri.pathSegments.isNotEmpty) {
      id = uri.pathSegments.first;
    }

    if (id == null || id.length < 6) return null;
    return 'https://www.youtube.com/embed/$id?rel=0&playsinline=1';
  }
}

class _MediaFallback extends StatelessWidget {
  final IconData icon;

  const _MediaFallback({required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.primary.withAlpha(18),
      child: Center(
        child: Icon(icon, color: AppColors.primary, size: 42),
      ),
    );
  }
}

// ── Chat Tab ─────────────────────────────────────────────────────────────────

class _ChatTab extends ConsumerStatefulWidget {
  final String courseId;
  final String topic;
  final String context;

  const _ChatTab({
    required this.courseId,
    required this.topic,
    required this.context,
  });

  @override
  ConsumerState<_ChatTab> createState() => _ChatTabState();
}

class _ChatTabState extends ConsumerState<_ChatTab> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  List<Map<String, String>> _messages = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.get(ApiEndpoints.chatHistory(widget.courseId));
      final list = res.data as List? ?? [];
      setState(() {
        _messages = list
            .map((m) => {
                  'role': m['role'].toString(),
                  'content': m['content'].toString()
                })
            .toList();
      });
    } catch (_) {}
  }

  Future<void> _send() async {
    final msg = _msgCtrl.text.trim();
    if (msg.isEmpty) return;
    _msgCtrl.clear();
    setState(() {
      _messages.add({'role': 'user', 'content': msg});
      _loading = true;
    });
    _scrollToBottom();
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.post(ApiEndpoints.chat, data: {
        'message': msg,
        'courseId': widget.courseId,
        'topic': widget.topic,
        'context': widget.context,
        'history': _messages,
      });
      final reply =
          res.data['reply'] ?? res.data['message'] ?? res.data['content'] ?? '';
      if (mounted) {
        setState(() {
          _messages.add({'role': 'assistant', 'content': reply.toString()});
          _loading = false;
        });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      children: [
        Expanded(
          child: _messages.isEmpty && !_loading
              ? const NvEmptyState(
                  icon: Icons.chat_bubble_outline,
                  title: 'Ask anything about this course',
                )
              : ListView.builder(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.all(16),
                  itemCount: _messages.length + (_loading ? 1 : 0),
                  itemBuilder: (_, i) {
                    if (i == _messages.length) {
                      return const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Row(children: [
                          CircleAvatar(
                            radius: 16,
                            backgroundColor: AppColors.primary,
                            child: Icon(Icons.auto_awesome,
                                size: 14, color: Colors.white),
                          ),
                          SizedBox(width: 10),
                          SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: AppColors.primary),
                          ),
                        ]),
                      );
                    }
                    final m = _messages[i];
                    final isUser = m['role'] == 'user';
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: isUser
                            ? MainAxisAlignment.end
                            : MainAxisAlignment.start,
                        children: [
                          if (!isUser) ...[
                            const CircleAvatar(
                              radius: 16,
                              backgroundColor: AppColors.primary,
                              child: Icon(Icons.auto_awesome,
                                  size: 14, color: Colors.white),
                            ),
                            const SizedBox(width: 8),
                          ],
                          Flexible(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: isUser
                                    ? AppColors.primary
                                    : Theme.of(context).colorScheme.surface,
                                borderRadius: BorderRadius.only(
                                  topLeft: const Radius.circular(14),
                                  topRight: const Radius.circular(14),
                                  bottomLeft: Radius.circular(isUser ? 14 : 4),
                                  bottomRight: Radius.circular(isUser ? 4 : 14),
                                ),
                                border: isUser
                                    ? null
                                    : Border.all(
                                        color: Theme.of(context).dividerColor),
                              ),
                              child: Text(m['content'] ?? '',
                                  style: TextStyle(
                                      color: isUser ? Colors.white : null,
                                      fontSize: 14,
                                      height: 1.5)),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            border:
                Border(top: BorderSide(color: Theme.of(context).dividerColor)),
          ),
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: _msgCtrl,
                decoration: InputDecoration(
                  hintText: l10n.t('type_message'),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                onSubmitted: (_) => _send(),
                maxLines: null,
              ),
            ),
            const SizedBox(width: 8),
            Material(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                onTap: _send,
                borderRadius: BorderRadius.circular(12),
                child: const Padding(
                  padding: EdgeInsets.all(12),
                  child: Icon(Icons.send, color: Colors.white, size: 20),
                ),
              ),
            ),
          ]),
        ),
      ],
    );
  }
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────

class _NotesTab extends ConsumerStatefulWidget {
  final int courseId;
  const _NotesTab({required this.courseId});

  @override
  ConsumerState<_NotesTab> createState() => _NotesTabState();
}

class _NotesTabState extends ConsumerState<_NotesTab> {
  final _noteCtrl = TextEditingController();
  List<Map<String, dynamic>> _notes = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.get(ApiEndpoints.notes,
          queryParameters: {'course_id': widget.courseId});
      setState(() {
        _notes = (res.data as List? ?? []).cast<Map<String, dynamic>>();
      });
    } catch (_) {}
  }

  Future<void> _save() async {
    final content = _noteCtrl.text.trim();
    if (content.isEmpty) return;
    try {
      final api = ref.read(apiClientProvider);
      await api.dio.post(ApiEndpoints.notes, data: {
        'content': content,
        'course_id': widget.courseId,
      });
      _noteCtrl.clear();
      _load();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      children: [
        Expanded(
          child: _notes.isEmpty
              ? const NvEmptyState(icon: Icons.notes, title: 'No notes yet')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _notes.length,
                  itemBuilder: (_, i) {
                    final n = _notes[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Text(n['content']?.toString() ?? '',
                            style: const TextStyle(fontSize: 14, height: 1.5)),
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 24),
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: _noteCtrl,
                decoration: const InputDecoration(hintText: 'Add a note...'),
                maxLines: 3,
                minLines: 1,
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(onPressed: _save, child: Text(l10n.t('save'))),
          ]),
        ),
      ],
    );
  }
}
