<?php

namespace Database\Seeders;

use App\Models\Blog;
use Illuminate\Database\Seeder;

class BlogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $posts = [
            [
                'title' => 'AI in Education: New Horizons and Contemporary Challenges',
                'title_ar' => 'الذكاء الاصطناعي في التعليم: آفاق جديدة وتحديات معاصرة',
                'slug' => 'ai-in-education-new-horizons',
                'content' => '<p>Generative AI is one of the most prominent technologies reshaping the future of education in the 21st century. By personalizing content and analyzing individual learner needs, AI opens new horizons that were previously impossible.</p><h3>Personalizing Learning Paths</h3><p>In traditional classrooms, educational content is delivered at the same pace and style to all students, regardless of individual differences. Here comes the role of AI to create personalized learning paths that fit each student\'s absorption speed, strengths, and weaknesses.</p><h3>Automating Academic Content Creation</h3><p>Using advanced platforms like NOVAIS, educators and researchers can now generate complete textbooks, academic references, and graduation project blueprints in seconds, saving weeks of administrative effort and manual formatting.</p>',
                'content_ar' => '<p>يعد الذكاء الاصطناعي التوليدي أحد أبرز التقنيات التي تعيد تشكيل مستقبل التعليم في القرن الحادي والعشرين. من خلال القدرة على صياغة محتوى مخصص وتحليل احتياجات كل متعلم على حدة، يفتح الذكاء الاصطناعي آفاقاً جديدة لم تكن ممكنة من قبل.</p><h3>تخصيص مسارات التعلم</h3><p>في الفصول الدراسية التقليدية، يُعطى المحتوى التعليمي بنفس الوتيرة والأسلوب لجميع الطلاب بغض النظر عن الفروق الفردية. هنا يأتي دور الذكاء الاصطناعي لإنشاء مسارات تعلم مخصصة تتناسب مع سرعة استيعاب كل طالب ونقاط قوته وضعفه.</p><h3>أتمتة صناعة المحتوى الأكاديمي</h3><p>باستخدام منصات متقدمة مثل NOVAIS، يستطيع المعلمون والباحثون الآن توليد كتب دراسية كاملة، مراجع أكاديمية، ومخططات لمشاريع التخرج في ثوانٍ معدودة، مما يوفر أسابيع من الجهد الإداري والتنسيق اليدوي ويسمح بالتركيز الكامل على التفاعل الإنساني والتوجيه المباشر.</p>',
                'image' => null,
                'meta_title' => 'AI in Education: New Horizons and Challenges',
                'meta_description' => 'A detailed article discussing the impact of generative AI in personalizing education, automating academic content, and the digital future of universities.',
            ],
            [
                'title' => 'How to Write Effective Prompts for Best Educational Results',
                'title_ar' => 'كيفية كتابة موجهات (Prompts) فعالة للحصول على أفضل النتائج التعليمية',
                'slug' => 'how-to-write-effective-prompts',
                'content' => '<p>Prompt Engineering has become an essential skill for anyone looking to maximize the benefit from large AI models. In the educational context, formulating the question correctly determines the quality and depth of the generated textbook or course.</p><h3>1. Define the AI\'s Role (Assign a Role)</h3><p>Always start your prompt by defining the identity you want the model to adopt. For example: "Act as an expert university professor in nuclear physics with 20 years of experience in simplified academic teaching."</p><h3>2. Be Specific with Output and Context</h3><p>Instead of saying "write about the history of Egypt", say "write a structured chapter of 4 sections about the economic history of Egypt in the 19th century, focusing on Muhammad Ali Pasha\'s era and the introduction of modern irrigation systems."</p><h3>3. Specify Target Audience and Difficulty Level</h3><p>Tell the model the target audience: "The content should be suitable for first-year university students, avoiding overly complex terms and explaining basic principles first."</p>',
                'content_ar' => '<p>أصبحت هندسة الموجهات (Prompt Engineering) مهارة أساسية لكل من يريد تعظيم الاستفادة من نماذج الذكاء الاصطناعي الكبيرة. في السياق التعليمي، صياغة السؤال بشكل صحيح تحدد جودة وعمق الكتاب أو المنهج الدراسي المتولد.</p><h3>1. حدد دور الذكاء الاصطناعي (Assign a Role)</h3><p>ابدأ موجهك دائماً بتحديد الهوية التي تريد أن يتقمصها النموذج. على سبيل المثال: "تصرف كأستاذ جامعي خبير في الفيزياء النووية ولديه خبرة 20 عاماً في التدريس الأكاديمي المبسط".</p><h3>2. كن محدداً في المخرجات والسياق</h3><p>بدلاً من قول "اكتب عن تاريخ مصر"، قل "اكتب فصلاً دراسياً منظماً من 4 أقسام حول التاريخ الاقتصادي لمصر في القرن التاسع عشر، مع التركيز على فترة محمد علي باشا وإدخال نظام الري الحديث".</p><h3>3. حدد الفئة المستهدفة ومستوى الصعوبة</h3><p>أخبر النموذج بالجمهور المخاطب: "المحتوى يجب أن يكون مناسباً لطلاب السنة الأولى بالجامعة، مع تجنب المصطلحات شديدة التعقيد وشرح المبادئ الأساسية أولاً".</p>',
                'image' => null,
                'meta_title' => 'How to Write Effective Educational Prompts',
                'meta_description' => 'A practical guide for teachers and students to write precise prompts for academic content engineering and generate optimal textbooks.',
            ],
            [
                'title' => 'NOVAIS Platform: The Next Revolution in Interactive Educational Content',
                'title_ar' => 'منصة نوفايس: الثورة القادمة في صناعة المحتوى التعليمي التفاعلي',
                'slug' => 'novais-platform-next-revolution',
                'content' => '<p>NOVAIS is characterized by a clear vision aimed at breaking down traditional barriers to knowledge production. There is no longer a need to spend long weeks formatting a book, building a question bank, or formulating interactive scenarios.</p><h3>Integration of Interactive Media</h3><p>The platform enables the automatic embedding of relevant instructional videos, images, dynamic media, and presentations inside the written materials, significantly improving learner focus and engagement compared to dry texts.</p><h3>Question Banks and Smart Assessment</h3><p>Through advanced assessment algorithms, the platform generates scenario-based quizzes that test actual understanding, providing instant, personalized feedback that guides learners to the lessons they need to review.</p>',
                'content_ar' => '<p>تتميز منصة NOVAIS برؤية واضحة تهدف إلى كسر الحواجز التقليدية أمام إنتاج المعرفة. لم تعد هناك حاجة لقضاء أيام وأسابيع طويلة لتنسيق كتاب أو إنشاء بنك أسئلة أو صياغة سيناريوهات تفاعلية.</p><h3>تكامل الوسائط التفاعلية</h3><p>تتيح المنصة إمكانية إدراج الفيديوهات والصور والوسائط الديناميكية والشرائح التقديمية تلقائياً في صلب المادة التعليمية المكتوبة، مما يحسن من معدلات التركيز وتفاعل المتعلمين بشكل ملحوظ مقارنة بالنصوص الجافة.</p><h3>بنوك الأسئلة والتقييم الذكي</h3><p>عن طريق خوارزميات التقييم المتقدمة، تولد المنصة اختبارات وسيناريوهات قائمة على حل المشكلات الحقيقية لتقييم الفهم الفعلي وتوفير تغذية راجعة فورية ومخصصة ترشد المتعلم للدروس التي يحتاج لمراجعتها.</p>',
                'image' => null,
                'meta_title' => 'NOVAIS Platform: Next Gen AI Learning Engine',
                'meta_description' => 'Explore the features of the NOVAIS smart engine for generating textbooks, courses, interactive media, and question banks using artificial intelligence.',
            ]
        ];

        foreach ($posts as $post) {
            Blog::updateOrCreate(
                ['slug' => $post['slug']],
                $post
            );
        }
    }
}
