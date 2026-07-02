import React, { useEffect, useState, useCallback, useMemo } from 'react';

import { useNavigate, useLocation, useParams } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { motion, AnimatePresence } from 'framer-motion';

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';

import 'react-circular-progressbar/dist/styles.css';

import axios from 'axios';

import { toast } from 'react-toastify';



// Components

import StyledText from '../components/styledText';

import ChatBot from '../components/HumanUI/ChatBot';

import ExportModal from '../components/ExportModal';

import NotesSidebar from '../components/NotesSidebar';

import MediaCard from '../components/ui/MediaCard';

import MouseBackground from '../components/common/MouseBackground';



// Icons

import {

    LuHouse,

    LuAward,

    LuDownload,

    LuShare2,

    LuMoon,

    LuSun,

    LuChevronDown,

    LuCheck,

    LuMenu,

    LuX,

    LuFileText,

    LuChevronLeft,

    LuChevronRight,

    LuHeadphones,

    LuBookOpen

} from "react-icons/lu";

import { FiCpu, FiFileText, FiImage, FiVideo, FiLoader, FiActivity, FiServer } from "react-icons/fi";

// import { IoSparkles } from "react-icons/io5"; // Unused

import { serverURL, logo } from '../constants';



const normalizeObject = (value) => {

    if (!value || Array.isArray(value) || typeof value !== 'object') return {};

    return value;

};



const mergeSavedLessonsIntoMetadata = (metadata, lessons = []) => {

    const updated = JSON.parse(JSON.stringify(metadata || {}));

    const lessonByTitle = new Map(

        lessons

            .filter(lesson => lesson?.title)

            .map(lesson => [lesson.title, lesson])

    );



    for (const key of ['chapters', 'topics', 'content']) {

        if (!Array.isArray(updated[key])) continue;



        updated[key] = updated[key].map(chapter => {

            const subtopics = chapter.subtopics || chapter.sections || [];

            const mergedSubtopics = subtopics.map(subtopic => {

                const saved = lessonByTitle.get(subtopic.title);

                if (!saved) return subtopic;



                const savedMetadata = normalizeObject(saved.metadata);

                const savedMediaMetadata = { ...savedMetadata };

                if (saved.media_url && saved.media_type === 'image' && !savedMediaMetadata.images?.length) {

                    savedMediaMetadata.images = [{

                        url: saved.media_url,

                        title: saved.title,

                        source: 'course',

                        verified: true,

                        score: 1

                    }];

                }

                if (saved.media_url && saved.media_type === 'video' && !savedMediaMetadata.videos?.length) {

                    savedMediaMetadata.videos = [{

                        url: saved.media_url,

                        title: saved.title,

                        platform: 'video',

                        metadata: normalizeObject(saved.metadata),

                        verified: true,

                        score: 1

                    }];

                }



                return {

                    ...subtopic,

                    content: saved.content || subtopic.content,

                    theory: saved.content || subtopic.theory,

                    metadata: Object.keys(savedMediaMetadata).length ? savedMediaMetadata : subtopic.metadata,

                    done: Boolean(saved.content) || subtopic.done,

                };

            });



            return chapter.subtopics

                ? { ...chapter, subtopics: mergedSubtopics }

                : { ...chapter, sections: mergedSubtopics };

        });

    }



    return updated;

};



