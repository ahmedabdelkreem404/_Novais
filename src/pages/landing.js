import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverURL } from '../constants';
import { motion } from 'framer-motion';
import {
    LuChartBar, LuLanguages,
    LuMessageSquare, LuDownload, LuArrowRight,
    LuSparkles, LuCircleCheck
} from "react-icons/lu";
import Button from '../components/ui/Button';
import slideOne from '../res/img/slideOne.png';
import { useTranslation } from 'react-i18next';

const Landing = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const isRtl = i18n.language === 'ar';
    const [billingCycle, setBillingCycle] = React.useState('monthly');

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard', { replace: true });
            return;
        }

        const target = location.state?.scrollTo;
        if (!target) return;

        const el = document.querySelector(target);
        if (!el) return;

        window.setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
    }, [location.state, navigate]);

    // Animation Variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const [plans, setPlans] = React.useState([]);
    const [config, setConfig] = React.useState(null);

    React.useEffect(() => {
        const fetchPlansAndConfig = async () => {
            try {
                const [plansRes, configRes] = await Promise.all([
                    axios.get(`${serverURL}/plans`),
                    axios.get(`${serverURL}/platform-config`)
                ]);
                setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
                setConfig(configRes.data);
            } catch (err) {
                console.error("Failed to fetch plans or config", err);
            }
        };
        fetchPlansAndConfig();
    }, []);

    const getPlan = (slug) => (Array.isArray(plans) ? plans : []).find(p => p.slug === slug) || {};
    const lang = i18n.language.startsWith('ar') ? 'ar' : 'en';

    const getPlanField = (plan, field, fallback) => {
        if (!plan[field]) return fallback;
        if (typeof plan[field] === 'string') return plan[field];
        return plan[field][lang] || plan[field]['ar'] || fallback;
    };

    return (
        <div className={`landing ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <section className="landing-hero">
                <div className="app-container landing-hero__inner">
                    <motion.div
                        className="landing-hero__copy"
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.div className="landing-badge" variants={fadeInUp}>
                            {(config && (isRtl ? config.web_hero_badge_ar : config.web_hero_badge_en)) || t('landing.badge')}
                        </motion.div>
                        <motion.h1 className="h1 landing-hero__title" variants={fadeInUp}>
                            {config && (isRtl ? config.web_hero_title_ar : config.web_hero_title_en) ? (
                                isRtl ? config.web_hero_title_ar : config.web_hero_title_en
                            ) : (
                                <>
                                    {t('landing.title_main')}<br />
                                    <span className="landing-hero__titleAccent">{t('landing.title_accent')}</span>
                                </>
                            )}
                        </motion.h1>
                        <motion.p className="landing-hero__subtitle" variants={fadeInUp}>
                            {(config && (isRtl ? config.web_hero_subtitle_ar : config.web_hero_subtitle_en)) || t('landing.subtitle')}
                        </motion.p>

                        <motion.div className="landing-hero__cta" variants={fadeInUp}>
                            <Button variant="primary" size="xl" onClick={() => navigate('/signup')}>
                                {(config && (isRtl ? config.web_hero_cta_ar : config.web_hero_cta_en)) || t('landing.cta_start')}
                                {isRtl ? <LuArrowRight className="rotate-180" /> : <LuArrowRight />}
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            <section className="landing-preview">
                <div className="app-container">
                    <motion.div
                        initial={{ opacity: 0, y: 40, rotateX: 10 }}
                        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="landing-preview__wrapper"
                    >
                        <div className="landing-preview__card">
                            {/* 3D Decorative Orbitals */}
                            {/* Floating Feature Icons */}
                            <div className="landing-preview__icons">
                                <motion.div
                                    className="landing-preview__icon landing-preview__icon--1"
                                    initial={{ scale: 0, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                >
                                    <LuSparkles size={32} />
                                </motion.div>
                                <motion.div
                                    className="landing-preview__icon landing-preview__icon--2"
                                    initial={{ scale: 0, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.4, type: "spring" }}
                                >
                                    <LuChartBar size={32} />
                                </motion.div>
                                <motion.div
                                    className="landing-preview__icon landing-preview__icon--3"
                                    initial={{ scale: 0, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.6, type: "spring" }}
                                >
                                    {/* Using a different icon for diversity, e.g. Languages or Message */}
                                    <LuLanguages size={32} />
                                </motion.div>
                            </div>

                            {config && config.hero_media_url ? (
                                config.hero_media_type === 'video' ? (
                                    <video
                                        className="landing-preview__image w-full rounded-2xl object-cover shadow-2xl"
                                        src={config.hero_media_url.startsWith('http') ? config.hero_media_url : `${serverURL.replace('/api', '')}${config.hero_media_url}`}
                                        autoPlay
                                        muted={config.hero_media_muted !== undefined ? !!config.hero_media_muted : true}
                                        loop={config.hero_media_loop !== undefined ? !!config.hero_media_loop : true}
                                        playsInline
                                        poster={config.hero_media_poster ? (config.hero_media_poster.startsWith('http') ? config.hero_media_poster : `${serverURL.replace('/api', '')}${config.hero_media_poster}`) : undefined}
                                    />
                                ) : (
                                    <img
                                        className="landing-preview__image w-full rounded-2xl object-cover shadow-2xl"
                                        src={config.hero_media_url.startsWith('http') ? config.hero_media_url : `${serverURL.replace('/api', '')}${config.hero_media_url}`}
                                        alt="Platform Preview"
                                    />
                                )
                            ) : (
                                <img
                                    className="landing-preview__image"
                                    src={slideOne}
                                    alt="Platform Screenshot"
                                />
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="landing-section" id="features">
                <div className="app-container">
                    <header className={`landing-section__header landing-section__header--center ${isRtl ? 'text-right' : ''}`}>
                        <p className="landing-section__kicker">{t('landing.sections.features.kicker')}</p>
                        <h2 className="h2 landing-section__title">{t('landing.sections.features.title')}<br /><span className="landing-hero__titleAccent">{t('landing.sections.features.title_accent')}</span></h2>
                    </header>

                    <motion.div
                        className="landing-grid"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                    >
                        {[
                            { icon: LuSparkles, key: 'ai' },
                            { icon: LuChartBar, key: 'types' },
                            { icon: LuCircleCheck, key: 'quizzes' },
                            { icon: LuLanguages, key: 'languages' },
                            { icon: LuMessageSquare, key: 'chat' },
                            { icon: LuDownload, key: 'export' }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                className="landing-feature"
                                variants={fadeInUp}
                            >
                                <div className="landing-feature__icon" aria-hidden="true">
                                    <feature.icon size={26} />
                                </div>
                                <h3 className="h3 landing-feature__title">{t(`landing.features_list.${feature.key}.title`)}</h3>
                                <p className="landing-feature__desc">{t(`landing.features_list.${feature.key}.desc`)}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <section className="landing-section" id="how-it-works">
                <div className="app-container">
                    <header className={`landing-section__header landing-section__header--center ${isRtl ? 'text-right' : ''}`}>
                        <p className="landing-section__kicker">{t('landing.sections.process.kicker')}</p>
                        <h2 className="h2 landing-section__title">{t('landing.sections.process.title')} <span className="landing-hero__titleAccent">{t('landing.sections.process.title_accent')}</span> {t('landing.sections.process.subtitle')}</h2>
                    </header>

                    <div className="landing-steps-diagram">
                        <div className="landing-steps-diagram__path" />
                        {[
                            { key: 'topics', icon: LuMessageSquare },
                            { key: 'preferences', icon: LuChartBar },
                            { key: 'language', icon: LuLanguages },
                            { key: 'magic', icon: LuSparkles },
                        ].map((item, idx) => (
                            <motion.div
                                className={`landing-process-card landing-process-card--${idx + 1}`}
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, delay: idx * 0.1 }}
                            >
                                <div>
                                    <div className="landing-process-card__number">0{idx + 1}</div>
                                    <div className="landing-process-card__icon">
                                        <item.icon size={30} />
                                    </div>
                                    <div className="landing-process-card__content">
                                        <h3>{t(`landing.steps.${item.key}.title`)}</h3>
                                        <p>{t(`landing.steps.${item.key}.desc`)}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="landing-section">
                <div className="app-container">
                    <header className={`landing-section__header landing-section__header--center ${isRtl ? 'text-right' : ''}`}>
                        <p className="landing-section__kicker">{t('landing.sections.reviews.kicker')}</p>
                        <h2 className="h2 landing-section__title">{t('landing.sections.reviews.title')}<span className="landing-hero__titleAccent">{t('landing.sections.reviews.title_accent')}</span></h2>
                    </header>

                    <motion.div
                        className="landing-testimonials"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {[
                            { key: 'sarah', name: "Sarah Johnson", avatar: "SJ" },
                            { key: 'david', name: "Prof. David Chen", avatar: "DC" },
                            { key: 'michael', name: "Michael Rodriguez", avatar: "MR" },
                            { key: 'anna', name: "Anna Wilson", avatar: "AW" }
                        ].map((t_item, idx) => (
                            <motion.div
                                key={idx}
                                className="landing-testimonial card"
                                variants={fadeInUp}
                            >
                                <p className="landing-testimonial__quote">"{t(`landing.testimonials.${t_item.key}.quote`)}"</p>
                                <div className="landing-testimonial__meta">
                                    <div className="landing-testimonial__avatar">
                                        {t_item.avatar}
                                    </div>
                                    <div className="landing-testimonial__info">
                                        <h4>{t_item.name}</h4>
                                        <p className="landing-testimonial__role">{t(`landing.testimonials.${t_item.key}.role`)}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <section className="landing-section" id="pricing">
                <div className="app-container">
                    <header className={`landing-section__header landing-section__header--center ${isRtl ? 'text-right' : ''}`}>
                        <p className="landing-section__kicker">{t('landing.sections.pricing.kicker')}</p>
                        <h2 className="h2 landing-section__title">{t('landing.sections.pricing.title')}<span className="landing-hero__titleAccent">{t('landing.sections.pricing.title_accent')}</span></h2>
                        <p className="landing-section__subtitle">{t('landing.sections.pricing.subtitle')}</p>
                    </header>

                    {/* Toggle */}
                    <div className="mb-12 flex items-center justify-center gap-4 bg-white dark:bg-slate-900/50 p-2 rounded-2xl w-fit mx-auto border border-gray-100 dark:border-white/5 shadow-xl">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            {t('pricing.monthly')}
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            {t('pricing.yearly')}
                            <span className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full border border-green-500/20">{t('common.save_30')}</span>
                        </button>
                    </div>

                    <div className="landing-pricing">
                        {/* Free Plan */}
                        <div className="landing-plan card">
                            <h3 className="landing-plan__name">{getPlanField(getPlan('free'), 'name', t('pricing.free_plan'))}</h3>
                            <div className="landing-plan__price">0 {t('common.egp')}</div>
                            <ul className="landing-plan__list">
                                {(getPlan('free').features?.[lang] || getPlan('free').features?.['ar']) ? (getPlan('free').features[lang] || getPlan('free').features['ar']).map((feat, i) => (
                                    <li key={i}><span className="landing-plan__check" aria-hidden="true">✓</span> {feat.replace('{{limit}}', getPlan('free').course_limit || 1)}</li>
                                )) : (
                                    <>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {getPlan('free').course_limit || 1} {t('common.course')}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.lifetime')}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.theory_image')}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.ai_chat')}</li>
                                    </>
                                )}
                            </ul>
                            <div className="landing-plan__footer">
                                <Button variant="secondary" size="lg" className="landing-plan__cta" onClick={() => navigate('/signup')}>
                                    {t('pricing.get_started')}
                                </Button>
                            </div>
                        </div>

                        {/* Pro Plan */}
                        <div className="landing-plan landing-plan--popular card">
                            <div className="landing-plan__badge">{t('pricing.best_seller')}</div>
                            <h3 className="landing-plan__name">{getPlanField(getPlan('pro'), 'name', t('pricing.pro_plan'))}</h3>
                            <div className="landing-plan__price">
                                {billingCycle === 'monthly'
                                    ? (getPlan('pro').price_egp || 149)
                                    : (getPlan('pro').price_egp * 10 || 1299)}
                                {t('common.egp')}
                                <span className="landing-plan__period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>
                            <ul className="landing-plan__list">
                                {(getPlan('pro').features?.[lang] || getPlan('pro').features?.['ar']) ? (getPlan('pro').features[lang] || getPlan('pro').features['ar']).map((feat, i) => (
                                    <li key={i}><span className="landing-plan__check" aria-hidden="true">✓</span> {feat.replace('{{limit}}', billingCycle === 'monthly' ? (getPlan('pro').course_limit || 10) : (getPlan('pro').course_limit || 10) * 12)}</li>
                                )) : (
                                    <>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {getPlan('pro').course_limit === -1 ? t('pricing.features.unlimited') : `${(getPlan('pro').course_limit || 10) * (billingCycle === 'monthly' ? 1 : 12)} ${t('common.course')}`}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.theory_image')}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.ai_chat')}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.languages_23')}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.unlimited')}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.video_theory')}</li>
                                    </>
                                )}
                            </ul>
                            <div className="landing-plan__footer">
                                <Button variant="primary" size="lg" className="landing-plan__cta" onClick={() => navigate('/signup')}>
                                    {t('pricing.get_started')}
                                </Button>
                            </div>
                        </div>

                        {/* Elite Plan */}
                        <div className="landing-plan card">
                            <h3 className="landing-plan__name">{getPlanField(getPlan('elite'), 'name', t('pricing.elite_plan'))}</h3>
                            <div className="landing-plan__price">
                                {billingCycle === 'monthly'
                                    ? (getPlan('elite').price_egp || 80)
                                    : (getPlan('elite').price_egp * 10 || 800)}
                                {t('common.egp')}
                                <span className="landing-plan__period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>
                            <ul className="landing-plan__list">
                                {(getPlan('elite').features?.[lang] || getPlan('elite').features?.['ar']) ? (getPlan('elite').features[lang] || getPlan('elite').features['ar']).map((feat, i) => (
                                    <li key={i}><span className="landing-plan__check" aria-hidden="true">✓</span> {feat.replace('{{limit}}', billingCycle === 'monthly' ? (getPlan('elite').course_limit || 20) : (getPlan('elite').course_limit || 20) * 12)}</li>
                                )) : (
                                    <>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {getPlan('elite').course_limit === -1 ? t('pricing.features.unlimited') : `${(getPlan('elite').course_limit || 20) * (billingCycle === 'monthly' ? 1 : 12)} ${t('common.course')}`}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.theory_image')}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.ai_chat')}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.languages_23')}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.unlimited')}</li>
                                        <li><span className="landing-plan__check" aria-hidden="true">✓</span> {t('pricing.features.video_theory')}</li>
                                    </>
                                )}
                            </ul>
                            <div className="landing-plan__footer">
                                <Button variant="secondary" size="lg" className="landing-plan__cta" onClick={() => navigate('/signup')}>
                                    {t('pricing.get_started')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-section">
                <div className="app-container">
                    <div className="landing-cta landing-cta--hover card">
                        <div className="landing-cta__inner">
                            <h2 className="h2">{t('landing.sections.cta.title')}</h2>
                            <p className="landing-cta__desc">
                                {t('landing.sections.cta.subtitle')}
                            </p>
                            <Button variant="primary" size="xl" onClick={() => navigate('/signup')}>
                                {t('landing.cta_start')}
                                {isRtl ? <LuArrowRight className="rotate-180" /> : <LuArrowRight />}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
