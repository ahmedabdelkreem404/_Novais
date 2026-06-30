import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { serverURL } from '../constants';
import { LuPlus, LuWand, LuLayers, LuVideo, LuBookOpen, LuGlobe, LuX, LuGem, LuCheck, LuRocket, LuChevronDown, LuLayoutTemplate, LuSettings2 } from "react-icons/lu";
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../components/ui/Input';

const languagesList = [
    { name: "English", displayName: { en: "English", ar: "الإنجليزية" }, isPremium: false },
    { name: "Arabic", displayName: { en: "Modern Standard Arabic", ar: "العربية الفصحى" }, isPremium: true },
    { name: "Egyptian Arabic", displayName: { en: "Egyptian Arabic", ar: "العامية المصرية" }, isPremium: true },
    { name: "Spanish", displayName: { en: "Spanish", ar: "الإسبانية" }, isPremium: true },
    { name: "French", displayName: { en: "French", ar: "الفرنسية" }, isPremium: true },
    { name: "German", displayName: { en: "German", ar: "الألمانية" }, isPremium: true },
    { name: "Italian", displayName: { en: "Italian", ar: "الإيطالية" }, isPremium: true },
    { name: "Portuguese", displayName: { en: "Portuguese", ar: "البرتغالية" }, isPremium: true },
    { name: "Russian", displayName: { en: "Russian", ar: "الروسية" }, isPremium: true },
    { name: "Japanese", displayName: { en: "Japanese", ar: "اليابانية" }, isPremium: true },
    { name: "Chinese (Simplified)", displayName: { en: "Chinese (Simplified)", ar: "الصينية (المبسطة)" }, isPremium: true },
    { name: "Hindi", displayName: { en: "Hindi", ar: "الهندية" }, isPremium: true },
    { name: "Bengali", displayName: { en: "Bengali", ar: "البنغالية" }, isPremium: true },
    { name: "Korean", displayName: { en: "Korean", ar: "الكورية" }, isPremium: true },
    { name: "Turkish", displayName: { en: "Turkish", ar: "التركية" }, isPremium: true },
    { name: "Vietnamese", displayName: { en: "Vietnamese", ar: "الفيتنامية" }, isPremium: true },
    { name: "Polish", displayName: { en: "Polish", ar: "البولندية" }, isPremium: true },
    { name: "Dutch", displayName: { en: "Dutch", ar: "الهولندية" }, isPremium: true },
    { name: "Indonesian", displayName: { en: "Indonesian", ar: "الإندونيسية" }, isPremium: true },
    { name: "Thai", displayName: { en: "Thai", ar: "التايلاندية" }, isPremium: true },
    { name: "Swedish", displayName: { en: "Swedish", ar: "السويدية" }, isPremium: true },
    { name: "Greek", displayName: { en: "Greek", ar: "اليونانية" }, isPremium: true },
    { name: "Czech", displayName: { en: "Czech", ar: "التشيكية" }, isPremium: true },
    { name: "Romanian", displayName: { en: "Romanian", ar: "الرومانية" }, isPremium: true },
    { name: "Hungarian", displayName: { en: "Hungarian", ar: "الهنغارية" }, isPremium: true },
    { name: "Ukrainian", displayName: { en: "Ukrainian", ar: "الأوكرانية" }, isPremium: true }
];

const getBilingualValue = (val, lang = 'en', defaultVal = '') => {
    if (!val) return defaultVal;
    if (typeof val === 'object') {
        return val[lang] || val.en || '';
    }
    return String(val);
};

const getLanguageDisplayName = (langName, locale) => {
    const langObj = languagesList.find(l => l.name === langName);
    if (langObj && langObj.displayName) {
        return getBilingualValue(langObj.displayName, locale, langName);
    }
    return langName;
};

const getDynamicTopicLabel = (slug, lang) => {
    if (slug === 'book') {
        return lang === 'ar' ? 'عنوان أو موضوع الكتاب' : 'Book Title or Topic';
    }
    if (slug === 'exam-builder' || slug === 'question-bank') {
        return lang === 'ar' ? 'موضوع الامتحان / المادة' : 'Exam Subject / Topic';
    }
    if (slug === 'graduation-project' || slug === 'master-thesis') {
        return lang === 'ar' ? 'عنوان أو مجال البحث' : 'Research Field / Project Topic';
    }
    if (slug === 'lesson-plan') {
        return lang === 'ar' ? 'موضوع الدرس' : 'Lesson Topic';
    }
    return lang === 'ar' ? 'موضوع الكورس / المحتوى' : 'Course Topic / Content';
};

