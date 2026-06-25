import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LuCircleX, LuRefreshCw, LuMessageCircle, LuTriangleAlert, LuArrowLeft } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';

const PaymentFailed = () => {
    const { i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [searchParams] = useSearchParams();
    const reference = searchParams.get('reference');
    const navigate = useNavigate();

    const commonIssues = [
        {
            icon: '💳',
            title: isRtl ? 'رصيد غير كافٍ' : 'Insufficient Funds',
            desc: isRtl ? 'تأكد من وجود رصيد كافٍ في بطاقتك' : 'Ensure your card has sufficient balance'
        },
        {
            icon: '🔒',
            title: isRtl ? 'بطاقة محظورة' : 'Card Blocked',
            desc: isRtl ? 'تواصل مع البنك لإلغاء الحظر' : 'Contact your bank to unblock'
        },
        {
            icon: '📝',
            title: isRtl ? 'بيانات خاطئة' : 'Incorrect Details',
            desc: isRtl ? 'تحقق من صحة بيانات البطاقة' : 'Verify your card information'
        },
        {
            icon: '🌐',
            title: isRtl ? 'مشكلة في الاتصال' : 'Connection Issue',
            desc: isRtl ? 'تحقق من اتصالك بالإنترنت' : 'Check your internet connection'
        }
    ];

    return (
        <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Animated Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-red-400 to-orange-500 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full blur-3xl"
                />
            </div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 max-w-2xl w-full"
            >
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 dark:border-gray-800">

                    {/* Error Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                        className="flex justify-center mb-8"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-500 rounded-full blur-xl"
                            />
                            <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl">
                                <LuCircleX className="w-14 h-14 text-white" strokeWidth={2.5} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center mb-6"
                    >
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3">
                            {isRtl ? 'فشلت عملية الدفع' : 'Payment Failed'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            {isRtl ? 'للأسف، لم نتمكن من معالجة دفعتك. يرجى المحاولة مرة أخرى.' : 'Unfortunately, we couldn\'t process your payment. Please try again.'}
                        </p>
                    </motion.div>

                    {/* Transaction Reference */}
                    {reference && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 mb-6 border border-red-200 dark:border-red-800"
                        >
                            <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
                                {isRtl ? 'رقم المرجع' : 'Reference Number'}
                            </p>
                            <code className="text-sm font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-3 py-2 rounded-lg block overflow-x-auto">
                                {reference}
                            </code>
                        </motion.div>
                    )}

                    {/* Common Issues */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl p-6 mb-6 border border-orange-200 dark:border-orange-800"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <LuTriangleAlert className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            <h3 className="font-bold text-gray-900 dark:text-white">
                                {isRtl ? 'الأسباب الشائعة:' : 'Common Issues:'}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {commonIssues.map((issue, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 + i * 0.1 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl flex-shrink-0">{issue.icon}</span>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                                                {issue.title}
                                            </h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {issue.desc}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="space-y-3"
                    >
                        <Button
                            onClick={() => navigate('/pricing')}
                            variant="primary"
                            className="w-full h-12 text-base font-bold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 border-none shadow-lg hover:shadow-xl transition-all"
                        >
                            <LuRefreshCw className="w-4 h-4 mr-2" />
                            {isRtl ? 'حاول مرة أخرى' : 'Try Again'}
                        </Button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button
                                onClick={() => navigate('/contact')}
                                variant="secondary"
                                className="h-12 text-base font-bold"
                            >
                                <LuMessageCircle className="w-4 h-4 mr-2" />
                                {isRtl ? 'تواصل مع الدعم' : 'Contact Support'}
                            </Button>
                            <Button
                                onClick={() => navigate('/')}
                                variant="secondary"
                                className="h-12 text-base font-bold"
                            >
                                <LuArrowLeft className={`w-4 h-4 mr-2 ${isRtl ? 'rotate-180' : ''}`} />
                                {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
                            </Button>
                        </div>
                    </motion.div>

                    {/* Help Text */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-6 text-center"
                    >
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isRtl ? 'إذا استمرت المشكلة، يرجى التواصل مع فريق الدعم للمساعدة.' : 'If the problem persists, please contact our support team for assistance.'}
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentFailed;
