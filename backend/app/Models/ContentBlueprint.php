<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ContentBlueprint extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'enabled',
        'sort_order',
        'language_support',
        'target_academic_level',
        'output_structure',
        'required_sections',
        'optional_sections',
        'default_count',
        'assessment_rules',
        'media_rules',
        'citation_rules',
        'tone_rules',
        'output_format_rules',
        'prompt_instructions',
        'validation_schema',
        'form_schema',
    ];

    protected $casts = [
        'name' => 'array',
        'enabled' => 'boolean',
        'sort_order' => 'integer',
        'language_support' => 'array',
        'output_structure' => 'array',
        'required_sections' => 'array',
        'optional_sections' => 'array',
        'default_count' => 'integer',
        'assessment_rules' => 'array',
        'media_rules' => 'array',
        'citation_rules' => 'array',
        'tone_rules' => 'array',
        'output_format_rules' => 'array',
        'validation_schema' => 'array',
        'form_schema' => 'array',
    ];

    public static function defaults(): array
    {
        $types = [
            ['normal course', 'كورس عادي', 'normal-course', ['overview', 'chapters', 'lessons', 'practice']],
            ['leveled course', 'كورس بمستويات', 'leveled-course', ['level map', 'chapters', 'lessons', 'checkpoints']],
            ['exam', 'امتحان', 'exam', ['instructions', 'sections', 'questions', 'answer key']],
            ['research paper', 'بحث أكاديمي', 'research-paper', ['abstract', 'introduction', 'methodology', 'findings', 'references']],
            ['book', 'كتاب', 'book', ['preface', 'chapters', 'exercises', 'summary']],
            ['graduation project', 'مشروع تخرج', 'graduation-project', ['proposal', 'requirements', 'architecture', 'implementation', 'evaluation']],
            ['academic lecture', 'محاضرة أكاديمية', 'academic-lecture', ['objectives', 'lecture notes', 'examples', 'discussion prompts']],
            ['workshop', 'ورشة عمل', 'workshop', ['agenda', 'hands-on labs', 'facilitator notes', 'outcomes']],
            ['assignment', 'واجب', 'assignment', ['brief', 'requirements', 'rubric', 'submission format']],
            ['study plan', 'خطة مذاكرة', 'study-plan', ['goals', 'weekly schedule', 'resources', 'milestones']],
            ['quiz bank', 'بنك أسئلة', 'quiz-bank', ['categories', 'questions', 'answers', 'difficulty tags']],
            ['lesson plan', 'خطة درس', 'lesson-plan', ['objectives', 'activities', 'assessment', 'materials']],
        ];

        return collect($types)->map(function ($item, $index) {
            [$nameEn, $nameAr, $slug, $sections] = $item;

            return [
                'name' => [
                    'en' => Str::title($nameEn),
                    'ar' => $nameAr,
                ],
                'slug' => $slug,
                'enabled' => true,
                'sort_order' => $index + 1,
                'language_support' => ['English', 'Arabic'],
                'target_academic_level' => 'general',
                'output_structure' => [
                    'type' => $slug,
                    'sections' => $sections,
                    'must_return_json' => true,
                ],
                'required_sections' => $sections,
                'optional_sections' => ['media suggestions', 'practice prompts'],
                'default_count' => in_array($slug, ['book', 'research-paper', 'graduation-project'], true) ? 8 : 5,
                'assessment_rules' => [
                    'include_quiz' => in_array($slug, ['normal-course', 'leveled-course', 'academic-lecture', 'workshop', 'lesson-plan'], true),
                    'style' => 'scenario based where relevant',
                ],
                'media_rules' => ['prefer_instructional_media' => true, 'avoid_decorative_media' => true],
                'citation_rules' => ['required' => in_array($slug, ['research-paper', 'book', 'graduation-project'], true)],
                'tone_rules' => ['style' => 'clear, educational, academically responsible'],
                'output_format_rules' => ['format' => 'structured JSON compatible with NOVAIS course metadata'],
                'prompt_instructions' => "Generate a " . Str::title($nameEn) . " with explicit structure, practical educational value, and language-appropriate labels. Follow the required sections exactly.",
                'validation_schema' => ['required' => ['title', 'description', 'chapters']],
                'form_schema' => self::defaultFormSchema($slug, Str::title($nameEn)),
            ];
        })->all();
    }

    public static function defaultFormSchema(string $slug, string $name = 'course'): array
    {
        $common = [
            self::field('audience', 'Target audience', 'الجمهور المستهدف', 'text', false, ['en' => 'University students, junior developers, managers...', 'ar' => 'طلاب الجامعات، المطورين المبتدئين، المدراء...']),
            self::field('outcome', 'Learning outcome', 'النتيجة المطلوبة', 'textarea', false, ['en' => 'What should learners be able to do after this content?', 'ar' => 'ما الذي يجب أن يكون المتعلمون قادرين على فعله بعد هذا المحتوى؟']),
            self::field('difficulty_focus', 'Difficulty focus', 'مستوى التركيز', 'select', false, null, [
                ['en' => 'Foundational', 'ar' => 'تأسيسي'],
                ['en' => 'Balanced', 'ar' => 'متوازن'],
                ['en' => 'Advanced', 'ar' => 'متقدم']
            ]),
        ];

        $schemas = [
            'book' => [
                self::field('chapters_count', 'Chapters', 'عدد الفصول', 'number', true, '8'),
                self::field('writing_style', 'Writing style', 'أسلوب الكتابة', 'select', true, null, [
                    ['en' => 'Academic', 'ar' => 'أكاديمي'],
                    ['en' => 'Practical', 'ar' => 'عملي'],
                    ['en' => 'Story-driven', 'ar' => 'قصصي']
                ]),
                self::field('include_exercises', 'Include exercises', 'تضمين تدريبات', 'boolean', false),
            ],
            'exam' => [
                self::field('question_count', 'Question count', 'عدد الأسئلة', 'number', true, '20'),
                self::field('question_types', 'Question types', 'أنواع الأسئلة', 'multiselect', true, null, [
                    ['en' => 'MCQ', 'ar' => 'اختيار من متعدد'],
                    ['en' => 'True/False', 'ar' => 'صواب/خطأ'],
                    ['en' => 'Essay', 'ar' => 'سؤال مقالي'],
                    ['en' => 'Scenario', 'ar' => 'سيناريو/حالة']
                ]),
                self::field('include_answer_key', 'Include answer key', 'تضمين نموذج الإجابة', 'boolean', false),
            ],
            'research-paper' => [
                self::field('citation_style', 'Citation style', 'نمط التوثيق', 'select', true, null, [
                    ['en' => 'APA', 'ar' => 'APA'],
                    ['en' => 'MLA', 'ar' => 'MLA'],
                    ['en' => 'IEEE', 'ar' => 'IEEE'],
                    ['en' => 'Chicago', 'ar' => 'Chicago']
                ]),
                self::field('research_method', 'Research method', 'منهج البحث', 'select', false, null, [
                    ['en' => 'Qualitative', 'ar' => 'نوعي'],
                    ['en' => 'Quantitative', 'ar' => 'كمي'],
                    ['en' => 'Mixed', 'ar' => 'مختلط'],
                    ['en' => 'Literature review', 'ar' => 'مراجعة أدبية']
                ]),
                self::field('sources_count', 'Target sources', 'عدد المصادر المستهدف', 'number', false, '8'),
            ],
            'graduation-project' => [
                self::field('domain', 'Project domain', 'مجال المشروع', 'text', true, ['en' => 'Healthcare, fintech, education...', 'ar' => 'الرعاية الصحية، التكنولوجيا المالية، التعليم...']),
                self::field('deliverables', 'Deliverables', 'المخرجات', 'multiselect', true, null, [
                    ['en' => 'Proposal', 'ar' => 'مقترح المشروع'],
                    ['en' => 'SRS', 'ar' => 'مواصفات المتطلبات (SRS)'],
                    ['en' => 'Architecture', 'ar' => 'بنية النظام'],
                    ['en' => 'Implementation plan', 'ar' => 'خطة التنفيذ'],
                    ['en' => 'Evaluation', 'ar' => 'التقييم والاختبار']
                ]),
                self::field('team_size', 'Team size', 'حجم الفريق', 'number', false, '4'),
            ],
            'academic-lecture' => [
                self::field('duration_minutes', 'Lecture duration', 'مدة المحاضرة', 'number', true, '90'),
                self::field('interaction_style', 'Interaction style', 'أسلوب التفاعل', 'select', false, null, [
                    ['en' => 'Discussion', 'ar' => 'نقاش تفاعلي'],
                    ['en' => 'Examples first', 'ar' => 'الأمثلة أولاً'],
                    ['en' => 'Problem solving', 'ar' => 'حل المشكلات']
                ]),
                self::field('include_slides_outline', 'Slides outline', 'مخطط شرائح', 'boolean', false),
            ],
        ];

        return [
            'title' => Str::title($name) . ' details',
            'fields' => array_values(array_merge($common, $schemas[$slug] ?? [
                self::field('section_count', 'Sections', 'عدد الأقسام', 'number', false, '5'),
                self::field('practice_style', 'Practice style', 'أسلوب التدريب', 'select', false, null, [
                    ['en' => 'Quiz', 'ar' => 'اختبار قصير'],
                    ['en' => 'Projects', 'ar' => 'مشاريع عملية'],
                    ['en' => 'Reflection prompts', 'ar' => 'أسئلة تفكير']
                ]),
                self::field('include_quiz', 'Include quiz', 'تضمين اختبار', 'boolean', false),
            ])),
        ];
    }

    private static function field(string $key, string $labelEn, string $labelAr, string $type, bool $required = false, mixed $placeholder = null, array $options = []): array
    {
        return array_filter([
            'key' => $key,
            'label' => ['en' => $labelEn, 'ar' => $labelAr],
            'type' => $type,
            'required' => $required,
            'placeholder' => $placeholder,
            'options' => $options,
        ], fn ($value) => $value !== null && $value !== []);
    }

    public function toPublicArray(): array
    {
        $nameVal = $this->name;
        $nameStr = is_array($nameVal) ? ($nameVal['en'] ?? 'course') : ($nameVal ?? 'course');

        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'enabled' => $this->enabled,
            'language_support' => $this->language_support ?? [],
            'target_academic_level' => $this->target_academic_level,
            'output_structure' => $this->output_structure ?? [],
            'default_count' => $this->default_count,
            'form_schema' => $this->form_schema ?? self::defaultFormSchema($this->slug, $nameStr),
        ];
    }

    public function promptBlock(): string
    {
        return trim(json_encode([
            'blueprint' => $this->slug,
            'name' => $this->name,
            'target_academic_level' => $this->target_academic_level,
            'output_structure' => $this->output_structure,
            'required_sections' => $this->required_sections,
            'optional_sections' => $this->optional_sections,
            'assessment_rules' => $this->assessment_rules,
            'media_rules' => $this->media_rules,
            'citation_rules' => $this->citation_rules,
            'tone_rules' => $this->tone_rules,
            'output_format_rules' => $this->output_format_rules,
            'prompt_instructions' => $this->prompt_instructions,
            'form_schema' => $this->form_schema,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }
}
