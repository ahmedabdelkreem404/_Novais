import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/api/endpoints.dart';
import '../../core/theme/app_theme.dart';
import '../../core/l10n/app_localizations.dart';
import '../../models/course.dart';
import '../../widgets/widgets.dart';

final _courseDetailProvider =
    FutureProvider.family<Course, int>((ref, id) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.course(id));
  return Course.fromJson(res.data);
});

class CourseScreen extends ConsumerStatefulWidget {
  final int courseId;
  const CourseScreen({super.key, required this.courseId});

  @override
  ConsumerState<CourseScreen> createState() => _CourseScreenState();
}

class _CourseScreenState extends ConsumerState<CourseScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  int _currentLesson = 0;
  bool _drawerOpen = false;

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

    return Scaffold(
      body: courseAsync.when(
        loading: () => const NvLoading(message: 'Loading course...'),
        error: (e, _) => NvEmptyState(
          icon: Icons.error_outline,
          title: 'Failed to load course',
          subtitle: e.toString(),
        ),
        data: (course) => _buildCourse(context, l10n, course),
      ),
    );
  }

  Widget _buildCourse(BuildContext context, AppLocalizations l10n, Course course) {
    final lessons = course.lessons;
    final lesson = lessons.isNotEmpty ? lessons[_currentLesson] : null;

    return Scaffold(
      appBar: AppBar(
        title: Text(course.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        leading: BackButton(onPressed: () => context.pop()),
        actions: [
          IconButton(
            icon: const Icon(Icons.quiz_outlined),
            tooltip: l10n.t('quiz'),
            onPressed: () => context.push('/quiz/${widget.courseId}'),
          ),
          IconButton(
            icon: const Icon(Icons.workspace_premium_outlined),
            tooltip: l10n.t('certificate'),
            onPressed: () => context.push('/certificate/${widget.courseId}'),
          ),
          IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => setState(() => _drawerOpen = !_drawerOpen),
          ),
        ],
        bottom: TabBar(
          controller: _tabCtrl,
          tabs: [
            Tab(text: l10n.t('lessons')),
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
                                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                        fontFamily: 'PlusJakartaSans',
                                        fontWeight: FontWeight.w700)),
                                const SizedBox(height: 16),
                                if (lesson.imageUrl != null) ...[
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: Image.network(lesson.imageUrl!,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => const SizedBox()),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                                if (lesson.content != null)
                                  MarkdownBody(
                                    data: lesson.content!,
                                    styleSheet: MarkdownStyleSheet(
                                      p: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.7),
                                      h2: Theme.of(context).textTheme.titleLarge?.copyWith(
                                          fontFamily: 'PlusJakartaSans',
                                          fontWeight: FontWeight.w700),
                                      code: TextStyle(
                                          backgroundColor: AppColors.primary.withAlpha(25),
                                          fontFamily: 'monospace'),
                                    ),
                                  ),
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
                          top: BorderSide(color: Theme.of(context).dividerColor),
                        ),
                      ),
                      child: Row(children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _currentLesson > 0
                                ? () => setState(() => _currentLesson--)
                                : null,
                            icon: const Icon(Icons.arrow_back, size: 16),
                            label: Text(l10n.t('previous')),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text('${_currentLesson + 1}/${lessons.length}',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        ),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _currentLesson < lessons.length - 1
                                ? () => setState(() => _currentLesson++)
                                : null,
                            icon: const Icon(Icons.arrow_forward, size: 16),
                            label: Text(l10n.t('next')),
                          ),
                        ),
                      ]),
                    ),
                ],
              ),

              // ── AI Chat ────────────────────────────────────────────
              _ChatTab(courseId: widget.courseId),

              // ── Notes ──────────────────────────────────────────────
              _NotesTab(courseId: widget.courseId),
            ],
          ),

          // ── Lesson Drawer (right side) ─────────────────────────────
          if (_drawerOpen && course.lessons.isNotEmpty)
            Positioned(
              top: 0, right: 0, bottom: 0,
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
                            Text(l10n.t('lessons'),
                                style: Theme.of(context).textTheme.titleLarge),
                            IconButton(
                              icon: const Icon(Icons.close),
                              onPressed: () => setState(() => _drawerOpen = false),
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
                              selectedTileColor: AppColors.primary.withAlpha(25),
                              leading: CircleAvatar(
                                radius: 14,
                                backgroundColor: isActive
                                    ? AppColors.primary
                                    : AppColors.primary.withAlpha(25),
                                child: Text('${i + 1}',
                                    style: TextStyle(
                                        color: isActive ? Colors.white : AppColors.primary,
                                        fontSize: 12, fontWeight: FontWeight.w700)),
                              ),
                              title: Text(l.title,
                                  maxLines: 2,
                                  style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: isActive ? FontWeight.w700 : FontWeight.w400)),
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
}

// ── Chat Tab ─────────────────────────────────────────────────────────────────

class _ChatTab extends ConsumerStatefulWidget {
  final int courseId;
  const _ChatTab({required this.courseId});

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
            .map((m) => {'role': m['role'].toString(), 'content': m['content'].toString()})
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
        'course_id': widget.courseId,
      });
      final reply = res.data['message'] ?? res.data['content'] ?? '';
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
                            radius: 16, backgroundColor: AppColors.primary,
                            child: Icon(Icons.auto_awesome, size: 14, color: Colors.white),
                          ),
                          SizedBox(width: 10),
                          SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
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
                        mainAxisAlignment:
                            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
                        children: [
                          if (!isUser) ...[
                            const CircleAvatar(
                              radius: 16, backgroundColor: AppColors.primary,
                              child: Icon(Icons.auto_awesome, size: 14, color: Colors.white),
                            ),
                            const SizedBox(width: 8),
                          ],
                          Flexible(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
                                    : Border.all(color: Theme.of(context).dividerColor),
                              ),
                              child: Text(m['content'] ?? '',
                                  style: TextStyle(
                                      color: isUser ? Colors.white : null,
                                      fontSize: 14, height: 1.5)),
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
            border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
          ),
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: _msgCtrl,
                decoration: InputDecoration(
                  hintText: l10n.t('type_message'),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
