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

  String? get imageUrl => photo;

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
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      id: json['id'] as int? ?? 0,
      publicId: json['public_id'] as String? ?? '',
      title: json['title'] as String? ?? 'Untitled Course',
      type: json['type'] as String?,
      language: json['language'] as String?,
      photo: json['photo'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      completed: json['completed'] == 1 || json['completed'] == true,
      lessons: (json['lessons'] as List<dynamic>?)
              ?.map((e) => Lesson.fromJson(e))
              .toList() ??
          [],
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

  String? get imageUrl => (mediaType == 'image' || mediaType == 'img') ? mediaUrl : null;
  String? get audioUrl => (mediaType == 'audio') ? mediaUrl : null;
  String? get videoUrl => (mediaType == 'video') ? mediaUrl : null;

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
      id: json['id'] as int? ?? 0,
      courseId: int.tryParse(json['course_id'].toString()) ?? 0,
      title: json['title'] as String? ?? '',
      topicTitle: json['topic_title'] as String? ?? '',
      content: json['content'] as String?,
      completed: json['completed'] == 1 || json['completed'] == true,
      mediaUrl: json['media_url'] as String?,
      mediaType: json['media_type'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }
}
