<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            'free' => [
                'name' => ['ar' => 'الخطة المجانية', 'en' => 'FREE PLAN'],
                'description' => [
                    'ar' => 'ابدأ رحلتك التعليمية مجاناً مع الأساسيات.',
                    'en' => 'Start your learning journey for free with essentials.'
                ],
                'price' => 0,
                'limit' => 1,
                'features' => [
                    'ar' => ['إنشاء 1 دورة تدريبية', 'توليد 5 مواضيع فرعية', 'دعم الصور والنصوص', 'محادثة ذكية مع NOVAIS'],
                    'en' => ['Create 1 Course', 'Generate 5 Sub-topics', 'Image & Text Support', 'Smart Chat with NOVAIS']
                ]
            ],
            'pro' => [
                'name' => ['ar' => 'الخطة الاحترافية', 'en' => 'PRO PLAN'],
                'description' => [
                    'ar' => 'الخيار الأفضل للمتعلمين الجادين.',
                    'en' => 'The best choice for serious learners.'
                ],
                'price' => 60,
                'limit' => 3,
                'features' => [
                    'ar' => [
                        'إنشاء 3 دورة تدريبية',
                        'توليد 10 مواضيع فرعية',
                        'دعم الفيديو والصور',
                        'محادثة ذكية مع NOVAIS',
                        'دعم أكثر من 23 لغة',
                        'الأولوية في معالجة الذكاء الاصطناعي',
                        'تحميل المحتوى (PDF)',
                        'شهادات إتمام معتمدة',
                        'دعم فني مخصص'
                    ],
                    'en' => [
                        'Create 3 Courses',
                        'Generate 10 Sub-topics',
                        'Video & Image Support',
                        'Smart Chat with NOVAIS',
                        'Support 23+ Languages',
                        'Priority AI Processing',
                        'Download Content (PDF)',
                        'Accredited Certificates',
                        'Dedicated Support'
                    ]
                ]
            ],
            'elite' => [
                'name' => ['ar' => 'خطة النخبة (Elite)', 'en' => 'ELITE PLAN'],
                'description' => [
                    'ar' => 'تجربة تعليمية متكاملة بلا حدود.',
                    'en' => 'A complete learning experience without limits.'
                ],
                'price' => 85,
                'limit' => 5,
                'features' => [
                    'ar' => [
                        'إنشاء 5 دورة تدريبية',
                        'توليد 10 مواضيع فرعية',
                        'دعم الفيديو والصور',
                        'محادثة ذكية مع NOVAIS',
                        'دعم أكثر من 23 لغة',
                        'الأولوية في معالجة الذكاء الاصطناعي',
                        'تحميل المحتوى (PDF)',
                        'شهادات إتمام معتمدة',
                        'دعم فني مخصص'
                    ],
                    'en' => [
                        'Create 5 Courses',
                        'Generate 10 Sub-topics',
                        'Video & Image Support',
                        'Smart Chat with NOVAIS',
                        'Support 23+ Languages',
                        'Priority AI Processing',
                        'Download Content (PDF)',
                        'Accredited Certificates',
                        'Dedicated Support'
                    ]
                ]
            ]
        ];

        foreach ($plans as $slug => $data) {
            Plan::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'price_egp' => $data['price'],
                    'course_limit' => $data['limit'],
                    'features' => $data['features']
                ]
            );
        }
    }
}
