class ContentBlueprint {
  final dynamic name;
  final String slug;
  final bool enabled;
  final List<String> languageSupport;
  final String? targetAcademicLevel;
  final Map<String, dynamic> outputStructure;
  final int defaultCount;
  final Map<String, dynamic> formSchema;

  const ContentBlueprint({
    required this.name,
    required this.slug,
    required this.enabled,
    required this.languageSupport,
    this.targetAcademicLevel,
    required this.outputStructure,
    required this.defaultCount,
    required this.formSchema,
  });

  factory ContentBlueprint.fromJson(Map<String, dynamic> json) {
    return ContentBlueprint(
      name: json['name'] ?? 'Course',
      slug: json['slug']?.toString() ?? 'normal-course',
      enabled: json['enabled'] ?? true,
      languageSupport: List<String>.from(json['language_support'] ?? []),
      targetAcademicLevel: json['target_academic_level']?.toString(),
      outputStructure:
          Map<String, dynamic>.from(json['output_structure'] ?? {}),
      defaultCount: json['default_count'] ?? 5,
      formSchema: Map<String, dynamic>.from(json['form_schema'] ?? {}),
    );
  }

  String nameFor(String languageCode) {
    if (name is Map) {
      final nameMap = Map<String, dynamic>.from(name);
      if (languageCode == 'ar') {
        return nameMap['ar']?.toString() ?? nameMap['en']?.toString() ?? slug;
      }
      return nameMap['en']?.toString() ?? nameMap['ar']?.toString() ?? slug;
    }
    return name.toString();
  }

  List<BlueprintFormField> get formFields {
    final fields = formSchema['fields'];
    if (fields is! List) return const [];
    return fields
        .whereType<Map>()
        .map((item) => BlueprintFormField.fromJson(
              Map<String, dynamic>.from(item),
            ))
        .toList();
  }
}

class BlueprintFormField {
  final String keyName;
  final String type;
  final Map<String, dynamic> label;
  final bool required;
  final dynamic placeholder;
  final List<dynamic> options;

  const BlueprintFormField({
    required this.keyName,
    required this.type,
    required this.label,
    required this.required,
    this.placeholder,
    required this.options,
  });

  factory BlueprintFormField.fromJson(Map<String, dynamic> json) {
    return BlueprintFormField(
      keyName: json['key']?.toString() ?? '',
      type: json['type']?.toString() ?? 'text',
      label: Map<String, dynamic>.from(json['label'] ?? {}),
      required: json['required'] == true,
      placeholder: json['placeholder'],
      options: List<dynamic>.from(json['options'] ?? []),
    );
  }

  String labelFor(String languageCode) {
    if (languageCode == 'ar') {
      return label['ar']?.toString() ?? label['en']?.toString() ?? keyName;
    }
    return label['en']?.toString() ?? label['ar']?.toString() ?? keyName;
  }

  String? placeholderFor(String languageCode) {
    if (placeholder == null) return null;
    if (placeholder is Map) {
      final pMap = Map<String, dynamic>.from(placeholder);
      if (languageCode == 'ar') {
        return pMap['ar']?.toString() ?? pMap['en']?.toString();
      }
      return pMap['en']?.toString() ?? pMap['ar']?.toString();
    }
    return placeholder.toString();
  }

  List<Map<String, dynamic>> get parsedOptions {
    return options.map((opt) {
      if (opt is Map) {
        return {
          'value': opt['value']?.toString() ?? '',
          'label': Map<String, dynamic>.from(opt['label'] ?? {}),
        };
      }
      return {
        'value': opt.toString(),
        'label': {'en': opt.toString(), 'ar': opt.toString()},
      };
    }).toList();
  }
}
