<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'array',
    ];

    public const CONFIG_KEY = 'platform_config';

    public static function defaults(): array
    {
        return [
            'course_creation_enabled' => true,
            'all_languages_free' => false,
            'video_courses_enabled' => true,
            'video_courses_free' => false,
            'enabled_languages' => [
                'English',
                'Arabic',
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
            ],
            'free_languages' => ['English'],
            'enabled_course_types' => [
                'Theory & Image Course',
                'Video & Theory Course',
            ],
            'free_course_types' => ['Theory & Image Course'],
            'enabled_levels' => [
                'Beginner',
                'Intermediate',
                'Advanced',
                'Professional',
            ],
            'free_levels' => [
                'Beginner',
                'Intermediate',
                'Advanced',
            ],
            'enabled_depths' => [5, 10],
            'free_depth_limit' => 5,
            'hero_media_type' => 'image',
            'hero_media_url' => null,
            'web_hero_title_en' => 'Build Knowledge Instantly with AI',
            'web_hero_title_ar' => 'ابنِ معرفتك فوراً بالذكاء الاصطناعي',
            'web_hero_subtitle_en' => 'Generate rich courses in seconds and learn anything.',
            'web_hero_subtitle_ar' => 'ولّد كورسات غنية في ثوانٍ وتعلم أي شيء.',
            'web_hero_badge_en' => 'Next-Gen AI Learning Platform',
            'web_hero_badge_ar' => 'منصة التعلم الذكي للجيل القادم',
            'web_hero_cta_en' => 'Get Started Free',
            'web_hero_cta_ar' => 'ابدأ مجاناً',
            'download_page_title_en' => 'Install Novais Apps',
            'download_page_title_ar' => 'تثبيت تطبيقات Novais',
            'download_page_desc_en' => 'Download Novais client for Windows and Mobile devices.',
            'download_page_desc_ar' => 'قم بتحميل وتثبيت تطبيق Novais للويندوز وتطبيقات الموبايل.',
            'windows_download_url' => null,
            'mobile_download_url' => null,
            'system_theme_mode' => 'user_choice',
            'hero_media_muted' => true,
            'hero_media_loop' => true,
            'hero_media_poster' => null,
        ];
    }

    public static function currentConfig(): array
    {
        $row = static::firstOrCreate(
            ['key' => self::CONFIG_KEY],
            ['value' => static::defaults()]
        );

        return array_replace_recursive(static::defaults(), $row->value ?? []);
    }

    public static function updateConfig(array $value): array
    {
        $config = array_replace_recursive(static::currentConfig(), $value);

        static::updateOrCreate(
            ['key' => self::CONFIG_KEY],
            ['value' => $config]
        );

        return $config;
    }
}
