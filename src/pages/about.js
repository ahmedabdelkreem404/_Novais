import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { company, name } from '../constants';
import aboutImg from '../res/img/about.svg';
import { useTranslation } from 'react-i18next';

const About = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.language === 'ar';

    return (
        <div className={`w-full min-h-screen py-12 px-6 md:px-12 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <motion.h1
                        className="text-4xl md:text-6xl font-black mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}>
                        {t('about_page.title')} <span className="text-blue-600">{name}</span>
                    </motion.h1>
                    <motion.p
                        className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}>
                        {t('about_page.subtitle')}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, x: isRtl ? 50 : -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}>
                        <Card className="p-8 md:p-12 relative overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl">
                            <h2 className="text-3xl font-bold mb-8">{t('about_page.story.title')}</h2>
                            <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
                                <p>
                                    {t('about_page.story.p1', { company })}
                                </p>
                                <p>
                                    {t('about_page.story.p2', { name })}
                                </p>
                                <p>
                                    {t('about_page.story.p3')}
                                </p>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        className="relative flex justify-center"
                        initial={{ opacity: 0, x: isRtl ? -50 : 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}>
                        <div className="relative z-10 w-full max-w-md">
                            <img src={aboutImg} alt="About Us" className="w-full h-auto drop-shadow-2xl" />
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl -z-10" />
                    </motion.div>
                </div>

                <motion.div
                    className="mb-24"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-4">{t('about_page.mission.title')}</h2>
                        <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { key: "empower" },
                            { key: "innovate" },
                            { key: "quality" }
                        ].map((item, i) => (
                            <Card key={i} hover={true} className="p-8 rounded-2xl border border-gray-100 dark:border-white/5 h-full">
                                <h3 className="text-xl font-bold mb-4 text-blue-600">{t(`about_page.mission.list.${item.key}.title`)}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{t(`about_page.mission.list.${item.key}.desc`)}</p>
                            </Card>
                        ))}
                    </div>
                </motion.div>

                <div className="text-center bg-blue-600 rounded-[2rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black mb-6">{t('about_page.join.title')}</h2>
                        <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
                            {t('about_page.join.text')}
                        </p>
                        <Button
                            variant="secondary"
                            size="xl"
                            className="bg-white text-blue-600 border-none hover:bg-gray-100 shadow-xl"
                            onClick={() => navigate('/contact')}>
                            {t('nav.contact')}
                        </Button>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </div>
            </div>
        </div>
    );
};

export default About;
