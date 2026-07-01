import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { serverURL } from '../constants';
import { LuPlus, LuWand, LuLayers, LuVideo, LuBookOpen, LuGlobe, LuX, LuGem, LuCheck, LuRocket, LuChevronDown, LuSettings2, LuGraduationCap, LuFileSpreadsheet, LuCircleHelp, LuBook, LuFolderHeart, LuAward, LuListChecks, LuClipboardList, LuBriefcase, LuSparkles, LuChevronLeft, LuChevronRight, LuMenu } from "react-icons/lu";
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../components/ui/Input';
import CustomDropdown from '../components/CustomDropdown';

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

const templateCards = [
    { slug: 'normal-course', nameEn: 'Interactive Practical Course', nameAr: 'كورس تفاعلي عملي', descEn: 'Generate structured courses with practical projects, exercises and quizzes.', descAr: 'إنشاء مسارات تعليمية منظمة مع مشاريع تطبيقية، تمارين، واختبارات.', icon: LuRocket },
    { slug: 'academic-course', nameEn: 'Academic Lecture Pack', nameAr: 'محاضرات أكاديمية جامعية', descEn: 'Formal university course outline with lecture duration, syllabus, slides outline and references.', descAr: 'مخطط محاضرات جامعي رسمي يحدد مدة المحاضرة، السجل الأكاديمي، والمراجع.', icon: LuGraduationCap },
    { slug: 'study-review', nameEn: 'Study & Review Guide', nameAr: 'مراجعة مذاكرة للامتحان', descEn: 'Summarized topics, key facts, revision schedules, memory aids, and common errors.', descAr: 'ملخص موضوعات، حقائق أساسية، جداول مراجعة، ووسائل لتسهيل التذكر.', icon: LuFileSpreadsheet },
    { slug: 'question-bank', nameEn: 'Question Bank', nameAr: 'بنك أسئلة شروحات', descEn: 'Generate collections of MCQs, essay questions, true/false, with detailed explanation keys.', descAr: 'مجموعة من الأسئلة المتنوعة (اختياري، صح/خطأ، مقالي) مع الشروحات المفصلة.', icon: LuCircleHelp },
    { slug: 'exam-builder', nameEn: 'Practice Exam Builder', nameAr: 'بناء اختبارات قصيرة', descEn: 'Formal tests with strict mark distribution, sections counts, duration, and grading rubrics.', descAr: 'اختبار رسمي محدد بالدرجات، عدد الأقسام، الزمن المتاح، ونموذج إجابة.', icon: LuListChecks },
    { slug: 'book', nameEn: 'Full Book Outline', nameAr: 'تأليف كتاب تعليمي', descEn: 'Outline multi-chapter books with introduction, preface, chapter summaries, glossary and references.', descAr: 'كتابة تمهيد، فصول متكاملة، تدريبات عملية، مسرد للمصطلحات ومراجع.', icon: LuBook },
    { slug: 'graduation-project', nameEn: 'Graduation Project Book', nameAr: 'توثيق مشروع تخرج', descEn: 'Build a complete academic project document for any faculty, with software sections only when relevant.', descAr: 'توثيق أكاديمي متكامل لأي كلية أو تخصص، مع أقسام البرمجة فقط عند الحاجة.', icon: LuFolderHeart },
    { slug: 'master-thesis', nameEn: 'Master Thesis / Research Outline', nameAr: 'أطروحة ماجستير / بحث أكاديمي', descEn: 'Exhaustive academic research synthesis with literature depth, hypotheses, methodology, and citation style.', descAr: 'إطار بحثي شامل بمحددات المنهجية، مراجعة الأدبيات، الفرضيات، والتوصيات.', icon: LuAward },
    { slug: 'lesson-plan', nameEn: 'Teacher Lesson Plan', nameAr: 'خطة درس المعلم', descEn: 'Structured classroom lesson plans with objectives, materials, teaching strategy, and activities.', descAr: 'خطة دراسية للمعلمين تحدد الأهداف، الاستراتيجية، الأنشطة، والواجب.', icon: LuClipboardList },
    { slug: 'assignment-builder', nameEn: 'Assignment Builder', nameAr: 'تكليفات وواجبات دراسية', descEn: 'Generate tasks list with detailed task description, deadline style, and grading criteria.', descAr: 'إنشاء تكليفات عملية أو نظرية مع معايير تقييم ودليل إجابة.', icon: LuClipboardList },
    { slug: 'project-based-learning', nameEn: 'Project-Based Learning Plan', nameAr: 'التعلم القائم على المشاريع', descEn: 'Develop scenario-based student milestones, deliverables, evaluation rubrics, and teamwork roles.', descAr: 'مخطط تعليمي قائم على المشاريع، أدوار الفريق، معايير التقييم والمخرجات.', icon: LuBriefcase },
    { slug: 'story', nameEn: 'Educational Novel / Story', nameAr: 'رواية / قصة تعليمية شائقة', descEn: 'Creative educational narratives with theme, characters description, setting and language style.', descAr: 'قصص وروايات تعليمية هادفة تحدد الشخصيات، الإطار الزماني، والهدف الأخلاقي.', icon: LuSparkles }
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
    if (slug === 'story') {
        return lang === 'ar' ? 'عنوان أو فكرة الرواية القصصية' : 'Novel / Story Title or Concept';
    }
    if (slug === 'exam-builder' || slug === 'question-bank' || slug === 'assignment-builder') {
        return lang === 'ar' ? 'موضوع الامتحان / المادة الدراسية' : 'Exam Subject / Course Topic';
    }
    if (slug === 'graduation-project' || slug === 'master-thesis') {
        return lang === 'ar' ? 'عنوان أو مجال البحث العلمي' : 'Research Field / Project Topic';
    }
    if (slug === 'lesson-plan') {
        return lang === 'ar' ? 'موضوع الدرس التعليمي' : 'Lesson Topic';
    }
    if (slug === 'project-based-learning') {
        return lang === 'ar' ? 'موضوع التعلم القائم على المشاريع' : 'Project-Based Learning Topic';
    }
    if (slug === 'study-review') {
        return lang === 'ar' ? 'المادة المراد مراجعتها' : 'Study Review Topic';
    }
    return lang === 'ar' ? 'موضوع الكورس / المحتوى التعليمي' : 'Course Topic / Content';
};

