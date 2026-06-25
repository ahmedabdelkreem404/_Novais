import React from 'react';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import { LuBrainCircuit, LuGlobe, LuVideo, LuFileText, LuAward, LuDownload } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

const Features = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    const features = [
        { key: "ai", icon: LuBrainCircuit },
        { key: "lang", icon: LuGlobe },
        { key: "video", icon: LuVideo },
        { key: "quiz", icon: LuFileText },
        { key: "cert", icon: LuAward },
        { key: "pdf", icon: LuDownload }
    ];

    return (
        <div className={`w-full min-h-screen p-6 md:p-12 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h1
                        className="text-4xl md:text-6xl font-black mb-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}>
                        {t('features_page.title')}<span className="text-blue-600">{t('features_page.title_accent')}</span>
                    </motion.h1>
                    <motion.p
                        className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}>
                        {t('features_page.subtitle')}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}>
                            <Card
                                glass={true}
                                hover={true}
                                tilt={true}
                                className="p-8 h-full">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-6">
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-4">{t(`features_page.list.${feature.key}.title`)}</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {t(`features_page.list.${feature.key}.desc`)}
                                </p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Features;
