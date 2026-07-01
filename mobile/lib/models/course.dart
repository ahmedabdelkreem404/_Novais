class Course {
  final int id;
  final String publicId;
  final String title;
  final String? type;
  final String? language;
  final String? photo;
  final Map<String, dynamic>? metadata;
  final bool completed;
  final List<Lesson> lessons;
  final String? blueprintSlug;

  String? get imageUrl => photo;
  String get apiId => publicId.isNotEmpty ? publicId : id.toString();

  const Course({
    required this.id,
    required this.publicId,
    required this.title,
    this.type,
    this.language,
    this.photo,
    this.metadata,
    this.completed = false,
    this.lessons = const [],
    this.blueprintSlug,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    final metadata = _mapOrNull(json['metadata']);
    final savedLessons = (json['lessons'] as List<dynamic>?)
            ?.whereType<Map>()
            .map((e) => Lesson.fromJson(Map<String, dynamic>.from(e)))
            .toList() ??
        [];
    final metadataLessons = _lessonsFromMetadata(
      metadata,
      savedLessons,
      int.tryParse(json['id'].toString()) ?? 0,
    );

    return Course(
      id: int.tryParse(json['id'].toString()) ?? 0,
      publicId: json['public_id'] as String? ?? '',
      title: json['title'] as String? ?? 'Untitled Course',
      type: json['type'] as String?,
      language: json['language'] as String?,
      photo: _stringOrNull(json['photo']) ??
          _stringOrNull(metadata?['cover_image']) ??
          _stringOrNull(metadata?['photo']) ??
          _stringOrNull(metadata?['image']),
      metadata: metadata,
      completed: json['completed'] == 1 || json['completed'] == true,
      lessons: metadataLessons.isNotEmpty ? metadataLessons : savedLessons,
      blueprintSlug: json['blueprint_slug'] as String? ?? metadata?['blueprint_slug'] as String?,
    );
  }

  Course copyWith({List<Lesson>? lessons}) {
    return Course(
      id: id,
      publicId: publicId,
      title: title,
      type: type,
      language: language,
      photo: photo,
      metadata: metadata,
      completed: completed,
      lessons: lessons ?? this.lessons,
      blueprintSlug: blueprintSlug,
    );
  }
}

class Lesson {
  final int id;
  final int courseId;
  final String title;
  final String topicTitle;
  final String? content;
  final bool completed;
  final String? mediaUrl;
  final String? mediaType;
  final Map<String, dynamic>? metadata;

  String? get imageUrl =>
      _firstMediaUrl('images') ??
      ((mediaType == 'image' || mediaType == 'img') ? mediaUrl : null);
  String? get audioUrl => (mediaType == 'audio') ? mediaUrl : null;
  String? get videoUrl =>
      _firstMediaUrl('videos') ?? ((mediaType == 'video') ? mediaUrl : null);

  const Lesson({
    required this.id,
    required this.courseId,
    required this.title,
    required this.topicTitle,
    this.content,
    this.completed = false,
    this.mediaUrl,
    this.mediaType,
    this.metadata,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: int.tryParse(json['id'].toString()) ?? 0,
      courseId: int.tryParse(json['course_id'].toString()) ?? 0,
      title: _stringOrNull(json['title']) ?? '',
      topicTitle: _stringOrNull(json['topic_title']) ??
          _stringOrNull(json['chapter_title']) ??
          '',
      content: _stringOrNull(json['content']) ?? _stringOrNull(json['theory']),
      completed: json['completed'] == 1 || json['completed'] == true,
      mediaUrl: _stringOrNull(json['media_url']) ??
          _stringOrNull(json['image_url']) ??
          _stringOrNull(json['video_url']) ??
          _stringOrNull(json['image']) ??
          _stringOrNull(json['video']),
      mediaType: _stringOrNull(json['media_type']) ??
          (_stringOrNull(json['video_url']) != null ||
                  _stringOrNull(json['video']) != null
              ? 'video'
              : null) ??
          (_stringOrNull(json['image_url']) != null ||
                  _stringOrNull(json['image']) != null
              ? 'image'
              : null),
      metadata: _mapOrNull(json['metadata']),
    );
  }

  Lesson copyWith({
    String? content,
    String? mediaUrl,
    String? mediaType,
    Map<String, dynamic>? metadata,
    bool? completed,
  }) {
    return Lesson(
      id: id,
      courseId: courseId,
      title: title,
      topicTitle: topicTitle,
      content: content ?? this.content,
      completed: completed ?? this.completed,
      mediaUrl: mediaUrl ?? this.mediaUrl,
      mediaType: mediaType ?? this.mediaType,
      metadata: metadata ?? this.metadata,
    );
  }

  String? _firstMediaUrl(String key) {
    final items = metadata?[key];
    if (items is List && items.isNotEmpty) {
      final first = items.first;
      if (first is Map) return _stringOrNull(first['url']);
    }
    return null;
  }
}

Map<String, dynamic>? _mapOrNull(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

String? _stringOrNull(dynamic value) {
  if (value == null) return null;
  final text = value.toString().trim();
  return text.isEmpty ? null : text;
}

List<Lesson> _lessonsFromMetadata(
  Map<String, dynamic>? metadata,
  List<Lesson> savedLessons,
  int courseId,
) {
  if (metadata == null) return [];

  final savedByTitle = {
    for (final lesson in savedLessons)
      if (lesson.title.isNotEmpty) lesson.title: lesson
  };
  final chapters = _chapterList(metadata);
  final lessons = <Lesson>[];

  for (final chapter in chapters) {
    final chapterTitle = _stringOrNull(chapter['title']) ?? '';
    final subtopics = chapter['subtopics'] ?? chapter['sections'];
    if (subtopics is! List) continue;

    for (final rawSubtopic in subtopics) {
      if (rawSubtopic is! Map) continue;
      final subtopic = Map<String, dynamic>.from(rawSubtopic);
      final title = _stringOrNull(subtopic['title']) ?? '';
      final saved = savedByTitle[title];
      final metadata = _mergedMediaMetadata(subtopic, saved);
      final directVideo = _stringOrNull(subtopic['video_url']) ??
          _stringOrNull(subtopic['video']);
      final directImage = _stringOrNull(subtopic['image_url']) ??
          _stringOrNull(subtopic['image']);

      lessons.add(Lesson(
        id: saved?.id ?? 0,
        courseId: saved?.courseId ?? courseId,
        title: title,
        topicTitle: saved?.topicTitle ?? chapterTitle,
        content: saved?.content ??
            _stringOrNull(subtopic['content']) ??
            _stringOrNull(subtopic['theory']),
        completed: saved?.completed == true || subtopic['done'] == true,
        mediaUrl: saved?.mediaUrl ?? directVideo ?? directImage,
        mediaType: saved?.mediaType ??
            (directVideo != null ? 'video' : null) ??
            (directImage != null ? 'image' : null),
        metadata: metadata,
      ));
    }
  }

  return lessons;
}

List<Map<String, dynamic>> _chapterList(Map<String, dynamic> metadata) {
  for (final key in ['chapters', 'topics', 'content']) {
    final value = metadata[key];
    if (value is List) {
      return value
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
    }
  }
  return [];
}

Map<String, dynamic> _mergedMediaMetadata(
  Map<String, dynamic> subtopic,
  Lesson? saved,
) {
  final merged = <String, dynamic>{
    ...?_mapOrNull(subtopic['metadata']),
    ...?saved?.metadata,
  };

  if ((merged['images'] is! List || (merged['images'] as List).isEmpty) &&
      saved?.mediaType == 'image' &&
      saved?.mediaUrl != null) {
    merged['images'] = [
      {'url': saved!.mediaUrl, 'title': saved.title, 'verified': true}
    ];
  }

  if ((merged['videos'] is! List || (merged['videos'] as List).isEmpty) &&
      saved?.mediaType == 'video' &&
      saved?.mediaUrl != null) {
    merged['videos'] = [
      {'url': saved!.mediaUrl, 'title': saved.title, 'verified': true}
    ];
  }

  return merged;
}
