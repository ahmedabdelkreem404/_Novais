
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../core/api/endpoints.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../models/course.dart';
import '../../widgets/widgets.dart';

// ─── Provider ─────────────────────────────────────────────────────────────────

final sharedCourseProvider = FutureProvider.family<Course, String>((ref, token) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.dio.get(ApiEndpoints.sharedCourse(token));
  // The API returns the course object directly
  return Course.fromJson(response.data);
});

// ─── Screen ───────────────────────────────────────────────────────────────────

class SharedCourseScreen extends ConsumerStatefulWidget {
  final String token;

  const SharedCourseScreen({super.key, required this.token});

  @override
  ConsumerState<SharedCourseScreen> createState() => _SharedCourseScreenState();
}

class _SharedCourseScreenState extends ConsumerState<SharedCourseScreen> {
  Map<String, dynamic>? _selectedSubtopic;
  late final WebViewController _webViewController;
  bool _isWebViewInitialized = false;

  @override
  void initState() {
    super.initState();
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000));
  }

  void _loadVideo(String? videoUrl) {
    if (videoUrl == null) return;
    
    // Extract video ID if it's a YouTube URL to construct a clean embed
    String finalUrl = videoUrl;
    if (videoUrl.contains('youtube.com') || videoUrl.contains('youtu.be')) {
      final videoId = videoUrl.contains('v=') 
          ? videoUrl.split('v=')[1].split('&')[0] 
          : videoUrl.split('/').last; // Fix pop() to last
      finalUrl = 'https://www.youtube.com/embed/$videoId?rel=0';
    }

    _webViewController.loadRequest(Uri.parse(finalUrl));
    setState(() {
      _isWebViewInitialized = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final courseAsync = ref.watch(sharedCourseProvider(widget.token));
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('SHARED COURSE'),
        actions: [
          IconButton(
            icon: const Icon(Icons.home_outlined),
            onPressed: () => context.go('/'),
          ),
        ],
      ),
      drawer: courseAsync.when(
        data: (course) => _buildDrawer(course, isDark),
        loading: () => null,
        error: (_, __) => null,
      ),
      body: courseAsync.when(
        data: (course) {
          // Initialize selection if needed
          if (_selectedSubtopic == null) {
            _initSelection(course);
          }

          if (_selectedSubtopic == null) {
            return const NvEmptyState(
              icon: Icons.lock_outline,
              title: 'Content Locked',
              subtitle: 'This course has no public content available.',
            );
          }

          return _buildContent(isDark);
        },
        loading: () => const NvLoading(message: 'Loading shared course...'),
        error: (err, stack) => NvEmptyState(
          icon: Icons.error_outline,
          title: 'Error loading course',
          subtitle: err.toString(),
          action: NvButton(
            label: 'Retry',
            width: 120,
            onTap: () => ref.refresh(sharedCourseProvider(widget.token)),
          ),
        ),
      ),
    );
  }

  void _initSelection(Course course) {
    // Logic to find first unlocked subtopic matches Web:
    // const chapters = metadata.chapters || metadata.topics || [];
    // Find first subtopic with content or theory
    final metadata = course.metadata;
    if (metadata == null) return;

    final chapters = (metadata['chapters'] as List?) ?? (metadata['topics'] as List?) ?? [];
    
    for (final chapter in chapters) {
      final subs = (chapter['subtopics'] as List?) ?? (chapter['sections'] as List?) ?? [];
      for (final sub in subs) {
        if (sub['content'] != null || sub['theory'] != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
             _selectSubtopic(sub);
          });
          return;
        }
      }
    }
  }

  void _selectSubtopic(Map<String, dynamic> sub) {
    setState(() {
      _selectedSubtopic = sub;
      _isWebViewInitialized = false; 
    });
    
    // Check for video/image
    // Web logic: video_url || video
    String? videoUrl = sub['video_url'] ?? sub['video'];
    if (videoUrl != null && videoUrl.isNotEmpty) {
      _loadVideo(videoUrl);
    }
  }

  Widget _buildDrawer(Course course, bool isDark) {
    final metadata = course.metadata ?? {};
    final chapters = (metadata['chapters'] as List?) ?? (metadata['topics'] as List?) ?? [];

    return Drawer(
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1F1F1F) : Colors.blue.shade600,
            ),
            accountName: Text('Shared via NOVAIS', 
              style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 10, letterSpacing: 1)),
            accountEmail: Text(course.title, 
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, overflow: TextOverflow.ellipsis),
              maxLines: 2),
            currentAccountPicture: const CircleAvatar(
              backgroundColor: Colors.white24,
              child: Icon(Icons.share, color: Colors.white),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.zero,
              itemCount: chapters.length,
              itemBuilder: (context, index) {
                final chapter = chapters[index];
                final subs = (chapter['subtopics'] as List?) ?? (chapter['sections'] as List?) ?? [];

                return ExpansionTile(
                  initiallyExpanded: index == 0,
                  leading: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(20),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text('${index + 1}', 
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                  title: Text(chapter['title'] ?? 'Chapter ${index + 1}',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  children: subs.map<Widget>((sub) {
                    final isLocked = (sub['content'] == null && sub['theory'] == null);
                    final isSelected = _selectedSubtopic == sub;

                    return ListTile(
                      contentPadding: const EdgeInsets.only(left: 56, right: 16),
                      selected: isSelected,
                      selectedTileColor: AppColors.primary.withAlpha(15),
                      leading: Icon(
                        isLocked ? Icons.lock_outline : Icons.article_outlined,
                        size: 18,
                        color: isLocked ? Colors.grey : (isSelected ? AppColors.primary : null),
                      ),
                      title: Text(sub['title'] ?? 'Section',
                        style: TextStyle(
                          fontSize: 13, 
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.normal,
                          color: isLocked ? Colors.grey : null,
                        )),
                      onTap: isLocked ? null : () {
                        Navigator.pop(context); // Close drawer
                        _selectSubtopic(sub);
                      },
                    );
                  }).toList(),
                );
              },
            ),
          ),
          // CTA at bottom of drawer
          Padding(
            padding: const EdgeInsets.all(16),
            child: NvButton(
              label: 'Create Your Course',
              icon: const Icon(Icons.auto_awesome, size: 16),
              onTap: () => context.go('/signup'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(bool isDark) {
    if (_selectedSubtopic == null) return const SizedBox();
    
    final sub = _selectedSubtopic!;
    final title = sub['title'] ?? '';
    final theory = sub['theory'] ?? sub['content'] ?? '';
    final examples = sub['examples'];
    final imageUrl = sub['image_url'] ?? sub['image'];
    final videoUrl = sub['video_url'] ?? sub['video'];
    final bool hasVideo = videoUrl != null && videoUrl.isNotEmpty;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, 
            style: const TextStyle(
              fontSize: 24, 
              fontWeight: FontWeight.w800, 
              fontFamily: 'PlusJakartaSans',
              height: 1.2
            )),
          const SizedBox(height: 24),

          // ─── Media Section ──────────────────────────────────────────────
          if (hasVideo)
             Container(
                height: 220,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.black.withAlpha(50), blurRadius: 10, offset: const Offset(0, 4))],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: _isWebViewInitialized
                      ? WebViewWidget(controller: _webViewController)
                      : const Center(child: CircularProgressIndicator(color: Colors.white)),
                ),
             )
          else if (imageUrl != null)
            Container(
              margin: const EdgeInsets.only(bottom: 24),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(imageUrl, 
                  width: double.infinity, 
                  fit: BoxFit.cover,
                  errorBuilder: (_,__,___) => const SizedBox(),
                ),
              ),
            ),

          // ─── Theory ─────────────────────────────────────────────────────
          MarkdownBody(
            data: theory,
            selectable: true,
            styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
              p: TextStyle(fontSize: 16, height: 1.6, color: isDark ? Colors.grey[300] : Colors.grey[800]),
              h1: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, height: 2),
              h2: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, height: 2),
              blockquote: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[600], fontStyle: FontStyle.italic),
              blockquoteDecoration: BoxDecoration(
                color: isDark ? Colors.white10 : Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
                border: const Border(left: BorderSide(color: AppColors.primary, width: 4)),
              ),
            ),
          ),

          // ─── Examples ───────────────────────────────────────────────────
          if (examples != null && examples.isNotEmpty) ...[
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(20),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primary.withAlpha(50)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(children: [
                     Icon(Icons.play_circle_outline, color: AppColors.primary, size: 20),
                     SizedBox(width: 8),
                     Text('EXAMPLES & PRACTICE', 
                        style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1)),
                  ]),
                  const SizedBox(height: 12),
                  MarkdownBody(data: examples),
                ],
              ),
            ),
          ],

          // ─── Bottom CTA ────────────────────────────────────────────────
          const SizedBox(height: 48),
          Center(
            child: Column(children: [
               const Text('Want to create courses like this?', 
                  style: TextStyle(color: Colors.grey, fontSize: 14)),
               const SizedBox(height: 12),
               NvButton(
                 label: 'START FREE TRIAL',
                 width: 200,
                 primary: false, // Outline style
                 onTap: () => context.go('/signup'),
               )
            ]),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