const Course = () => {

    const { t, i18n } = useTranslation();

    const navigate = useNavigate();

    const { courseId: urlCourseId } = useParams();

    const { state } = useLocation();

    const { mainTopic: stateMainTopic, courseId: stateCourseId, jsonData: stateData } = state || {};

    const courseId = stateCourseId || urlCourseId;



    const [mainTopic, setMainTopic] = useState(stateMainTopic || '');

    const [jsonData, setJsonData] = useState(stateData);

    const [loading, setLoading] = useState(false);

    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const [isNotesOpen, setIsNotesOpen] = useState(false);

    const [dbCourseId, setDbCourseId] = useState(null);

    const [chatHistory, setChatHistory] = useState([]);

    const [quizResult, setQuizResult] = useState(null);

    const [blueprintSlug, setBlueprintSlug] = useState(stateData?.blueprint_slug || null);

    const [generatingSectionTitle, setGeneratingSectionTitle] = useState('');

    const [showAnswers, setShowAnswers] = useState(false);
    const [prepError, setPrepError] = useState('');
    const activePreparationRef = React.useRef(null);



    const layoutMode = useMemo(() => {

        if (!blueprintSlug) return 'loading';

        const documentSlugs = ['book', 'graduation-project', 'master-thesis', 'study-review'];

        const questionSlugs = ['question-bank', 'exam-builder', 'assignment-builder'];

        const storySlugs = ['story'];



        if (documentSlugs.includes(blueprintSlug)) return 'document';

        if (questionSlugs.includes(blueprintSlug)) return 'question';

        if (storySlugs.includes(blueprintSlug)) return 'story';

        return 'course';

    }, [blueprintSlug]);



    const getDynamicLabel = (key) => {

        const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';



        const labels = {

            progress: {

                'normal-course': lang === 'ar' ? 'تقدم الدورة' : 'Course Progress',

                'leveled-course': lang === 'ar' ? 'تقدم الدورة' : 'Course Progress',

                'interactive-practical-course': lang === 'ar' ? 'تقدم الدورة العمليّة' : 'Practical Course Progress',

                'academic-course': lang === 'ar' ? 'تقدم الدورة الأكاديمية' : 'Academic Course Progress',

                'study-review': lang === 'ar' ? 'تقدم المراجعة' : 'Review Progress',

                'question-bank': lang === 'ar' ? 'تقدم بنك الأسئلة' : 'Question Bank Progress',

                'exam-builder': lang === 'ar' ? 'تقدم الامتحان' : 'Exam Progress',

                'book': lang === 'ar' ? 'تقدم الكتاب' : 'Book Progress',

                'story': lang === 'ar' ? 'تقدم القصة' : 'Story Progress',

                'graduation-project': lang === 'ar' ? 'تقدم وثيقة مشروع التخرج' : 'Graduation Project Document Progress',

                'master-thesis': lang === 'ar' ? 'تقدم أطروحة الماجستير' : 'Thesis Progress',

                'lesson-plan': lang === 'ar' ? 'تقدم خطة الدرس' : 'Lesson Plan Progress',

                'assignment-builder': lang === 'ar' ? 'تقدم التكليف' : 'Assignment Progress',

                'project-based-learning': lang === 'ar' ? 'تقدم التعلم بالمشاريع' : 'PBL Progress',

                default: lang === 'ar' ? 'تقدم الدورة' : 'Course Progress'

            },

            layer: {

                'normal-course': lang === 'ar' ? 'الدرس' : 'Lesson',

                'leveled-course': lang === 'ar' ? 'الدرس' : 'Lesson',

                'interactive-practical-course': lang === 'ar' ? 'الدرس' : 'Lesson',

                'academic-course': lang === 'ar' ? 'المحاضرة' : 'Lecture',

                'study-review': lang === 'ar' ? 'الموضوع' : 'Topic',

                'question-bank': lang === 'ar' ? 'السؤال' : 'Question',

                'exam-builder': lang === 'ar' ? 'السؤال' : 'Question',

                'book': lang === 'ar' ? 'الفصل' : 'Chapter',

                'story': lang === 'ar' ? 'الفصل' : 'Chapter',

                'graduation-project': lang === 'ar' ? 'قسم الوثيقة' : 'Document Section',

                'master-thesis': lang === 'ar' ? 'القسم' : 'Section',

                'lesson-plan': lang === 'ar' ? 'الخطوة' : 'Step',

                'assignment-builder': lang === 'ar' ? 'المهمة' : 'Task',

                'project-based-learning': lang === 'ar' ? 'المرحلة' : 'Phase',

                default: lang === 'ar' ? 'المستوى' : 'Level'

            },

            prev: {

                'normal-course': lang === 'ar' ? 'الدرس السابق' : 'Previous Lesson',

                'leveled-course': lang === 'ar' ? 'الدرس السابق' : 'Previous Lesson',

                'interactive-practical-course': lang === 'ar' ? 'الدرس السابق' : 'Previous Lesson',

                'academic-course': lang === 'ar' ? 'المحاضرة السابقة' : 'Previous Lecture',

                'study-review': lang === 'ar' ? 'الموضوع السابق' : 'Previous Topic',

                'question-bank': lang === 'ar' ? 'السؤال السابق' : 'Previous Question',

                'exam-builder': lang === 'ar' ? 'السؤال السابق' : 'Previous Question',

                'book': lang === 'ar' ? 'الفصل السابق' : 'Previous Chapter',

                'story': lang === 'ar' ? 'الفصل السابق' : 'Previous Chapter',

                'graduation-project': lang === 'ar' ? 'قسم الوثيقة السابق' : 'Previous Document Section',

                'master-thesis': lang === 'ar' ? 'القسم السابق' : 'Previous Section',

                'lesson-plan': lang === 'ar' ? 'الخطوة السابقة' : 'Previous Step',

                'assignment-builder': lang === 'ar' ? 'المهمة السابقة' : 'Previous Task',

                'project-based-learning': lang === 'ar' ? 'المرحلة السابقة' : 'Previous Phase',

                default: lang === 'ar' ? 'السابق' : 'Previous'

            },

            next: {

                'normal-course': lang === 'ar' ? 'الدرس التالي' : 'Next Lesson',

                'leveled-course': lang === 'ar' ? 'الدرس التالي' : 'Next Lesson',

                'interactive-practical-course': lang === 'ar' ? 'الدرس التالي' : 'Next Lesson',

                'academic-course': lang === 'ar' ? 'المحاضرة التالية' : 'Next Lecture',

                'study-review': lang === 'ar' ? 'الموضوع التالي' : 'Next Topic',

                'question-bank': lang === 'ar' ? 'السؤال التالي' : 'Next Question',

                'exam-builder': lang === 'ar' ? 'السؤال التالي' : 'Next Question',

                'book': lang === 'ar' ? 'الفصل التالي' : 'Next Chapter',

                'story': lang === 'ar' ? 'الفصل التالي' : 'Next Chapter',

                'graduation-project': lang === 'ar' ? 'قسم الوثيقة التالي' : 'Next Document Section',

                'master-thesis': lang === 'ar' ? 'القسم التالي' : 'Next Section',

                'lesson-plan': lang === 'ar' ? 'الخطوة التالية' : 'Next Step',

                'assignment-builder': lang === 'ar' ? 'المهمة التالية' : 'Next Task',

                'project-based-learning': lang === 'ar' ? 'المرحلة التالية' : 'Next Phase',

                default: lang === 'ar' ? 'التالي' : 'Next'

            },

            exam_btn: {

                'normal-course': lang === 'ar' ? 'بدء الاختبار النهائي' : 'Start Final Exam',

                'leveled-course': lang === 'ar' ? 'بدء الاختبار النهائي' : 'Start Final Exam',

                'interactive-practical-course': lang === 'ar' ? 'بدء الاختبار النهائي' : 'Start Final Exam',

                'academic-course': lang === 'ar' ? 'بدء التقييم النهائي' : 'Start Final Assessment',

                'study-review': lang === 'ar' ? 'بدء المراجعة النهائية' : 'Start Final Revision',

                'question-bank': lang === 'ar' ? 'تقديم الأسئلة' : 'Submit Questions',

                'exam-builder': lang === 'ar' ? 'تقديم الامتحان' : 'Submit Exam',

                'book': lang === 'ar' ? 'بدء التقييم النهائي' : 'Start Final Assessment',

                'story': lang === 'ar' ? 'بدء التقييم النهائي' : 'Start Final Assessment',

                'graduation-project': lang === 'ar' ? 'بدء التقييم النهائي' : 'Start Final Assessment',

                'master-thesis': lang === 'ar' ? 'بدء التقييم النهائي' : 'Start Final Assessment',

                'lesson-plan': lang === 'ar' ? 'بدء التقييم النهائي' : 'Start Final Assessment',

                'assignment-builder': lang === 'ar' ? 'تقديم التكليف' : 'Submit Assignment',

                'project-based-learning': lang === 'ar' ? 'بدء التقييم النهائي' : 'Start Final Assessment',

                default: lang === 'ar' ? 'بدء الاختبار' : 'Start Exam'

            }

        };



        return labels[key]?.[blueprintSlug] || labels[key]?.default || t(`sidebar.${key}`) || key;

    };



    const [selectedSubtopic, setSelectedSubtopic] = useState('');

    const [showPrepButton, setShowPrepButton] = useState(false);

    const [pendingLesson, setPendingLesson] = useState(null);

    const [hasStartedJourney, setHasStartedJourney] = useState(false);

    const [lessonContent, setLessonContent] = useState({

        theory: '',

        examples: '',

        media: '',

        images: [],

        videos: []

    });



    const [prepLogLines, setPrepLogLines] = useState([]);

    const [prepProgress, setPrepProgress] = useState(0);

    const [prepStep, setPrepStep] = useState(0); // 0: Analyzing, 1: Structuring, 2: Assets, 3: Finalizing



    const [expandedChapters, setExpandedChapters] = useState({});



    // Auth & Dark Mode Effect

    useEffect(() => {

        if (!localStorage.getItem('token')) {

            navigate('/signin');

            return;

        }

        if (isDarkMode) {

            document.documentElement.classList.add('dark');

        } else {

            document.documentElement.classList.remove('dark');

        }

        localStorage.setItem('darkMode', isDarkMode);

        window.dispatchEvent(new Event('themeChange'));

    }, [isDarkMode, navigate]);



    const scrollToSection = (title) => {

        const slugified = title.replace(/\s+/g, '-');

        const el = document.getElementById(`section-${slugified}`);

        if (el) {

            el.scrollIntoView({ behavior: 'smooth', block: 'start' });

        }

    };



    const renderContentWithPlaceholders = (text, isAr, isAcademic = false) => {

        if (!text) return null;

        const regex = /(\[(?:IMAGE|DIAGRAM|TABLE)\s+PLACEHOLDER:\s*[^\]]+\])/gi;

        const parts = text.split(regex);

        return parts.map((part, index) => {

            const match = /\[(IMAGE|DIAGRAM|TABLE)\s+PLACEHOLDER:\s*([^\]]+)\]/i.exec(part);

            if (match) {

                const type = match[1].toUpperCase();

                const desc = match[2];

                const isTable = type === 'TABLE';

                const isDiagram = type === 'DIAGRAM';

                return (

                    <div key={index} className="my-8 p-6 bg-slate-50 dark:bg-slate-900/40 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start transition-all hover:border-blue-500/50">

                        <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">

                            {isTable ? <LuFileText size={28} /> : isDiagram ? <FiActivity size={28} /> : <FiImage size={28} />}

                        </div>

                        <div>

                            <div className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">

                                {isTable ? (isAr ? 'موضع جدول مقترح' : 'Suggested Table Placeholder') : isDiagram ? (isAr ? 'موضع رسم توضيحي مقترح' : 'Suggested Diagram Placeholder') : (isAr ? 'موضع صورة مقترحة' : 'Suggested Image Placeholder')}

                            </div>

                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">

                                {desc}

                            </p>

                        </div>

                    </div>

                );

            }

            return <StyledText key={index} text={part} isRtl={isAr} isAcademic={isAcademic} />;

        });

    };



    const renderDocumentLayout = () => {

        const rawFields = jsonData?.blueprint_fields || {};
        const blueprintFields = { ...rawFields };
        if (jsonData?.language === 'English' && jsonData?.translated_fields) {
            const tf = jsonData.translated_fields;
            if (tf.university_name) blueprintFields.university = tf.university_name;
            if (tf.faculty) blueprintFields.faculty = tf.faculty;
            if (tf.department) blueprintFields.department = tf.department;
            if (tf.specialization) blueprintFields.specialization = tf.specialization;
            if (tf.student_names) blueprintFields.student_names = tf.student_names;
            if (tf.supervisor_names) blueprintFields.supervisor_names = tf.supervisor_names;
        }

        return (

            <div className="w-full max-w-4xl mx-auto py-10" dir={isArabic ? 'rtl' : 'ltr'}>

                {/* 1. Academic Cover Sheet */}

                <div className="bg-white dark:bg-[#111111] border border-gray-200/60 dark:border-gray-800 rounded-[32px] p-8 md:p-16 shadow-2xl mb-12 text-center relative overflow-hidden">

                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full pointer-events-none" />

                    <div className="border-b-2 border-double border-gray-200 dark:border-gray-800 pb-8 mb-12">

                        {blueprintFields.university_name && (

                            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-wide">{blueprintFields.university_name}</h3>

                        )}

                        {blueprintFields.faculty && (

                            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">{blueprintFields.faculty}</p>

                        )}

                        {blueprintFields.department && (

                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-0.5">{blueprintFields.department}</p>

                        )}

                    </div>

                    <div className="my-16">

                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-6">

                            {blueprintSlug === 'graduation-project' ? (isArabic ? 'مشروع التخرج النهائي' : 'Graduation Project Book') : blueprintSlug === 'master-thesis' ? (isArabic ? 'رسالة ماجستير علمية' : 'Master Thesis') : (isArabic ? 'كتاب تعليمي متكامل' : 'Academic Book')}

                        </span>

                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight max-w-2xl mx-auto select-all">

                            {mainTopic}

                        </h1>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-start max-w-xl mx-auto border-t border-gray-100 dark:border-gray-800/50 pt-8 mt-16 text-sm">

                        {blueprintFields.specialization && (

                            <div>

                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">{isArabic ? 'التخصص الدراسي' : 'Specialization'}</span>

                                <span className="font-bold text-gray-900 dark:text-white">{blueprintFields.specialization}</span>

                            </div>

                        )}

                        {blueprintFields.student_names && (

                            <div>

                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">{isArabic ? 'إعداد الطلاب / الباحث' : 'Prepared By'}</span>

                                <span className="font-bold text-gray-900 dark:text-white whitespace-pre-line">{blueprintFields.student_names}</span>

                            </div>

                        )}

                        {blueprintFields.supervisor_names && (

                            <div className="md:col-span-2">

                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">{isArabic ? 'إشراف لجنة الأساتذة' : 'Supervised By'}</span>

                                <span className="font-bold text-gray-900 dark:text-white whitespace-pre-line">{blueprintFields.supervisor_names}</span>

                            </div>

                        )}

                    </div>

                    <div className="mt-20 text-xs text-gray-400 font-bold tracking-widest border-t border-gray-100 dark:border-gray-800/30 pt-6">

                        {blueprintFields.academic_year || new Date().getFullYear()}

                    </div>

                </div>



                {/* 2. Table of Contents List */}

                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-[32px] p-8 md:p-10 shadow-2xl mb-12 text-start">

                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">

                        {isArabic ? 'الفهرس العام' : 'Table of Contents'}

                    </h2>

                    <div className="space-y-3">

                        {flatTopics.map((item, idx) => (

                            <button

                                key={idx}

                                onClick={() => scrollToSection(item.subtopicTitle)}

                                className="w-full flex justify-between items-center py-2.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold transition-all text-start"

                            >

                                <span className="flex items-center gap-3">

                                    <span className="text-blue-500 text-sm font-black">{idx + 1}.</span>

                                    <span>{item.subtopicTitle}</span>

                                </span>

                                <span className="text-gray-400 dark:text-gray-600 text-xs">➔</span>

                            </button>

                        ))}

                    </div>

                </div>



                {/* 3. Continuous Content Reader Sections */}

                <div className="space-y-12">

                    {flatTopics.map((item, idx) => {

                        const hasContent = item.subtopicObj.content || item.subtopicObj.theory;

                        const isGeneratingThis = loading && generatingSectionTitle === item.subtopicTitle;

                        const sectionId = `section-${item.subtopicTitle.replace(/\s+/g, '-')}`;

                        return (

                            <div key={idx} id={sectionId} className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-[32px] p-8 md:p-12 shadow-2xl text-start scroll-mt-24 transition-all hover:shadow-blue-500/5">

                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800/80 pb-6 mb-8">

                                    <h2 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight">

                                        {item.subtopicTitle}

                                    </h2>

                                    <span className="text-xs font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">

                                        {getDynamicLabel('layer')} {idx + 1}

                                    </span>

                                </div>

                                {isGeneratingThis ? (

                                    <div className="py-8 flex flex-col items-center justify-center">

                                        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">

                                            <FiLoader size={48} className="animate-spin text-blue-600" />

                                            <img src={logo} alt="Processing" className="w-[20px] h-[20px] absolute object-contain animate-pulse" />

                                        </div>

                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('footer.magic_title')}</h4>

                                        <div className="w-full max-w-md bg-slate-950 text-slate-300 font-mono text-[11px] p-4 rounded-xl text-left border border-slate-800">

                                            {prepLogLines.map((line, i) => (

                                                <div key={i} className="flex gap-2">

                                                    <span className="text-blue-500 font-bold">~</span>

                                                    <span>{line}</span>

                                                </div>

                                            ))}

                                        </div>

                                    </div>

                                ) : hasContent ? (

                                    <div
                                        className="prose prose-lg dark:prose-invert max-w-none prose-p:text-[17px] md:prose-p:text-[19px] prose-p:leading-[1.8] prose-p:text-gray-700 dark:prose-p:text-gray-300 select-text"
                                        style={{
                                            fontFamily: isArabic
                                                ? "'Amiri', 'Times New Roman', serif"
                                                : "'Lora', Georgia, serif",
                                        }}
                                    >

                                        {renderContentWithPlaceholders(item.subtopicObj.theory || item.subtopicObj.content, isArabic, true)}

                                        {item.subtopicObj.examples && (
                                            <div className="mt-12 border-t border-gray-150 dark:border-gray-800 pt-8">
                                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                                    {isArabic ? 'دراسة حالة وتطبيق عملي' : 'Case Study & Practical Application'}
                                                </h4>
                                                {renderContentWithPlaceholders(item.subtopicObj.examples, isArabic, true)}
                                            </div>
                                        )}

                                    </div>

                                ) : (

                                    <div className="py-12 text-center">

                                        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-white/10 text-gray-400">

                                            <LuBookOpen size={28} />

                                        </div>

                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">

                                            {isArabic ? 'هذا القسم من الوثيقة لم يتم توليده بعد.' : 'This section of the document has not been generated yet.'}

                                        </p>

                                        <button

                                            onClick={() => handlePrepareLessonInternal(item.chapterTitle, item.subtopicTitle, item.subtopicObj)}

                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all"

                                        >

                                            {isArabic ? 'توليد القسم الآن' : 'Generate Section Now'}

                                        </button>

                                    </div>

                                )}

                            </div>

                        );

                    })}

                </div>

            </div>

        );

    };



    const renderQuestionLayout = () => {

        return (

            <div className="w-full max-w-4xl mx-auto py-10" dir={isArabic ? 'rtl' : 'ltr'}>

                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-[32px] p-8 md:p-12 shadow-2xl mb-12 text-start">

                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800/80 pb-6 mb-8">

                        <div>

                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">

                                {isArabic ? 'بنك الأسئلة / نموذج امتحان' : 'Question Bank / Exam'}

                            </span>

                            <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mt-3">

                                {mainTopic}

                            </h1>

                        </div>

                        <button

                            onClick={() => setShowAnswers(!showAnswers)}

                            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-90 transition-all self-start"

                        >

                            {showAnswers ? (isArabic ? 'إخفاء الإجابات النموذجية' : 'Hide Answer Key') : (isArabic ? 'عرض الإجابات النموذجية' : 'Show Answer Key')}

                        </button>

                    </div>

                    <div className="space-y-8">

                        {flatTopics.map((item, idx) => {

                            const hasContent = item.subtopicObj.content || item.subtopicObj.theory;

                            const isGeneratingThis = loading && generatingSectionTitle === item.subtopicTitle;

                            const sectionId = `section-${item.subtopicTitle.replace(/\s+/g, '-')}`;

                            return (

                                <div key={idx} id={sectionId} className="border-b border-gray-100 dark:border-gray-850 pb-8 last:border-0 last:pb-0 scroll-mt-24">

                                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">

                                        <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center shrink-0">

                                            {idx + 1}

                                        </span>

                                        <span>{item.subtopicTitle}</span>

                                    </h3>

                                    {isGeneratingThis ? (

                                        <div className="py-6 flex flex-col items-center justify-center">

                                            <FiLoader size={32} className="animate-spin text-blue-600 mb-4" />

                                            <div className="w-full max-w-md bg-slate-950 text-slate-300 font-mono text-[10px] p-4 rounded-xl text-left border border-slate-800">

                                                {prepLogLines.map((line, i) => (

                                                    <div key={i} className="flex gap-1">

                                                        <span className="text-blue-500 font-bold">~</span>

                                                        <span>{line}</span>

                                                    </div>

                                                ))}

                                            </div>

                                        </div>

                                    ) : hasContent ? (

                                        <div className="prose prose-lg dark:prose-invert max-w-none ml-8">

                                            {renderContentWithPlaceholders(item.subtopicObj.theory || item.subtopicObj.content, isArabic, true)}

                                            {showAnswers && item.subtopicObj.examples && (

                                                <div className="not-prose mt-6 bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900/30 rounded-2xl p-6">

                                                    <h4 className="text-xs font-black text-green-700 dark:text-green-400 mb-3 uppercase tracking-wider">

                                                        {isArabic ? 'الإجابة النموذجية وتوزيع الدرجات' : 'Model Answer & Rubric'}

                                                    </h4>

                                                    {renderContentWithPlaceholders(item.subtopicObj.examples, isArabic, true)}

                                                </div>

                                            )}

                                        </div>

                                    ) : (

                                        <div className="py-6 ml-8 text-start flex items-center justify-between bg-slate-50 dark:bg-white/5 p-6 rounded-2xl">

                                            <span className="text-xs text-gray-400">{isArabic ? 'الأسئلة لم يتم توليدها بعد.' : 'Questions have not been generated yet.'}</span>

                                            <button

                                                onClick={() => handlePrepareLessonInternal(item.chapterTitle, item.subtopicTitle, item.subtopicObj)}

                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"

                                            >

                                                {isArabic ? 'توليد الأسئلة' : 'Generate'}

                                            </button>

                                        </div>

                                    )}

                                </div>

                            );

                        })}

                    </div>

                </div>

            </div>

        );

    };



    const renderStoryLayout = () => {

        return (

            <div className="w-full max-w-3xl mx-auto py-10" dir={isArabic ? 'rtl' : 'ltr'}>

                <div className="bg-[#fcfbf7] dark:bg-[#141414] border border-amber-100/50 dark:border-gray-800 rounded-[32px] p-8 md:p-12 shadow-xl mb-12 text-start font-serif">

                    <div className="text-center border-b border-amber-100 dark:border-gray-800/80 pb-8 mb-12">

                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">

                            {isArabic ? 'رواية / قصة مصورة' : 'Novel / Illustrated Story'}

                        </span>

                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mt-6 mb-4">

                            {mainTopic}

                        </h1>

                    </div>

                    <div className="space-y-12">

                        {flatTopics.map((item, idx) => {

                            const hasContent = item.subtopicObj.content || item.subtopicObj.theory;

                            const isGeneratingThis = loading && generatingSectionTitle === item.subtopicTitle;

                            const sectionId = `section-${item.subtopicTitle.replace(/\s+/g, '-')}`;

                            return (

                                <div key={idx} id={sectionId} className="space-y-6 scroll-mt-24">

                                    <h3 className="text-xl md:text-2xl font-black text-amber-800 dark:text-amber-500 border-b border-amber-50 dark:border-gray-800 pb-3">

                                        {item.subtopicTitle}

                                    </h3>

                                    {isGeneratingThis ? (

                                        <div className="py-6 flex flex-col items-center justify-center">

                                            <FiLoader size={32} className="animate-spin text-amber-600 mb-4" />

                                            <div className="w-full max-w-md bg-slate-950 text-slate-300 font-mono text-[10px] p-4 rounded-xl text-left border border-slate-800">

                                                {prepLogLines.map((line, i) => (

                                                    <div key={i} className="flex gap-1">

                                                        <span className="text-blue-500 font-bold">~</span>

                                                        <span>{line}</span>

                                                    </div>

                                                ))}

                                            </div>

                                        </div>

                                    ) : hasContent ? (

                                        <div className="prose prose-lg dark:prose-invert max-w-none text-slate-800 dark:text-slate-300 leading-relaxed text-[18px] md:text-[20px]">

                                            {renderContentWithPlaceholders(item.subtopicObj.theory || item.subtopicObj.content, isArabic, true)}

                                        </div>

                                    ) : (

                                        <div className="py-6 text-center bg-amber-50/20 dark:bg-white/5 p-6 rounded-2xl border border-dashed border-amber-100 dark:border-gray-800">

                                            <p className="text-sm text-gray-500 mb-4">{isArabic ? 'هذا الفصل لم يكتب بعد.' : 'This chapter has not been written yet.'}</p>

                                            <button

                                                onClick={() => handlePrepareLessonInternal(item.chapterTitle, item.subtopicTitle, item.subtopicObj)}

                                                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all shadow-md"

                                            >

                                                {isArabic ? 'اكتب هذا الفصل الآن' : 'Write Chapter Now'}

                                            </button>

                                        </div>

                                    )}

                                </div>

                            );

                        })}

                    </div>

                </div>

            </div>

        );

    };



    // Derived topics array

    const topics = useMemo(() => {

        if (!jsonData) return [];

        const possibleKeys = ['chapters', 'topics', 'content'];

        for (const key of possibleKeys) {

            if (Array.isArray(jsonData[key])) return jsonData[key];

        }

        if (mainTopic && Array.isArray(jsonData[mainTopic])) return jsonData[mainTopic];

        return [];

    }, [jsonData, mainTopic]);



    const isArabic = useMemo(() => jsonData?.language?.toLowerCase().startsWith('ar'), [jsonData]);



    // Derived percentage - more reliable than useEffect + useState

    const percentage = useMemo(() => {

        let total = 0, done = 0;

        topics.forEach(t => {

            const subs = t.subtopics || t.sections || [];

            total += subs.length;

            subs.forEach(s => { if (s.done) done++ });

        });

        return total > 0 ? Math.round((done / total) * 100) : 0;

    }, [topics]);



    const syncProgress = useCallback(async (updatedData) => {

        try {

            const token = localStorage.getItem('token');

            if (!token) return;



            localStorage.setItem('jsonData', JSON.stringify(updatedData));

            setJsonData(prev => ({ ...updatedData }));



            await axios.put(`${serverURL}/courses/${courseId}`, {

                metadata: updatedData

            }, { headers: { Authorization: `Bearer ${token}` } });



        } catch (e) {

            console.error("Progress sync failed", e);

            if (e.response?.status === 401) navigate('/signin');

        }

    }, [courseId, navigate]);



    const handlePrepareLessonInternal = useCallback(async (chapterTitle, subtopicTitle, subtopicObj) => {

        const preparationKey = `${chapterTitle}::${subtopicTitle}`;
        if (activePreparationRef.current === preparationKey) return;
        activePreparationRef.current = preparationKey;
        setPrepError('');
        setGeneratingSectionTitle(subtopicTitle);

        setLoading(true);

        setShowPrepButton(false);

        setPrepProgress(0);

        setPrepProgress(0);

        setPrepStep(0);

        setPrepLogLines([t('footer.logs.init'), t('footer.logs.sync')]);



        const progressInterval = setInterval(() => {

            setPrepProgress(prev => {

                if (prev >= 95) return prev;

                let nextVal = prev + (Math.random() * 1.5);

                let step = Math.floor(nextVal / 25);

                setPrepStep(step);

                return nextVal;

            });

        }, 350);



        const isVideoCourse = jsonData?.type?.toLowerCase().includes('video');

        const mediaLog = isVideoCourse

            ? t('footer.logs.video')

            : t('footer.logs.image');



        const lessonLogs = [

            t('footer.logs.target', { topic: subtopicTitle }),

            t('footer.logs.analyzing'),

            t('footer.logs.constraints'),

            t('footer.logs.path'),

            t('footer.logs.outline'),

            t('footer.logs.theory'),

            t('footer.logs.examples'),

            mediaLog,

            t('footer.logs.schema'),

            t('footer.logs.finalizing')

        ];

        let logIndex = 0;

        const logInterval = setInterval(() => {

            if (logIndex < lessonLogs.length) {

                setPrepLogLines(prev => [...prev.slice(-3), lessonLogs[logIndex]]);

                logIndex++;

            }

        }, 1200);



        try {

            const token = localStorage.getItem('token');

            const res = await axios.post(`${serverURL}/generate-lesson`, {

                course_id: courseId,

                chapter_title: chapterTitle,

                subtopic_title: subtopicTitle,

                language: jsonData.language || 'en'

            }, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 90000
            });



            if (res.data.success) {

                setPrepProgress(100);

                setTimeout(() => setPrepLogLines(prev => [...prev.slice(-3), t('footer.logs.success')]), 200);



                const newContent = res.data.data;

                const updatedJson = JSON.parse(JSON.stringify(jsonData));



                let found = false;

                for (const key of ['chapters', 'topics', 'content']) {

                    if (Array.isArray(updatedJson[key])) {

                        for (const chap of updatedJson[key]) {

                            const subs = chap.subtopics || chap.sections || [];

                            const subPath = subs.find(st => st.title === subtopicTitle);

                            if (subPath) {

                                Object.assign(subPath, newContent);

                                if (!subPath.done) subPath.done = true;

                                found = true;

                                break;

                            }

                        }

                    }

                }



                if (!found && Array.isArray(updatedJson[mainTopic])) {

                    const subPath = updatedJson[mainTopic].find(st => st.title === subtopicTitle);

                    if (subPath) {

                        Object.assign(subPath, newContent);

                        if (!subPath.done) subPath.done = true;

                    }

                }



                const meta = newContent.metadata || {};



                setLessonContent({

                    theory: newContent.content || newContent.theory,

                    examples: newContent.examples,

                    images: meta.images || [],

                    videos: meta.videos || []

                });



                syncProgress(updatedJson);

                setPendingLesson(null);

                setHasStartedJourney(true);

            }

        } catch (e) {

            console.error("Lesson generation failed:", e);

            setPrepError(e.code === 'ECONNABORTED'
                ? (isArabic ? 'استغرق تجهيز هذا الدرس وقتًا أطول من المتوقع. حاول مرة أخرى.' : 'Lesson preparation took longer than expected. Please retry.')
                : (e.response?.data?.message || t('footer.load_fail')));
            toast.error(e.response?.data?.message || t('footer.load_fail'));

            setShowPrepButton(true);

        } finally {

            clearInterval(progressInterval);

            clearInterval(logInterval);

            activePreparationRef.current = null;
            setGeneratingSectionTitle('');

            setLoading(false);

        }

    }, [jsonData, mainTopic, syncProgress, courseId, t, isArabic]);



    const handleSelect = useCallback(async (chapterTitle, subtopicTitle, subtopicObj, forceAuto = false) => {

        setSelectedSubtopic(subtopicTitle);
        setPrepError('');



        if (!subtopicObj.content && !subtopicObj.theory) {

            setLessonContent({ theory: '', examples: '', images: [], videos: [] });

            setPendingLesson({ chapterTitle, subtopicTitle, subtopicObj });



            // If journey has started or navigation forced automation, prepare immediately

            if (hasStartedJourney || forceAuto) {

                setShowPrepButton(false);

                handlePrepareLessonInternal(chapterTitle, subtopicTitle, subtopicObj);

            } else {

                setShowPrepButton(true);

            }

            return;

        }



        setShowPrepButton(false);

        setPendingLesson(null);



        const meta = subtopicObj.metadata || {};

        setLessonContent({

            theory: subtopicObj.theory || subtopicObj.content,

            examples: subtopicObj.examples,

            images: meta.images || [],

            videos: meta.videos || []

        });



        if (!subtopicObj.done) {

            const updatedJson = JSON.parse(JSON.stringify(jsonData));

            let found = false;

            for (const key of ['chapters', 'topics', 'content']) {

                if (Array.isArray(updatedJson[key])) {

                    for (const chap of updatedJson[key]) {

                        const subs = chap.subtopics || chap.sections || [];

                        const sub = subs.find(st => st.title === subtopicTitle);

                        if (sub) {

                            sub.done = true;

                            found = true;

                            break;

                        }

                    }

                }

            }



            if (!found && Array.isArray(updatedJson[mainTopic])) {

                const sub = updatedJson[mainTopic].find(st => st.title === subtopicTitle);

                if (sub) sub.done = true;

            }



            syncProgress(updatedJson);

        }

    }, [jsonData, syncProgress, mainTopic, hasStartedJourney, handlePrepareLessonInternal]);



    const handlePrepareLesson = () => {

        if (!pendingLesson) return;

        handlePrepareLessonInternal(pendingLesson.chapterTitle, pendingLesson.subtopicTitle, pendingLesson.subtopicObj);

    };







    const flatTopics = useMemo(() => {

        const flat = [];

        topics.forEach(topic => {

            const subs = topic.subtopics || topic.sections || [];

            subs.forEach(sub => {

                flat.push({

                    chapterTitle: topic.title,

                    subtopicTitle: sub.title,

                    subtopicObj: sub

                });

            });

        });

        return flat;

    }, [topics]);



    const currentIndex = useMemo(() => {

        return flatTopics.findIndex(f => f.subtopicTitle === selectedSubtopic);

    }, [flatTopics, selectedSubtopic]);



    const handleNext = () => {

        if (currentIndex < flatTopics.length - 1) {

            const next = flatTopics[currentIndex + 1];

            handleSelect(next.chapterTitle, next.subtopicTitle, next.subtopicObj, true);

            setExpandedChapters(prev => ({ ...prev, [next.chapterTitle]: true }));

            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });

        } else if (percentage === 100) {

            navigate(`/course/${courseId}/quiz`, { state: { courseId, courseTitle: mainTopic } });

        } else {

            toast.info(t('footer.exam_locked'));

        }

    };



    const handlePrevious = () => {

        if (currentIndex > 0) {

            const prev = flatTopics[currentIndex - 1];

            handleSelect(prev.chapterTitle, prev.subtopicTitle, prev.subtopicObj, true);

            setExpandedChapters(p => ({ ...p, [prev.chapterTitle]: true }));

            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });

        }

    };



    useEffect(() => {

        const fetchCourse = async () => {

            if (courseId) {

                setLoading(true);

                try {

                    const token = localStorage.getItem('token');

                    const res = await axios.get(`${serverURL}/courses/${courseId}`, {

                        headers: { Authorization: `Bearer ${token}` }

                    });

                    const data = res.data;



                    // REDIRECT TO PUBLIC ID IF CURRENT URL USES NUMERIC ID

                    if (data.public_id && data.public_id !== urlCourseId) {

                        let jsonData = data.metadata;

                        if (typeof jsonData === 'string') {

                            try {

                                jsonData = JSON.parse(jsonData);

                            } catch (e) {

                                console.error("Failed to parse course metadata", e);

                            }

                        }

                        navigate(`/course/${data.public_id}`, {

                            replace: true,

                            state: { ...state, courseId: data.public_id, jsonData }

                        });

                        return;

                    }



                    let meta = data.metadata;

                    if (typeof meta === 'string') {

                        try {

                            meta = JSON.parse(meta);

                        } catch (e) {

                            console.error("Failed to parse course metadata", e);

                        }

                    }



                    if (meta) {

                        meta = mergeSavedLessonsIntoMetadata(normalizeObject(meta), data.lessons || []);

                        setDbCourseId(data.id);

                        setJsonData(meta);

                        setMainTopic(data.title);

                        setChatHistory(meta.chatHistory || []);

                        setQuizResult(meta.quizResult || null);

                        setBlueprintSlug(data.blueprint_slug || meta.blueprint_slug || 'normal-course');

                        localStorage.setItem('jsonData', JSON.stringify(meta));

                        localStorage.setItem('courseId', courseId);

                    }

                } catch (error) {

                    console.error("Course load failed:", error);

                    toast.error(t('footer.load_fail'));

                    navigate('/dashboard');

                } finally {

                    setLoading(false);

                }

            }

        };

        fetchCourse();

    }, [courseId, urlCourseId, navigate, state, t]);



    const updateChatHistory = useCallback((newHistory) => {

        setChatHistory(newHistory);

        const updated = { ...jsonData, chatHistory: newHistory };

        setJsonData(updated);

        syncProgress(updated);

    }, [jsonData, syncProgress]);



    const autoSelectedRef = React.useRef(false);



    useEffect(() => {

        if (topics.length > 0 && !selectedSubtopic && !autoSelectedRef.current && layoutMode !== 'loading') {

            const first = topics[0];

            const subs = first.subtopics || first.sections || [];

            if (subs.length > 0) {

                autoSelectedRef.current = true;

                if (layoutMode === 'course') {
                    handleSelect(first.title, subs[0].title, subs[0]);
                } else {
                    setSelectedSubtopic(subs[0].title);
                }

                setExpandedChapters({ [first.title]: true });

            }

        }

    }, [topics, selectedSubtopic, handleSelect, layoutMode]);



    const toggleChapter = (title) => {

        setExpandedChapters(prev => ({ ...prev, [title]: !prev[title] }));

    };



    const handleShare = async () => {

        try {

            const token = localStorage.getItem('token');

            const res = await axios.post(`${serverURL}/courses/${courseId}/share`, {}, {

                headers: { Authorization: `Bearer ${token}` }

            });



            const shareToken = res.data.token;

            const shareUrl = `${window.location.origin}/share/${shareToken}`;



            if (navigator.share) {

                navigator.share({

                    title: mainTopic,

                    text: `Check out this course on ${mainTopic}`,

                    url: shareUrl,

                }).catch(() => {

                    navigator.clipboard.writeText(shareUrl);

                    toast.success(t('footer.share_success'));

                });

            } else {

                navigator.clipboard.writeText(shareUrl);

                toast.success(t('footer.share_success'));

            }

        } catch (err) {

            console.error(err);

            toast.error(t('footer.share_fail'));

        }

    };



    const courseDir = isArabic ? 'rtl' : 'ltr';

    // Layout direction stays LTR if user wants navbar/sidebar fixed, but content uses courseDir

    const layoutDir = 'ltr';

    const isCourseMode = layoutMode === 'course';
    const showStars = (isCourseMode && loading) || showPrepButton;



    return (

        <div dir={layoutDir} className={`h-screen flex flex-col font-sans transition-colors duration-300 overflow-hidden selection:bg-blue-100 dark:selection:bg-blue-900/40 ${showStars ? 'bg-transparent' : 'bg-gray-50 dark:bg-[#0f0f0f]'} text-[#222] dark:text-gray-200`}>



            {/* Header */}

            <header className="h-[72px] flex-none border-b border-gray-200/50 dark:border-gray-800 flex items-center justify-between px-2 sm:px-4 md:px-6 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-xl z-50 sticky top-0 transition-all duration-300">

                <div className="flex items-center gap-2 md:gap-5">

                    {/* Sidebar Toggle - Always Visible */}

                    <button

                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}

                        className="p-2.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95"

                        title={isSidebarOpen ? t('footer.collapse_sidebar') : t('footer.expand_sidebar')}

                    >

                        {isSidebarOpen ? <LuX size={24} /> : <LuMenu size={24} />}

                    </button>



                    {isCourseMode && (

                        <div className="hidden min-[360px]:block w-[38px] h-[38px] flex-shrink-0 drop-shadow-sm">

                            <CircularProgressbar

                                value={percentage}

                                text={`${percentage}%`}

                                strokeWidth={10}

                                styles={buildStyles({

                                    textSize: '28px',

                                    pathColor: '#3b82f6',

                                    textColor: isDarkMode ? '#e5e7eb' : '#111827',

                                    trailColor: isDarkMode ? '#333' : '#e5e7eb',

                                    strokeLinecap: 'round'

                                })}

                            />

                        </div>

                    )}

                </div>



                <div className="flex items-center gap-2">

                    <nav className="flex items-center gap-1 md:gap-2 bg-gray-100 dark:bg-white/5 p-1 md:p-1.5 rounded-full border border-gray-200 dark:border-white/5">

                        {[

                            { icon: LuHouse, label: t('nav.home'), action: () => navigate('/dashboard') },

                            { icon: LuHeadphones, label: t('footer.audio'), action: () => navigate(`/audio-player/${courseId}`, { state: { lessonTitle: selectedSubtopic, sectionTitle: mainTopic, lessonContent: lessonContent.theory, photo: jsonData?.photo } }) },

                            { icon: LuDownload, label: t('footer.export'), action: () => setIsExportModalOpen(true) },

                            ...(isCourseMode ? [{

                                icon: LuAward,

                                label: t('footer.certificate'),

                                action: () => (percentage === 100 && quizResult?.passed) ? navigate(`/course/${courseId}/certificate`, { state: { quizResult } }) : toast.warning(t('footer.cert_locked')),

                                disabled: !(percentage === 100 && quizResult?.passed)

                            }] : []),

                            { icon: LuShare2, label: t('footer.share'), action: handleShare },

                            { icon: isDarkMode ? LuSun : LuMoon, label: isDarkMode ? t('footer.light') : t('footer.dark'), action: () => setIsDarkMode(!isDarkMode) },

                        ].map((item, idx) => (

                            <button

                                key={idx}

                                onClick={item.action}

                                title={item.label}

                                className={`p-2 xl:px-4 xl:py-2 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 ${item.disabled

                                    ? 'text-gray-400 dark:text-gray-600 opacity-50 cursor-not-allowed'

                                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 hover:shadow-md'

                                    }`}

                            >

                                <item.icon size={18} />

                                <span className="hidden xl:inline">{item.label}</span>

                            </button>

                        ))}

                    </nav>

                </div>

            </header>



            <div className="flex flex-1 overflow-hidden relative">



                {/* Mobile Sidebar Overlay */}

                <AnimatePresence>

                    {isSidebarOpen && window.innerWidth < 1024 && (

                        <motion.div

                            initial={{ opacity: 0 }}

                            animate={{ opacity: 1 }}

                            exit={{ opacity: 0 }}

                            onClick={() => setIsSidebarOpen(false)}

                            className="absolute inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"

                        />

                    )}

                </AnimatePresence>



                {/* Sidebar */}

                <aside

                    className={`

                        fixed lg:relative z-40 bg-white dark:bg-[#0f0f0f] border-gray-200/50 dark:border-gray-800

                        transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] flex flex-col

                        top-[72px] lg:top-auto h-[calc(100vh-72px)] lg:h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)]

                        left-0 border-r

                        ${isSidebarOpen

                            ? 'translate-x-0 w-[85vw] sm:w-[320px]'

                            : (isArabic ? 'translate-x-full' : '-translate-x-full') + ' w-0 lg:w-0 lg:translate-x-0 overflow-hidden opacity-0 lg:opacity-100'}

                    `}

                >

                    {/* Fixed Sidebar Header: Layer Indicator */}

                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between shadow-sm">

                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">

                            {isCourseMode ? getDynamicLabel('progress') : (isArabic ? 'محتويات الوثيقة' : 'Document Contents')}

                        </span>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-900/30">

                            {getDynamicLabel('layer')} {currentIndex + 1} <span className="text-blue-300 dark:text-blue-600">/</span> {flatTopics.length}

                        </div>

                    </div>



                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-10">

                        {topics.map((topic, i) => (

                            <div key={i} className="group">

                                <button

                                    onClick={() => toggleChapter(topic.title)}

                                    className="w-full flex items-center justify-between text-left py-2 mb-2"

                                >

                                    <div className="flex items-center gap-3">

                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black border transition-all ${expandedChapters[topic.title]

                                            ? 'bg-blue-600 text-white border-blue-600'

                                            : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-white/10 group-hover:border-blue-300'}`}>

                                            {i + 1}

                                        </div>

                                        <h3 className={`text-[13px] font-bold uppercase tracking-wider transition-colors

                                            ${expandedChapters[topic.title] ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>

                                            {topic.title}

                                        </h3>

                                    </div>

                                    <LuChevronDown

                                        size={16}

                                        className={`text-gray-400 transition-transform duration-300 ${expandedChapters[topic.title] ? 'rotate-180 text-blue-500' : ''}`}

                                    />

                                </button>



                                <AnimatePresence initial={false}>

                                    {expandedChapters[topic.title] && (

                                        <motion.div

                                            initial={{ height: 0, opacity: 0 }}

                                            animate={{ height: "auto", opacity: 1 }}

                                            exit={{ height: 0, opacity: 0 }}

                                            className="overflow-hidden"

                                        >

                                            <div className="space-y-1 pl-3 border-l-[2px] border-dashed border-gray-200 dark:border-white/10 ml-4 pb-2">

                                                {(topic.subtopics || topic.sections || []).map((sub, j) => {

                                                    const isActive = selectedSubtopic === sub.title;

                                                    return (

                                                        <button

                                                            key={j}

                                                            onClick={() => {

                                                                if (isCourseMode) {

                                                                    handleSelect(topic.title, sub.title, sub);

                                                                } else {

                                                                    scrollToSection(sub.title);

                                                                }

                                                                if (window.innerWidth < 1024) setIsSidebarOpen(false);

                                                            }}

                                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200

                                                                ${isActive

                                                                    ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 font-bold shadow-sm'

                                                                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}

                                                        >

                                                            {isCourseMode ? (

                                                                sub.done ? (

                                                                    <div className="w-5 h-5 shrink-0 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">

                                                                        <LuCheck size={12} className="text-white" strokeWidth={4} />

                                                                    </div>

                                                                ) : (

                                                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`} />

                                                                )

                                                            ) : (

                                                                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-700'}`} />

                                                            )}

                                                            <span className="text-[13px] leading-snug" dir="auto">

                                                                {/* BiDi Isolation: Wrap English/Code terms (including parens) in LTR spans */}

                                                                {sub.title ? sub.title.split(/([A-Za-z0-9._\-+#()]+(?:\s+[A-Za-z0-9._\-+#()]+)*)/g).map((part, i) =>

                                                                    /^[A-Za-z0-9]/.test(part) ? <span key={i} dir="ltr">{part}</span> : part

                                                                ) : ''}

                                                            </span>

                                                        </button>

                                                    );

                                                })}

                                            </div>

                                        </motion.div>

                                    )}

                                </AnimatePresence>

                            </div>

                        ))}



                        {isCourseMode && (

                            <div className="pt-8 border-t border-gray-100 dark:border-gray-800/50 mt-4">

                                <button

                                    onClick={() => percentage === 100 ? navigate(`/course/${courseId}/quiz`, { state: { courseId, courseTitle: mainTopic, generateNew: true } }) : toast.info(t('footer.exam_locked'))}

                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 text-sm transition-all shadow-lg

                                        ${percentage === 100

                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.02] shadow-blue-500/25'

                                            : 'bg-white dark:bg-white/5 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-white/5 cursor-not-allowed'}`}

                                >

                                    <LuBookOpen size={18} />

                                    <span>{getDynamicLabel('exam_btn')}</span>

                                </button>

                            </div>

                        )}

                    </div>

                </aside>



                {/* Main Content Area */}

                <main dir="ltr" className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar relative w-full bg-transparent">

                    {showStars && <MouseBackground />}

                    {/* Background Pattern */}

                    <div className="fixed inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.1]"

                        style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)' }} />



                    <div dir={courseDir} className="max-w-6xl mx-auto px-6 py-10 md:px-12 min-h-screen flex flex-col relative z-10">

                        {layoutMode === 'loading' ? (
                            <div className="flex-1 flex items-center justify-center py-20 min-h-[70vh]">
                                <div className="w-full max-w-md text-center rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-[#111827]/80 p-8 shadow-xl">
                                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                        <FiLoader size={28} className="animate-spin text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                                        {isArabic ? 'جاري فتح المحتوى' : 'Opening content'}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isArabic ? 'نحمّل نوع المحتوى وتفاصيله قبل عرض الواجهة المناسبة.' : 'Loading the content type and metadata before choosing the right viewer.'}
                                    </p>
                                </div>
                            </div>
                        ) : loading && layoutMode === 'course' ? (

                            <div className="flex-1 flex flex-col items-center justify-center py-10 md:py-20 min-h-[80vh] relative overflow-hidden" dir={courseDir}>



                                <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 text-start">



                                    {/* Left Column: AI Core & Console */}

                                    <div className="flex flex-col items-center lg:items-start order-2 lg:order-1">

                                        <motion.div

                                            initial={{ opacity: 0, scale: 0.9 }}

                                            animate={{ opacity: 1, scale: 1 }}

                                            className="relative w-full max-w-sm aspect-square flex items-center justify-center mb-8"

                                        >

                                            {/* Orbiting Elements */}

                                            <div className="absolute inset-0 animate-spin-slow">

                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-blue-500 transform -rotate-12">

                                                    <FiCpu size={24} />

                                                </div>

                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-indigo-500 transform rotate-12">

                                                    <FiFileText size={24} />

                                                </div>

                                            </div>



                                            {/* Central Core */}

                                            <div className="relative w-48 h-48 rounded-full bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-center group overflow-hidden">

                                                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-500 animate-pulse"></div>

                                                <motion.div

                                                    animate={{ rotate: 360 }}

                                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}

                                                    className="absolute inset-4 border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-full"

                                                />

                                                <div className="relative z-10 flex flex-col items-center">

                                                    <img src={logo} alt="Processing" className="w-[50px] h-[50px] object-contain animate-bounce mb-2" />

                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">{t('sidebar.ai_core')}</span>

                                                </div>

                                            </div>



                                            {/* Secondary Orbit */}

                                            <div className="absolute inset-10 animate-spin-reverse-slow">

                                                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-teal-500">

                                                    {jsonData?.type?.includes('Video') ? <FiVideo size={20} /> : <FiImage size={20} />}

                                                </div>

                                            </div>

                                        </motion.div>



                                        {/* Console Output */}

                                        <div className="w-full max-w-sm bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl p-6 font-mono text-xs shadow-xl min-h-[180px] flex flex-col">

                                            <div className="flex gap-1.5 mb-5">

                                                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>

                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>

                                                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>

                                            </div>

                                            <div className="space-y-2 flex-1 overflow-hidden">

                                                {prepLogLines.map((line, i) => (

                                                    <div key={i} className="flex gap-2">

                                                        <span className="text-blue-500 shrink-0 font-bold">~</span>

                                                        <span className="text-gray-600 dark:text-gray-400">{line}</span>

                                                    </div>

                                                ))}

                                                <div className="flex gap-2 items-center">

                                                    <span className="text-blue-500 shrink-0 font-bold">~</span>

                                                    <motion.div

                                                        animate={{ opacity: [0, 1, 0] }}

                                                        transition={{ repeat: Infinity, duration: 0.8 }}

                                                        className="w-1.5 h-3 bg-blue-500"

                                                    />

                                                </div>

                                            </div>

                                        </div>

                                    </div>



                                    {/* Right Column: Progress & Steps */}

                                    <div className="flex flex-col order-1 lg:order-2">

                                        <div className="mb-10 text-center lg:text-start">

                                            <motion.h1

                                                initial={{ opacity: 0, y: 10 }}

                                                animate={{ opacity: 1, y: 0 }}

                                                className="text-4xl font-black text-gray-900 dark:text-white mb-4"

                                            >

                                                {t('footer.magic_title')}

                                            </motion.h1>

                                            <p className="text-gray-500 dark:text-gray-400 font-medium">

                                                {t('footer.magic_subtitle')}

                                                <span className="block mt-1 text-gray-900 dark:text-gray-200 font-bold" dir="auto">"{selectedSubtopic}"</span>

                                            </p>

                                        </div>



                                        <div className="space-y-4 mb-10">

                                            {[

                                                { title: t('footer.steps.analyzing'), desc: t('footer.steps.analyzing_desc', { topic: selectedSubtopic }), icon: <FiCpu size={20} /> },

                                                { title: t('footer.steps.theory'), desc: t('footer.steps.theory_desc'), icon: <FiFileText size={20} /> },

                                                { title: t('footer.steps.assets'), desc: jsonData?.type?.includes('Video') ? t('footer.steps.assets_video') : t('footer.steps.assets_image'), icon: jsonData?.type?.includes('Video') ? <FiVideo size={20} /> : <FiImage size={20} /> },

                                                { title: t('footer.steps.finalizing'), desc: t('footer.steps.finalizing_desc'), icon: <FiServer size={20} /> }

                                            ].map((step, idx) => {

                                                const isActive = prepStep === idx;

                                                const isDone = prepStep > idx;

                                                return (

                                                    <motion.div

                                                        key={idx}

                                                        initial={{ opacity: 0, x: 20 }}

                                                        animate={{ opacity: 1, x: 0 }}

                                                        transition={{ delay: idx * 0.1 }}

                                                        className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-700 ${isActive ? 'bg-white dark:bg-gray-800/50 border-blue-500 dark:border-blue-500 shadow-lg shadow-blue-500/5' : 'border-gray-100 dark:border-gray-800 bg-transparent'} ${isDone ? 'opacity-60' : isActive ? 'opacity-100' : 'opacity-30'}`}

                                                    >

                                                        <div className={`p-2.5 rounded-xl transition-colors duration-500 ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>

                                                            {isDone ? <LuCheck size={20} /> : isActive ? <FiLoader size={20} className="animate-spin" /> : step.icon}

                                                        </div>

                                                        <div className="flex-1">

                                                            <div className="flex justify-between items-center mb-0.5">

                                                                <h3 className={`font-bold text-sm ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{step.title}</h3>

                                                                {isActive && <span className="text-[10px] font-black tracking-widest text-blue-500 dark:text-blue-400 animate-pulse">{t('footer.active')}</span>}

                                                            </div>

                                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate max-w-[200px]">{step.desc}</p>

                                                        </div>

                                                        {isDone && (

                                                            <div className="absolute -right-2 -top-2 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900">

                                                                <LuCheck size={10} />

                                                            </div>

                                                        )}

                                                    </motion.div>

                                                );

                                            })}

                                        </div>

                                        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">

                                            <div

                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"

                                                style={{ width: `${Math.min(100, Math.max(0, prepProgress))}%` }}

                                            />

                                        </div>

                                                <div className="mt-4 flex items-center gap-2 text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest">

                                                    <FiActivity className="text-blue-500 animate-pulse" />

                                                    <span>{t('footer.gpu_sync')}</span>

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                        ) : layoutMode === 'document' ? (

                            renderDocumentLayout()

                        ) : layoutMode === 'question' ? (

                            renderQuestionLayout()

                        ) : layoutMode === 'story' ? (

                            renderStoryLayout()

                        ) : (

                            <motion.div

                                key={selectedSubtopic}

                                initial={{ opacity: 0, scale: 0.98, y: 20 }}

                                animate={{ opacity: 1, scale: 1, y: 0 }}

                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}

                                className="flex-1 flex flex-col"

                            >

                                <header className="mb-10 lg:mb-14 flex flex-col items-center">

                                    {/* Course Cover Image */}

                                    {jsonData?.photo && (

                                        <div className="w-full max-w-3xl mb-8 rounded-3xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-800">

                                            <img

                                                src={jsonData.photo}

                                                alt={mainTopic || 'Course'}

                                                className="w-full h-48 md:h-64 lg:h-80 object-cover"

                                                onError={(e) => { e.target.style.display = 'none' }}

                                            />

                                        </div>

                                    )}

                                    {/* Removed Layer indicator from here as it is now in sidebar */}

                                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-[1.3] tracking-tight text-center w-full" dir="auto">

                                        {/* Helper to interpret local mixed text direction */}

                                        {(() => {

                                            const processText = (t) => {

                                                if (!t) return null;

                                                // Split by English/Latin-like words including technical symbols like ++, #, .

                                                const parts = t.split(/([A-Za-z0-9+\-.#]+)/g);

                                                return parts.map((part, i) => {

                                                    // If the part contains at least one Latin letter, force LTR

                                                    if (/[A-Za-z]/.test(part)) {

                                                        return <span key={i} dir="ltr">{part}</span>;

                                                    }

                                                    return part;

                                                });

                                            };

                                            return processText(selectedSubtopic);

                                        })()}

                                    </h1>

                                </header>



                                <div className="flex flex-col gap-6 mb-12 lg:max-w-3xl mx-auto w-full">

                                    {lessonContent.videos?.map((video, idx) => (

                                        <MediaCard key={`video-${idx}`} media={video} type="video" selectedSubtopic={selectedSubtopic} />

                                    ))}

                                    {lessonContent.images?.map((img, idx) => (

                                        <MediaCard key={`image-${idx}`} media={img} type="image" selectedSubtopic={selectedSubtopic} />

                                    ))}

                                </div>



                                {showPrepButton && !loading && (

                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20 min-h-[80vh] w-full bg-transparent mt-4">

                                        <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 animate-pulse">

                                            <img src={logo} alt="Ready" className="w-10 h-10 object-contain" />

                                        </div>

                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">

                                            {t('sidebar.ready_title')}

                                        </h3>

                                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">

                                            {prepError || t('sidebar.ready_desc')}

                                        </p>

                                        <motion.button

                                            whileHover={{ scale: 1.05 }}

                                            whileTap={{ scale: 0.95 }}

                                            onClick={handlePrepareLesson}

                                            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-600/20 transition-all flex items-center gap-3"

                                        >

                                            <span>{t('sidebar.start_prep')}</span>

                                            <LuChevronRight size={24} />

                                        </motion.button>

                                    </div>

                                )}



                                <div className="prose prose-lg dark:prose-invert max-w-none

                                    prose-p:text-[17px] md:prose-p:text-[19px] prose-p:leading-[1.8] prose-p:text-gray-700 dark:prose-p:text-gray-300

                                    prose-headings:font-black prose-headings:tracking-tight prose-headings:text-gray-900 dark:prose-headings:text-white

                                    prose-strong:text-blue-600 dark:prose-strong:text-blue-400 prose-strong:font-bold

                                    prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline

                                    prose-img:rounded-3xl prose-img:shadow-xl">



                                    {!showPrepButton && (

                                        <StyledText text={lessonContent.theory} isRtl={isArabic} />

                                    )}



                                    {lessonContent.examples && !showPrepButton && (

                                        <div className="not-prose mt-16 relative">

                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-[32px]" />

                                            <div className="relative bg-white dark:bg-[#151515] border border-gray-100 dark:border-white/5 rounded-[30px] p-8 md:p-10 shadow-2xl shadow-blue-500/5">

                                                <div className="flex items-center gap-4 mb-8">

                                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">

                                                        <LuAward size={24} />

                                                    </div>

                                                    <div>

                                                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wide">{t('sidebar.applied_examples')}</h3>

                                                        <p className="text-sm text-gray-500 font-medium">{t('sidebar.applied_examples_desc')}</p>

                                                    </div>

                                                </div>

                                                <div className="prose prose-lg dark:prose-invert max-w-none">

                                                    <StyledText text={lessonContent.examples} isRtl={isArabic} />

                                                </div>

                                            </div>

                                        </div>

                                    )}

                                </div>



                                {/* Bottom Navigation - Fixed LTR order for Prev/Next */}

                                <div dir="ltr" className="mt-20 pt-10 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 pb-24">

                                    <button

                                        onClick={handlePrevious}

                                        disabled={currentIndex === 0}

                                        className="w-full md:w-auto px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed

                                            text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10"

                                    >

                                        <LuChevronLeft size={18} />

                                        <span>{getDynamicLabel('prev')}</span>

                                    </button>



                                    {currentIndex === flatTopics.length - 1 ? (

                                        <motion.button

                                            whileHover={{ scale: 1.02 }}

                                            whileTap={{ scale: 0.98 }}

                                            disabled={loading || showPrepButton || percentage < 100}

                                            onClick={() => navigate(`/course/${courseId}/quiz`, { state: { courseId, courseTitle: mainTopic, generateNew: true } })}

                                            className="w-full md:w-auto px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-black text-[15px] tracking-wide hover:shadow-2xl hover:shadow-gray-900/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"

                                        >

                                            <LuAward size={20} />

                                            <span>{getDynamicLabel('exam_btn')}</span>

                                        </motion.button>

                                    ) : (

                                        <button

                                            disabled={loading || showPrepButton}

                                            onClick={handleNext}

                                            className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white rounded-xl font-black text-[15px] tracking-wide shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"

                                        >

                                            <span>{getDynamicLabel('next')}</span>

                                            <LuChevronRight size={18} />

                                        </button>

                                    )}

                                </div>

                            </motion.div>

                        )}

                    </div>

                </main>



                {/* Floating UI */}

                <div className="fixed right-6 bottom-8 z-40">

                    <motion.button

                        whileHover={{ scale: 1.05, x: -5 }}

                        whileTap={{ scale: 0.95 }}

                        onClick={() => setIsNotesOpen(true)}

                        className="w-14 h-14 bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-200 rounded-full shadow-2xl flex items-center justify-center border border-gray-100 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group relative"

                    >

                        <LuFileText size={22} />

                        <span className="absolute right-full mr-4 px-3 py-1.5 bg-gray-900 text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">

                            {t('sidebar.notes')}

                        </span>

                    </motion.button>

                </div>



                <ChatBot

                    courseId={dbCourseId}

                    courseContext={lessonContent.theory}

                    mainTopic={mainTopic}

                    chatHistory={chatHistory}

                    onUpdateHistory={updateChatHistory}

                />



                <NotesSidebar

                    isOpen={isNotesOpen}

                    onClose={() => setIsNotesOpen(false)}

                    courseId={dbCourseId}

                    lessonId={selectedSubtopic}

                />



                <ExportModal

                    isOpen={isExportModalOpen}

                    onClose={() => setIsExportModalOpen(false)}

                    courseId={courseId}

                    mainTopic={mainTopic}

                />

            </div>

        </div >

    );

};



export default Course;
