import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/api/endpoints.dart';
import '../../core/l10n/app_localizations.dart';
import '../../widgets/widgets.dart';

class NotesScreen extends ConsumerStatefulWidget {
  const NotesScreen({super.key});
  @override
  ConsumerState<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends ConsumerState<NotesScreen> {
  List<Map<String, dynamic>> _notes = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.get(ApiEndpoints.notes);
      setState(() { _notes = (res.data as List? ?? []).cast<Map<String,dynamic>>(); _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  Future<void> _delete(int id) async {
    try {
      final api = ref.read(apiClientProvider);
      await api.dio.delete(ApiEndpoints.deleteNote(id));
      _load();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.t('notes'))),
      body: _loading
          ? const NvLoading()
          : _notes.isEmpty
              ? NvEmptyState(
                  icon: Icons.notes, title: l10n.t('no_notes'),
                  subtitle: 'Open a course and add notes while studying')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _notes.length,
                  itemBuilder: (_, i) {
                    final n = _notes[i];
                    return Dismissible(
                      key: Key(n['id'].toString()),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        color: Colors.red, alignment: AlignmentDirectional.centerEnd,
                        padding: const EdgeInsets.only(right: 20),
                        child: const Icon(Icons.delete, color: Colors.white),
                      ),
                      onDismissed: (_) => _delete(n['id'] as int),
                      child: Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            if (n['course_title'] != null)
                              Text(n['course_title'].toString(),
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.blue)),
                            const SizedBox(height: 4),
                            Text(n['content']?.toString() ?? '',
                                style: const TextStyle(fontSize: 14, height: 1.5)),
                          ]),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
