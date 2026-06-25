import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LuHouse, LuTriangleAlert } from "react-icons/lu";
import Header from '../components/header';
import Footers from '../components/footers';
import { logo } from '../constants';

const Error = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#020617] transition-colors duration-300">
            <Header isHome={false} disableFixed={true} />

            <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12 lg:py-16 relative overflow-hidden">
                {/* Background Blobs - Responsive sizing */}
                <div className="absolute top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-600/5 blur-[80px] md:blur-[120px] rounded-full animate-pulse pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-600/5 blur-[80px] md:blur-[120px] rounded-full animate-pulse pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md w-full bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 text-center shadow-2xl relative z-10"
                >
                    {/* Logo Container - Responsive sizing */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mb-5 md:mb-6 relative group">
                        <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 rounded-full animate-ping opacity-75"></div>
                        <img
                            src={logo}
                            alt="NOVAIS"
                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain relative z-10 drop-shadow-sm"
                        />
                    </div>

                    {/* 404 Text - Responsive sizing */}
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">
                        4<span className="text-blue-500">0</span>4
                    </h1>

                    {/* Page Not Found - Responsive sizing */}
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 md:mb-3">
                        {t('common.page_not_found') || "Page Not Found"}
                    </h2>

                    {/* Description - Responsive sizing */}
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 md:mb-8 font-medium leading-relaxed px-2">
                        {t('error.description')}
                    </p>

                    {/* Button - Responsive sizing */}
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 sm:py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group text-sm sm:text-base"
                    >
                        <LuHouse size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                        <span>{t('common.back_to_home') || "Back to Home"}</span>
                    </button>

                    {/* Error Code - Responsive sizing */}
                    <div className="mt-5 md:mt-6 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider sm:tracking-widest">
                        <LuTriangleAlert size={12} className="text-amber-500 flex-shrink-0" />
                        <span className="break-all">{t('error.code')}: ERR_NOT_FOUND</span>
                    </div>
                </motion.div>
            </main>

            <Footers />
        </div>
    );
};

export default Error;
