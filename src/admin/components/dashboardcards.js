import React from 'react';
import { LuUsers, LuDollarSign, LuRepeat, LuPlay } from "react-icons/lu";
import DonutChart from 'react-donut-chart';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const DashboardCards = ({ datas }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    const formatTrend = (trend) => {
        const num = Number(trend) || 0;
        return num > 0 ? `+${num}%` : `${num}%`;
    };

    const cards = [
        {
            title: t('admin.dashboard.users'),
            value: datas.users,
            icon: LuUsers,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            trend: formatTrend(datas.users_trend),
            rawTrend: datas.users_trend,
            gradient: 'from-blue-600 via-blue-500 to-cyan-400',
            shadow: 'shadow-blue-500/20'
        },
        {
            title: t('admin.dashboard.courses'),
            value: datas.courses,
            icon: LuPlay,
            color: 'text-fuchsia-500',
            bg: 'bg-fuchsia-500/10',
            trend: formatTrend(datas.courses_trend),
            rawTrend: datas.courses_trend,
            gradient: 'from-fuchsia-600 via-purple-500 to-pink-500',
            shadow: 'shadow-fuchsia-500/20'
        },
        {
            title: t('admin.dashboard.monthly_revenue'),
            value: `${datas.sum} ${t('common.egp')}`,
            icon: LuRepeat,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            trend: formatTrend(datas.monthly_trend),
            rawTrend: datas.monthly_trend,
            gradient: 'from-emerald-600 via-teal-500 to-cyan-400',
            shadow: 'shadow-emerald-500/20'
        },
        {
            title: t('admin.dashboard.total_revenue'),
            value: `${datas.total} ${t('common.egp')}`,
            icon: LuDollarSign,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            trend: formatTrend(datas.total_trend),
            rawTrend: datas.total_trend,
            gradient: 'from-orange-600 via-amber-500 to-yellow-400',
            shadow: 'shadow-amber-500/20'
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        show: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <div className="space-y-12 pb-10" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Stats Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {cards.map((card, idx) => (
                    <motion.div key={idx} variants={cardVariants}>
                        <div className={`relative group p-0.5 rounded-[2rem] overflow-hidden bg-gradient-to-br ${card.gradient} opacity-90 hover:opacity-100 transition-all duration-500 ${card.shadow} hover:shadow-2xl`}>
                            <div className="bg-white dark:bg-[#0a0a0b] rounded-[1.9rem] p-6 h-full relative z-10 overflow-hidden">
                                {/* Decorator circles */}
                                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-2xl transition-all duration-700 group-hover:scale-150`} />

                                <div className="flex flex-col h-full relative z-20">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-lg ${card.shadow}`}>
                                            <card.icon size={22} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                            <span className="text-[10px] font-black">{card.trend}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">{card.title}</p>
                                        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums flex items-baseline gap-1">
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                            >
                                                {card.value}
                                            </motion.span>
                                        </h3>
                                        <div className="mt-4 flex items-center gap-2">
                                            <div className="flex-1 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(Math.max(Number(card.rawTrend) || 0, 0), 100)}%` }}
                                                    // Logic above is too complex for inline, let's simplify by passing raw trend to card object
                                                    transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                                                    className={`h-full bg-gradient-to-r ${card.gradient} rounded-full`}
                                                />
                                            </div>
                                            <span className="text-[9px] font-black text-gray-400 uppercase">{t('admin.dashboard.stats.vs_last_month')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Main Visual Data Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* User Distribution */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative group h-full"
                >
                    <div className="absolute inset-0 bg-blue-500/5 rounded-[2.5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="bg-white dark:bg-[#0a0a0b] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-10 shadow-2xl shadow-black/5 relative z-10 h-full overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="flex justify-between items-center mb-10 relative z-20">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('admin.dashboard.user_base')}</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 opacity-60">{t('admin.dashboard.charts.dist_analysis')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{t('admin.dashboard.real_time')}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center relative z-20 group/chart">
                            {(Number(datas.paid) + Number(datas.free)) > 0 ? (
                                <>
                                    <div className="relative p-6">
                                        <div className="absolute inset-0 bg-blue-500/[0.03] rounded-full blur-2xl group-hover/chart:scale-110 transition-transform duration-1000" />
                                        <DonutChart
                                            width={320}
                                            height={320}
                                            interactive={true}
                                            colors={['#3b82f6', '#1e293b']}
                                            strokeColor='transparent'
                                            innerRadius={0.8}
                                            data={[
                                                { label: t('admin.dashboard.paid'), value: Number(datas.paid) || 0 },
                                                { label: t('admin.dashboard.free'), value: Number(datas.free) || 0 },
                                            ]}
                                            legend={false}
                                        />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                            <p className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums leading-none">
                                                {(Number(datas.paid) + Number(datas.free))}
                                            </p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2 block opacity-60">{t('admin.dashboard.stats.total_users')}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mt-16 w-full max-w-sm">
                                        <div className="p-5 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.4)]" />
                                                <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{datas.paid || 0}</span>
                                            </div>
                                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none block">{t('admin.dashboard.paid_users')}</p>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-3 h-3 bg-slate-800 dark:bg-slate-400 rounded-full opacity-40" />
                                                <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{datas.free || 0}</span>
                                            </div>
                                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none block">{t('admin.dashboard.free_users')}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-6 py-20 text-gray-400/30">
                                    <LuUsers size={80} strokeWidth={1} />
                                    <div className="text-xs font-black uppercase tracking-[0.3em]">{t('admin.dashboard.charts.no_data')}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Content Library Stats */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="relative group h-full"
                >
                    <div className="absolute inset-0 bg-purple-500/5 rounded-[2.5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="bg-white dark:bg-[#0a0a0b] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-10 shadow-2xl shadow-black/5 relative z-10 h-full overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="flex justify-between items-center mb-10 relative z-20">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('admin.dashboard.content_library')}</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 opacity-60">{t('admin.dashboard.charts.catalog_stats')}</p>
                            </div>
                            <span className="text-[10px] font-black text-purple-500 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full uppercase tracking-tighter">{t('admin.dashboard.updated')}</span>
                        </div>

                        <div className="flex flex-col items-center justify-center relative z-20 group/chart">
                            {(Number(datas.textType) + Number(datas.videoType)) > 0 ? (
                                <>
                                    <div className="relative p-6">
                                        <div className="absolute inset-0 bg-purple-500/[0.03] rounded-full blur-2xl group-hover/chart:scale-110 transition-transform duration-1000" />
                                        <DonutChart
                                            width={320}
                                            height={320}
                                            interactive={true}
                                            colors={['#a855f7', '#1e293b']}
                                            strokeColor='transparent'
                                            innerRadius={0.8}
                                            data={[
                                                { label: t('admin.course_types.text'), value: Number(datas.textType) || 0 },
                                                { label: t('admin.course_types.video'), value: Number(datas.videoType) || 0 },
                                            ]}
                                            legend={false}
                                        />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                            <p className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums leading-none">
                                                {(Number(datas.textType) + Number(datas.videoType))}
                                            </p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2 block opacity-60">{t('admin.dashboard.stats.total_courses')}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mt-16 w-full max-w-sm">
                                        <div className="p-5 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.4)]" />
                                                <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{datas.textType || 0}</span>
                                            </div>
                                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none block text-nowrap">{t('admin.dashboard.text_audio')}</p>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-3 h-3 bg-slate-800 dark:bg-slate-400 rounded-full opacity-40" />
                                                <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{datas.videoType || 0}</span>
                                            </div>
                                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none block text-nowrap">{t('admin.dashboard.video_courses')}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-6 py-20 text-gray-400/30">
                                    <LuPlay size={80} strokeWidth={1} />
                                    <div className="text-xs font-black uppercase tracking-[0.3em]">{t('admin.dashboard.charts.no_data')}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DashboardCards;
