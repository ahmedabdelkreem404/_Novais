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
            'web_hero_title_en' => 'Transform Text into | Complete Courses',
            'web_hero_title_ar' => 'حول النصوص إلى | كورسات متكاملة',
            'web_hero_subtitle_en' => 'Define a topic, select from customizable blueprints, upload files, write prompts, choose from 10+ languages, and let our AI generate a comprehensive academic book, interactive course, story or question bank in seconds today.',
            'web_hero_subtitle_ar' => 'حدد موضوعًا، واختر من بين قوالب قابلة للتخصيص، وارفع الملفات، واكتب موجهًا، واختر من بين أكثر من 10 لغات، ودع ذكاءنا الاصطناعي يولد كتابًا أكاديميًا شاملاً، أو دورة تفاعلية، أو قصة، أو بنك أسئلة في ثوانٍ اليوم.',
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

            // Landing Page Customizations
            'landing_features_kicker_en' => 'Features',
            'landing_features_kicker_ar' => 'المميزات',
            'landing_features_title_en' => 'Everything You Need to Create Exceptional Courses',
            'landing_features_title_ar' => 'كل ما تحتاجه لإنشاء دورات استثنائية',
            'landing_features_accent_en' => 'Exceptional Courses',
            'landing_features_accent_ar' => 'دورات استثنائية',

            'landing_steps_kicker_en' => 'Simple 4-Step',
            'landing_steps_kicker_ar' => 'خطوات بسيطة',
            'landing_steps_title_en' => 'Simple 4-Step Course Creation',
            'landing_steps_title_ar' => 'خطوات بسيطة لإنشاء الدورات',
            'landing_steps_accent_en' => '4-Step Course',
            'landing_steps_accent_ar' => '4 خطوات',

            'landing_reviews_kicker_en' => 'Testimonials',
            'landing_reviews_kicker_ar' => 'آراء المستخدمين',
            'landing_reviews_title_en' => 'Trusted by Educators & Learning Professionals',
            'landing_reviews_title_ar' => 'موثوق من قبل المعلمين ومحترفي التعلم',
            'landing_reviews_accent_en' => 'Educators',
            'landing_reviews_accent_ar' => 'المعلمين',

            'landing_cta_title_en' => 'Transform your content into engaging courses today',
            'landing_cta_title_ar' => 'حول محتواك إلى دورات تفاعلية اليوم',
            'landing_cta_subtitle_en' => 'Join thousands of students, researchers, and educators who use NOVAIS to generate professional-grade materials.',
            'landing_cta_subtitle_ar' => 'انضم إلى آلاف الطلاب والباحثين والمعلمين الذين يستخدمون نوفايس لتوليد مواد تعليمية بمستوى احترافي.',
            'landing_cta_btn_en' => 'Get Started Now',
            'landing_cta_btn_ar' => 'ابدأ الآن',

            'landing_features_list' => [
                [
                    'key' => 'ai',
                    'icon' => 'LuSparkles',
                    'title_en' => 'AI-Powered Generation',
                    'title_ar' => 'التوليد بالذكاء الاصطناعي',
                    'desc_en' => 'Get a fully structured course or book in seconds based on your inputs.',
                    'desc_ar' => 'احصل على دورة أو كتاب منظم بالكامل في ثوانٍ بناءً على مدخلاتك.',
                ],
                [
                    'key' => 'types',
                    'icon' => 'LuChartBar',
                    'title_en' => 'Customizable Blueprints',
                    'title_ar' => 'مخططات قابلة للتخصيص',
                    'desc_en' => 'Select from books, graduation project blueprints, stories, or exam builders.',
                    'desc_ar' => 'اختر من بين الكتب، ومخططات مشاريع التخرج، أو منشئ الاختبارات.',
                ],
                [
                    'key' => 'quizzes',
                    'icon' => 'LuCircleCheck',
                    'title_en' => 'Active learning',
                    'title_ar' => 'التعلم النشط',
                    'desc_en' => 'Generate scenario-based quizzes to test your understanding.',
                    'desc_ar' => 'قم بتوليد اختبارات قائمة على السيناريوهات لاختبار فهمك للدرس.',
                ],
                [
                    'key' => 'languages',
                    'icon' => 'LuLanguages',
                    'title_en' => 'Multi-Language Output',
                    'title_ar' => 'دعم متعدد اللغات',
                    'desc_en' => 'Generate content in Arabic, English, or any of the 10+ supported languages.',
                    'desc_ar' => 'قم بتوليد المحتوى باللغة العربية، أو الإنجليزية، أو أي من اللغات الـ 10+ المدعومة.',
                ],
                [
                    'key' => 'chat',
                    'icon' => 'LuMessageSquare',
                    'title_en' => 'Learning Coach Chat',
                    'title_ar' => 'المحادثة مع المعلم الذكي',
                    'desc_en' => 'Ask your dedicated AI Coach questions about the course material.',
                    'desc_ar' => 'اسأل معلمك الذكي المخصص الأسئلة حول مادة الدورة التدريبية.',
                ],
                [
                    'key' => 'export',
                    'icon' => 'LuDownload',
                    'title_en' => 'Dynamic Media',
                    'title_ar' => 'الوسائط الديناميكية',
                    'desc_en' => 'Automatically embeds relevant instructional images, videos, and slides.',
                    'desc_ar' => 'تضمين تلقائي للصور والفيديوهات التعليمية والشرائح ذات الصلة بالموضوع.',
                ],
            ],
            'landing_steps_list' => [
                [
                    'key' => 'topics',
                    'icon' => 'LuMessageSquare',
                    'title_en' => 'Define Topic',
                    'title_ar' => 'حدد الموضوع',
                    'desc_en' => 'Enter your topic or paste raw text files.',
                    'desc_ar' => 'أدخل موضوعك أو الصق ملفات النص الخام.',
                ],
                [
                    'key' => 'preferences',
                    'icon' => 'LuChartBar',
                    'title_en' => 'Choose Blueprint',
                    'title_ar' => 'اختر المخطط المناسب',
                    'desc_en' => 'Pick a blueprint matching your goal.',
                    'desc_ar' => 'اختر مخططاً يطابق هدفك التعليمي.',
                ],
                [
                    'key' => 'language',
                    'icon' => 'LuLanguages',
                    'title_en' => 'Customize details',
                    'title_ar' => 'خصص التفاصيل',
                    'desc_en' => 'Fill out university metadata or custom fields.',
                    'desc_ar' => 'املأ بيانات الجامعة أو الحقول المخصصة.',
                ],
                [
                    'key' => 'magic',
                    'icon' => 'LuSparkles',
                    'title_en' => 'AI Magic',
                    'title_ar' => 'سحر الذكاء الاصطناعي',
                    'desc_en' => 'Let the engine create your complete learning resource.',
                    'desc_ar' => 'دع محركنا ينشئ لك موردك التعليمي الكامل.',
                ],
            ],
            'landing_reviews_list' => [
                [
                    'key' => 'sarah',
                    'name' => 'Sameer Al-Mansoori',
                    'avatar' => 'SA',
                    'quote_en' => 'NOVAIS changed how I teach. I can generate complete academic books and guides in seconds.',
                    'quote_ar' => 'لقد غير نوفايس طريقة تدريسي. يمكنني توليد كتب وأدلة أكاديمية كاملة في ثوانٍ.',
                    'role_en' => 'Medical Professor',
                    'role_ar' => 'أستاذ بكلية الطب',
                ],
                [
                    'key' => 'david',
                    'name' => 'Dr. Jeremy Smith',
                    'avatar' => 'JS',
                    'quote_en' => 'The master thesis blueprint saved me weeks of formatting. The AI outline is incredibly formal.',
                    'quote_ar' => 'أنقذني مخطط رسالة الماجستير من أسابيع التنسيق. الخطوط العريضة للذكاء الاصطناعي رسمية للغاية.',
                    'role_en' => 'Thesis Advisor',
                    'role_ar' => 'مشرف رسائل علمية',
                ],
                [
                    'key' => 'michael',
                    'name' => 'Sarah Jenkins',
                    'avatar' => 'SJ',
                    'quote_en' => 'Building exam questions and storybooks has never been faster.',
                    'quote_ar' => 'لم يكن إنشاء أسئلة الامتحانات والقصص التعليمية أسرع من ذلك من قبل.',
                    'role_en' => 'High School Teacher',
                    'role_ar' => 'معلمة ثانوية العامة',
                ],
                [
                    'key' => 'anna',
                    'name' => 'Amir Tarek',
                    'avatar' => 'AT',
                    'quote_en' => 'Generating structured course materials with dynamic media was exactly what we needed.',
                    'quote_ar' => 'كان توليد مواد الدورات التدريبية المنظمة بلمسات وسائط ديناميكية هو بالضبط ما نحتاجه.',
                    'role_en' => 'EdTech Director',
                    'role_ar' => 'مدير تكنولوجيا التعليم',
                ],
            ],

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
            $row = static::firstOrCreate(
                ['key' => self::CONFIG_KEY],
                [
                    'value' => static::defaults(),
                    'group' => 'platform',
                    'is_public' => true,
                    'description' => 'Backend-driven platform configuration shared by web, mobile, and desktop.',
                ]
            );

            $config = static::sanitizeForPublic(
                array_replace_recursive(static::defaults(), $row->value ?? [])
            );
            $config['settings_version'] = sha1(json_encode($config));

            return $config;
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
