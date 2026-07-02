import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LuHouse,
    LuHeadphones,
    LuUser,
    LuDollarSign,
    LuLogOut,
    LuSun,
    LuMoon,
    LuDownload,
    LuLayoutDashboard,
    LuGlobe,
    LuZap
} from "react-icons/lu";
import axios from 'axios';
import { serverURL, logo } from '../../constants';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isOpen, onClose }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [usage, setUsage] = useState({ used: 0, limit: 1, remaining: 1 });

    const [userRole, setUserRole] = useState(() => localStorage.getItem('role') || 'user');
    const links = [
        { path: '/dashboard', label: t('nav.home'), icon: LuHouse },
        { path: '/dashboard/audio-courses', label: t('nav.audio_courses'), icon: LuHeadphones },
        { path: '/dashboard/profile', label: t('nav.profile'), icon: LuUser },
        { path: '/dashboard/pricing', label: t('nav.pricing'), icon: LuDollarSign },
    ];

    if (userRole === 'admin') {
        links.push({ path: '/admin', label: t('nav.admin_panel'), icon: LuLayoutDashboard, hiddenOnMobile: true });
    }

    const handleLogout = () => {
        localStorage.clear();
        localStorage.clear();
        navigate('/');
    };

    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(`${serverURL}/auth/user-profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Assuming user-profile or a new endpoint returns subscription usage
                if (res.data.subscription_usage) {
                    setUsage(res.data.subscription_usage);
                } else if (res.data.user) {
                    setUsage({
                        used: res.data.user.used_courses || 0,
                        limit: res.data.user.plan_limit || 1,
                        remaining: (res.data.user.plan_limit || 1) - (res.data.user.used_courses || 0)
                    });
                }

                // Sync Role
                const profileUser = res.data.user || res.data;
                if (profileUser.role && profileUser.role !== userRole) {
                    setUserRole(profileUser.role);
                    localStorage.setItem('role', profileUser.role);
                }
            } catch (e) {
                console.error("Failed to fetch usage", e);
            }
        };
        fetchCredits();
        // Refresh every minute to keep it updated
        const interval = setInterval(fetchCredits, 60000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleLanguage = () => {
        const currentLang = i18n.language;
        const newLang = currentLang.startsWith('ar') ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
    };

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const stored = localStorage.getItem('darkMode');
        return stored === null ? true : stored === 'true';
    });

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('darkMode', newMode);
        document.documentElement.classList.toggle('dark', newMode);
    };

    const isRtl = i18n.language.startsWith('ar');

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <aside className={`
                flex flex-col w-[255px] h-screen fixed top-0 z-40 
                bg-white dark:bg-[#0f0f0f] transition-transform duration-300 
                ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} 
                border-gray-100 dark:border-gray-800
                ${isOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')}
                md:translate-x-0
            `}>

                {/* Logo */}
                <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-semibold text-base text-gray-900 dark:text-white">
                            NOVAIS
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            end={link.path === '/dashboard'}
                            onClick={() => onClose && onClose()}
                            className={({ isActive }) => `
                                ${link.path === '/dashboard' ? 'hidden md:flex' : 'flex'}
                                ${link.hiddenOnMobile ? 'hidden md:flex' : ''}
                                items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-[13px] font-medium
                                ${isActive
                                    ? 'bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}
                            `}
                        >
                            <link.icon size={16} />
                            <span>{link.label}</span>
                        </NavLink>
                    ))}

                    {/* Generate Course Button */}
                    <button
                        onClick={() => {
                            navigate('/dashboard/generate-course');
                            onClose && onClose();
                        }}
                        className="w-full flex items-center justify-center gap-2 mt-3 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium text-[13px] transition-colors"
                    >
                        <img src={logo} alt="Generate" className="w-4 h-4 object-contain" />
                        <span>{t('common.generate_course')}</span>
                    </button>

                    {/* Subscription Usage Display */}
                    <div className="mt-4 px-3 py-3 border border-blue-500/20 bg-blue-500/5 rounded-md">
                        <div className="flex items-center gap-2 mb-1.5 text-blue-500">
                            <LuZap size={14} />
                            <span className="text-[11px] font-black uppercase tracking-wider">{t('common.courses_limit')}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-gray-900 dark:text-white leading-none" dir="ltr">
                                {usage.used}
                                <span className="text-gray-400 font-normal mx-0.5">/</span>
                                {usage.limit === -1 ? '∞' : usage.limit}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none">
                                {t('common.course')}
                            </span>
                        </div>
                        {usage.limit !== -1 && (
                            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                </nav>

                {/* Bottom Actions */}
                <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-800 space-y-0.5">
                    <button
                        onClick={() => navigate('/dashboard/download')}
                        className="hidden md:flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-[13px] font-medium"
                    >
                        <LuDownload size={16} />
                        <span>{t('common.desktop_app')}</span>
                    </button>

                    <button
                        onClick={toggleLanguage}
                        className="hidden md:flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-[13px] font-medium"
                    >
                        <LuGlobe size={16} />
                        <span>{i18n.language.startsWith('ar') ? 'English' : 'العربية'}</span>
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="hidden md:flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-[13px] font-medium"
                    >
                        {isDarkMode ? <LuSun size={16} /> : <LuMoon size={16} />}
                        <span>{t('common.toggle_theme')}</span>
                    </button>


                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-[13px] font-medium"
                    >
                        <LuLogOut size={16} />
                        <span>{t('common.logout')}</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
