class PlatformConfig {
  final bool courseCreationEnabled;
  final bool allLanguagesFree;
  final bool videoCoursesEnabled;
  final bool videoCoursesFree;
  final List<String> enabledLanguages;
  final List<String> freeLanguages;
  final List<String> enabledCourseTypes;
  final List<String> freeCourseTypes;
  final String systemThemeMode;

  const PlatformConfig({
    required this.courseCreationEnabled,
    required this.allLanguagesFree,
    required this.videoCoursesEnabled,
    required this.videoCoursesFree,
    required this.enabledLanguages,
    required this.freeLanguages,
    required this.enabledCourseTypes,
    required this.freeCourseTypes,
    required this.systemThemeMode,
  });

  factory PlatformConfig.fromJson(Map<String, dynamic> json) {
    return PlatformConfig(
      courseCreationEnabled: json['course_creation_enabled'] ?? true,
      allLanguagesFree: json['all_languages_free'] ?? false,
      videoCoursesEnabled: json['video_courses_enabled'] ?? true,
      videoCoursesFree: json['video_courses_free'] ?? false,
      enabledLanguages: List<String>.from(json['enabled_languages'] ?? []),
      freeLanguages: List<String>.from(json['free_languages'] ?? []),
      enabledCourseTypes: List<String>.from(json['enabled_course_types'] ?? []),
      freeCourseTypes: List<String>.from(json['free_course_types'] ?? []),
      systemThemeMode: json['system_theme_mode'] ?? 'user_choice',
    );
  }

  Map<String, dynamic> toJson() => {
        'course_creation_enabled': courseCreationEnabled,
        'all_languages_free': allLanguagesFree,
        'video_courses_enabled': videoCoursesEnabled,
        'video_courses_free': videoCoursesFree,
        'enabled_languages': enabledLanguages,
        'free_languages': freeLanguages,
        'enabled_course_types': enabledCourseTypes,
        'free_course_types': freeCourseTypes,
        'system_theme_mode': systemThemeMode,
      };

  /// Helper to check if a language is premium
  bool isPremiumLanguage(String lang) {
    if (allLanguagesFree) return false;
    return !freeLanguages.contains(lang);
  }

  /// Helper to check if a course type is premium
  bool isPremiumCourseType(String type) {
    if (type.contains('Video') && videoCoursesFree) return false;
    return !freeCourseTypes.contains(type);
  }
}
