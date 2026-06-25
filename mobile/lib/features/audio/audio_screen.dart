import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:just_audio/just_audio.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/api/endpoints.dart';
import '../../core/l10n/app_localizations.dart';
import '../../models/course.dart';
import '../../widgets/widgets.dart';

final _audioCoursesProvider = FutureProvider<List<Course>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.audioCourses);
  final data = res.data as List? ?? [];
  return data.map((e) => Course.fromJson(e)).toList();
});

class AudioCoursesScreen extends ConsumerWidget {
  const AudioCoursesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final coursesAsync = ref.watch(_audioCoursesProvider);

    return Scaffold(
      body: coursesAsync.when(
        loading: () => const NvLoading(),
        error: (_, __) => const NvEmptyState(icon: Icons.error_outline, title: 'Failed to load'),
        data: (courses) => CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 140,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                title: Text(l10n.t('audio_courses'),
                    style: const TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w700)),
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF7c3aed), Color(0xFF4f46e5)],
                      begin: Alignment.topLeft, end: Alignment.bottomRight,
                    ),
                  ),
                ),
              ),
            ),
            if (courses.isEmpty)
              const SliverFillRemaining(
                child: NvEmptyState(
                  icon: Icons.headphones_outlined,
                  title: 'No audio courses yet',
                  subtitle: 'Create a course with "audio" type to see it here',
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) {
                    final c = courses[i];
                    return Card(
                      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(12),
                        leading: ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: c.imageUrl != null
                              ? Image.network(c.imageUrl!, width: 56, height: 56, fit: BoxFit.cover)
                              : Container(
                                  width: 56, height: 56,
                                color: const Color(0xFF7c3aed).withAlpha(25),
                                  child: const Icon(Icons.headphones, color: Color(0xFF7c3aed))),
                        ),
                        title: Text(c.title,
                            maxLines: 2, overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('${c.lessons.length} lessons'),
                        trailing: const Icon(Icons.play_circle_outline,
                            color: Color(0xFF7c3aed), size: 32),
                        onTap: () => context.push('/audio/${c.id}'),
                      ),
                    );
                  },
                  childCount: courses.length,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Audio Player ──────────────────────────────────────────────────────────────

class AudioPlayerScreen extends ConsumerStatefulWidget {
  final int courseId;
  const AudioPlayerScreen({super.key, required this.courseId});
  @override
  ConsumerState<AudioPlayerScreen> createState() => _AudioPlayerScreenState();
}

class _AudioPlayerScreenState extends ConsumerState<AudioPlayerScreen> {
  late AudioPlayer _player;
  Course? _course;
  int _currentLesson = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _player = AudioPlayer();
    _loadCourse();
  }

  Future<void> _loadCourse() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.get(ApiEndpoints.course(widget.courseId));
      setState(() { _course = Course.fromJson(res.data); _loading = false; });
      _playLesson(0);
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _playLesson(int idx) async {
    final lesson = _course?.lessons[idx];
    final url = lesson?.audioUrl;
    if (url == null) return;
    try {
      await _player.setUrl(url);
      _player.play();
    } catch (_) {}
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final course = _course;

    if (_loading) return const Scaffold(body: NvLoading(message: 'Loading...'));

    return Scaffold(
      body: Container(
        width: double.infinity, height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0f0a1e), Color(0xFF1a0533)],
            begin: Alignment.topCenter, end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(children: [
            // AppBar
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.white),
                  onPressed: () => context.pop(),
                ),
                Expanded(
                  child: Text(course?.title ?? '',
                      textAlign: TextAlign.center,
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                ),
                const SizedBox(width: 48),
              ]),
            ),

            // Artwork
            Expanded(
              child: Center(
                child: Hero(
                  tag: 'audio-${widget.courseId}',
                  child: Container(
                    width: 220, height: 220,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const RadialGradient(colors: [Color(0xFF7c3aed), Color(0xFF4f46e5)]),
                        boxShadow: [
                          BoxShadow(color: const Color(0xFF7c3aed).withAlpha(100),
                              blurRadius: 60, spreadRadius: 10),
                        ],
                    ),
                    child: course?.imageUrl != null
                        ? ClipOval(child: Image.network(course!.imageUrl!, fit: BoxFit.cover))
                        : const Icon(Icons.headphones, size: 80, color: Colors.white),
                  ),
                ),
              ),
            ),

            // Track info
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              child: Column(children: [
                Text(course?.lessons[_currentLesson].title ?? '',
                    textAlign: TextAlign.center, maxLines: 2,
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text('${_currentLesson + 1} / ${course?.lessons.length ?? 0} lessons',
                    style: const TextStyle(color: Colors.white60, fontSize: 13)),
              ]),
            ),

            // Progress
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: StreamBuilder<Duration?>(
                stream: _player.durationStream,
                builder: (_, durSnap) {
                  return StreamBuilder<Duration>(
                    stream: _player.positionStream,
                    builder: (_, posSnap) {
                      final dur = durSnap.data ?? Duration.zero;
                      final pos = posSnap.data ?? Duration.zero;
                      return Column(children: [
                        Slider(
                          value: dur.inMilliseconds > 0
                              ? (pos.inMilliseconds / dur.inMilliseconds).clamp(0, 1)
                              : 0,
                          activeColor: const Color(0xFF7c3aed),
                          inactiveColor: Colors.white24,
                          onChanged: (v) => _player.seek(
                              Duration(milliseconds: (v * dur.inMilliseconds).round())),
                        ),
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text(_fmt(pos), style: const TextStyle(color: Colors.white60, fontSize: 11)),
                          Text(_fmt(dur), style: const TextStyle(color: Colors.white60, fontSize: 11)),
                        ]),
                      ]);
                    },
                  );
                },
              ),
            ),

            // Controls
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
                IconButton(
                  icon: const Icon(Icons.skip_previous, color: Colors.white, size: 36),
                  onPressed: _currentLesson > 0
                      ? () { setState(() => _currentLesson--); _playLesson(_currentLesson); }
                      : null,
                ),
                StreamBuilder<PlayerState>(
                  stream: _player.playerStateStream,
                  builder: (_, snap) {
                    final playing = snap.data?.playing ?? false;
                    return GestureDetector(
                      onTap: playing ? _player.pause : _player.play,
                      child: Container(
                        width: 68, height: 68,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(colors: [Color(0xFF7c3aed), Color(0xFF4f46e5)]),
                        ),
                        child: Icon(playing ? Icons.pause : Icons.play_arrow,
                            color: Colors.white, size: 36),
                      ),
                    );
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.skip_next, color: Colors.white, size: 36),
                  onPressed: _currentLesson < (course?.lessons.length ?? 1) - 1
                      ? () { setState(() => _currentLesson++); _playLesson(_currentLesson); }
                      : null,
                ),
              ]),
            ),
          ]),
        ),
      ),
    );
  }

  String _fmt(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }
}
