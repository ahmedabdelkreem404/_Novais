import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuCheck, LuCrown, LuZap, LuRocket, LuFlame, LuArrowRight } from "react-icons/lu";
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { serverURL } from '../constants';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';

const Pricing = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [userPlan, setUserPlan] = useState('free');
    const isRtl = i18n.language === 'ar';
    const [billingCycle, setBillingCycle] = useState('monthly');

    const [plansData, setPlansData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${serverURL}/plans`);
                setPlansData(res.data);
            } catch (err) {
                console.error("Failed to fetch plans", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const getDBPlan = (slug) => plansData.find(p => p.slug === slug) || {};
    const lang = i18n.language.startsWith('ar') ? 'ar' : 'en';

    const getPlanField = (plan, field, fallback) => {
        if (!plan[field]) return fallback;
        if (typeof plan[field] === 'string') return plan[field];
        return plan[field][lang] || plan[field]['ar'] || fallback;
    };

    const plans = [
        {
            id: 'free',
            name: getPlanField(getDBPlan('free'), 'name', t('pricing.free_plan')),
            desc: getPlanField(getDBPlan('free'), 'description', t('pricing.get_started_desc')),
            price: 0,
            icon: LuZap,
            color: 'blue',
            features: (getDBPlan('free').features?.[lang] || getDBPlan('free').features?.['ar'])
                ? (getDBPlan('free').features[lang] || getDBPlan('free').features['ar']).map(f => {
                    const limitText = getDBPlan('free').course_limit || 1;
                    return f.replace('{{limit}}', limitText)
                        .replace(/(Create\s+)\d+(\s+Courses?)/i, `$1${limitText}$2`)
                        .replace(/(إنشاء\s+)\d+(\s+دورة)/i, `$1${limitText}$2`);
                })
                : [
                    `${getDBPlan('free').course_limit || 1} ${t('common.course')}`,
                    t('pricing.features.subtopics_5'),
                    t('pricing.features.credits_500'),
                    t('pricing.features.theory_image'),
                    t('pricing.features.ai_chat'),
                    t('pricing.features.lifetime')
                ]
        },
        {
            id: 'pro',
            name: getPlanField(getDBPlan('pro'), 'name', t('pricing.pro_plan')),
            desc: getPlanField(getDBPlan('pro'), 'description', t('pricing.pro_desc')),
            price: billingCycle === 'monthly'
                ? (getDBPlan('pro').price_egp || 0)
                : (getDBPlan('pro').price_egp * 10 || 0),
            oldPrice: billingCycle === 'monthly'
                ? (getDBPlan('pro').price_egp ? Math.round(getDBPlan('pro').price_egp * 1.4) : 0)
                : (getDBPlan('pro').price_egp ? Math.round(getDBPlan('pro').price_egp * 10 * 1.4) : 0),
            icon: LuRocket,
            color: 'indigo',
            popular: true,
            features: (getDBPlan('pro').features?.[lang] || getDBPlan('pro').features?.['ar'])
                ? (getDBPlan('pro').features[lang] || getDBPlan('pro').features['ar']).map(f => {
                    const limit = billingCycle === 'monthly' ? (getDBPlan('pro').course_limit || 3) : (getDBPlan('pro').course_limit || 3) * 12;
                    const limitText = getDBPlan('pro').course_limit === -1 ? t('pricing.features.unlimited') : limit;

                    // Replace {{limit}} or legacy "Create X Courses" pattern
                    return f.replace('{{limit}}', limitText)
                        .replace(/(Create\s+)\d+(\s+Courses?)/i, `$1${limitText}$2`)
                        .replace(/(إنشاء\s+)\d+(\s+دورة)/i, `$1${limitText}$2`);
                })
                : []
        },
        {
            id: 'elite',
            name: getPlanField(getDBPlan('elite'), 'name', t('pricing.elite_plan')),
            desc: getPlanField(getDBPlan('elite'), 'description', t('pricing.elite_desc')),
            price: billingCycle === 'monthly'
                ? (getDBPlan('elite').price_egp || 0)
                : (getDBPlan('elite').price_egp * 10 || 0),
            oldPrice: billingCycle === 'monthly'
                ? (getDBPlan('elite').price_egp ? Math.round(getDBPlan('elite').price_egp * 1.5) : 0)
                : (getDBPlan('elite').price_egp ? Math.round(getDBPlan('elite').price_egp * 10 * 1.5) : 0),
            icon: LuFlame,
            color: 'amber',
            features: (getDBPlan('elite').features?.[lang] || getDBPlan('elite').features?.['ar'])
                ? (getDBPlan('elite').features[lang] || getDBPlan('elite').features['ar']).map(f => {
                    const limit = billingCycle === 'monthly' ? (getDBPlan('elite').course_limit || 10) : (getDBPlan('elite').course_limit || 10) * 12;
                    const limitText = getDBPlan('elite').course_limit === -1 ? t('pricing.features.unlimited') : limit;

                    // Replace {{limit}} or legacy "Create X Courses" pattern
                    return f.replace('{{limit}}', limitText)
                        .replace(/(Create\s+)\d+(\s+Courses?)/i, `$1${limitText}$2`)
                        .replace(/(إنشاء\s+)\d+(\s+دورة)/i, `$1${limitText}$2`);
                })
                : []
        }
    ];

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(`${serverURL}/auth/user-profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data) {
                    const user = res.data.user || res.data;
                    setUserPlan(String(user.sub_status || 'free').toLowerCase());
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPlan();
    }, []);

    const isCurrentPlan = (id) => userPlan.includes(id);

    const location = require('react-router-dom').useLocation();
    const isDashboard = location.pathname.includes('/dashboard');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#020617]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-400 animate-pulse">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`pricing-page ${isDashboard ? 'h-full' : 'min-h-screen'} relative py-8 md:py-12 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-[#020617] dark:to-[#0f172a] transition-colors duration-500 overflow-hidden ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Animated background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-500/30 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        x: [0, -40, 0],
                        y: [0, 60, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/30 rounded-full blur-[120px]"
                />
            </div>

            <div className={`max-w-7xl mx-auto relative z-10 ${isDashboard ? 'pb-20' : ''}`}>
                {/* Header */}
                <div className="text-center mb-10 md:mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-bold mb-4 sm:mb-6"
                    >
                        <LuCrown className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{t('pricing.flexible_plans')}</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent leading-tight px-2"
                    >
                        {t('pricing.title')}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 dark:text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-12 px-4"
                    >
                        {t('pricing.subtitle')}
                    </motion.p>

                    {/* Toggle */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-2 sm:gap-4 bg-white dark:bg-slate-900/50 p-1.5 sm:p-2 rounded-2xl w-fit mx-auto border border-gray-100 dark:border-white/5 shadow-xl"
                    >
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            {t('pricing.monthly')}
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            {t('pricing.yearly')}
                            <span className="bg-green-500/20 text-green-500 text-[10px] px-1.5 py-0.5 rounded-full border border-green-500/20">{t('common.save_30')}</span>
                        </button>
                    </motion.div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            className="h-full"
                        >
                            <div className={`relative h-full flex flex-col p-6 md:p-8 rounded-3xl transition-all duration-300 ${plan.popular ? 'bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-2xl scale-100 lg:scale-105 z-10' : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 hover:border-blue-500/50 shadow-lg group'}`}>
                                {plan.popular && (
                                    <div className="absolute -top-4 inset-x-0 flex justify-center">
                                        <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                                            {t('pricing.popular')}
                                        </span>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${plan.popular ? 'bg-white/20' : 'bg-blue-500/10 text-blue-500'}`}>
                                        <plan.icon size={24} />
                                    </div>
                                    <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                                    <p className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-500'}`}>{plan.desc}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-2">
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={plan.price}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`text-5xl font-black ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                                            >
                                                {plan.price}
                                            </motion.span>
                                        </AnimatePresence>
                                        <div className="flex flex-col">
                                            {plan.oldPrice && (
                                                <span className="text-sm line-through opacity-50 font-bold">{plan.oldPrice} {t('common.egp')}</span>
                                            )}
                                            <span className={`text-sm font-bold ${plan.popular ? 'text-blue-100' : 'text-gray-500'}`}>{t('common.egp')} / {billingCycle === 'monthly' ? t('pricing.monthly').toLowerCase() : t('pricing.yearly').toLowerCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.features.map((feat, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${plan.popular ? 'bg-white/20 text-white' : 'bg-green-500/10 text-green-500'}`}>
                                                <LuCheck size={12} className="stroke-[3]" />
                                            </div>
                                            <span className={`text-sm font-medium ${plan.popular ? 'text-blue-50' : 'text-gray-600 dark:text-gray-300'}`}>{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => {
                                        if (plan.id === 'free') return;
                                        navigate('/payment', { state: { plan_id: plan.id + '_' + billingCycle, amount: plan.price } });
                                    }}
                                    variant="primary"
                                    className={`w-full py-3.5 sm:py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm sm:text-base transition-all duration-300 group ${plan.popular
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-2xl border-none shadow-xl transform hover:scale-[1.02]'
                                        : plan.id === 'free'
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 cursor-default'
                                            : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-none shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                                        }`}
                                    disabled={isCurrentPlan(plan.id) || plan.id === 'free'}
                                >
                                    {isCurrentPlan(plan.id) ? t('pricing.current_plan') : plan.id === 'free' ? t('pricing.start_free') : t('pricing.subscribe_now')}
                                    {!isCurrentPlan(plan.id) && plan.id !== 'free' && <LuArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />}
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ / Trust */}
                <div className="max-w-4xl mx-auto text-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left bg-gray-50 dark:bg-slate-900/40 p-10 rounded-3xl border border-gray-100 dark:border-white/5">
                        <div className="space-y-3">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t('pricing.faq_1_q')}</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{t('pricing.faq_1_a')}</p>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t('pricing.faq_2_q')}</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{t('pricing.faq_2_a')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
