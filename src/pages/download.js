import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LuDownload, LuMonitor, LuSmartphone, LuAppWindow } from "react-icons/lu";
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { serverURL } from '../constants';
import Card from '../components/ui/Card';

const DownloadApp = () => {
    const { i18n } = useTranslation();
    const isRtl = i18n.language.startsWith('ar');
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${serverURL}/platform-settings`);
                setConfig(res.data);
            } catch (err) {
                console.error("Failed to fetch download config", err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-400 animate-pulse">
                {isRtl ? 'جاري التحميل...' : 'Loading...'}
            </div>
        );
    }

    const title = (config && (isRtl ? config.download_page_title_ar : config.download_page_title_en))
        || (isRtl ? 'تثبيت تطبيقات Novais' : 'Install Novais Apps');

    const desc = (config && (isRtl ? config.download_page_desc_ar : config.download_page_desc_en))
        || (isRtl ? 'قم بتحميل وتثبيت تطبيق Novais للويندوز وتطبيقات الموبايل لبدء التعلم فوراً.' : 'Download Novais client for Windows and Mobile devices to start learning.');

    const winUrl = config && config.windows_download_url 
        ? (config.windows_download_url.startsWith('http') ? config.windows_download_url : `${serverURL.replace('/api', '')}${config.windows_download_url}`)
        : `${serverURL.replace('/api', '')}/NOVAIS_Installer.exe`;

    const apkUrl = config && config.mobile_download_url
        ? (config.mobile_download_url.startsWith('http') ? config.mobile_download_url : `${serverURL.replace('/api', '')}${config.mobile_download_url}`)
        : `${serverURL.replace('/api', '')}/NOVAIS_App.apk`;

    const apps = [
        {
            os: isRtl ? 'ويندوز (Windows)' : 'Windows Client',
            version: 'v1.0.0 (64-bit .exe)',
            icon: LuAppWindow,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            link: winUrl,
            btnText: isRtl ? 'تنزيل لنظام ويندوز' : 'Download for Windows',
            comingSoonText: isRtl ? 'قريباً لويندوز' : 'Windows client coming soon'
        },
        {
            os: isRtl ? 'أندرويد (Android)' : 'Android Application',
            version: 'v1.0.0 (.apk)',
            icon: LuSmartphone,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            link: apkUrl,
            btnText: isRtl ? 'تنزيل ملف APK' : 'Download APK File',
            comingSoonText: isRtl ? 'قريباً للأندرويد' : 'Android app coming soon'
        }
    ];

    return (
        <div className="max-w-4xl mx-auto py-16 px-4 md:py-24" dir={isRtl ? 'rtl' : 'ltr'}>
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
                    className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight"
                >
                    {title}
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
                >
                    {desc}
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
                        <Card className="p-8 hover:border-blue-500/50 transition-all duration-300 flex flex-col h-full justify-between min-h-[300px]">
                            <div>
                                <div className="flex items-start justify-between mb-6">
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
                            </div>

                            {app.link ? (
                                <a
                                    href={app.link}
                                    download
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                                >
                                    <LuDownload size={20} />
                                    {app.btnText}
                                </a>
                            ) : (
                                <div className="w-full text-center py-3 bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 rounded-xl text-sm font-bold border border-dashed border-gray-200 dark:border-white/5">
                                    {app.comingSoonText}
                                </div>
                            )}
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
                <p className="text-xs text-gray-400 leading-relaxed">
                    {isRtl 
                        ? 'متطلبات النظام: ويندوز 10/11 أو هاتف أندرويد بنظام 8.0 أو أحدث.' 
                        : 'System Requirements: Windows 10/11 or Android 8.0+.'}
                    <br />
                    {isRtl
                        ? 'يلزم وجود اتصال نشط بالإنترنت لاستخدام خيارات توليد المحتوى بالذكاء الاصطناعي.'
                        : 'Active internet connection required to utilize all AI platform capabilities.'}
                </p>
            </motion.div>
        </div>
    );
};

export default DownloadApp;
