import React from 'react';
import { motion } from 'framer-motion';
import { LuDownload, LuMonitor, LuAppWindow, LuApple } from "react-icons/lu";
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';

const DownloadApp = () => {
    useTranslation();

    const apps = [
        {
            os: 'Windows',
            version: 'v1.0.0 (64-bit)',
            icon: LuAppWindow,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            link: '/downloads/NOVAIS-Setup.exe',
            disabled: false
        },
        {
            os: 'macOS',
            version: 'v1.0.0 (Universal)',
            icon: LuApple,
            color: 'text-gray-900 dark:text-gray-100',
            bg: 'bg-gray-500/10',
            link: '/downloads/NOVAIS-Installer.dmg',
            disabled: false
        }
    ];

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div className="text-center mb-16">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-500/20"
                >
                    <LuMonitor size={32} />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4"
                >
                    Download Desktop App
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto"
                >
                    Experience NOVAIS natively on your operating system. Faster, smoother, and more integrated workflow.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {apps.map((app, idx) => (
                    <motion.div
                        key={app.os}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                    >
                        <Card className="p-8 hover:border-blue-500/50 transition-all duration-300 group">
                            <div className="flex items-start justify-between mb-8">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${app.bg} ${app.color}`}>
                                    <app.icon size={28} />
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                {app.os}
                            </h3>
                            <p className="text-sm text-gray-500 mb-8">
                                {app.version}
                            </p>

                            <a
                                href={app.link}
                                download
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${app.disabled
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5'
                                    }`}
                                onClick={(e) => app.disabled && e.preventDefault()}
                            >
                                <LuDownload size={20} />
                                Download for {app.os}
                            </a>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-16 text-center"
            >
                <p className="text-sm text-gray-400">
                    System Requirements: Windows 10/11 or macOS 12+ (Ventura). <br />
                    Internet connection required for AI features.
                </p>
            </motion.div>
        </div>
    );
};

export default DownloadApp;