const getDynamicTopicPlaceholder = (slug, lang) => {
    if (slug === 'book') {
        return lang === 'ar' ? 'مثال: تاريخ مصر القديمة، أساسيات الفيزياء الحديثة...' : 'e.g., History of Ancient Egypt, Modern Physics Fundamentals...';
    }
    if (slug === 'story') {
        return lang === 'ar' ? 'مثال: رحلة استكشافية داخل الجهاز الهضمي، أسرار الرياضيات...' : "e.g., A Journey inside the Human Body, The Time Traveler's Math Guide...";
    }
    if (slug === 'exam-builder' || slug === 'question-bank' || slug === 'assignment-builder') {
        return lang === 'ar' ? 'مثال: رياضيات الصف الأول الثانوي، مبادئ كيمياء عضوية...' : 'e.g., High School Algebra, Introduction to Organic Chemistry...';
    }
    if (slug === 'graduation-project' || slug === 'master-thesis') {
        return lang === 'ar' ? 'مثال: تطبيق الذكاء الاصطناعي في تشخيص الأمراض، الأمن السيبراني للبنوك...' : 'e.g., Smart IoT Agriculture System, Blockchain for Secure Health Records...';
    }
    if (slug === 'lesson-plan') {
        return lang === 'ar' ? 'مثال: خطة درس عملية البناء الضوئي، دورة المياه في الطبيعة...' : 'e.g., Photosynthesis Process, The Water Cycle for 5th Grade...';
    }
    if (slug === 'project-based-learning') {
        return lang === 'ar' ? 'مثال: تصميم نموذج فلتر لتنقية المياه، بناء روبوت منزلي...' : 'e.g., Designing a Solar-Powered Water Filter, Building a Smart Home Robot...';
    }
    if (slug === 'study-review') {
        return lang === 'ar' ? 'مثال: مراجعة شاملة لاختبار رخصة القيادة، مراجعة قواعد النحو...' : 'e.g., Biology MCAT Review, Arabic Grammar Exam Revision...';
    }
    return lang === 'ar' ? 'مثال: أساسيات لغة بايثون وتطوير الويب، مهارات التفاوض...' : 'e.g., Python Web Development Basics, Effective Negotiation Skills...';
};

const getFieldLabel = (field, lang = 'en') => {
    if (field?.label) {
        return getBilingualValue(field.label, lang, field.key);
    }
    return field?.key || '';
};

