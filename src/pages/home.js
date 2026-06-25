import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserCourses from '../components/usercourses';
import { IoSparkles } from "react-icons/io5";
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { serverURL } from '../constants';

const Home = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [usage, setUsage] = React.useState({ used: 0, limit: 1, remaining: 1 });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/signin');
            return;
        }

        const fetchUsage = async () => {
            try {
                const res = await axios.get(`${serverURL}/auth/user-profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.subscription_usage) {
                    setUsage(res.data.subscription_usage);
                }
            } catch (e) {
                console.error("Failed to fetch usage", e);
            } finally {
            }
        };

        fetchUsage();
    }, [navigate]);

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">

            {/* Header Section */}
            <header className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 mb-8">
                <div className="text-center sm:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-1">
                        {t('home.my_courses')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                        {t('home.subtitle')}
                    </p>
                </div>

                <button
                    onClick={() => navigate('/dashboard/generate-course')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 transform active:scale-95"
                >
                    <IoSparkles size={18} />
                    <span>{t('home.generate_new')}</span>
                </button>
            </header>

            {/* Mobile-Only Usage Stats */}
            <div className="md:hidden mb-8">
                <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-blue-500">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <IoSparkles size={16} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider">{t('common.courses_limit')}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase">
                            {usage.used} / {usage.limit === -1 ? '∞' : usage.limit}
                        </span>
                    </div>

                    {usage.limit !== -1 && (
                        <>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                                />
                            </div>
                            <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                {usage.remaining === 0
                                    ? t('common.insufficient_credits')
                                    : `${t('common.remaining_courses')}: ${usage.remaining}`}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Courses Grid */}
            <UserCourses userId={localStorage.getItem('uid')} />
        </div>
    );
};

export default Home;
