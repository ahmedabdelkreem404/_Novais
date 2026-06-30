import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/l10n/app_localizations.dart';
import '../../widgets/widgets.dart';
import '../../core/api/platform_config_provider.dart';
import '../../core/api/content_blueprints_provider.dart';
import '../../models/content_blueprint.dart';
import '../../models/platform_config.dart';

class CreateScreen extends ConsumerStatefulWidget {
  const CreateScreen({super.key});
  @override
  ConsumerState<CreateScreen> createState() => _CreateScreenState();
}

class _CreateScreenState extends ConsumerState<CreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _topicCtrl = TextEditingController();
  final _subTopicCtrl = TextEditingController();

  // Selection state
  String _type = 'Theory & Image Course';
  String _blueprintSlug = 'normal-course';
  String _language = 'English';
  String _level = 'Beginner';
  int _modules = 5;
  final List<String> _subTopics = [];
  final Map<String, dynamic> _blueprintFields = {};

  final _languages = [
    'English',
    'Arabic',
    'Egyptian Arabic',
    'French',
    'Spanish',
    'German',
    'Italian',
    'Portuguese',
    'Russian',
    'Japanese',
    'Chinese',
    'Korean',
    'Hindi',
    'Turkish',
    'Polish',
    'Dutch',
  ];

  String _getLanguageLabel(String langName, bool isAr) {
    if (langName == 'Arabic') {
      return isAr ? 'العربية الفصحى' : 'Modern Standard Arabic';
    }
    if (langName == 'Egyptian Arabic') {
      return isAr ? 'العامية المصرية' : 'Egyptian Arabic';
    }
    if (isAr) {
      final translations = {
        'English': 'الإنجليزية',
        'French': 'الفرنسية',
        'Spanish': 'الإسبانية',
        'German': 'الألمانية',
        'Italian': 'الإيطالية',
        'Portuguese': 'البرتغالية',
        'Russian': 'الروسية',
        'Japanese': 'اليابانية',
        'Chinese': 'الصينية',
        'Korean': 'الكورية',
        'Hindi': 'الهندية',
        'Turkish': 'التركية',
        'Polish': 'البولندية',
        'Dutch': 'الهولندية',
      };
      return translations[langName] ?? langName;
    }
    return langName;
  }

  String _getDynamicTopicLabel(String slug, bool isAr) {
    if (slug == 'book') {
      return isAr ? 'عنوان أو موضوع الكتاب' : 'Book Title or Topic';
    }
    if (slug == 'exam-builder' || slug == 'question-bank') {
      return isAr ? 'موضوع الامتحان / المادة' : 'Exam Subject / Topic';
    }
    if (slug == 'graduation-project' || slug == 'master-thesis') {
      return isAr ? 'عنوان أو مجال البحث' : 'Research Field / Project Topic';
    }
    if (slug == 'lesson-plan') {
      return isAr ? 'موضوع الدرس' : 'Lesson Topic';
    }
    return isAr ? 'موضوع الكورس / المحتوى' : 'Course Topic / Content';
  }

  String _getDynamicTopicPlaceholder(String slug, bool isAr) {
    if (slug == 'book') {
      return isAr ? 'مثال: تاريخ مصر القديمة، أساسيات الفيزياء...' : 'e.g., History of Ancient Egypt, Physics Fundamentals...';
    }
    if (slug == 'exam-builder' || slug == 'question-bank') {
      return isAr ? 'مثال: رياضيات الصف الأول الثانوي، كيمياء عضوية...' : 'e.g., High School Math, Organic Chemistry...';
    }
    if (slug == 'graduation-project' || slug == 'master-thesis') {
      return isAr ? 'مثال: تطبيق الذكاء الاصطناعي في الطب، بلوكشين...' : 'e.g., AI in Healthcare, Blockchain in Finance...';
    }
    if (slug == 'lesson-plan') {
      return isAr ? 'مثال: دورة المياه في الطبيعة، الجهاز الهضمي...' : 'e.g., Water Cycle, Digestion System...';
    }
    return isAr ? 'مثال: أساسيات لغة بايثون، تصميم الويب...' : 'e.g., Python Basics, Web Design...';
  }

  void _onFeatureSelect(String feature, dynamic value, PlatformConfig? config) {
    final user = ref.read(authProvider).user;
    final isPro = user?.isPro == true;

    // Premium checks
    bool isPremiumFeature = false;
    if (feature == 'modules' && value > 5) isPremiumFeature = true;
    if (feature == 'level' && value == 'Professional') isPremiumFeature = true;

    if (config != null) {
      if (feature == 'type') {
        isPremiumFeature = config.isPremiumCourseType(value.toString());
      }
      if (feature == 'language') {
        isPremiumFeature = config.isPremiumLanguage(value.toString());
      }
    } else {
      if (feature == 'type' && value.toString().contains('Video')) {
        isPremiumFeature = true;
      }
      if (feature == 'language' && value != 'English') {
        isPremiumFeature = true;
      }
    }

    if (isPremiumFeature && !isPro) {
      _showPremiumDialog();
      return;
    }

    setState(() {
      if (feature == 'modules') _modules = value;
      if (feature == 'type') _type = value;
      if (feature == 'level') _level = value;
      if (feature == 'language') _language = value;
    });
  }

  void _addSubTopic() {
    if (_subTopicCtrl.text.trim().isNotEmpty) {
      setState(() {
        _subTopics.add(_subTopicCtrl.text.trim());
        _subTopicCtrl.clear();
      });
    }
  }

  Future<void> _generate() async {
    if (!_formKey.currentState!.validate()) return;

    final Map<String, dynamic> extra = {
      'topic': _topicCtrl.text.trim(),
      'subTopics': _subTopics,
      'type': _type,
      'blueprint_slug': _blueprintSlug,
      'blueprint_fields': _blueprintFields,
      'language': _language,
      'level': _level,
      'numModules': _modules,
    };

    if (_blueprintFields.containsKey('level')) {
      extra['level'] = _blueprintFields['level'];
    }
    if (_blueprintFields.containsKey('numModules')) {
      extra['numModules'] = int.tryParse(_blueprintFields['numModules'].toString()) ?? _modules;
    }
    if (_blueprintFields.containsKey('type')) {
      extra['type'] = _blueprintFields['type'];
    }

    if (mounted) {
      context.push('/generating', extra: extra);
    }
  }

  void _showPremiumDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Theme.of(context).cardColor,
        title: const Row(children: [
          Icon(Icons.workspace_premium, color: Colors.amber),
          SizedBox(width: 8),
          Text('Premium Feature'),
        ]),
        content: const Text('Upgrade to Pro to access this feature!'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Later')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.push('/pricing'); // Updated route
            },
            child: const Text('Upgrade'),
          ),
        ],
      ),
    );
  }

  void _prepareBlueprintFields(List<BlueprintFormField> fields) {
    for (final field in fields) {
      if (field.keyName.isEmpty ||
          _blueprintFields.containsKey(field.keyName)) {
        continue;
      }
      if (field.type == 'boolean') {
        _blueprintFields[field.keyName] = false;
      } else if (field.type == 'multiselect') {
        _blueprintFields[field.keyName] = <String>[];
      } else {
        _blueprintFields[field.keyName] = '';
      }
    }
  }

  void _setBlueprintField(String key, dynamic value) {
    setState(() => _blueprintFields[key] = value);
  }

  Widget _buildBlueprintField(
    BuildContext context,
    BlueprintFormField field,
    bool isDark,
  ) {
    final languageCode = Localizations.localeOf(context).languageCode;
    final label = field.labelFor(languageCode);
    final value = _blueprintFields[field.keyName];
    final inputDecoration = InputDecoration(
      hintText: field.placeholderFor(languageCode) ?? label,
      filled: true,
      fillColor: isDark ? const Color(0xFF1F1F1F) : const Color(0xFFF9FAFB),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );

    Widget control;
    if (field.type == 'textarea') {
      control = TextFormField(
        initialValue: value?.toString() ?? '',
        minLines: 3,
        maxLines: 5,
        decoration: inputDecoration,
        onChanged: (next) => _blueprintFields[field.keyName] = next,
        validator: field.required
            ? (next) =>
                (next == null || next.trim().isEmpty) ? AppLocalizations.of(context).t('required') : null
            : null,
      );
    } else if (field.type == 'number') {
      control = TextFormField(
        initialValue: value?.toString() ?? '',
        keyboardType: TextInputType.number,
        decoration: inputDecoration,
        onChanged: (next) => _blueprintFields[field.keyName] = next,
        validator: field.required
            ? (next) =>
                (next == null || next.trim().isEmpty) ? AppLocalizations.of(context).t('required') : null
            : null,
      );
    } else if (field.type == 'select') {
      final parsed = field.parsedOptions;
      final selectedValue = parsed.any((o) => o['value'] == value) ? value?.toString() : null;
      control = DropdownButtonFormField<String>(
        value: selectedValue,
        decoration: inputDecoration,
        dropdownColor: isDark ? const Color(0xFF1F1F1F) : Colors.white,
        items: parsed
            .map((option) {
              final optLabelMap = option['label'] as Map<String, dynamic>;
              final optLabel = languageCode == 'ar'
                  ? (optLabelMap['ar']?.toString() ?? optLabelMap['en']?.toString() ?? option['value'].toString())
                  : (optLabelMap['en']?.toString() ?? optLabelMap['ar']?.toString() ?? option['value'].toString());
              return DropdownMenuItem(
                value: option['value'].toString(),
                child: Text(optLabel),
              );
            })
            .toList(),
        onChanged: (next) => _setBlueprintField(field.keyName, next ?? ''),
        validator: field.required
            ? (next) => (next == null || next.isEmpty) ? AppLocalizations.of(context).t('required') : null
            : null,
      );
    } else if (field.type == 'multiselect') {
      final parsed = field.parsedOptions;
      final selected = (value is List ? value : const [])
          .map((item) => item.toString())
          .toList();
      control = Wrap(
        spacing: 8,
        runSpacing: 8,
        children: parsed.map((option) {
          final optVal = option['value'].toString();
          final optLabelMap = option['label'] as Map<String, dynamic>;
          final optLabel = languageCode == 'ar'
              ? (optLabelMap['ar']?.toString() ?? optLabelMap['en']?.toString() ?? optVal)
              : (optLabelMap['en']?.toString() ?? optLabelMap['ar']?.toString() ?? optVal);
          final checked = selected.contains(optVal);
          return FilterChip(
            label: Text(optLabel),
            selected: checked,
            onSelected: (next) {
              final updated = [...selected];
              if (next) {
                updated.add(optVal);
              } else {
                updated.remove(optVal);
              }
              _setBlueprintField(field.keyName, updated);
            },
          );
        }).toList(),
      );
    } else if (field.type == 'boolean') {
      control = SwitchListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(label),
        value: value == true,
        activeColor: AppColors.primary,
        onChanged: (next) => _setBlueprintField(field.keyName, next),
      );
    } else {
      control = TextFormField(
        initialValue: value?.toString() ?? '',
        decoration: inputDecoration,
        onChanged: (next) => _blueprintFields[field.keyName] = next,
        validator: field.required
            ? (next) =>
                (next == null || next.trim().isEmpty) ? AppLocalizations.of(context).t('required') : null
            : null,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                style:
                    const TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
              ),
            ),
            if (field.required)
              Text(
                AppLocalizations.of(context).t('required'),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        control,
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final user = ref.watch(authProvider).user;
    final isPro = user?.isPro == true;
    final languageCode = Localizations.localeOf(context).languageCode;

    final configAsync = ref.watch(platformConfigProvider);
    final config = configAsync.valueOrNull;
    final blueprints = ref.watch(contentBlueprintsProvider).valueOrNull ?? [];
    if (blueprints.isNotEmpty &&
        !blueprints.any((item) => item.slug == _blueprintSlug)) {
      _blueprintSlug = blueprints.first.slug;
    }
    ContentBlueprint? activeBlueprint;
    for (final blueprint in blueprints) {
      if (blueprint.slug == _blueprintSlug) {
        activeBlueprint = blueprint;
        break;
      }
    }
    final activeBlueprintFields = activeBlueprint?.formFields ?? const [];
    _prepareBlueprintFields(activeBlueprintFields);

    final languages = config?.enabledLanguages ?? _languages;
    final courseTypes = config?.enabledCourseTypes ??
        [
          'Theory & Image Course',
          'Video & Theory Course',
        ];
    final creationEnabled = config?.courseCreationEnabled ?? true;

    // Verify current selection is still in the active list
    String selectedLanguage = _language;
    if (languages.isNotEmpty) {
      if (!languages.contains(selectedLanguage)) {
        selectedLanguage =
            languages.contains('English') ? 'English' : languages.first;
      }
    } else {
      selectedLanguage = 'English';
    }

    String selectedType = _type;
    if (courseTypes.isNotEmpty) {
      if (!courseTypes.contains(selectedType)) {
        selectedType = courseTypes.first;
      }
    } else {
      selectedType = 'Theory & Image Course';
    }

    return Material(
      color: isDark ? const Color(0xFF050816) : const Color(0xFFF8FAFC),
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 60, 20, 20),
            child: Column(
              children: [
                Text(l10n.t('create_page.title'),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontFamily: 'PlusJakartaSans',
                        fontWeight: FontWeight.w800,
                        fontSize:
                            28, // Matches web 3xl/4xl scaling slightly down for mobile
                        color: isDark ? Colors.white : const Color(0xFF111827),
                        height: 1.2)),
                const SizedBox(height: 8),
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [AppColors.gradientStart, AppColors.gradientEnd],
                  ).createShader(bounds),
                  child: Text(l10n.t('create_page.subtitle'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontSize: 14,
                          color: Colors.white,
                          fontWeight: FontWeight.w500)),
                ),
                const SizedBox(height: 16),
                // Plan Badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: isPro
                        ? Colors.amber.withAlpha(30)
                        : Colors.grey.withAlpha(30),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: isPro
                            ? Colors.amber.withAlpha(100)
                            : Colors.grey.withAlpha(100)),
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(isPro ? Icons.workspace_premium : Icons.layers,
                        size: 14, color: isPro ? Colors.amber : Colors.grey),
                    const SizedBox(width: 6),
                    Text('${user?.subscriptionType ?? 'FREE'} PLAN',
                        style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isPro ? Colors.amber : Colors.grey)),
                  ]),
                ),
              ],
            ),
          ),

          Container(
            margin: const EdgeInsets.all(20),
            decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                    color: isDark ? Colors.white24 : Colors.grey[200]!),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(isDark ? 0 : 10),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  )
                ]),
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Disabled Warning
                  if (!creationEnabled)
                    Container(
                      margin: const EdgeInsets.only(bottom: 20),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withAlpha(20),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.withAlpha(50)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded,
                              color: Colors.red),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              l10n.t('disabled_warning'),
                              style: const TextStyle(
                                color: Colors.red,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                   _SectionHeader(
                      label: _getDynamicTopicLabel(_blueprintSlug, l10n.isAr).toUpperCase(), icon: Icons.lightbulb_outline),
                  NvTextField(
                    label: '',
                    fieldKey: const Key('create_topic_input'),
                    controller: _topicCtrl,
                    hint: _getDynamicTopicPlaceholder(_blueprintSlug, l10n.isAr),
                    maxLines: 1,
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 24),

                  // Subtopics
                  const _SectionHeader(
                      label: 'SUB-TOPICS (OPTIONAL)', icon: Icons.list),
                  Row(children: [
                    Expanded(
                      child: NvTextField(
                        label: '',
                        controller: _subTopicCtrl,
                        hint: 'Add specific focus areas...',
                        onFieldSubmitted: (_) => _addSubTopic(),
                      ),
                    ),
                    const SizedBox(width: 10),
                    IconButton.filled(
                      style: IconButton.styleFrom(
                          backgroundColor:
                              isDark ? Colors.white10 : Colors.black),
                      icon: const Icon(Icons.add, color: Colors.white),
                      onPressed: _addSubTopic,
                    ),
                  ]),
                  if (_subTopics.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _subTopics
                          .map((t) => Chip(
                                label: Text(t,
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.primary)),
                                deleteIcon: const Icon(Icons.close,
                                    size: 14, color: AppColors.primary),
                                onDeleted: () =>
                                    setState(() => _subTopics.remove(t)),
                                backgroundColor:
                                    AppColors.primary.withAlpha(20),
                                side: BorderSide(
                                    color: AppColors.primary.withAlpha(50)),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8)),
                              ))
                          .toList(),
                    ),
                  ],
                  const SizedBox(height: 24),

                  // Language
                  if (blueprints.isNotEmpty) ...[
                    _SectionHeader(
                        label: l10n.t('content_blueprint').toUpperCase(),
                        icon: Icons.dashboard_customize_outlined),
                    DropdownButtonFormField<String>(
                      value:
                          blueprints.any((item) => item.slug == _blueprintSlug)
                              ? _blueprintSlug
                              : blueprints.first.slug,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: isDark
                            ? const Color(0xFF1F1F1F)
                            : const Color(0xFFF9FAFB),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 14),
                      ),
                      dropdownColor:
                          isDark ? const Color(0xFF1F1F1F) : Colors.white,
                      items: blueprints
                          .map((blueprint) => DropdownMenuItem(
                                value: blueprint.slug,
                                child: Text(blueprint.nameFor(languageCode)),
                              ))
                          .toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            _blueprintSlug = value;
                            _blueprintFields.clear();
                            final selectedBp = blueprints.firstWhere(
                              (bp) => bp.slug == value,
                              orElse: () => blueprints.first,
                            );
                            if (value != 'normal-course' && value != 'leveled-course') {
                              _modules = selectedBp.defaultCount;
                            }
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 24),
                  ],

                  if (activeBlueprintFields.isNotEmpty) ...[
                    _SectionHeader(
                      label: '${activeBlueprint?.nameFor(languageCode) ?? 'Blueprint'} ${l10n.t('details')}'
                          .toUpperCase(),
                      icon: Icons.tune_outlined,
                    ),
                    ...activeBlueprintFields.map(
                      (field) => Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: _buildBlueprintField(context, field, isDark),
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],

                  _SectionHeader(label: l10n.t('language').toUpperCase(), icon: Icons.language),
                  DropdownButtonFormField<String>(
                    value: selectedLanguage,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: isDark
                          ? const Color(0xFF1F1F1F)
                          : const Color(0xFFF9FAFB),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
                    ),
                    icon: const Icon(Icons.keyboard_arrow_down),
                    dropdownColor:
                        isDark ? const Color(0xFF1F1F1F) : Colors.white,
                    items: languages.map((l) {
                      final isPrem = config != null
                          ? config.isPremiumLanguage(l)
                          : l != 'English';
                      return DropdownMenuItem(
                        value: l,
                        child: Row(children: [
                          Text(_getLanguageLabel(l, l10n.isAr)),
                          if (isPrem && !isPro) ...[
                            const SizedBox(width: 8),
                            const Icon(Icons.workspace_premium,
                                size: 14, color: Colors.amber),
                          ]
                        ]),
                      );
                    }).toList(),
                    onChanged: (v) {
                      if (v != null) {
                        _onFeatureSelect('language', v, config);
                      }
                    },
                  ),
                  const SizedBox(height: 24),

                  // Complexity, Depth, and Format inputs - only visible for normal-course or leveled-course blueprints
                  if (_blueprintSlug == 'normal-course' || _blueprintSlug == 'leveled-course') ...[
                    // Complexity (Grid)
                    const _SectionHeader(
                        label: 'COMPLEXITY LEVEL',
                        icon: Icons.rocket_launch_outlined),
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      childAspectRatio: 2.2,
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      children: [
                        'Beginner',
                        'Intermediate',
                        'Advanced',
                        'Professional'
                      ].map((level) {
                        final isPrem = level == 'Professional';
                        return _ComplexityCard(
                          label: level,
                          isSelected: _level == level,
                          isPremium: isPrem,
                          isLocked: isPrem && !isPro,
                          onTap: () => _onFeatureSelect('level', level, config),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),

                    // Depth (Modules)
                    const _SectionHeader(
                        label: 'DEPTH', icon: Icons.layers_outlined),
                    Row(
                      children: [5, 10].map((m) {
                        final isPrem = m > 5;
                        return Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(
                                right: m == 5 ? 10 : 0), // Spacing
                            child: _DepthCard(
                              value: m,
                              label: 'Modules',
                              isSelected: _modules == m,
                              isPremium: isPrem,
                              isLocked: isPrem && !isPro,
                              onTap: () => _onFeatureSelect('modules', m, config),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),

                    // Format (Type)
                    const _SectionHeader(
                        label: 'FORMAT', icon: Icons.auto_stories_outlined),
                    Column(
                      children: courseTypes.map((t) {
                        final isPrem = config != null
                            ? config.isPremiumCourseType(t)
                            : t.contains('Video');
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _TypeCard(
                            label: t.contains('Video')
                                ? 'Video & Theory'
                                : 'Theory & Image',
                            desc: t.contains('Video')
                                ? 'Detailed video explanations'
                                : 'Comprehensive text & images',
                            icon: t.contains('Video')
                                ? Icons.videocam
                                : Icons.menu_book,
                            isSelected: selectedType == t,
                            isPremium: isPrem,
                            isLocked: isPrem && !isPro,
                            onTap: () => _onFeatureSelect('type', t, config),
                          ),
                        );
                      }).toList(),
                    ),
                  ],

                  const SizedBox(height: 40),

                  // Submit
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      key: const Key('create_generate_button'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            creationEnabled ? AppColors.primary : Colors.grey,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16)),
                        elevation: creationEnabled ? 4 : 0,
                        shadowColor: creationEnabled
                            ? AppColors.primary.withAlpha(80)
                            : Colors.transparent,
                      ),
                      onPressed: creationEnabled ? _generate : null,
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.auto_awesome, size: 20),
                          SizedBox(width: 8),
                          Text('Generate Course',
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;
  final IconData icon;
  const _SectionHeader({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(children: [
        Icon(icon, size: 16, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(label,
            style: const TextStyle(
                fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
      ]),
    );
  }
}

class _ComplexityCard extends StatelessWidget {
  final String label;
  final bool isSelected;
  final bool isPremium;
  final bool isLocked;
  final VoidCallback onTap;

  const _ComplexityCard({
    required this.label,
    required this.isSelected,
    required this.isPremium,
    required this.isLocked,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withAlpha(20)
              : (isDark ? const Color(0xFF1F1F1F) : Colors.white),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : (isDark ? Colors.white10 : Colors.grey[300]!),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(label.toUpperCase(),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11, // Match web text-[10px] scale
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                      color: isSelected
                          ? AppColors.primary
                          : (isDark ? Colors.grey[400] : Colors.grey[600]),
                    )),
              ],
            ),
            if (isPremium)
              Positioned(
                top: 6,
                right: 6,
                child: Icon(
                    isLocked ? Icons.lock_outline : Icons.workspace_premium,
                    size: 12,
                    color: Colors.amber),
              )
          ],
        ),
      ),
    );
  }
}

