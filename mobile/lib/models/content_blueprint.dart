class ContentBlueprint {
  final String name;
  final String slug;
  final bool enabled;
  final List<String> languageSupport;
  final String? targetAcademicLevel;
  final Map<String, dynamic> outputStructure;
  final int defaultCount;

  const ContentBlueprint({
    required this.name,
    required this.slug,
    required this.enabled,
    required this.languageSupport,
    this.targetAcademicLevel,
    required this.outputStructure,
    required this.defaultCount,
  });

  factory ContentBlueprint.fromJson(Map<String, dynamic> json) {
    return ContentBlueprint(
      name: json['name']?.toString() ?? 'Course',
      slug: json['slug']?.toString() ?? 'normal-course',
      enabled: json['enabled'] ?? true,
      languageSupport: List<String>.from(json['language_support'] ?? []),
      targetAcademicLevel: json['target_academic_level']?.toString(),
      outputStructure:
          Map<String, dynamic>.from(json['output_structure'] ?? {}),
      defaultCount: json['default_count'] ?? 5,
    );
  }
}
