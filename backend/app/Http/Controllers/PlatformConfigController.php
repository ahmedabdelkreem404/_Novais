<?php

namespace App\Http\Controllers;

use App\Models\PlatformSetting;
use Illuminate\Http\Request;

class PlatformConfigController extends Controller
{
    public function show()
    {
        $config = PlatformSetting::currentConfig();
        unset($config['secret_private_key']);
        return response()->json($config);
    }

    public function adminShow()
    {
        return response()->json(PlatformSetting::currentConfig());
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'course_creation_enabled' => 'sometimes|boolean',
            'all_languages_free' => 'sometimes|boolean',
            'video_courses_enabled' => 'sometimes|boolean',
            'video_courses_free' => 'sometimes|boolean',
            'enabled_languages' => 'sometimes|array',
            'enabled_languages.*' => 'string',
            'free_languages' => 'sometimes|array',
            'free_languages.*' => 'string',
            'enabled_course_types' => 'sometimes|array',
            'enabled_course_types.*' => 'string',
            'free_course_types' => 'sometimes|array',
            'free_course_types.*' => 'string',
            'enabled_levels' => 'sometimes|array',
            'enabled_levels.*' => 'string',
            'free_levels' => 'sometimes|array',
            'free_levels.*' => 'string',
            'enabled_depths' => 'sometimes|array',
            'enabled_depths.*' => 'integer',
            'free_depth_limit' => 'sometimes|integer',
            'hero_media_type' => 'sometimes|string|in:image,video',
            'hero_media_url' => 'sometimes|nullable|string',
            'web_hero_title_en' => 'sometimes|string',
            'web_hero_title_ar' => 'sometimes|string',
            'web_hero_subtitle_en' => 'sometimes|string',
            'web_hero_subtitle_ar' => 'sometimes|string',
            'web_hero_badge_en' => 'sometimes|string',
            'web_hero_badge_ar' => 'sometimes|string',
            'web_hero_cta_en' => 'sometimes|string',
            'web_hero_cta_ar' => 'sometimes|string',
            'download_page_title_en' => 'sometimes|string',
            'download_page_title_ar' => 'sometimes|string',
            'download_page_desc_en' => 'sometimes|string',
            'download_page_desc_ar' => 'sometimes|string',
            'windows_download_url' => 'sometimes|nullable|string',
            'mobile_download_url' => 'sometimes|nullable|string',
            'system_theme_mode' => 'sometimes|string|in:system_default,light_only,dark_only,user_choice',
            'hero_media_muted' => 'sometimes|boolean',
            'hero_media_loop' => 'sometimes|boolean',
            'hero_media_poster' => 'sometimes|nullable|string',

            // Branding & Identity
            'branding_platform_name_en' => 'sometimes|string',
            'branding_platform_name_ar' => 'sometimes|string',
            'branding_logo_url' => 'sometimes|nullable|string',
            'branding_favicon_url' => 'sometimes|nullable|string',
            
            // Theme behavior
            'theme_default_mode' => 'sometimes|string|in:light,dark',

            // Hero Video Options
            'hero_video_enabled' => 'sometimes|boolean',
            'hero_video_autoplay' => 'sometimes|boolean',
            'hero_video_loop_mode' => 'sometimes|string|in:loop_forever,play_once,play_once_then_image',
            'hero_video_fallback_image' => 'sometimes|nullable|string',
            'hero_video_controls_hidden' => 'sometimes|boolean',
            'hero_video_display_target' => 'sometimes|string|in:both,web_only,mobile_only',
            'hero_video_replace_low_bandwidth' => 'sometimes|boolean',

            // Payment visibility & instructions
            'payment_methods_visible' => 'sometimes|boolean',
            'offline_payment_instructions_en' => 'sometimes|string',
            'offline_payment_instructions_ar' => 'sometimes|string',

            // Feature Flags
            'feature_pdf_export_enabled' => 'sometimes|boolean',
            'feature_ppt_export_enabled' => 'sometimes|boolean',
            'feature_notes_enabled' => 'sometimes|boolean',
            'feature_quiz_enabled' => 'sometimes|boolean',
            'feature_chat_enabled' => 'sometimes|boolean',
            'feature_audio_courses_enabled' => 'sometimes|boolean',

            // SEO / Social
            'seo_meta_title_en' => 'sometimes|string',
            'seo_meta_title_ar' => 'sometimes|string',
            'seo_meta_description_en' => 'sometimes|string',
            'seo_meta_description_ar' => 'sometimes|string',
            'seo_meta_keywords_en' => 'sometimes|string',
            'seo_meta_keywords_ar' => 'sometimes|string',

            // Secret key
            'secret_private_key' => 'sometimes|string',
        ]);

        return response()->json(PlatformSetting::updateConfig($data));
    }
}
