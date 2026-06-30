import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiLoader, FiCpu, FiFileText, FiImage, FiVideo, FiServer, FiActivity, FiAlertTriangle, FiRefreshCw, FiArrowLeft } from "react-icons/fi";
import axios from 'axios';
import { serverURL, logo } from '../constants';
import { useTranslation, Trans } from 'react-i18next';
import { toast } from 'react-toastify';

const Generating = () => {
    const { t, i18n } = useTranslation();
    const { state } = useLocation();
    const navigate = useNavigate();
    const [statusIndex, setStatusIndex] = useState(0);
    const [logLines, setLogLines] = useState([]);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const isRtl = i18n.language === 'ar';

    const getLocalizedErrorMessage = (msgKey) => {
        const isAr = i18n.language?.startsWith('ar');
        if (msgKey === 'platform.blueprint_disabled') {
            return isAr ? 'هذا المخطط التعليمي معطل مؤقتاً من قبل الإدارة.' : 'This content template is temporarily disabled by the administrator.';
        }
        if (msgKey === 'platform.language_disabled') {
            return isAr ? 'هذه اللغة معطلة في المنصة حالياً.' : 'This language is currently disabled on the platform.';
        }
        if (msgKey === 'platform.language_requires_upgrade') {
            return isAr ? 'توليد المحتوى بهذه اللغة يتطلب ترقية حسابك.' : 'Generating content in this language requires a plan upgrade.';
        }
        if (msgKey === 'platform.course_type_requires_upgrade') {
            return isAr ? 'توليد محتوى الفيديو يتطلب ترقية حسابك.' : 'Generating video content requires a plan upgrade.';
        }
        if (msgKey === 'platform.level_requires_upgrade') {
            return isAr ? 'هذا المستوى الدراسي يتطلب ترقية حسابك.' : 'This academic level requires a plan upgrade.';
        }
        if (msgKey === 'platform.depth_requires_upgrade') {
            return isAr ? 'توليد هذا العدد من الوحدات/الفصول يتطلب ترقية حسابك.' : 'Generating this number of modules/chapters requires a plan upgrade.';
        }
        if (msgKey === 'common.content_policy_violation') {
            return isAr ? 'تم رفض الموضوع لمخالفته سياسة المحتوى الخاصة بالمنصة.' : 'The topic was rejected as it violates the platform content safety policy.';
        }
        return msgKey;
    };

    const steps = [
        { icon: FiCpu, text: t("generating.analyzing"), detail: t("generating.analyzing_detail", { topic: state?.topic || 'Topic' }) },
        { icon: FiFileText, text: t("generating.structuring"), detail: t("generating.structuring_detail") },
        { icon: FiImage, text: t("generating.assets"), detail: t("generating.assets_detail") },
        { icon: FiServer, text: t("generating.finalizing"), detail: t("generating.finalizing_detail") },
    ];

    // Logs simulation
    useEffect(() => {
        if (error) return;
        const logs = [
            t("generating.logs.init"),
            t("generating.logs.nodes"),
            t("generating.logs.target", { topic: state?.topic }),
            t("generating.logs.semantic"),
            t("generating.logs.constraints"),
            t("generating.logs.optimizing"),
            t("generating.logs.drafting"),
            t("generating.logs.validating"),
            t("generating.logs.finalizing")
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < logs.length) {
                setLogLines(prev => [...prev.slice(-3), logs[i]]);
                i++;
            }
        }, 1200);

        return () => clearInterval(interval);
    }, [state?.topic, t, error]);

    // Progress and API Call
    useEffect(() => {
        if (!state?.topic) {
            navigate('/dashboard/generate-course', { replace: true });
            return;
        }

        let progressInterval;
        let stepInterval;

        const runGeneration = async () => {
            setError(null);
            setProgress(0);
            setStatusIndex(0);
            try {
                progressInterval = setInterval(() => {
                    setProgress(prev => {
                        if (prev >= 95) return prev;
                        return prev + (Math.random() * 1.5);
                    });
                }, 300);

                stepInterval = setInterval(() => {
                    setStatusIndex(prev => (prev < steps.length - 1 ? prev + 1 : prev));
                }, 3500);

                const token = localStorage.getItem('token');
                const res = await axios.post(`${serverURL}/generate-course`, {
                    ...state
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json'
                    }
                });

                clearInterval(progressInterval);
                clearInterval(stepInterval);

                if (res.data.success) {
                    setProgress(100);
                    setStatusIndex(steps.length);
                    setTimeout(() => {
                        navigate(`/course-topics`, {
                            replace: true,
                            state: {
                                mainTopic: state.topic,
                                type: state.type,
                                jsonData: res.data.data, // This is the outline data
                                ...state // Pass all original form data too for 'Cancel' back navigation
                            }
                        });
                    }, 1500);
                }
            } catch (err) {
                clearInterval(progressInterval);
                clearInterval(stepInterval);
                console.error("Generation failed:", err);
                const rawErrorMsg = err.response?.data?.message || err.response?.data?.error || "Generation failed";
                setError(getLocalizedErrorMessage(rawErrorMsg));
            }
        };

        runGeneration();

        return () => {
            clearInterval(progressInterval);
            clearInterval(stepInterval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, retryCount]);

    return (
        <div className={`min-h-screen transition-colors duration-500 bg-gray-50 dark:bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Animated Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

                {/* Visual Side */}
                <div className="flex flex-col items-center lg:items-start">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-sm aspect-square flex items-center justify-center mb-8"
                    >
                        {/* Orbiting Elements */}
                        <div className="absolute inset-0 animate-spin-slow">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-blue-500 transform -rotate-12">
                                <FiCpu size={24} />
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-indigo-500 transform rotate-12">
                                <FiFileText size={24} />
                            </div>
                        </div>

                        {/* Central Core */}
                        <div className="relative w-48 h-48 rounded-full bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-center group overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-500 animate-pulse"></div>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-4 border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-full"
                            />
                            <div className="relative z-10 flex flex-col items-center">
                                <img src={logo} alt="Processing" className="w-[50px] h-[50px] object-contain animate-bounce mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                    {t('generating.core_ai')}
                                </span>
                            </div>
                        </div>

                        {/* Secondary Orbit */}
                        <div className="absolute inset-10 animate-spin-reverse-slow">
                            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-teal-500">
                                {state?.type?.includes('Video') ? <FiVideo size={20} /> : <FiImage size={20} />}
                            </div>
                        </div>
                    </motion.div>

                    {/* Console Output */}
                    <div className={`w-full max-w-sm bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl p-4 font-mono text-xs shadow-xl`}>
                        <div className="flex gap-1.5 mb-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                        </div>
                        <div className="space-y-1">
                            {logLines.map((line, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-blue-500 shrink-0 font-bold">~</span>
                                    <span className="text-gray-600 dark:text-gray-400">{line}</span>
                                </div>
                            ))}
                            <div className="flex gap-2 items-center">
                                <span className="text-blue-500 shrink-0 font-bold">~</span>
                                <motion.div
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="w-1.5 h-3 bg-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Side */}
                <div className="flex flex-col">
                    {error ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-[#111827] border border-red-100 dark:border-red-950 p-6 md:p-8 rounded-3xl shadow-xl space-y-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl">
                                    <FiAlertTriangle size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {isRtl ? 'فشل التوليد' : 'Generation Failed'}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isRtl ? 'حدث خطأ أثناء إعداد المحتوى الخاص بك' : 'An error occurred while building your content.'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800 leading-relaxed">
                                {error}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    onClick={() => setRetryCount(prev => prev + 1)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <FiRefreshCw size={16} />
                                    {t('retry')}
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard/generate-course')}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    <FiArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
                                    {t('go_back')}
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <div className={`mb-10 text-center ${isRtl ? 'lg:text-right' : 'lg:text-left'}`}>
                                <motion.h1
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-4xl font-black text-gray-900 dark:text-white mb-4"
                                >
                                    <Trans i18nKey="generating.title">
                                        AI <span className="text-blue-600 dark:text-blue-500">Magic</span> in Progress
                                    </Trans>
                                </motion.h1>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">
                                    {t('generating.subtitle')}
                                    <span className="block mt-1 text-gray-900 dark:text-gray-200 font-bold">"{state?.topic}"</span>
                                </p>
                            </div>

                            <div className="space-y-4 mb-10">
                                {steps.map((s, i) => {
                                    const isCompleted = i < statusIndex;
                                    const isCurrent = i === statusIndex;
                                    const isPending = i > statusIndex;

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-700
                                                ${isCurrent
                                                    ? 'bg-white dark:bg-gray-800/50 border-blue-500 dark:border-blue-500 shadow-lg shadow-blue-500/5'
                                                    : 'border-gray-100 dark:border-gray-800 bg-transparent'}
                                                ${isCompleted ? 'opacity-60' : ''}
                                                ${isPending ? 'opacity-30' : ''}
                                            `}
                                        >
                                            <div className={`p-2.5 rounded-xl transition-colors duration-500
                                                ${isCompleted ? 'bg-green-500 text-white' :
                                                    isCurrent ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' :
                                                        'bg-gray-100 dark:bg-gray-800 text-gray-400'}
                                            `}>
                                                {isCompleted ? <FiCheckCircle size={20} /> :
                                                    isCurrent ? <FiLoader size={20} className="animate-spin" /> :
                                                        <s.icon size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <h3 className={`font-bold text-sm ${isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{s.text}</h3>
                                                    {isCurrent && <span className="text-[10px] font-black tracking-widest text-blue-500 dark:text-blue-400 animate-pulse">
                                                        {t('generating.active')}
                                                    </span>}
                                                </div>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate max-w-[200px]">{s.detail}</p>
                                            </div>
                                            {isCompleted && (
                                                <div className="absolute -right-2 -top-2 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900">
                                                    <FiCheckCircle size={10} />
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Overall Progress Container */}
                            <div className="bg-white dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
                                <div className="flex justify-between items-end mb-4 font-black">
                                    <div>
                                        <span className="text-xs uppercase tracking-widest text-gray-400 mb-1 block">
                                            {t('generating.intensity')}
                                        </span>
                                        <span className="text-2xl text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                            {Math.round(progress)}%
                                        </span>
                                    </div>
                                    <div className="flex gap-1 items-end h-6">
                                        {[...Array(8)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-1 rounded-full bg-blue-500 transition-all duration-300 ${i < Math.floor(progress / 12) ? 'opacity-100' : 'opacity-20'}`}
                                                style={{ height: `${(i + 1) * 12}%`, transitionDelay: `${i * 50}ms` }}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                    <FiActivity className="text-blue-500 animate-pulse" />
                                    <span>{t('generating.system_status')}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Generating;
