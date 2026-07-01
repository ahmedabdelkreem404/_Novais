<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Terms & Conditions
        Page::updateOrCreate(
            ['slug' => 'terms'],
            [
                'title' => 'Terms and Conditions',
                'title_ar' => 'الشروط والأحكام',
                'content' => '
                    <h2>1. Educational Agreement</h2>
                    <p>Welcome to NOVAIS. By accessing and using this platform, you agree to comply with and be bound by these Terms and Conditions. Our services provide interactive educational content generation, digital project books, and academic synthesis tools powered by artificial intelligence.</p>
                    
                    <h2>2. Intellectual Property & AI Outputs</h2>
                    <p>Users retain ownership of the specific topics and input metadata provided to the platform. The structural layouts, outline templates, software codebases, and generated content formats are protected under local and international intellectual property laws. Generated textbooks, blueprints, and materials are licensed to the creating user for personal, professional, and educational use.</p>
                    
                    <h2>3. Acceptable Use Policy</h2>
                    <p>You agree not to use the platform to generate plagiarized academic content without appropriate citation, or to violate code of conduct rules set by your educational institution. You must not attempt to bypass rate limits, perform security tests, or extract underlying model weights.</p>
                ',
                'content_ar' => '
                    <h2>1. الاتفاقية التعليمية</h2>
                    <p>مرحباً بكم في منصة نوفايس (NOVAIS). باستخدامكم لهذه المنصة، فإنكم توافقون على الالتزام بشروط الخدمة والأحكام الحالية. تقدم خدماتنا توليداً تفاعلياً للمحتوى التعليمي، وكتب مشاريع التخرج الرقمية، وأدوات التوليف الأكاديمي المدعومة بالذكاء الاصطناعي.</p>
                    
                    <h2>2. الملكية الفكرية ومخرجات الذكاء الاصطناعي</h2>
                    <p>يحتفظ المستخدم بملكية المواضيع والبيانات المدخلة في المنصة. إن الهياكل التنظيمية، قوالب المخططات، والتعليمات البرمجية للمنصة محمية بقوانين الملكية الفكرية المحلية والدولية. تُرخص المواد والكتب المولدة للمستخدم لأغراض الاستخدام الشخصي، والمهني، والأكاديمي.</p>
                    
                    <h2>3. سياسة الاستخدام المقبول</h2>
                    <p>يلتزم المستخدم بعدم استخدام المنصة لتوليد محتوى منتحل دون الإشارة المناسبة للمصادر أو انتهاك مواثيق الشرف الأكاديمي للمؤسسات التعليمية. يُحظر تماماً محاولة تخطي حدود الاستخدام أو إجراء اختبارات أمنية على خوادم المنصة.</p>
                '
            ]
        );

        // 2. Privacy Policy
        Page::updateOrCreate(
            ['slug' => 'privacy'],
            [
                'title' => 'Privacy Policy',
                'title_ar' => 'سياسة الخصوصية',
                'content' => '
                    <h2>1. Information We Collect</h2>
                    <p>We collect information necessary to deliver and improve our AI-assisted educational services, including account details (name, email), academic metadata input, device fingerprint identifiers (for session security and multi-device limit compliance), and payment transactions.</p>
                    
                    <h2>2. Data Processing and Storage</h2>
                    <p>Input topics and parameters are processed through secure APIs to generate learning roadmaps. We do not sell or lease your input data to third parties. Device tracking data is exclusively utilized to enforce license compliance and prevent unauthorized credential sharing.</p>
                    
                    <h2>3. Cookies and Local Storage</h2>
                    <p>We use session cookies and local storage tokens to maintain user authentication status, selected language, and user interface customization parameters (such as theme mode and chatbot coordinates).</p>
                ',
                'content_ar' => '
                    <h2>1. البيانات التي نجمعها</h2>
                    <p>نقوم بجمع المعلومات اللازمة لتقديم وتحسين خدماتنا التعليمية، ويشمل ذلك بيانات الحساب (الاسم، البريد الإلكتروني)، البيانات الأكاديمية المدخلة، معرفات الأجهزة (لضمان أمن الجلسات والالتزام بالحد الأقصى للأجهزة المتزامنة)، ومعاملات الدفع.</p>
                    
                    <h2>2. معالجة وتخزين البيانات</h2>
                    <p>تتم معالجة المواضيع المدخلة عبر واجهات برمجية آمنة لتوليد المخططات التعليمية. نحن لا نقوم ببيع أو مشاركة بياناتك مع أطراف ثالثة. تُستخدم بيانات معرفات الأجهزة حصرياً لمنع مشاركة الحسابات بطرق غير قانونية.</p>
                    
                    <h2>3. ملفات تعريف الارتباط والتخزين المحلي</h2>
                    <p>نستخدم التخزين المحلي وملفات تعريف الارتباط للاحتفاظ بحالة تسجيل الدخول، اللغة المفضلة، وإعدادات واجهة المستخدم (مثل المظهر المظلم وإحداثيات البوت الذكي).</p>
                '
            ]
        );

        // 3. Cancellation Policy
        Page::updateOrCreate(
            ['slug' => 'cancellation'],
            [
                'title' => 'Cancellation Policy',
                'title_ar' => 'سياسة الإلغاء',
                'content' => '
                    <h2>1. Subscription Cancellation</h2>
                    <p>Subscribers can cancel their educational plans at any time directly through the billing interface in their user profile dashboard. Upon cancellation, your premium benefits will remain active until the end of the current paid billing cycle.</p>
                    
                    <h2>2. System Automatic Termination</h2>
                    <p>If payment fails during the renewal date, the system will attempt retry transactions. If payment remains outstanding, your account will be downgraded to the free tier limits automatically.</p>
                ',
                'content_ar' => '
                    <h2>1. إلغاء الاشتراك</h2>
                    <p>يمكن للمشتركين إلغاء خططهم التعليمية في أي وقت مباشرة عبر واجهة الفوترة في الصفحة الشخصية بلوحة التحكم. عند الإلغاء، تظل الميزات المفعّلة نشطة حتى نهاية دورة الفوترة المدفوعة الحالية.</p>
                    
                    <h2>2. الإلغاء التلقائي للميزات</h2>
                    <p>في حالة فشل عملية الدفع التلقائي لتجديد الاشتراك، سيقوم النظام بمحاولة الخصم مرة أخرى. إذا استمر تعذر الدفع، فسيتم خفض رتبة الحساب إلى الخطة المجانية تلقائياً.</p>
                '
            ]
        );

        // 4. Refund Policy
        Page::updateOrCreate(
            ['slug' => 'refund'],
            [
                'title' => 'Refund Policy',
                'title_ar' => 'سياسة الاسترجاع',
                'content' => '
                    <h2>1. Eligibility for Refunds</h2>
                    <p>We offer a 14-day refund window for standard subscriptions if the educational content generation quota has not been utilized (i.e. zero books or courses generated). Refunds will not be issued once resource generation credit is consumed.</p>
                    
                    <h2>2. Refund Process</h2>
                    <p>To request a refund, please contact support with details of your payment. Refunds are processed back to the original payment method (Paymob, card, or e-wallet) within 7 to 14 business days, subject to payment provider transaction fees.</p>
                ',
                'content_ar' => '
                    <h2>1. أهلية استرداد الأموال</h2>
                    <p>نقدم نافذة استرجاع مدتها 14 يوماً للاشتراكات القياسية بشرط عدم استهلاك حصة توليد المحتوى (أي عدم إنشاء أي كتب أو مساقات). لا يمكن استرجاع المبالغ بمجرد البدء في توليد الموارد التعليمية.</p>
                    
                    <h2>2. آلية الاسترجاع</h2>
                    <p>لطلب استرداد الأموال، يرجى التواصل مع الدعم الفني وتوضيح تفاصيل الدفع. يتم إرجاع المبالغ المستردة إلى طريقة الدفع الأصلية (Paymob، بطاقة ائتمان، أو محفظة إلكترونية) خلال 7 إلى 14 يوم عمل.</p>
                '
            ]
        );

        // 5. Billing Policy
        Page::updateOrCreate(
            ['slug' => 'billing'],
            [
                'title' => 'Billing Policy',
                'title_ar' => 'سياسة الفوترة',
                'content' => '
                    <h2>1. Payment Options</h2>
                    <p>We accept local and international payment options through Paymob, credit/debit cards, e-wallets, Instapay, and offline cash deposits. All transactions are billed in Egyptian Pounds (EGP) or equivalent foreign currencies.</p>
                    
                    <h2>2. Recurring Charges</h2>
                    <p>Subscription fees are billed automatically on the anniversary date of plan activation. Users receive billing invoices and receipts directly to their registered email addresses upon successful payment.</p>
                ',
                'content_ar' => '
                    <h2>1. وسائل الدفع المتاحة</h2>
                    <p>نقبل خيارات الدفع المحلية والدولية عبر بوابة Paymob، البطاقات الائتمانية، المحافظ الإلكترونية، تطبيق Instapay، والإيداع النقدي. تتم فوترة جميع المعاملات بالجنيه المصري (EGP).</p>
                    
                    <h2>2. الدفع المتكرر والفواتير</h2>
                    <p>يتم خصم رسوم الاشتراك تلقائياً في تاريخ تفعيل الخطة. يتلقى المستخدمون الفواتير وإيصالات الدفع مباشرة على بريدهم الإلكتروني المسجل بعد كل عملية دفع ناجحة.</p>
                '
            ]
        );
    }
}