const getDynamicTopicPlaceholder = (slug, lang) => {
    if (slug === 'book') {
        return lang === 'ar' ? 'مثال: تاريخ مصر القديمة، أساسيات الفيزياء...' : 'e.g., History of Ancient Egypt, Physics Fundamentals...';
    }
    if (slug === 'exam-builder' || slug === 'question-bank') {
        return lang === 'ar' ? 'مثال: رياضيات الصف الأول الثانوي، كيمياء عضوية...' : 'e.g., High School Math, Organic Chemistry...';
    }
    if (slug === 'graduation-project' || slug === 'master-thesis') {
        return lang === 'ar' ? 'مثال: تطبيق الذكاء الاصطناعي في الطب، بلوكشين...' : 'e.g., AI in Healthcare, Blockchain in Finance...';
    }
    if (slug === 'lesson-plan') {
        return lang === 'ar' ? 'مثال: دورة المياه في الطبيعة، الجهاز الهضمي...' : 'e.g., Water Cycle, Digestion System...';
    }
    return lang === 'ar' ? 'مثال: أساسيات لغة بايثون، تصميم الويب...' : 'e.g., Python Basics, Web Design...';
};

const getFieldLabel = (field, lang = 'en') => {
    if (field?.label) {
        return getBilingualValue(field.label, lang, field.key);
    }
    return field?.key || '';
};

const getBlueprintFields = (blueprint) => Array.isArray(blueprint?.form_schema?.fields)
    ? blueprint.form_schema.fields
    : [];

