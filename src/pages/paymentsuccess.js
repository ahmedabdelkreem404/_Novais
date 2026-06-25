import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LuCircleCheck, LuArrowRight, LuSparkles, LuCopy, LuCheck } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import Confetti from 'react-confetti';

const PaymentSuccess = () => {
    const { i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [searchParams] = useSearchParams();
    const reference = searchParams.get('reference');
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(8);
    const [copied, setCopied] = useState(false);
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        // Auto-redirect after 8 seconds
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/dashboard');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Stop confetti after 5 seconds
        const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);

        return () => {
            clearInterval(timer);
            clearTimeout(confettiTimer);
        };
    }, [navigate]);

    const copyReference = () => {
        if (reference) {
            navigator.clipboard.writeText(reference);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20 flex items-center justify-center p-4 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Confetti */}
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} gravity={0.3} />}

            {/* Animated Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-3xl"
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

                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                        className="flex justify-center mb-8"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-xl opacity-50"
                            />
                            <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl">
                                <LuCircleCheck className="w-14 h-14 text-white" strokeWidth={2.5} />
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
                            {isRtl ? 'تم الدفع بنجاح! 🎉' : 'Payment Successful! 🎉'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            {isRtl ? 'تم تفعيل اشتراكك بنجاح. مرحباً بك في عائلة NOVAIS!' : 'Your subscription has been activated successfully. Welcome to the NOVAIS family!'}
                        </p>
                    </motion.div>

                    {/* Features Unlocked */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6 mb-6 border border-green-200 dark:border-green-800"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <LuSparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <h3 className="font-bold text-gray-900 dark:text-white">
                                {isRtl ? 'تم فتح الميزات التالية:' : 'Features Unlocked:'}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                isRtl ? 'رصيد إضافي للذكاء الاصطناعي' : 'AI Credits Added',
                                isRtl ? 'دورات غير محدودة' : 'Unlimited Courses',
                                isRtl ? 'دعم 23+ لغة' : '23+ Languages Support',
                                isRtl ? 'معلم ذكاء اصطناعي 24/7' : '24/7 AI Assistant'
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                        <LuCheck className="w-3 h-3 text-white" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Transaction Reference */}
                    {reference && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 mb-6 border border-gray-200 dark:border-gray-700"
                        >
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                {isRtl ? 'رقم المعاملة' : 'Transaction Reference'}
                            </p>
                            <div className="flex items-center justify-between gap-3">
                                <code className="text-sm font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-3 py-2 rounded-lg flex-1 overflow-x-auto">
                                    {reference}
                                </code>
                                <button
                                    onClick={copyReference}
                                    className="flex-shrink-0 p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                                    title={isRtl ? 'نسخ' : 'Copy'}
                                >
                                    {copied ? <LuCheck className="w-4 h-4" /> : <LuCopy className="w-4 h-4" />}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Countdown */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-center mb-6"
                    >
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isRtl ? `سيتم التحويل إلى لوحة التحكم خلال` : 'Redirecting to your dashboard in'}{' '}
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-bold text-sm">
                                {countdown}
                            </span>{' '}
                            {isRtl ? 'ثانية...' : 'seconds...'}
                        </p>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col sm:flex-row gap-3"
                    >
                        <Button
                            onClick={() => navigate('/dashboard')}
                            variant="primary"
                            className="flex-1 h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-none shadow-lg hover:shadow-xl transition-all"
                        >
                            {isRtl ? 'انتقل إلى لوحة التحكم' : 'Go to Dashboard'}
                            <LuArrowRight className={`w-4 h-4 ml-2 ${isRtl ? 'rotate-180' : ''}`} />
                        </Button>
                        <Button
                            onClick={() => navigate('/dashboard/generate-course')}
                            variant="secondary"
                            className="flex-1 h-12 text-base font-bold"
                        >
                            <LuSparkles className="w-4 h-4 mr-2" />
                            {isRtl ? 'أنشئ دورة الآن' : 'Create a Course'}
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;
