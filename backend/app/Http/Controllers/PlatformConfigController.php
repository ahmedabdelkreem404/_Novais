<?php

namespace App\Http\Controllers;

use App\Models\PlatformSetting;
use Illuminate\Http\Request;

class PlatformConfigController extends Controller
{
    public function show()
    {
        return response()->json(PlatformSetting::currentConfig());
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
        ]);

        return response()->json(PlatformSetting::updateConfig($data));
    }
}