const getFieldCategory = (slug, fieldKey) => {
    // Essential fields for each blueprint
    const essentialKeys = [
        'practical_domain', 'practice_intensity', 'academic_level', 'lecture_count',
        'exam_level', 'topics_to_review', 'topics', 'question_count', 'question_types', 
        'exam_duration', 'total_marks', 'section_count', 'target_reader', 'chapter_count', 
        'writing_style', 'genre', 'theme', 'faculty', 'department', 'student_names',
        'supervisor_names', 'university_name', 'domain', 'problem_statement', 'objectives',
        'research_problem', 'research_questions', 'grade', 'duration', 'learning_objectives', 
        'activities', 'assessment_method', 'task_count', 'delivery_style', 'final_deliverable', 
        'milestones', 'evaluation_criteria'
    ];

    if (essentialKeys.includes(fieldKey)) {
        return 'essential';
    }

    if (['audience', 'outcome', 'difficulty_focus'].includes(fieldKey)) {
        return 'optional';
    }

    return 'advanced';
};

const getBlueprintFields = (blueprint) => Array.isArray(blueprint?.form_schema?.fields)
    ? blueprint.form_schema.fields
    : [];

const getDraftKey = () => {
    const userKey = localStorage.getItem('userId') || localStorage.getItem('email') || localStorage.getItem('token')?.slice(0, 16) || 'guest';
    return `novais.generateWizardDraft.${userKey}`;
};