class _DepthCard extends StatelessWidget {
  final int value;
  final String label;
  final bool isSelected;
  final bool isPremium;
  final bool isLocked;
  final VoidCallback onTap;

  const _DepthCard({
    required this.value,
    required this.label,
    required this.isSelected,
    required this.isPremium,
    required this.isLocked,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withAlpha(20)
              : (isDark ? const Color(0xFF1F1F1F) : Colors.white),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : (isDark ? Colors.white10 : Colors.grey[300]!),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Column(
              children: [
                Text(value.toString(),
                    style: TextStyle(
                      fontSize: 24, // Web text-2xl
                      fontWeight: FontWeight.w900,
                      color: isSelected
                          ? AppColors.primary
                          : (isDark ? Colors.white : Colors.black),
                    )),
                const SizedBox(height: 2),
                Text(label.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? AppColors.primary : Colors.grey,
                    )),
              ],
            ),
            if (isPremium)
              Positioned(
                top: 0,
                right: 8,
                child: Icon(
                    isLocked ? Icons.lock_outline : Icons.workspace_premium,
                    size: 14,
                    color: Colors.amber),
              )
          ],
        ),
      ),
    );
  }
}

class _TypeCard extends StatelessWidget {
  final String label;
  final String desc;
  final IconData icon;
  final bool isSelected;
  final bool isPremium;
  final bool isLocked;
  final VoidCallback onTap;

  const _TypeCard({
    required this.label,
    required this.desc,
    required this.icon,
    required this.isSelected,
    required this.isPremium,
    required this.isLocked,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withAlpha(20)
              : (isDark ? const Color(0xFF1F1F1F) : Colors.white),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : (isDark ? Colors.white10 : Colors.grey[300]!),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.primary.withAlpha(30)
                    : (isDark ? Colors.white10 : Colors.grey[100]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon,
                  color: isSelected ? AppColors.primary : Colors.grey,
                  size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : Colors.black)),
                  Text(desc,
                      style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.grey[400] : Colors.grey[600])),
                ],
              ),
            ),
            if (isPremium)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.amber.withAlpha(40),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(children: [
                  Icon(isLocked ? Icons.lock_outline : Icons.workspace_premium,
                      size: 10, color: Colors.amber),
                  const SizedBox(width: 4),
                  const Text('PREMIUM',
                      style: TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                          color: Colors.amber))
                ]),
              ),
          ],
        ),
      ),
    );
  }
}
