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

  // New fields
  final String themeDefaultMode;
  final String? heroMediaType;
  final String? heroMediaUrl;
  final bool heroVideoEnabled;
  final bool heroVideoAutoplay;
  final String heroVideoLoopMode;
  final String? heroVideoFallbackImage;
  final String? heroVideoPoster;
  final bool heroVideoControlsHidden;
  final String heroVideoDisplayTarget;
  final bool heroVideoReplaceLowBandwidth;
  final bool heroMediaMuted;

  final String brandingPlatformNameEn;
  final String brandingPlatformNameAr;
  final String? brandingLogoUrl;
  final String? brandingFaviconUrl;

  final bool paymentMethodsVisible;
  final String offlinePaymentInstructionsEn;
  final String offlinePaymentInstructionsAr;

  final bool featurePdfExportEnabled;
  final bool featurePptExportEnabled;
  final bool featureNotesEnabled;
  final bool featureQuizEnabled;
  final bool featureChatEnabled;
  final bool featureAudioCoursesEnabled;

  final String seoMetaTitleEn;
  final String seoMetaTitleAr;
  final String seoMetaDescriptionEn;
  final String seoMetaDescriptionAr;
  final String seoMetaKeywordsEn;
  final String seoMetaKeywordsAr;
  final String? settingsVersion;

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
    required this.themeDefaultMode,
    this.heroMediaType,
    this.heroMediaUrl,
    required this.heroVideoEnabled,
    required this.heroVideoAutoplay,
    required this.heroVideoLoopMode,
    this.heroVideoFallbackImage,
    this.heroVideoPoster,
    required this.heroVideoControlsHidden,
    required this.heroVideoDisplayTarget,
    required this.heroVideoReplaceLowBandwidth,
    required this.heroMediaMuted,
    required this.brandingPlatformNameEn,
    required this.brandingPlatformNameAr,
    this.brandingLogoUrl,
    this.brandingFaviconUrl,
    required this.paymentMethodsVisible,
    required this.offlinePaymentInstructionsEn,
    required this.offlinePaymentInstructionsAr,
    required this.featurePdfExportEnabled,
    required this.featurePptExportEnabled,
    required this.featureNotesEnabled,
    required this.featureQuizEnabled,
    required this.featureChatEnabled,
    required this.featureAudioCoursesEnabled,
    required this.seoMetaTitleEn,
    required this.seoMetaTitleAr,
    required this.seoMetaDescriptionEn,
    required this.seoMetaDescriptionAr,
    required this.seoMetaKeywordsEn,
    required this.seoMetaKeywordsAr,
    this.settingsVersion,
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
      themeDefaultMode: json['theme_default_mode'] ?? 'dark',
      heroMediaType: json['hero_media_type'],
      heroMediaUrl: json['hero_media_url'],
      heroVideoEnabled: json['hero_video_enabled'] ?? true,
      heroVideoAutoplay: json['hero_video_autoplay'] ?? true,
      heroVideoLoopMode: json['hero_video_loop_mode'] ?? 'loop_forever',
      heroVideoFallbackImage: json['hero_video_fallback_image'],
      heroVideoPoster: json['hero_video_poster'] ?? json['hero_media_poster'],
      heroVideoControlsHidden: json['hero_video_controls_hidden'] ?? true,
      heroVideoDisplayTarget: json['hero_video_display_target'] ?? 'both',
      heroVideoReplaceLowBandwidth:
          json['hero_video_replace_low_bandwidth'] ?? true,
      heroMediaMuted: json['hero_media_muted'] ?? true,
      brandingPlatformNameEn: json['branding_platform_name_en'] ?? 'NOVAIS',
      brandingPlatformNameAr: json['branding_platform_name_ar'] ?? 'نوفايس',
      brandingLogoUrl: json['branding_logo_url'],
      brandingFaviconUrl: json['branding_favicon_url'],
      paymentMethodsVisible: json['payment_methods_visible'] ?? true,
      offlinePaymentInstructionsEn:
          json['offline_payment_instructions_en'] ?? '',
      offlinePaymentInstructionsAr:
          json['offline_payment_instructions_ar'] ?? '',
      featurePdfExportEnabled: json['feature_pdf_export_enabled'] ?? true,
      featurePptExportEnabled: json['feature_ppt_export_enabled'] ?? true,
      featureNotesEnabled: json['feature_notes_enabled'] ?? true,
      featureQuizEnabled: json['feature_quiz_enabled'] ?? true,
      featureChatEnabled: json['feature_chat_enabled'] ?? true,
      featureAudioCoursesEnabled: json['feature_audio_courses_enabled'] ?? true,
      seoMetaTitleEn: json['seo_meta_title_en'] ?? '',
      seoMetaTitleAr: json['seo_meta_title_ar'] ?? '',
      seoMetaDescriptionEn: json['seo_meta_description_en'] ?? '',
      seoMetaDescriptionAr: json['seo_meta_description_ar'] ?? '',
      seoMetaKeywordsEn: json['seo_meta_keywords_en'] ?? '',
      seoMetaKeywordsAr: json['seo_meta_keywords_ar'] ?? '',
      settingsVersion: json['settings_version']?.toString(),
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
        'theme_default_mode': themeDefaultMode,
        'hero_media_type': heroMediaType,
        'hero_media_url': heroMediaUrl,
        'hero_video_enabled': heroVideoEnabled,
        'hero_video_autoplay': heroVideoAutoplay,
        'hero_video_loop_mode': heroVideoLoopMode,
        'hero_video_fallback_image': heroVideoFallbackImage,
        'hero_video_poster': heroVideoPoster,
        'hero_video_controls_hidden': heroVideoControlsHidden,
        'hero_video_display_target': heroVideoDisplayTarget,
        'hero_video_replace_low_bandwidth': heroVideoReplaceLowBandwidth,
        'hero_media_muted': heroMediaMuted,
        'branding_platform_name_en': brandingPlatformNameEn,
        'branding_platform_name_ar': brandingPlatformNameAr,
        'branding_logo_url': brandingLogoUrl,
        'branding_favicon_url': brandingFaviconUrl,
        'payment_methods_visible': paymentMethodsVisible,
        'offline_payment_instructions_en': offlinePaymentInstructionsEn,
        'offline_payment_instructions_ar': offlinePaymentInstructionsAr,
        'feature_pdf_export_enabled': featurePdfExportEnabled,
        'feature_ppt_export_enabled': featurePptExportEnabled,
        'feature_notes_enabled': featureNotesEnabled,
        'feature_quiz_enabled': featureQuizEnabled,
        'feature_chat_enabled': featureChatEnabled,
        'feature_audio_courses_enabled': featureAudioCoursesEnabled,
        'seo_meta_title_en': seoMetaTitleEn,
        'seo_meta_title_ar': seoMetaTitleAr,
        'seo_meta_description_en': seoMetaDescriptionEn,
        'seo_meta_description_ar': seoMetaDescriptionAr,
        'seo_meta_keywords_en': seoMetaKeywordsEn,
        'seo_meta_keywords_ar': seoMetaKeywordsAr,
        'settings_version': settingsVersion,
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