const CreateCourse = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const langDropdownRef = useRef(null);

    // Initial check from session storage first to avoid layout shift if possible
    const [userPlan, setUserPlan] = useState(localStorage.getItem('type') || 'free');
    const [usage, setUsage] = useState({ used: 0, limit: 1, remaining: 1 });
    const [loadingPlan, setLoadingPlan] = useState(true);

    const location = useLocation(); // Add this import if missing

    // Initial State (Default or from Navigation State)
    const [formData, setFormData] = useState({
        topic: location.state?.topic || '',
        subTopic: '',
        subTopics: location.state?.subTopics || [],
        numModules: location.state?.numModules || 5,
        type: location.state?.type || 'Theory & Image Course',
        language: location.state?.language || 'English',
        level: location.state?.level || 'Beginner'
    });

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
                setIsLangOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch User Plan from DB
    useEffect(() => {
        const fetchUserPlan = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await axios.get(`${serverURL}/auth/user-profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json'
                    }
                });

                if (res.data) {
                    const user = res.data.user || res.data;
                    const planUsage = res.data.subscription_usage || { used: 0, limit: 1, remaining: 1 };

                    // Normalize plan name
                    const rawPlan = user.sub_status || user.type || 'free';
                    const plan = String(rawPlan).toLowerCase();

                    console.log("Create Page: Usage Fetched:", planUsage); // Debugging

                    setUserPlan(plan);
                    setUsage(planUsage);
                    localStorage.setItem('type', plan);
                }
            } catch (error) {
                console.error("Failed to fetch plan:", error);
            } finally {
                setLoadingPlan(false);
            }
        };

        fetchUserPlan();
    }, []);

    // Check if plan is NOT free to grant full access
    const isPremiumUser = (
        userPlan && (
            userPlan.toLowerCase().includes('pro') ||
            userPlan.toLowerCase().includes('elite') ||
            userPlan.toLowerCase().includes('admin')
        )
    ) || localStorage.getItem('role') === 'admin';

    const [config, setConfig] = useState(null);
    const [blueprints, setBlueprints] = useState([]);
    const [selectedBlueprint, setSelectedBlueprint] = useState(location.state?.blueprint_slug || 'normal-course');
    const [blueprintFields, setBlueprintFields] = useState(location.state?.blueprint_fields || {});

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const [settingsRes, blueprintsRes] = await Promise.all([
                    axios.get(`${serverURL}/platform-settings`),
                    axios.get(`${serverURL}/content-blueprints`),
                ]);
                const res = settingsRes;
                setConfig(res.data);
                const nextBlueprints = Array.isArray(blueprintsRes.data) ? blueprintsRes.data : [];
                setBlueprints(nextBlueprints);
                if (nextBlueprints.length > 0 && !nextBlueprints.some((item) => item.slug === selectedBlueprint)) {
                    setSelectedBlueprint(nextBlueprints[0].slug);
                }
                if (res.data) {
                    if (res.data.enabled_course_types && res.data.enabled_course_types.length > 0) {
                        if (!res.data.enabled_course_types.includes(formData.type)) {
                            setFormData(prev => ({ ...prev, type: res.data.enabled_course_types[0] }));
                        }
                    }
                    if (res.data.enabled_languages && res.data.enabled_languages.length > 0) {
                        if (!res.data.enabled_languages.includes(formData.language)) {
                            setFormData(prev => ({ ...prev, language: res.data.enabled_languages[0] }));
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch platform config:", error);
            }
        };
        fetchConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeLanguages = config
        ? config.enabled_languages.map(lang => ({
            name: lang,
            isPremium: !config.all_languages_free && !config.free_languages.includes(lang)
          }))
        : languagesList;

    const activeCourseTypes = config
        ? config.enabled_course_types
        : ['Theory & Image Course', 'Video & Theory Course'];

    const activeLevels = config
        ? (config.enabled_levels ?? ['Beginner', 'Intermediate', 'Advanced', 'Professional'])
        : ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

    const activeDepths = config
        ? (config.enabled_depths ?? [5, 10])
        : [5, 10];
    const activeBlueprint = useMemo(
        () => blueprints.find((item) => item.slug === selectedBlueprint),
        [blueprints, selectedBlueprint]
    );
    const activeBlueprintFields = useMemo(
        () => getBlueprintFields(activeBlueprint),
        [activeBlueprint]
    );

    useEffect(() => {
        if (!activeBlueprintFields.length) return;
        setBlueprintFields((current) => {
            const next = { ...current };
            let changed = false;
            activeBlueprintFields.forEach((field) => {
                if (next[field.key] !== undefined) return;
                if (field.type === 'boolean') next[field.key] = false;
                else if (field.type === 'multiselect') next[field.key] = [];
                else next[field.key] = '';
                changed = true;
            });
            return changed ? next : current;
        });
    }, [activeBlueprintFields]);

    useEffect(() => {
        if (activeBlueprint && selectedBlueprint !== 'normal-course' && selectedBlueprint !== 'leveled-course') {
            setFormData(prev => ({
                ...prev,
                numModules: activeBlueprint.default_count || 5
            }));
        }
    }, [selectedBlueprint, activeBlueprint]);

    const isCourseTypePremium = (type) => {
        if (!config) {
            return type.includes('Video');
        }
        const isVideo = type.toLowerCase().includes('video');
        if (isVideo && !config.video_courses_free) {
            return true;
        }
        return !config.free_course_types.includes(type);
    };

    const isLevelPremium = (level) => {
        if (!config) {
            return level === 'Professional';
        }
        return !(config.free_levels ?? ['Beginner', 'Intermediate', 'Advanced']).includes(level);
    };

    const isDepthPremium = (depth) => {
        if (!config) {
            return depth > 5;
        }
        return depth > (config.free_depth_limit ?? 5);
    };

    const creationDisabled = config && !config.course_creation_enabled;

    // Premium Check Handler
    const handleFeatureClick = (feature, value) => {
        // If user is premium, allow everything immediately
        if (isPremiumUser) {
            setFormData({ ...formData, [feature]: value });
            if (feature === 'language') setIsLangOpen(false);
            return;
        }

        // Free Plan Limits Definitions
        const isPremiumFeature =
            (feature === 'numModules' && isDepthPremium(value)) ||
            (feature === 'type' && isCourseTypePremium(value)) ||
            (feature === 'language' && (activeLanguages.find(l => l.name === value)?.isPremium)) ||
            (feature === 'level' && isLevelPremium(value));

        if (isPremiumFeature) {
            setShowPremiumModal(true);
            if (feature === 'language') setIsLangOpen(false);
        } else {

            setFormData({ ...formData, [feature]: value });
            if (feature === 'language') setIsLangOpen(false);
        }
    };

    const addSubTopic = () => {
        if (formData.subTopic.trim()) {
            setFormData({
                ...formData,
                subTopics: [...formData.subTopics, formData.subTopic],
                subTopic: ''
            });
        }
    };

    const handleGenerate = () => {
        if (!formData.topic) return;

        // Strict limit check: If no courses remaining and not unlimited (-1)
        if (usage.remaining === 0 && usage.limit !== -1) {
            setShowPremiumModal(true);
            return;
        }

        // Map dynamic fields to root params if they exist in blueprintFields
        const submissionData = {
            ...formData,
            blueprint_slug: selectedBlueprint,
            blueprint_fields: blueprintFields
        };

        if (blueprintFields.level !== undefined) {
            submissionData.level = blueprintFields.level;
        }
        if (blueprintFields.numModules !== undefined) {
            submissionData.numModules = Number(blueprintFields.numModules);
        }
        if (blueprintFields.type !== undefined) {
            submissionData.type = blueprintFields.type;
        }

        navigate('/generating', { state: submissionData });
    };

    const navigateToPricing = () => {
        navigate('/dashboard/pricing');
        setShowPremiumModal(false);
    };

    const updateBlueprintField = (key, value) => {
        setBlueprintFields((current) => ({ ...current, [key]: value }));
    };

    const renderBlueprintField = (field) => {
        const value = blueprintFields[field.key];
        const title = getFieldLabel(field, i18n.language?.startsWith('ar') ? 'ar' : 'en');
        const placeholderText = field.placeholder ? getBilingualValue(field.placeholder, i18n.language?.startsWith('ar') ? 'ar' : 'en') : title;
        const baseClass = 'w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none focus:border-blue-500';

        if (field.type === 'textarea') {
            return (
                <textarea
                    rows={3}
                    value={value || ''}
                    onChange={(e) => updateBlueprintField(field.key, e.target.value)}
                    placeholder={placeholderText}
                    className={baseClass}
                />
            );
        }

        if (field.type === 'number') {
            return (
                <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => updateBlueprintField(field.key, e.target.value)}
                    placeholder={placeholderText}
                    className={baseClass}
                />
            );
        }

        if (field.type === 'select') {
            return (
                <select value={value || ''} onChange={(e) => updateBlueprintField(field.key, e.target.value)} className={baseClass}>
                    <option value="">{title}</option>
                    {(field.options || []).map((option) => {
                        const optVal = typeof option === 'object' ? option.value : option;
                        const optLabel = typeof option === 'object' ? getBilingualValue(option.label, i18n.language?.startsWith('ar') ? 'ar' : 'en') : option;
                        return <option key={optVal} value={optVal}>{optLabel}</option>;
                    })}
                </select>
            );
        }

        if (field.type === 'multiselect') {
            const selected = Array.isArray(value) ? value : [];
            return (
                <div className="flex flex-wrap gap-2">
                    {(field.options || []).map((option) => {
                        const optVal = typeof option === 'object' ? option.value : option;
                        const optLabel = typeof option === 'object' ? getBilingualValue(option.label, i18n.language?.startsWith('ar') ? 'ar' : 'en') : option;
                        const checked = selected.includes(optVal);
                        return (
                            <button
                                key={optVal}
                                type="button"
                                onClick={() => updateBlueprintField(field.key, checked ? selected.filter((item) => item !== optVal) : [...selected, optVal])}
                                className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${checked ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200' : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-[#151515] dark:text-gray-300'}`}
                            >
                                {optLabel}
                            </button>
                        );
                    })}
                </div>
            );
        }

        if (field.type === 'boolean') {
            const enabledText = t('common.enabled');
            const disabledText = t('common.disabled');
            const displayVal = value 
                ? (enabledText && enabledText !== 'common.enabled' ? enabledText : 'Enabled') 
                : (disabledText && disabledText !== 'common.disabled' ? disabledText : 'Disabled');
            return (
                <button
                    type="button"
                    onClick={() => updateBlueprintField(field.key, !value)}
                    className={`w-full rounded-xl border p-3.5 text-start text-sm font-bold transition ${value ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200' : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-[#151515] dark:text-gray-300'}`}
                >
                    {displayVal}
                </button>
            );
        }

        return (
            <input
                value={value || ''}
                onChange={(e) => updateBlueprintField(field.key, e.target.value)}
                placeholder={placeholderText}
                className={baseClass}
            />
        );
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-10 font-sans text-gray-900 dark:text-white pb-32 relative">

            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-4 animate-in fade-in slide-in-from-bottom-2">
                    {t('create_page.title')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-base">
                    {t('create_page.subtitle')}
                </p>

                {/* User Plan Badge (Dynamic) */}
                <div className="mt-4 flex justify-center">
                    {loadingPlan ? (
                        <span className="text-xs text-gray-400 animate-pulse">{t('create_page.loading_plan')}</span>
                    ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 
                            ${isPremiumUser ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {isPremiumUser ? <LuGem size={12} /> : <LuLayers size={12} />}
                            {userPlan} ({usage.used}/{usage.limit === -1 ? '∞' : usage.limit}) {t('create_page.plan_suffix')}
                        </span>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 md:p-8 lg:p-10 shadow-lg shadow-gray-100/50 dark:shadow-none animate-in fade-in zoom-in-95 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                    {/* Left Column: Topics */}
                    <div className="space-y-8">
                        <div>
                            <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block uppercase tracking-wide">
                                {getDynamicTopicLabel(selectedBlueprint, i18n.language?.startsWith('ar') ? 'ar' : 'en')}
                            </label>
                            <Input
                                placeholder={getDynamicTopicPlaceholder(selectedBlueprint, i18n.language?.startsWith('ar') ? 'ar' : 'en')}
                                value={formData.topic}
                                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                className="!bg-gray-50 dark:!bg-[#151515] !border-gray-200 dark:!border-gray-700 !py-4 !text-base focus:!ring-blue-500/20"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block uppercase tracking-wide flex items-center gap-2">
                                {t('create_page.desc_label')}
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder={t('create_page.desc_placeholder')}
                                    value={formData.subTopic}
                                    onChange={e => setFormData({ ...formData, subTopic: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && addSubTopic()}
                                    className="!bg-gray-50 dark:!bg-[#151515] !border-gray-200 dark:!border-gray-700 focus:!ring-blue-500/20"
                                />
                                <button
                                    onClick={addSubTopic}
                                    className="bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white px-5 rounded-xl flex items-center justify-center transition-colors relative group"
                                >
                                    <LuPlus size={20} />
                                </button>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mt-4 min-h-[40px]">
                                {formData.subTopics.length > 0 ? formData.subTopics.map((st, i) => (
                                    <span key={i} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800 flex items-center gap-2 animate-in fade-in zoom-in">
                                        {st}
                                        <button
                                            onClick={() => setFormData({ ...formData, subTopics: formData.subTopics.filter((_, idx) => idx !== i) })}
                                            className="hover:text-blue-800 dark:hover:text-white transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )) : (
                                    <span className="text-sm text-gray-400 italic">{t('create_page.no_desc')}</span>
                                )}
                            </div>
                        </div>

                        {/* Custom Language Dropdown */}
                        <div className="relative" ref={langDropdownRef}>
                            <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block uppercase tracking-wide flex items-center gap-2">
                                <LuGlobe className="text-blue-500" /> {t('create_page.lang_label')}
                            </label>

                            <div
                                onClick={() => setIsLangOpen(!isLangOpen)}
                                className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 md:p-4 text-sm font-medium flex items-center justify-between cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                            >
                                <span className="text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                    {getLanguageDisplayName(formData.language, i18n.language?.startsWith('ar') ? 'ar' : 'en')}
                                    {/* Show gem if selected language is premium and user is NOT premium */}
                                    {!isPremiumUser && formData.language !== 'English' && <LuGem className="text-amber-500 text-xs" />}
                                </span>
                                <LuChevronDown className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
                            </div>

                            <AnimatePresence>
                                {isLangOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
                                    >
                                        {languagesList.map((lang, idx) => {
                                            // Only show premium badge if language is premium AND user is free
                                            const showPremiumBadge = !isPremiumUser && lang.isPremium;

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleFeatureClick('language', lang.name)}
                                                    className={`p-3 text-sm font-medium cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                                                        ${formData.language === lang.name ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-300'}
                                                    `}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        {getLanguageDisplayName(lang.name, i18n.language?.startsWith('ar') ? 'ar' : 'en')}
                                                    </span>
                                                    {showPremiumBadge ? (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                                                            <LuGem size={10} /> PREMIUM
                                                        </span>
                                                    ) : !lang.isPremium ? (
                                                        <span className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                                            FREE
                                                        </span>
                                                    ) : null}
                                                </div>
                                            )
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Column: Configuration */}
                    <div className="space-y-8">
                        {blueprints.length > 0 && (
                            <div>
                                <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block uppercase tracking-wide flex items-center gap-2">
                                    <LuLayoutTemplate className="text-blue-500" /> {t('create_page.blueprint_label')}
                                </label>
                                <select
                                    value={selectedBlueprint}
                                    onChange={(e) => {
                                        setSelectedBlueprint(e.target.value);
                                        setBlueprintFields({});
                                    }}
                                    className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 md:p-4 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none focus:border-blue-500"
                                >
                                    {blueprints.map((blueprint) => (
                                        <option key={blueprint.slug} value={blueprint.slug}>
                                            {getBilingualValue(blueprint.name, i18n.language?.startsWith('ar') ? 'ar' : 'en')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {activeBlueprintFields.length > 0 && (
                            <div>
                                <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block uppercase tracking-wide flex items-center gap-2">
                                    <LuSettings2 className="text-blue-500" /> {getBilingualValue(activeBlueprint?.name, i18n.language?.startsWith('ar') ? 'ar' : 'en')} {t('create_page.details_suffix')}
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    {activeBlueprintFields.map((field) => (
                                        <div key={field.key} className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    {getFieldLabel(field, i18n.language?.startsWith('ar') ? 'ar' : 'en')}
                                                </span>
                                                {field.required && <span className="text-[10px] font-black uppercase text-blue-500">{t('create_page.required_badge')}</span>}
                                            </div>
                                            {renderBlueprintField(field)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Complexity Level, Depth, and Format inputs - only visible for normal-course or leveled-course blueprints */}
                        {(selectedBlueprint === 'normal-course' || selectedBlueprint === 'leveled-course') && (
                            <>
                                {/* Complexity Level */}
                                <div>
                                    <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block uppercase tracking-wide flex items-center gap-2">
                                        <LuRocket className="text-blue-500" /> {t('create_page.level_label')}
                                    </label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
                                        {activeLevels.map(val => {
                                            const showLock = !isPremiumUser && isLevelPremium(val);

                                            return (
                                                <div
                                                    key={val}
                                                    onClick={() => handleFeatureClick('level', val)}
                                                    className={`relative flex flex-col items-center justify-center p-1.5 md:p-2 border rounded-xl cursor-pointer transition-all duration-200 gap-1 text-center h-full min-h-[72px] md:min-h-[80px] overflow-hidden
                                                        ${formData.level === val
                                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-500 ring-1 ring-blue-500'
                                                            : 'bg-white dark:bg-[#151515] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}
                                                    `}
                                                >
                                                    <span className={`text-[8.5px] sm:text-[10px] md:text-xs font-bold uppercase break-normal whitespace-normal leading-tight tracking-tighter px-0.5 ${formData.level === val ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'}`}>
                                                        {t(`create_page.levels.${val.toLowerCase()}`) || val}
                                                    </span>
                                                    {showLock && (
                                                        <LuGem className="text-amber-500" size={12} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Modules Count */}
                                <div>
                                    <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block uppercase tracking-wide flex items-center gap-2">
                                        <LuLayers className="text-blue-500" /> {t('create_page.depth_label')}
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {activeDepths.map(val => (
                                            <div
                                                key={val}
                                                onClick={() => handleFeatureClick('numModules', val)}
                                                className={`relative group p-3 md:p-4 border rounded-xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center min-h-[90px] md:min-h-[100px]
                                                    ${formData.numModules === val
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-500 ring-1 ring-blue-500'
                                                        : 'bg-white dark:bg-[#151515] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}
                                                `}
                                            >
                                                <span className={`text-2xl font-black ${formData.numModules === val ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                                    {val}
                                                </span>
                                                <span className={`text-xs font-bold uppercase ${formData.numModules === val ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'}`}>
                                                    {t('create_page.depth_unit')}
                                                </span>
                                                {!isPremiumUser && isDepthPremium(val) && (
                                                    <div className="absolute top-2 right-2 text-amber-500">
                                                        <LuGem size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Course Type */}
                                <div>
                                    <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block uppercase tracking-wide flex items-center gap-2">
                                        <LuBookOpen className="text-blue-500" /> {t('create_page.format_label')}
                                    </label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {activeCourseTypes.map(val => {
                                            const showLock = !isPremiumUser && isCourseTypePremium(val);

                                            return (
                                                <div
                                                    key={val}
                                                    onClick={() => handleFeatureClick('type', val)}
                                                    className={`relative flex items-center p-3 md:p-4 border rounded-xl cursor-pointer transition-all duration-200 gap-4
                                                        ${formData.type === val
                                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-500 ring-1 ring-blue-500'
                                                            : 'bg-white dark:bg-[#151515] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}
                                                    `}
                                                >
                                                    <div className={`p-2 rounded-lg ${formData.type === val ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                        {val.toLowerCase().includes('video') ? <LuVideo size={20} /> : <LuBookOpen size={20} />}
                                                    </div>
                                                    <div>
                                                        <span className={`block text-sm font-bold ${formData.type === val ? 'text-blue-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                            {val}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {val.toLowerCase().includes('video') ? t('create_page.format_video_desc') : t('create_page.format_theory_desc')}
                                                        </span>
                                                    </div>
                                                    {formData.type === val && (
                                                        <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 shadow-sm"></div>
                                                    )}
                                                    {showLock && (
                                                        <div className="ml-auto flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                                            <LuGem size={10} /> Premium
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Submit Action */}
                <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={handleGenerate}
                        disabled={!formData.topic || creationDisabled}
                        className="w-full relative group overflow-hidden bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:-translate-y-1"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <LuWand size={24} className={formData.topic ? "animate-pulse" : ""} />
                            {t('create_page.generate_btn')}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_auto] animate-gradient"></div>
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">
                        {t('create_page.credit_notice', { plan: userPlan.toLowerCase().includes('premium') ? t('common.premium') : t('common.free') })}
                    </p>
                </div>
            </div>

            {/* Premium Upgrade Modal */}
            <AnimatePresence>
                {showPremiumModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPremiumModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
                        >
                            {/* Header Gradient */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative h-32 flex flex-col justify-center">
                                <button
                                    onClick={() => setShowPremiumModal(false)}
                                    className="absolute top-5 end-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all z-20"
                                >
                                    <LuX size={20} />
                                </button>
                                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px] bg-white/20 w-fit px-3 py-1.5 rounded-full mb-3 backdrop-blur-md border border-white/20 shadow-lg">
                                    <LuGem size={14} className="text-amber-300" /> Premium
                                </div>
                                <h2 className="text-2xl font-bold leading-tight">{t('create_page.premium_modal.title')}</h2>
                                <p className="text-blue-100/80 text-sm mt-1">{t('create_page.premium_modal.subtitle')}</p>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                                        <LuCheck className="text-amber-500" size={20} />
                                        <span>{t('pricing.features.unlimited')}</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                                        <LuRocket className="text-purple-500" size={20} />
                                        <span>{t('pricing.features.video_theory')}</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                                        <LuGlobe className="text-blue-500" size={20} />
                                        <span>{t('pricing.features.languages_23')}</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                                        <LuBookOpen className="text-teal-500" size={20} />
                                        <span>{t('pricing.features.pdf_export')}</span>
                                    </li>
                                </ul>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={navigateToPricing}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30"
                                    >
                                        {t('create_page.premium_modal.btn_upgrade')}
                                    </button>
                                    <button
                                        onClick={() => setShowPremiumModal(false)}
                                        className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-xl font-bold transition-all"
                                    >
                                        {t('create_page.premium_modal.btn_later')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default CreateCourse;
