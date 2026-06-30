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
            ['interactive practical course', 'كورس تفاعلي عملي', 'interactive-practical-course', ['overview', 'chapters', 'lessons', 'practice']],
            ['academic course', 'كورس أكاديمي / محاضرات جامعية', 'academic-course', ['overview', 'lecture plan', 'board explanation', 'references']],
            ['study review', 'مراجعة مذاكرة للامتحان', 'study-review', ['summaries', 'key points', 'expected questions', 'revision schedule']],
            ['question bank', 'بنك أسئلة', 'question-bank', ['questions', 'answer key', 'explanations']],
            ['exam builder', 'إنشاء امتحان', 'exam-builder', ['exam paper', 'instructions', 'model answers', 'grading rubric']],
            ['book', 'كتاب كامل', 'book', ['preface', 'chapters', 'exercises', 'glossary']],
            ['novel story', 'رواية / قصة تعليمية', 'story', ['synopsis', 'chapters', 'scenes', 'educational message']],
            ['graduation project', 'كتاب مشروع تخرج', 'graduation-project', ['abstract', 'introduction', 'methodology', 'requirements', 'system design', 'implementation', 'testing', 'references']],
            ['master thesis', 'رسالة ماجستير / بحث أكاديمي متقدم', 'master-thesis', ['abstract', 'introduction', 'literature review', 'methodology', 'findings', 'discussion', 'references']],
            ['teacher lesson plan', 'خطة درس للمعلم', 'lesson-plan', ['lesson objectives', 'activities', 'assessment', 'homework']],
            ['assignment builder', 'إنشاء واجب / تكليف', 'assignment-builder', ['assignment brief', 'tasks', 'grading rubric', 'answer guide']],
            ['project based learning', 'خطة تعلم بالمشاريع', 'project-based-learning', ['project scenario', 'milestones', 'evaluation rubric', 'deliverables']],
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
                'language_support' => ['English', 'Arabic', 'Egyptian Arabic'],
                'target_academic_level' => 'general',
                'output_structure' => [
                    'type' => $slug,
                    'sections' => $sections,
                    'must_return_json' => true,
                ],
                'required_sections' => $sections,
                'optional_sections' => ['media suggestions', 'practice prompts'],
                'default_count' => in_array($slug, ['book', 'research-paper', 'graduation-project', 'master-thesis'], true) ? 8 : 5,
                'assessment_rules' => [
                    'include_quiz' => in_array($slug, ['normal-course', 'leveled-course', 'academic-course', 'lesson-plan', 'interactive-practical-course'], true),
                    'style' => 'scenario based where relevant',
                ],
                'media_rules' => ['prefer_instructional_media' => true, 'avoid_decorative_media' => true],
                'citation_rules' => ['required' => in_array($slug, ['research-paper', 'book', 'graduation-project', 'master-thesis'], true)],
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
            self::field('audience', 'Target audience', 'الجمهور المستهدف', 'text', false, ['en' => 'e.g. University students, junior developers, managers...', 'ar' => 'مثال: طلاب الجامعات، المطورين المبتدئين، المدراء...']),
            self::field('outcome', 'Learning outcome', 'النتيجة المطلوبة', 'textarea', false, ['en' => 'What should learners be able to do after this content?', 'ar' => 'ما الذي يجب أن يكون المتعلمون قادرين على فعله بعد هذا المحتوى؟']),
            self::field('difficulty_focus', 'Difficulty focus', 'مستوى التركيز', 'select', false, null, [
                ['value' => 'foundational', 'label' => ['en' => 'Foundational', 'ar' => 'تأسيسي']],
                ['value' => 'balanced', 'label' => ['en' => 'Balanced', 'ar' => 'متوازن']],
                ['value' => 'advanced', 'label' => ['en' => 'Advanced', 'ar' => 'متقدم']]
            ]),
        ];

        $schemas = [
            'interactive-practical-course' => [
                self::field('practical_domain', 'Practical domain', 'المجال العملي', 'text', true, ['en' => 'e.g. Software engineering, clinical medicine...', 'ar' => 'مثال: هندسة البرمجيات، الطب السريري...']),
                self::field('practice_intensity', 'Practice intensity', 'كثافة التدريب', 'select', true, null, [
                    ['value' => 'low', 'label' => ['en' => 'Low', 'ar' => 'منخفضة']],
                    ['value' => 'medium', 'label' => ['en' => 'Medium', 'ar' => 'متوسطة']],
                    ['value' => 'high', 'label' => ['en' => 'High', 'ar' => 'عالية']]
                ]),
                self::field('include_mini_projects', 'Include mini projects', 'تضمين مشاريع صغيرة', 'boolean', false),
                self::field('include_quizzes', 'Include quizzes', 'تضمين اختبارات قصيرة', 'boolean', false),
                self::field('include_real_examples', 'Include real-world examples', 'تضمين أمثلة واقعية', 'boolean', false),
                self::field('preferred_media', 'Preferred media', 'الوسائط المفضلة', 'select', false, null, [
                    ['value' => 'images', 'label' => ['en' => 'Images', 'ar' => 'صور']],
                    ['value' => 'videos', 'label' => ['en' => 'Videos', 'ar' => 'فيديو']],
                    ['value' => 'none', 'label' => ['en' => 'None', 'ar' => 'لا شيء']]
                ]),
                self::field('final_project_required', 'Final project required?', 'هل المشروع النهائي مطلوب؟', 'boolean', false),
            ],
            'academic-course' => [
                self::field('academic_level', 'Academic level', 'المستوى الأكاديمي', 'select', true, null, [
                    ['value' => 'school', 'label' => ['en' => 'School', 'ar' => 'مدرسي']],
                    ['value' => 'undergraduate', 'label' => ['en' => 'Undergraduate', 'ar' => 'جامعي']],
                    ['value' => 'postgraduate', 'label' => ['en' => 'Postgraduate', 'ar' => 'دراسات عليا']]
                ]),
                self::field('department', 'Department/Faculty', 'القسم أو الكلية', 'text', false, ['en' => 'e.g. Computer Science, Medicine...', 'ar' => 'مثال: علوم الحاسب، الطب...']),
                self::field('lecture_count', 'Lecture count', 'عدد المحاضرات', 'number', true, '8'),
                self::field('lecture_duration', 'Lecture duration', 'مدة المحاضرة بالدقائق', 'number', true, '90'),
                self::field('include_script', 'Include lecture script', 'تضمين نص المحاضرة', 'boolean', false),
                self::field('include_slides_outline', 'Slides outline', 'تضمين مخطط الشرائح', 'boolean', false),
                self::field('include_discussion_questions', 'Include discussion questions', 'تضمين أسئلة للنقاش', 'boolean', false),
                self::field('include_assignments', 'Include assignments', 'تضمين تكليفات', 'boolean', false),
                self::field('include_references', 'Include references', 'تضمين مراجع موثقة', 'boolean', false),
                self::field('academic_tone', 'Academic tone', 'الأسلوب الأكاديمي', 'select', true, null, [
                    ['value' => 'formal', 'label' => ['en' => 'Formal', 'ar' => 'رسمي']],
                    ['value' => 'engaging', 'label' => ['en' => 'Engaging', 'ar' => 'تفاعلي شائق']],
                    ['value' => 'rigorous', 'label' => ['en' => 'Rigorous', 'ar' => 'صارم/دقيق']]
                ]),
            ],
            'study-review' => [
                self::field('exam_level', 'Exam level', 'مستوى الامتحان', 'text', true, ['en' => 'e.g. High school, SAT, University final...', 'ar' => 'مثال: الثانوية العامة، SAT، نهائي الجامعة...']),
                self::field('topics_to_review', 'Topics to review', 'الموضوعات للمراجعة', 'textarea', true, ['en' => 'List chapters or topics to review...', 'ar' => 'اكتب فصول أو موضوعات المراجعة...']),
                self::field('weak_areas', 'Weak areas to focus', 'نقاط الضعف للتركيز عليها', 'textarea', false, ['en' => 'Mention areas needing more focus...', 'ar' => 'اذكر نقاط الضعف التي تحتاج لتركيز أكثر...']),
                self::field('time_available', 'Time available', 'الوقت المتاح للمذاكرة', 'text', false, ['en' => 'e.g. 2 days, 1 week...', 'ar' => 'مثال: يومين، أسبوع...']),
                self::field('summary_depth', 'Summary depth', 'عمق التلخيص', 'select', true, null, [
                    ['value' => 'brief', 'label' => ['en' => 'Brief', 'ar' => 'موجز']],
                    ['value' => 'balanced', 'label' => ['en' => 'Balanced', 'ar' => 'متوازن']],
                    ['value' => 'detailed', 'label' => ['en' => 'Detailed', 'ar' => 'تفصيلي']]
                ]),
                self::field('include_memory_aids', 'Include memory aids', 'تضمين وسائل للتذكر', 'boolean', false),
                self::field('include_expected_questions', 'Include expected questions', 'تضمين أسئلة متوقعة', 'boolean', false),
                self::field('include_revision_table', 'Include quick revision table', 'تضمين جدول مراجعة سريع', 'boolean', false),
                self::field('mistakes_to_avoid', 'Mistakes to avoid', 'أخطاء يجب تجنبها', 'boolean', false),
            ],
            'question-bank' => [
                self::field('topics', 'Topics', 'الموضوعات المشمولة', 'textarea', true, ['en' => 'Topics to cover in questions...', 'ar' => 'الموضوعات المشمولة في الأسئلة...']),
                self::field('question_count', 'Question count', 'عدد الأسئلة', 'number', true, '10'),
                self::field('difficulty', 'Difficulty level', 'مستوى الصعوبة', 'select', true, null, [
                    ['value' => 'easy', 'label' => ['en' => 'Easy', 'ar' => 'سهل']],
                    ['value' => 'medium', 'label' => ['en' => 'Medium', 'ar' => 'متوسط']],
                    ['value' => 'hard', 'label' => ['en' => 'Hard', 'ar' => 'صعب']],
                    ['value' => 'mixed', 'label' => ['en' => 'Mixed', 'ar' => 'مختلط']]
                ]),
                self::field('question_types', 'Question types', 'أنواع الأسئلة', 'select', true, null, [
                    ['value' => 'essay', 'label' => ['en' => 'Essay only', 'ar' => 'أسئلة مقالية فقط']],
                    ['value' => 'mcq', 'label' => ['en' => 'MCQ only', 'ar' => 'اختيار من متعدد فقط']],
                    ['value' => 'true_false', 'label' => ['en' => 'True or False only', 'ar' => 'صح/خطأ فقط']],
                    ['value' => 'mixed', 'label' => ['en' => 'Mixed (Essay + MCQ + T/F)', 'ar' => 'مختلط (مقالي + اختيار من متعدد + صح/خطأ)']]
                ]),
                self::field('include_answers', 'Include answers key', 'تضمين نموذج الإجابة', 'boolean', false),
                self::field('include_explanations', 'Include explanations', 'تضمين الشروحات', 'boolean', false),
                self::field('include_rubric', 'Include grading rubric', 'تضمين معايير التقييم', 'boolean', false),
                self::field('group_by_topic', 'Group by topic', 'التجميع حسب الموضوع', 'boolean', false),
                self::field('randomize', 'Randomize order', 'ترتيب عشوائي', 'boolean', false),
            ],
            'exam-builder' => [
                self::field('exam_duration', 'Exam duration (minutes)', 'مدة الامتحان بالدقائق', 'number', true, '120'),
                self::field('total_marks', 'Total marks', 'الدرجة الإجمالية', 'number', true, '100'),
                self::field('question_types', 'Question types', 'أنواع الأسئلة', 'select', true, null, [
                    ['value' => 'essay', 'label' => ['en' => 'Essay only', 'ar' => 'أسئلة مقالية فقط']],
                    ['value' => 'mcq', 'label' => ['en' => 'MCQ only', 'ar' => 'اختيار من متعدد فقط']],
                    ['value' => 'true_false', 'label' => ['en' => 'True or False only', 'ar' => 'صح/خطأ فقط']],
                    ['value' => 'mixed', 'label' => ['en' => 'Mixed', 'ar' => 'مختلط']]
                ]),
                self::field('section_count', 'Number of sections', 'عدد الأقسام', 'number', true, '3'),
                self::field('questions_per_section', 'Questions per section', 'عدد الأسئلة لكل قسم', 'number', true, '5'),
                self::field('include_answers', 'Include model answers', 'تضمين الإجابات النموذجية', 'boolean', false),
                self::field('include_grading_scheme', 'Include grading scheme', 'تضمين معايير التوزيع', 'boolean', false),
                self::field('difficulty_distribution', 'Difficulty distribution', 'توزيع الصعوبة', 'select', true, null, [
                    ['value' => 'balanced', 'label' => ['en' => 'Balanced', 'ar' => 'متوازن']],
                    ['value' => 'easy-leaning', 'label' => ['en' => 'Easy-leaning', 'ar' => 'يميل للسهولة']],
                    ['value' => 'hard-leaning', 'label' => ['en' => 'Hard-leaning', 'ar' => 'يميل للصعوبة']]
                ]),
            ],
            'book' => [
                self::field('target_reader', 'Target reader', 'القارئ المستهدف', 'text', true, ['en' => 'e.g. High school students, general public...', 'ar' => 'مثال: طلاب المدارس، عامة الناس...']),
                self::field('academic_level', 'Academic/Professional level', 'المستوى الأكاديمي أو المهني', 'text', false, ['en' => 'e.g. Beginner, intermediate, advanced...', 'ar' => 'مثال: مبتدئ، متوسط، متقدم...']),
                self::field('chapter_count', 'Number of chapters', 'عدد الفصول', 'number', true, '8'),
                self::field('writing_style', 'Writing style', 'أسلوب الكتابة', 'select', true, null, [
                    ['value' => 'academic', 'label' => ['en' => 'Academic', 'ar' => 'أكاديمي']],
                    ['value' => 'practical', 'label' => ['en' => 'Practical', 'ar' => 'عملي']],
                    ['value' => 'conversational', 'label' => ['en' => 'Conversational', 'ar' => 'حواري/ودود']],
                    ['value' => 'story-driven', 'label' => ['en' => 'Story-driven', 'ar' => 'قصصي']]
                ]),
                self::field('include_intro', 'Include introduction', 'تضمين مقدمة الكتاب', 'boolean', false),
                self::field('include_preface', 'Include preface', 'تضمين تمهيد الكتاب', 'boolean', false),
                self::field('include_chapter_summary', 'Include chapter summary', 'تضمين ملخص للفصل', 'boolean', false),
                self::field('include_exercises', 'Include exercises', 'تضمين تدريبات', 'boolean', false),
                self::field('include_references', 'Include references', 'تضمين مراجع موثقة', 'boolean', false),
                self::field('include_glossary', 'Include glossary', 'تضمين مسرد المصطلحات', 'boolean', false),
                self::field('image_placeholders', 'Include image placeholders', 'تضمين مواضع للصور', 'boolean', false),
                self::field('placeholder_style', 'Image placeholder style', 'أسلوب مواضع الصور', 'select', false, null, [
                    ['value' => 'diagrams', 'label' => ['en' => 'Diagram', 'ar' => 'مخطط توضيحي']],
                    ['value' => 'screenshots', 'label' => ['en' => 'Screenshot', 'ar' => 'لقطة شاشة']],
                    ['value' => 'charts', 'label' => ['en' => 'Chart', 'ar' => 'رسم بياني']],
                    ['value' => 'illustrations', 'label' => ['en' => 'Illustration', 'ar' => 'رسم توضيحي']]
                ]),
            ],
            'story' => [
                self::field('genre', 'Genre', 'النوع الأدبي', 'select', true, null, [
                    ['value' => 'drama', 'label' => ['en' => 'Drama', 'ar' => 'دراما']],
                    ['value' => 'sci-fi', 'label' => ['en' => 'Sci-Fi', 'ar' => 'خيال علمي']],
                    ['value' => 'adventure', 'label' => ['en' => 'Adventure', 'ar' => 'مغامرة']],
                    ['value' => 'mystery', 'label' => ['en' => 'Mystery', 'ar' => 'غموض']],
                    ['value' => 'historical', 'label' => ['en' => 'Historical', 'ar' => 'تاريخي']]
                ]),
                self::field('theme', 'Theme/Topic', 'موضوع القصة', 'text', true, ['en' => 'Theme/Moral of the story...', 'ar' => 'موضوع أو مغزى القصة...']),
                self::field('target_age', 'Target age group', 'الفئة العمرية المستهدفة', 'text', false, ['en' => 'e.g. Kids, teenagers, young adults...', 'ar' => 'مثال: أطفال، مراهقين، شباب...']),
                self::field('characters', 'Main characters', 'الشخصيات الرئيسية', 'textarea', false, ['en' => 'Describe main characters...', 'ar' => 'صف الشخصيات الرئيسية...']),
                self::field('setting', 'Setting', 'الإطار الزماني والمكاني', 'text', false, ['en' => 'Time and location setting...', 'ar' => 'الإطار الزماني والمكاني...']),
                self::field('chapter_count', 'Number of chapters', 'عدد الفصول', 'number', true, '5'),
                self::field('moral_goal', 'Moral/Learning goal', 'الهدف التعليمي أو الأخلاقي', 'text', false, ['en' => 'Learning goal or moral...', 'ar' => 'الهدف التعليمي أو الأخلاقي...']),
                self::field('narrative_style', 'Narrative style', 'أسلوب السرد', 'select', true, null, [
                    ['value' => 'first-person', 'label' => ['en' => 'First-person', 'ar' => 'ضمير المتكلم']],
                    ['value' => 'third-person', 'label' => ['en' => 'Third-person', 'ar' => 'ضمير الغائب']]
                ]),
                self::field('language_style', 'Language style', 'أسلوب اللغة', 'select', true, null, [
                    ['value' => 'simplified', 'label' => ['en' => 'Simplified', 'ar' => 'مبسطة']],
                    ['value' => 'rich', 'label' => ['en' => 'Rich and Poetic', 'ar' => 'بليغة/شاعرية']],
                    ['value' => 'realistic', 'label' => ['en' => 'Realistic', 'ar' => 'واقعية']]
                ]),
            ],
            'graduation-project' => [
                self::field('domain', 'Project domain', 'مجال المشروع', 'text', true, ['en' => 'e.g. Healthcare, fintech, IoT...', 'ar' => 'مثال: الرعاية الصحية، التكنولوجيا المالية...']),
                self::field('team_size', 'Team size', 'حجم الفريق', 'number', false, '4'),
                self::field('supervisor_role', 'Supervisor role', 'دور المشرف', 'text', false, ['en' => 'e.g. Advisor, main grader...', 'ar' => 'مثال: مستشار، مصحح رئيسي...']),
                self::field('problem_statement', 'Problem statement', 'صياغة المشكلة', 'textarea', true, ['en' => 'What problem does the project solve?', 'ar' => 'ما هي المشكلة التي يحلها المشروع؟']),
                self::field('objectives', 'Objectives', 'الأهداف', 'textarea', true, ['en' => 'Core objectives of the project...', 'ar' => 'الأهداف الأساسية للمشروع...']),
                self::field('project_scope', 'Project scope', 'نطاق المشروع', 'textarea', false, ['en' => 'Project scope and boundaries...', 'ar' => 'نطاق المشروع وحدوده...']),
                self::field('technologies', 'Tools/Technologies', 'الأدوات والتقنيات المستخدمة', 'text', false, ['en' => 'e.g. React, Laravel, PostgreSQL...', 'ar' => 'مثال: ريأكت، لارافيل، بوستجرس...']),
                self::field('methodology', 'Methodology', 'منهجية التطوير', 'select', true, null, [
                    ['value' => 'agile', 'label' => ['en' => 'Agile Scrum', 'ar' => 'أجايل / سكروم']],
                    ['value' => 'waterfall', 'label' => ['en' => 'Waterfall', 'ar' => 'الشلال']],
                    ['value' => 'devops', 'label' => ['en' => 'DevOps', 'ar' => 'ديف أوبس']]
                ]),
                self::field('system_requirements', 'System requirements', 'متطلبات النظام', 'textarea', false, ['en' => 'Functional & non-functional requirements...', 'ar' => 'المتطلبات الوظيفية وغير الوظيفية...']),
                self::field('db_design_required', 'Database design required?', 'هل تصميم قاعدة البيانات مطلوب؟', 'boolean', false),
                self::field('uml_required', 'UML/Architecture diagrams required?', 'هل بنية النظام ورسومات UML مطلوبة؟', 'boolean', false),
                self::field('implementation_plan', 'Implementation plan', 'خطة التنفيذ', 'boolean', false),
                self::field('testing_evaluation', 'Testing & evaluation', 'الاختبار والتقييم', 'boolean', false),
                self::field('timeline', 'Project timeline', 'الجدول الزمني', 'boolean', false),
                self::field('image_placeholders', 'Include screenshot/diagram placeholders', 'تضمين مواضع الصور والرسومات', 'boolean', false),
            ],
            'master-thesis' => [
                self::field('research_problem', 'Research problem', 'مشكلة البحث', 'textarea', true, ['en' => 'Core research problem...', 'ar' => 'مشكلة البحث الأساسية...']),
                self::field('research_questions', 'Research questions', 'أسئلة البحث', 'textarea', true, ['en' => 'Research questions...', 'ar' => 'أسئلة البحث...']),
                self::field('hypotheses', 'Hypotheses', 'الفرضيات', 'textarea', false, ['en' => 'Hypotheses...', 'ar' => 'الفرضيات...']),
                self::field('methodology', 'Methodology', 'المنهجية البحثية', 'select', true, null, [
                    ['value' => 'qualitative', 'label' => ['en' => 'Qualitative', 'ar' => 'نوعي']],
                    ['value' => 'quantitative', 'label' => ['en' => 'Quantitative', 'ar' => 'كمي']],
                    ['value' => 'mixed', 'label' => ['en' => 'Mixed', 'ar' => 'مختلط']],
                    ['value' => 'case_study', 'label' => ['en' => 'Case Study', 'ar' => 'دراسة حالة']]
                ]),
                self::field('sample_data', 'Sample/Data source', 'العينة ومصدر البيانات', 'text', false, ['en' => 'Sample size or database source...', 'ar' => 'حجم العينة أو مصدر البيانات...']),
                self::field('citation_style', 'Citation style', 'أسلوب التوثيق', 'select', true, null, [
                    ['value' => 'apa', 'label' => ['en' => 'APA', 'ar' => 'APA']],
                    ['value' => 'mla', 'label' => ['en' => 'MLA', 'ar' => 'MLA']],
                    ['value' => 'ieee', 'label' => ['en' => 'IEEE', 'ar' => 'IEEE']],
                    ['value' => 'chicago', 'label' => ['en' => 'Chicago', 'ar' => 'Chicago']]
                ]),
                self::field('literature_depth', 'Literature depth', 'عمق مراجعة الأدبيات', 'select', true, null, [
                    ['value' => 'outline', 'label' => ['en' => 'Brief outline', 'ar' => 'مخطط موجز']],
                    ['value' => 'exhaustive', 'label' => ['en' => 'Exhaustive synthesis', 'ar' => 'تحليل شامل ومفصل']]
                ]),
                self::field('include_limitations', 'Include limitations', 'تضمين محددات البحث', 'boolean', false),
                self::field('include_recommendations', 'Include recommendations', 'تضمين التوصيات', 'boolean', false),
            ],
            'lesson-plan' => [
                self::field('grade', 'Grade level', 'الصف الدراسي', 'text', true, ['en' => 'e.g. 5th grade, High school...', 'ar' => 'مثال: الصف الخامس، المدرسة الثانوية...']),
                self::field('duration', 'Lesson duration', 'مدة الدرس بالدقائق', 'number', true, '45'),
                self::field('learning_objectives', 'Learning objectives', 'الأهداف التعليمية', 'textarea', true, ['en' => 'Key lesson objectives...', 'ar' => 'الأهداف الأساسية للدرس...']),
                self::field('materials', 'Required materials', 'الوسائل والمواد المطلوبة', 'textarea', false, ['en' => 'Required textbooks, kits, slides...', 'ar' => 'الكتب، الأدوات، أو الشرائح المطلوبة...']),
                self::field('teaching_strategy', 'Teaching strategy', 'استراتيجية التدريس', 'select', true, null, [
                    ['value' => 'direct', 'label' => ['en' => 'Direct instruction', 'ar' => 'التدريس المباشر']],
                    ['value' => 'collaborative', 'label' => ['en' => 'Collaborative learning', 'ar' => 'التعلم التعاوني']],
                    ['value' => 'inquiry', 'label' => ['en' => 'Inquiry-based', 'ar' => 'التعلم القائم على الاستقصاء']]
                ]),
                self::field('activities', 'Activities', 'الأنشطة الصفية', 'textarea', true, ['en' => 'Classroom activities list...', 'ar' => 'قائمة الأنشطة الصفية...']),
                self::field('assessment_method', 'Assessment method', 'طريقة التقييم', 'select', true, null, [
                    ['value' => 'exit_ticket', 'label' => ['en' => 'Exit ticket', 'ar' => 'بطاقة الخروج']],
                    ['value' => 'quiz', 'label' => ['en' => 'Quiz', 'ar' => 'اختبار قصير']],
                    ['value' => 'verbal', 'label' => ['en' => 'Verbal questions', 'ar' => 'أسئلة شفهية']]
                ]),
                self::field('homework', 'Homework assignment', 'الواجب المنزلي', 'text', false, ['en' => 'Homework tasks...', 'ar' => 'مهام الواجب المنزلي...']),
                self::field('differentiation', 'Differentiation', 'مراعاة الفروق الفردية', 'boolean', false),
            ],
            'assignment-builder' => [
                self::field('difficulty', 'Difficulty level', 'مستوى الصعوبة', 'select', true, null, [
                    ['value' => 'easy', 'label' => ['en' => 'Easy', 'ar' => 'سهل']],
                    ['value' => 'medium', 'label' => ['en' => 'Medium', 'ar' => 'متوسط']],
                    ['value' => 'hard', 'label' => ['en' => 'Hard', 'ar' => 'صعب']]
                ]),
                self::field('task_count', 'Number of tasks', 'عدد المهام', 'number', true, '3'),
                self::field('include_rubric', 'Include grading rubric', 'تضمين جدول معايير التقييم', 'boolean', false),
                self::field('include_guide', 'Include answer guide', 'تضمين دليل الإجابات', 'boolean', false),
                self::field('delivery_style', 'Delivery style', 'طبيعة التكليف', 'select', true, null, [
                    ['value' => 'practical', 'label' => ['en' => 'Practical', 'ar' => 'عملي']],
                    ['value' => 'theoretical', 'label' => ['en' => 'Theoretical', 'ar' => 'نظري']],
                    ['value' => 'mixed', 'label' => ['en' => 'Mixed', 'ar' => 'مختلط']]
                ]),
                self::field('deadline_style', 'Deadline style', 'طبيعة الموعد النهائي', 'text', false, ['en' => 'e.g. 1 week from now, strict 24 hours...', 'ar' => 'مثال: أسبوع من الآن، 24 ساعة...']),
            ],
            'project-based-learning' => [
                self::field('final_deliverable', 'Final deliverable', 'المخرج النهائي', 'text', true, ['en' => 'e.g. Working prototype, presentation...', 'ar' => 'مثال: نموذج عملي، عرض تقديمي...']),
                self::field('required_tools', 'Required tools', 'الأدوات المطلوبة', 'text', false, ['en' => 'Required tools...', 'ar' => 'الأدوات المطلوبة...']),
                self::field('milestones', 'Milestones', 'المراحل الرئيسية للمشروع', 'textarea', true, ['en' => 'Major milestones of the project...', 'ar' => 'المراحل الرئيسية للمشروع...']),
                self::field('evaluation_criteria', 'Evaluation criteria', 'معايير التقييم', 'textarea', true, ['en' => 'Criteria for evaluation...', 'ar' => 'معايير التقييم...']),
                self::field('teamwork_roles', 'Include teamwork roles', 'تضمين أدوار العمل الجماعي', 'boolean', false),
                self::field('real_world_scenario', 'Include real-world scenario', 'تضمين سيناريو واقعي', 'boolean', false),
            ],
        ];

        return [
            'title' => Str::title($name) . ' details',
            'fields' => array_values(array_merge($common, $schemas[$slug] ?? [
                self::field('section_count', 'Sections', 'عدد الأقسام', 'number', false, '5'),
                self::field('practice_style', 'Practice style', 'أسلوب التدريب', 'select', false, null, [
                    ['value' => 'quiz', 'label' => ['en' => 'Quiz', 'ar' => 'اختبار قصير']],
                    ['value' => 'projects', 'label' => ['en' => 'Projects', 'ar' => 'مشاريع عملية']],
                    ['value' => 'reflection', 'label' => ['en' => 'Reflection prompts', 'ar' => 'أسئلة تفكير']]
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
