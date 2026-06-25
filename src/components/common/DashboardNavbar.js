import React, { useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { LuHouse, LuLayoutDashboard, LuGlobe, LuSun, LuMoon } from "react-icons/lu";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logo } from '../../constants';

const DashboardNavbar = ({ onOpenSidebar }) => {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const userRole = localStorage.getItem('role') || 'user';

    // Theme Logic
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

    // Language Logic
    const toggleLanguage = () => {
        const currentLang = i18n.language;
        const newLang = currentLang.startsWith('ar') ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
    };

    return (
        <div className="md:hidden flex items-center justify-between px-4 h-14 bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-gray-800 fixed top-0 left-0 right-0 z-30">
            <div className="flex items-center">
                <button
                    onClick={onOpenSidebar}
                    className="p-2 -ml-2 mr-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-colors"
                    aria-label="Open Sidebar"
                >
                    <FiMenu size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1">
                {/* Home */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-colors"
                >
                    <LuHouse size={20} />
                </button>

                {/* Admin (Conditional) */}
                {userRole === 'admin' && (
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-colors"
                    >
                        <LuLayoutDashboard size={20} />
                    </button>
                )}

                {/* Language */}
                <button
                    onClick={toggleLanguage}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-colors"
                >
                    <LuGlobe size={20} />
                </button>

                {/* Theme */}
                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-colors"
                >
                    {isDarkMode ? <LuSun size={20} /> : <LuMoon size={20} />}
                </button>
            </div>
        </div>
    );
};

export default DashboardNavbar;