const readGenerateDraft = () => {
    try {
        const raw = sessionStorage.getItem(getDraftKey()) || localStorage.getItem(getDraftKey());
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const writeGenerateDraft = (draft) => {
    try {
        const serialized = JSON.stringify(draft);
        sessionStorage.setItem(getDraftKey(), serialized);
        localStorage.setItem(getDraftKey(), serialized);
    } catch {
        // Draft persistence is best-effort; generation must keep working.
    }
};

const CreateCourse = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');
    const navigate = useNavigate();
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const [userPlan, setUserPlan] = useState(localStorage.getItem('type') || 'free');
    const [usage, setUsage] = useState({ used: 0, limit: 1, remaining: 1 });
    const [loadingPlan, setLoadingPlan] = useState(true);

    const location = useLocation();
    const routeDraft = location.state?.draft || location.state?.generateDraft || null;
    const cachedDraft = routeDraft ? null : readGenerateDraft();
    const initialDraft = routeDraft || cachedDraft || {};
    const initialFormState = initialDraft.formData || initialDraft;

    const [step, setStep] = useState(initialDraft.step || 1);
    const [validationError, setValidationError] = useState('');
    const [advancedOpen, setAdvancedOpen] = useState(Boolean(initialDraft.advancedOpen));

    // Initial State (Default or from Navigation State)
    const [formData, setFormData] = useState({
        topic: initialFormState?.topic || '',
        subTopic: '',
        subTopics: initialFormState?.subTopics || [],
        numModules: initialFormState?.numModules || 5,
        type: initialFormState?.type || 'Theory & Image Course',
        language: initialFormState?.language || 'English',
        level: initialFormState?.level || 'Beginner'
    });


    // Fetch User Plan from DB
    useEffect(() => {
        const fetchUserPlan = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await axios.get(`${serverURL}/auth/user-profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
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
    const [selectedBlueprint, setSelectedBlueprint] = useState(
        initialDraft.selectedBlueprint || initialFormState?.blueprint_slug || 'normal-course'
    );
    const [blueprintFields, setBlueprintFields] = useState(
        initialDraft.blueprintFields || initialFormState?.blueprint_fields || {}
    );

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

    const fieldsByCategory = useMemo(() => {
        const essential = [];
        const optional = [];
        const advanced = [];

        activeBlueprintFields.forEach(field => {
            const category = getFieldCategory(selectedBlueprint, field.key);
            if (category === 'essential') {
                essential.push(field);
            } else if (category === 'optional') {
                optional.push(field);
            } else {
                advanced.push(field);
            }
        });

        return { essential, optional, advanced };
    }, [activeBlueprintFields, selectedBlueprint]);

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
        } else {
            setFormData({ ...formData, [feature]: value });
        }
    };

    useEffect(() => {
        if (!activeBlueprintFields.length) return;
        setBlueprintFields((current) => {
            const next = { ...current };
            let changed = false;
            activeBlueprintFields.forEach((field) => {
                if (next[field.key] !== undefined) return;
                if (field.type === 'boolean' && !field.required) return;
                if (field.type === 'boolean') next[field.key] = false;
                else if (field.type === 'select' && !field.required) return;
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

    useEffect(() => {
        writeGenerateDraft({
            formData,
            selectedBlueprint,
            blueprintFields,
            step,
            advancedOpen,
            updatedAt: new Date().toISOString()
        });
    }, [formData, selectedBlueprint, blueprintFields, step, advancedOpen]);

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

        // Preflight validation for required blueprint fields
        const missingFields = [];
        activeBlueprintFields.forEach(field => {
            if (field.required) {
                const val = blueprintFields[field.key];
                if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
                    const label = getFieldLabel(field, i18n.language?.startsWith('ar') ? 'ar' : 'en');
                    missingFields.push(label);
                }
            }
        });

        if (missingFields.length > 0) {
            const errorMsg = i18n.language?.startsWith('ar')
                ? `يرجى ملء الحقول المطلوبة: ${missingFields.join(', ')}`
                : `Please fill in the required fields: ${missingFields.join(', ')}`;
            setValidationError(errorMsg);
            return;
        }

        setValidationError('');

        // Map dynamic fields to root params if they exist in blueprintFields
        const submissionData = {
            ...formData,
            blueprint_slug: selectedBlueprint,
            blueprint_fields: blueprintFields
        };
        const draft = {
            formData,
            selectedBlueprint,
            blueprintFields,
            step,
            advancedOpen,
            updatedAt: new Date().toISOString()
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

        writeGenerateDraft(draft);
        navigate('/generating', { state: { ...submissionData, generateDraft: draft } });
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
            const isAr = i18n.language?.startsWith('ar');
            const rawOptions = field.options || [];
            const dropdownOptions = rawOptions.map(option => {
                const optVal = typeof option === 'object' ? option.value : option;
                const optLabel = typeof option === 'object' ? getBilingualValue(option.label, isAr ? 'ar' : 'en') : option;
                return { value: optVal, label: optLabel };
            });

            // Prepend Auto option for optional fields
            if (!field.required) {
                dropdownOptions.unshift({
                    value: 'auto',
                    label: isAr ? 'تلقائي / اتركه للذكاء الاصطناعي' : 'Auto / Let AI decide'
                });
            }

            const currentVal = value === undefined ? (field.required ? '' : 'auto') : value;

            return (
                <CustomDropdown
                    options={dropdownOptions}
                    value={currentVal}
                    onChange={(val) => updateBlueprintField(field.key, val === 'auto' ? undefined : val)}
                    placeholder={placeholderText}
                />
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
            const isAr = i18n.language?.startsWith('ar');
            const options = [
                { value: 'auto', label: isAr ? 'تلقائي' : 'Auto' },
                { value: true, label: isAr ? 'نعم' : 'Yes' },
                { value: false, label: isAr ? 'لا' : 'No' }
            ];
            const currentValue = value === undefined ? 'auto' : value;

            return (
                <div className="flex gap-2 w-full">
                    {options.map((opt) => {
                        const active = currentValue === opt.value;
                        return (
                            <button
                                key={String(opt.value)}
                                type="button"
                                onClick={() => updateBlueprintField(field.key, opt.value === 'auto' ? undefined : opt.value)}
                                className={`flex-1 rounded-xl border py-3 text-center text-xs font-bold transition-all duration-200
                                    ${active
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200 shadow-sm'
                                        : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-[#151515] hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
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
            <div className="text-center mb-8">
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

            {/* Stepper Progress Indicator */}
            <div className="flex items-center justify-between max-w-xl mx-auto mb-10 overflow-x-auto py-2 custom-scrollbar select-none" dir="ltr">
                {[1, 2, 3, 4, 5].map((s) => {
                    const active = step === s;
                    const done = step > s;
                    return (
                        <React.Fragment key={s}>
                            <div className="flex flex-col items-center gap-1 shrink-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                                    ${active ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 scale-110 shadow-md animate-pulse' :
                                      done ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}
                                >
                                    {done ? <LuCheck size={14} /> : s}
                                </div>
                            </div>
                            {s < 5 && (
                                <div className={`flex-1 h-0.5 mx-2 min-w-[20px] transition-all duration-500
                                    ${done ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-800'}`}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Main Guided Form Card */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-100 dark:border-gray-850 p-6 md:p-8 lg:p-10 shadow-xl shadow-gray-100/30 dark:shadow-none animate-in fade-in zoom-in-95 duration-500">
                
                {creationDisabled && (
                    <div className="bg-red-50 dark:bg-red-950/20 p-4 border border-red-100 dark:border-red-950 rounded-2xl mb-6 text-start">
                        <p className="text-red-500 text-xs font-bold">{t('disabled_warning')}</p>
                    </div>
                )}

                {/* Step 1: Choose Educational Format */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="text-center">
                            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white">
                                {isAr ? 'ماذا تريد أن تصنع اليوم؟' : 'What do you want to create today?'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {isAr ? 'اختر القالب التعليمي المناسب للمنتج الذي ترغب في توليده.' : 'Select the appropriate template for the content you want to generate.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                            {templateCards.map((tpl) => {
                                const Icon = tpl.icon;
                                const active = selectedBlueprint === tpl.slug;
                                return (
                                    <div
                                        key={tpl.slug}
                                        onClick={() => {
                                            setSelectedBlueprint(tpl.slug);
                                            setBlueprintFields({});
                                            setStep(2);
                                        }}
                                        className={`p-5 rounded-2xl border cursor-pointer text-start transition-all duration-300 flex items-start gap-4 hover:-translate-y-1 hover:shadow-lg
                                            ${active
                                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-500 shadow-md shadow-blue-500/10'
                                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] hover:border-blue-300 dark:hover:border-blue-700'}`}
                                    >
                                        <div className={`p-3 rounded-xl shrink-0 ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-850 text-gray-500 dark:text-gray-400'}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                                                {isAr ? tpl.nameAr : tpl.nameEn}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                                                {isAr ? tpl.descAr : tpl.descEn}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 2: Main Topic, Subtopics & Language */}
                {step === 2 && (
                    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="text-center">
                            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white">
                                {isAr ? 'الفكرة الأساسية واللغة' : 'Main Idea & Language'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {isAr ? 'حدد موضوع المحتوى واللغة التي ترغب في التوليد بها.' : 'Specify the topic of your content and the language you want to generate in.'}
                            </p>
                        </div>

                        <div className="space-y-6 mt-8">
                            {/* Topic Input */}
                            <div className="text-start">
                                <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block uppercase tracking-wide">
                                    {getDynamicTopicLabel(selectedBlueprint, isAr ? 'ar' : 'en')}
                                </label>
                                <Input
                                    placeholder={getDynamicTopicPlaceholder(selectedBlueprint, isAr ? 'ar' : 'en')}
                                    value={formData.topic}
                                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                    className="!bg-gray-50 dark:!bg-[#151515] !border-gray-200 dark:!border-gray-700 !py-4 !text-base focus:!ring-blue-500/20"
                                />
                            </div>

                            {/* Optional Description / Subtopics */}
                            <div className="text-start">
                                <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block uppercase tracking-wide flex items-center gap-2">
                                    {isAr ? 'تفاصيل إضافية / نقاط تركيز فرعية (اختياري)' : 'Additional Details / Subtopics (Optional)'}
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={isAr ? 'مثال: التركيز على الجوانب العملية، تجنب الحشو الأكاديمي...' : 'e.g. Focus on practical aspects, avoid academic fluff...'}
                                        value={formData.subTopic}
                                        onChange={e => setFormData({ ...formData, subTopic: e.target.value })}
                                        onKeyDown={e => e.key === 'Enter' && addSubTopic()}
                                        className="!bg-gray-50 dark:!bg-[#151515] !border-gray-200 dark:!border-gray-700 focus:!ring-blue-500/20"
                                    />
                                    <button
                                        onClick={addSubTopic}
                                        className="bg-[#151515] dark:bg-white text-white dark:text-[#151515] hover:bg-gray-800 dark:hover:bg-gray-100 p-4 rounded-xl flex items-center justify-center transition-all aspect-square border border-gray-200 dark:border-gray-700"
                                    >
                                        <LuPlus size={20} />
                                    </button>
                                </div>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                                    {isAr 
                                        ? '⚠️ تأكد من الضغط على زر (+) لحفظ التفصيل المكتوب قبل الانتقال للخطوة التالية!' 
                                        : '⚠️ Make sure to click the (+) button to save the detail before continuing!'}
                                </p>

                                {/* Tags list */}
                                <div className="flex flex-wrap gap-2 mt-3 min-h-[30px]">
                                    {formData.subTopics.length > 0 ? formData.subTopics.map((st, i) => (
                                        <span key={i} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800 flex items-center gap-2">
                                            {st}
                                            <button
                                                onClick={() => setFormData({ ...formData, subTopics: formData.subTopics.filter((_, idx) => idx !== i) })}
                                                className="hover:text-blue-800 dark:hover:text-white transition-colors"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    )) : (
                                        <span className="text-xs text-gray-400 italic">{isAr ? 'لا توجد تفاصيل إضافية مضافة بعد.' : 'No additional subtopics added yet.'}</span>
                                    )}
                                </div>
                            </div>

                            {/* Language Selector */}
                            <div className="text-start">
                                <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block uppercase tracking-wide flex items-center gap-2">
                                    <LuGlobe className="text-blue-500" /> {t('create_page.lang_label')}
                                </label>
                                <CustomDropdown
                                    options={activeLanguages.map(lang => ({
                                        value: lang.name,
                                        label: getLanguageDisplayName(lang.name, isAr ? 'ar' : 'en'),
                                        isPremium: !isPremiumUser && lang.isPremium
                                    }))}
                                    value={formData.language}
                                    onChange={(val) => handleFeatureClick('language', val)}
                                    placeholder={t('create_page.lang_label')}
                                    showSearch
                                />
                            </div>
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={() => setStep(1)}
                                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
                            >
                                <LuChevronLeft className={isAr ? 'rotate-180' : ''} /> {isAr ? 'نوع المحتوى' : 'Type'}
                            </button>
                            <button
                                disabled={!formData.topic}
                                onClick={() => {
                                    let updatedSubTopics = [...formData.subTopics];
                                    if (formData.subTopic.trim()) {
                                        updatedSubTopics.push(formData.subTopic.trim());
                                        setFormData(prev => ({
                                            ...prev,
                                            subTopics: updatedSubTopics,
                                            subTopic: ''
                                        }));
                                    }
                                    setStep(3);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAr ? 'التالي' : 'Next'} <LuChevronRight className={isAr ? 'rotate-180' : ''} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Smart Details (Essential Fields) */}
                {step === 3 && (
                    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="text-center">
                            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white">
                                {isAr ? 'التفاصيل الأساسية' : 'Smart Details'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {isAr ? 'تخصيص الخصائص الجوهرية لهذا القالب التعليمي.' : 'Customize the core parameters for this educational template.'}
                            </p>
                        </div>

                        <div className="space-y-6 mt-8">
                            {(selectedBlueprint === 'normal-course' || selectedBlueprint === 'leveled-course') ? (
                                <div className="space-y-6 text-start">
                                    {/* Complexity Level */}
                                    <div>
                                        <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block uppercase tracking-wide flex items-center gap-2">
                                            <LuRocket className="text-blue-500" /> {t('create_page.level_label')}
                                        </label>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            {activeLevels.map(val => {
                                                const showLock = !isPremiumUser && isLevelPremium(val);
                                                const active = formData.level === val;
                                                return (
                                                    <div
                                                        key={val}
                                                        onClick={() => handleFeatureClick('level', val)}
                                                        className={`p-3 border rounded-xl cursor-pointer text-center transition-all duration-200 flex flex-col items-center justify-center gap-1
                                                            ${active
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-500 ring-1 ring-blue-500'
                                                                : 'bg-white dark:bg-[#151515] border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-805'}`}
                                                    >
                                                        <span className={`text-xs font-bold uppercase ${active ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'}`}>
                                                            {t(`create_page.levels.${val.toLowerCase()}`) || val}
                                                        </span>
                                                        {showLock && <LuGem className="text-amber-500" size={12} />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Depth / Modules */}
                                    <div>
                                        <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block uppercase tracking-wide flex items-center gap-2">
                                            <LuLayers className="text-blue-500" /> {t('create_page.depth_label')}
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {activeDepths.map(val => {
                                                const active = formData.numModules === val;
                                                return (
                                                    <div
                                                        key={val}
                                                        onClick={() => handleFeatureClick('numModules', val)}
                                                        className={`relative p-3 border rounded-xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center min-h-[90px]
                                                            ${active
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-500 ring-1 ring-blue-500'
                                                                : 'bg-white dark:bg-[#151515] border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-805'}`}
                                                    >
                                                        <span className={`text-2xl font-black ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>{val}</span>
                                                        <span className={`text-xs font-bold uppercase ${active ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'}`}>{t('create_page.depth_unit')}</span>
                                                        {!isPremiumUser && isDepthPremium(val) && <div className="absolute top-2 right-2 text-amber-500"><LuGem size={16} /></div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Format / Media */}
                                    <div>
                                        <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block uppercase tracking-wide flex items-center gap-2">
                                            <LuBookOpen className="text-blue-500" /> {t('create_page.format_label')}
                                        </label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {activeCourseTypes.map(val => {
                                                const active = formData.type === val;
                                                const showLock = !isPremiumUser && isCourseTypePremium(val);
                                                return (
                                                    <div
                                                        key={val}
                                                        onClick={() => handleFeatureClick('type', val)}
                                                        className={`relative flex items-center p-3 md:p-4 border rounded-xl cursor-pointer transition-all duration-200 gap-4
                                                            ${active
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-500 ring-1 ring-blue-500'
                                                                : 'bg-white dark:bg-[#151515] border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-855'}`}
                                                    >
                                                        <div className={`p-2 rounded-lg ${active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                            {val.toLowerCase().includes('video') ? <LuVideo size={20} /> : <LuBookOpen size={20} />}
                                                        </div>
                                                        <div>
                                                            <span className={`block text-sm font-bold ${active ? 'text-blue-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{val}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {val.toLowerCase().includes('video') ? t('create_page.format_video_desc') : t('create_page.format_theory_desc')}
                                                            </span>
                                                        </div>
                                                        {active && <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 shadow-sm" />}
                                                        {showLock && <div className="ml-auto flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-2 py-1 rounded text-[10px] font-bold uppercase"><LuGem size={10} /> Premium</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : fieldsByCategory.essential.length > 0 ? (
                                <div className="grid grid-cols-1 gap-5">
                                    {fieldsByCategory.essential.map(field => (
                                        <div key={field.key} className="space-y-2 text-start">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1">
                                                    {getFieldLabel(field, isAr ? 'ar' : 'en')}
                                                    {field.required && <span className="text-red-500">*</span>}
                                                </span>
                                                {field.required && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">{t('create_page.required_badge')}</span>}
                                            </div>
                                            {renderBlueprintField(field)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl text-center space-y-2">
                                    <LuSparkles className="text-blue-500 mx-auto" size={32} />
                                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                                        {isAr ? 'قالب ذكي ومؤتمت بالكامل' : 'Fully Automated Template'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                        {isAr ? 'لا توجد حقول أساسية مطلوبة لهذا القالب. سيقوم NOVAIS بذكائه الاصطناعي بتحديد كافة التفاصيل تلقائياً.' : 'No essential parameters are required. NOVAIS will infer everything intelligently using advanced AI.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={() => setStep(2)}
                                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
                            >
                                <LuChevronLeft className={isAr ? 'rotate-180' : ''} /> {isAr ? 'السابق' : 'Back'}
                            </button>
                            <button
                                onClick={() => setStep(4)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
                            >
                                {isAr ? 'التالي' : 'Next'} <LuChevronRight className={isAr ? 'rotate-180' : ''} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Advanced & Optional Options */}
                {step === 4 && (
                    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="text-center">
                            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white">
                                {isAr ? 'خيارات إضافية ومتقدمة' : 'Optional & Advanced Options'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {isAr ? 'تخصيص الخيارات الإضافية للمخطط التعليمي أو تركها للذكاء الاصطناعي.' : 'Customize optional/advanced parameters, or leave them for the AI to decide.'}
                            </p>
                        </div>

                        <div className="space-y-4 mt-8">
                            {/* Optional common fields first */}
                            {fieldsByCategory.optional.length > 0 && (
                                <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 text-start">
                                    <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                        <LuSettings2 size={14} /> {isAr ? 'تفاصيل اختيارية' : 'Optional Details'}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 mt-2">
                                        {fieldsByCategory.optional.map(field => (
                                            <div key={field.key} className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                        {getFieldLabel(field, isAr ? 'ar' : 'en')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 italic">
                                                        {isAr ? 'تلقائي' : 'Auto'}
                                                    </span>
                                                </div>
                                                {renderBlueprintField(field)}
                                                {field.type !== 'boolean' && field.type !== 'select' && (
                                                    <p className="text-[10px] text-gray-400 italic">
                                                        {isAr ? 'يمكنك ترك هذا الحقل فارغاً وسيقوم NOVAIS بتحديده تلقائياً.' : 'Leave this blank and NOVAIS will infer it intelligently.'}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Collapsed Advanced Options Accordion */}
                            {fieldsByCategory.advanced.length > 0 && (
                                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-[#1a1a1a]">
                                    <div
                                        onClick={() => setAdvancedOpen(!advancedOpen)}
                                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                            <LuMenu size={16} className="text-blue-500" />
                                            {isAr ? 'تخصيص خيارات متقدمة وعناصر الهيكل' : 'Advanced Structure & Details'}
                                        </span>
                                        <LuChevronDown className={`transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    <AnimatePresence>
                                        {advancedOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-gray-100 dark:border-gray-800 p-5 space-y-4 text-start"
                                            >
                                                <div className="grid grid-cols-1 gap-4">
                                                    {fieldsByCategory.advanced.map(field => (
                                                        <div key={field.key} className="space-y-1.5">
                                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                                {getFieldLabel(field, isAr ? 'ar' : 'en')}
                                                            </span>
                                                            {renderBlueprintField(field)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {fieldsByCategory.optional.length === 0 && fieldsByCategory.advanced.length === 0 && (
                                <div className="p-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl text-center">
                                    <p className="text-xs text-gray-400 italic">
                                        {isAr ? 'لا توجد خيارات متقدمة لهذا المخطط.' : 'No advanced options are available for this blueprint.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={() => setStep(3)}
                                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
                            >
                                <LuChevronLeft className={isAr ? 'rotate-180' : ''} /> {isAr ? 'السابق' : 'Back'}
                            </button>
                            <button
                                onClick={() => setStep(5)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
                            >
                                {isAr ? 'التالي' : 'Next'} <LuChevronRight className={isAr ? 'rotate-180' : ''} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Review & Generate */}
                {step === 5 && (
                    <div className="space-y-6 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="text-center">
                            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white">
                                {isAr ? 'مراجعة وتوليد' : 'Review & Generate'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {isAr ? 'يرجى مراجعة تفاصيل المحتوى والبدء في التوليد بالذكاء الاصطناعي.' : 'Please review the summary details below and generate content.'}
                            </p>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 p-6 rounded-3xl text-start space-y-4 mt-6">
                            <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">{isAr ? 'نوع المحتوى المخطط' : 'Content Type'}</span>
                                <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                                    {getBilingualValue(activeBlueprint?.name, isAr ? 'ar' : 'en')}
                                </span>
                            </div>

                            <div className="flex flex-col border-b border-gray-100 dark:border-gray-800 pb-3 gap-1">
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">{isAr ? 'الموضوع الأساسي' : 'Topic'}</span>
                                <span className="text-base font-extrabold text-slate-800 dark:text-slate-200 leading-normal">
                                    {formData.topic}
                                </span>
                            </div>

                            <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">{t('create_page.lang_label')}</span>
                                <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                                    {getLanguageDisplayName(formData.language, isAr ? 'ar' : 'en')}
                                </span>
                            </div>

                            {/* Note about auto inference */}
                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl flex items-start gap-3 border border-blue-100/30 dark:border-blue-900/20">
                                <LuSparkles className="text-blue-500 shrink-0 mt-0.5" size={16} />
                                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                    {isAr 
                                        ? 'سيقوم NOVAIS تلقائياً باستنتاج باقي المعايير والتفاصيل غير المحددة بدقة تعليمية فائقة بناءً على فكرتك الأساسية.'
                                        : 'NOVAIS will intelligently infer any unspecified parameters or format requirements to maximize educational quality.'}
                                </p>
                            </div>
                        </div>

                        {/* Preflight validation error message */}
                        {validationError && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-950 text-start animate-in fade-in">
                                {validationError}
                            </div>
                        )}

                        {/* Navigation buttons and Generate CTA */}
                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={!formData.topic || creationDisabled}
                                className="w-full relative group overflow-hidden bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:-translate-y-0.5"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <LuWand size={20} className="animate-pulse" />
                                    {isAr ? 'توليد الآن' : 'Generate Now'}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_auto] animate-gradient"></div>
                            </button>

                            <button
                                onClick={() => setStep(4)}
                                className="bg-gray-105 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-2xl font-bold text-sm transition-all"
                            >
                                {isAr ? 'العودة للخلف' : 'Go Back'}
                            </button>
                        </div>
                    </div>
                )}
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



