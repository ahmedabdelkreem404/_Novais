<?php

namespace App\Models;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    protected $fillable = ['key', 'value', 'group', 'is_public', 'description'];

    protected $casts = [
        'value' => 'array',
        'is_public' => 'boolean',
    ];

    public const CONFIG_KEY = 'platform_config';
    public const CACHE_KEY = 'platform_settings.public';
    public const CACHE_TTL = 300;

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
            'hero_media_show_image_until_loaded' => true,
            
            // Branding & Identity
            'branding_platform_name_en' => 'NOVAIS',
            'branding_platform_name_ar' => 'نوفايس',
            'branding_logo_url' => null,
            'branding_favicon_url' => null,
            
            // Theme behavior
            'theme_default_mode' => 'dark',

            // Hero Video Options
            'hero_video_enabled' => true,
            'hero_video_autoplay' => true,
            'hero_video_loop_mode' => 'loop_forever', // 'loop_forever' | 'play_once' | 'play_once_then_image'
            'hero_video_fallback_image' => null,
            'hero_video_controls_hidden' => true,
            'hero_video_display_target' => 'both', // 'both' | 'web_only' | 'mobile_only'
            'hero_video_replace_low_bandwidth' => true,

            // Payment visibility
            'payment_methods_visible' => true,
            'payment_paymob_visible' => true,
            'payment_wallet_visible' => true,
            'payment_offline_visible' => true,
            'payment_vodafone_cash_visible' => true,
            'payment_instapay_visible' => true,
            'offline_payment_instructions_en' => 'Please send subscription price to bank account XXXX.',
            'offline_payment_instructions_ar' => 'الرجاء إرسال قيمة الاشتراك إلى الحساب البنكي XXXX.',

            // Feature Flags
            'feature_pdf_export_enabled' => true,
            'feature_ppt_export_enabled' => true,
            'feature_notes_enabled' => true,
            'feature_quiz_enabled' => true,
            'feature_chat_enabled' => true,
            'feature_audio_courses_enabled' => true,
            'feature_certificates_enabled' => true,

            // SEO / Social
            'seo_meta_title_en' => 'NOVAIS - AI Learning platform',
            'seo_meta_title_ar' => 'نوفايس - منصة التعلم بالذكاء الاصطناعي',
            'seo_meta_description_en' => 'Generate personalized courses using AI.',
            'seo_meta_description_ar' => 'ولد كورسات مخصصة باستخدام الذكاء الاصطناعي.',
            'seo_meta_keywords_en' => 'ai, course, learn',
            'seo_meta_keywords_ar' => 'ذكاء اصطناعي, كورس, تعلم',

            // Admin Secrets
            'secret_private_key' => 'super_secret_value',
        ];
    }

    public static function currentConfig(): array
    {
        $row = static::firstOrCreate(
            ['key' => self::CONFIG_KEY],
            [
                'value' => static::defaults(),
                'group' => 'platform',
                'is_public' => true,
                'description' => 'Backend-driven platform configuration shared by web, mobile, and desktop.',
            ]
        );

        return array_replace_recursive(static::defaults(), $row->value ?? []);
    }

    public static function publicConfig(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return static::sanitizeForPublic(static::currentConfig());
        });
    }

    public static function updateConfig(array $value): array
    {
        $config = array_replace_recursive(static::currentConfig(), $value);

        static::updateOrCreate(
            ['key' => self::CONFIG_KEY],
            [
                'value' => $config,
                'group' => 'platform',
                'is_public' => true,
                'description' => 'Backend-driven platform configuration shared by web, mobile, and desktop.',
            ]
        );

        Cache::forget(self::CACHE_KEY);
        Log::info('platform_settings.updated', [
            'keys' => array_keys($value),
            'admin_id' => auth('api')->id(),
        ]);

        return $config;
    }

    public static function sanitizeForPublic(array $config): array
    {
        return collect($config)
            ->reject(fn ($value, $key) => str_starts_with((string) $key, 'secret_')
                || str_contains((string) $key, 'private')
                || str_contains((string) $key, 'api_key')
                || str_contains((string) $key, 'token'))
            ->all();
    }
}
