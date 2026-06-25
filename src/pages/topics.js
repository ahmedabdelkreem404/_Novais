import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { LuArrowLeft, LuSparkles, LuLayoutList, LuCircle } from 'react-icons/lu';
import axios from 'axios';
import { serverURL } from '../constants';
import { useTranslation } from 'react-i18next';

const Topics = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { state } = useLocation();
    const { jsonData, mainTopic, type, courseId, ...originalFormData } = state || {};
    const navigate = useNavigate();
    const [courseData] = useState(jsonData);

    useEffect(() => {
        if (!jsonData) {
            navigate("/dashboard/generate-course");
        }
    }, [jsonData, navigate]);

    const handleCancel = () => {
        navigate("/dashboard/generate-course", {
            state: { ...originalFormData, topic: mainTopic, type }
        });
    }

    const handleGenerate = async () => {
        if (!courseData || !mainTopic) {
            toast.error('Course data missing. Please try again.');
            return;
        }

        const loadingToast = toast.loading(t('common.processing'));

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${serverURL}/course`, {
                mainTopic: mainTopic,
                type: type === 'Video & Theory Course' ? 'video' : 'image',
                language: originalFormData.language || 'English',
                content: JSON.stringify(courseData)
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            toast.dismiss(loadingToast);

            if (res.data.success) {
                const newCourseId = res.data.courseId;
                // Correct Navigation with ID
                navigate(`/course/${newCourseId}`, {
                    state: {
                        jsonData: courseData,
                        mainTopic: mainTopic.toUpperCase(),
                        type: type ? type.toLowerCase() : 'text & image course',
                        courseId: newCourseId,
                        end: ''
                    }
                });
            } else {
                toast.error('Failed to save course');
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('Save failed:', error);
            toast.error('Something went wrong. Please try again.');
        }
    }

    const renderTopicsAndSubtopics = (data) => {
        if (!data) return null;
        let topics = [];
        const possibleKeys = [mainTopic, mainTopic?.toLowerCase(), 'chapters', 'topics'];
        for (const key of possibleKeys) {
            if (data[key] && Array.isArray(data[key])) {
                topics = data[key];
                break;
            }
        }
        // Fallback search
        if (topics.length === 0) {
            const firstArray = Object.values(data).find(val => Array.isArray(val));
            if (firstArray) topics = firstArray;
        }

        if (!topics || topics.length === 0) return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <LuLayoutList size={48} className="mb-4 opacity-50" />
                <p>{t('topics.no_outline')}</p>
            </div>
        );

        return (
            <div className="space-y-8 relative">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-gray-100 dark:bg-gray-800 hidden md:block" />

                {topics.map((topic, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative pl-0 md:pl-12"
                    >
                        {/* Number Badge */}
                        <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white dark:bg-[#1a1a1a] border-[3px] border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-500 font-bold flex items-center justify-center z-10 shadow-sm hidden md:flex">
                            {idx + 1}
                        </div>

                        <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0f0f0f] shadow-sm hover:shadow-md transition-shadow">
                            {/* Topic Header */}
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                        {topic.title || `Module ${idx + 1}`}
                                    </h3>
                                    <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">
                                        {(topic.subtopics || topic.sections || []).length} {t('topics.lessons')}
                                    </p>
                                </div>
                            </div>

                            {/* Subtopics List */}
                            <div className="p-2">
                                {(topic.subtopics || topic.sections || []).map((sub, sIdx) => (
                                    <div key={sIdx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <LuCircle size={8} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                                            {sub.title || sub}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <div className={`min-h-screen flex flex-col bg-white dark:bg-black font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>

            <div className='flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-20'>

                {/* Header Section */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <LuSparkles size={14} /> {t('topics.ai_generator')}
                    </div>
                    <h1 className='text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight'>
                        {mainTopic || "Course Structure"}
                    </h1>
                    <p className='text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed'>
                        {t('topics.review_desc')}
                    </p>
                </div>

                {/* Topics List */}
                <div className="mb-20">
                    {renderTopicsAndSubtopics(courseData)}
                </div>

                {/* Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-50">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                        <button
                            onClick={handleCancel}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            <LuArrowLeft size={18} />
                            <span>{t('topics.adjust_topic')}</span>
                        </button>

                        <button
                            onClick={handleGenerate}
                            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            <span>{t('topics.start_journey')}</span>
                            <LuSparkles size={18} />
                        </button>
                    </div>
                </div>

                {/* Space for fixed footer */}
                <div className="h-24" />

            </div>
        </div>
    );
};

export default Topics;
