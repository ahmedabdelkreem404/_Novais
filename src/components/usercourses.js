import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serverURL } from '../constants';
import { useNavigate } from 'react-router-dom';
import { LuBookOpen } from "react-icons/lu";
import { useTranslation } from 'react-i18next';

const UserCourses = ({ userId }) => {
    const { t } = useTranslation();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await axios.get(`${serverURL}/courses?userId=${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json'
                    }
                });
                setCourses(res.data);
            } catch (err) {
                console.error("Failed to fetch courses", err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchCourses();
    }, [userId]);

    const handleCourse = (course) => {
        const courseId = course.public_id || course.id || course._id;
        let jsonData = course.metadata || course.content;
        if (typeof jsonData === 'string') {
            try {
                jsonData = JSON.parse(jsonData);
            } catch (e) {
                console.error("Failed to parse course metadata", e);
            }
        }
        const mainTopic = course.title || course.mainTopic;

        localStorage.setItem('courseId', courseId);
        localStorage.setItem('jsonData', JSON.stringify(jsonData));

        navigate(`/course/${courseId}`, {
            state: {
                jsonData,
                mainTopic: mainTopic.toUpperCase(),
                type: (course.type || 'text & image').toLowerCase(),
                courseId,
                photo: course.photo
            }
        });
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-[280px] rounded-2xl bg-gray-50 dark:bg-white/5 animate-pulse border border-gray-100 dark:border-gray-800" />
                ))}
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4">
                    <LuBookOpen size={30} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('dashboard_comp.no_courses')}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
                    {t('dashboard_comp.empty_desc')}
                </p>
                <button
                    onClick={() => navigate('/dashboard/generate-course')}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                    {t('dashboard_comp.create_first')}
                </button>
            </div>
        );
    }

    const calculateProgress = (course) => {
        try {
            let meta = course.metadata;
            if (typeof meta === 'string') meta = JSON.parse(meta);
            if (!meta) return 0;

            const topics = meta.chapters || meta.topics || meta.content || [];
            let total = 0;
            let done = 0;

            topics.forEach(topic => {
                const subs = topic.subtopics || topic.sections || [];
                total += subs.length;
                subs.forEach(sub => { if (sub.done) done++; });
            });

            return total === 0 ? 0 : Math.round((done / total) * 100);
        } catch (e) {
            return 0;
        }
    };

    const getChapterCount = (course) => {
        try {
            let meta = course.metadata;
            if (typeof meta === 'string') meta = JSON.parse(meta);
            const topics = meta?.chapters || meta?.topics || meta?.content || [];
            return topics.length;
        } catch (e) {
            return 0;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {courses.map((course) => {
                const progress = calculateProgress(course);
                const chapterCount = getChapterCount(course);
                const isRtl = localStorage.getItem('language')?.startsWith('ar');
                const metadata = typeof course.metadata === 'string'
                    ? (() => {
                        try { return JSON.parse(course.metadata); } catch { return {}; }
                    })()
                    : (course.metadata || {});
                const coverImage = course.photo || metadata.cover_image || metadata.photo;

                return (
                    <div
                        key={course.id || course._id}
                        onClick={() => handleCourse(course)}
                        className="group bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full"
                    >
                        <div className="relative h-32 md:h-40 overflow-hidden">
                            <img
                                src={coverImage || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop'}
                                alt={course.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4 gap-2`}>
                                <div className={`flex flex-wrap gap-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <span className={`text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-blue-600/80 rounded-md backdrop-blur-sm`}>
                                        {course.type || 'Interactive'}
                                    </span>

                                    {course.level && (
                                        <span className={`
                                            text-[10px] font-bold uppercase px-2 py-1 rounded-md backdrop-blur-sm border flex items-center gap-1
                                            ${course.level === 'Beginner'
                                                ? 'bg-blue-50/90 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-300'
                                                : 'bg-white/90 dark:bg-[#151515]/90 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}
                                        `}>
                                            {t(`create_page.levels.${course.level.toLowerCase()}`)}
                                            {course.level === 'Professional' && (
                                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500" height="10" width="10" xmlns="http://www.w3.org/2000/svg"><path d="M6 3h12l4 6-10 13L2 9Z"></path><path d="M11 3 8 9l4 13 4-13-3-6"></path><path d="M2 9h20"></path></svg>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 md:p-5 flex-1 flex flex-col">
                            <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-blue-500 transition-colors line-clamp-2">
                                {course.title || course.mainTopic}
                            </h3>

                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full mb-4 overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="flex items-center gap-4 mt-auto">
                                <div className="flex items-center gap-1.5 text-gray-400 text-[13px] font-medium">
                                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    <span>{progress}% {t('dashboard_comp.completed')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400 text-[13px] font-medium">
                                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path></svg>
                                    <span>{chapterCount} {t('dashboard_comp.chapters')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between group/footer">
                            <span className="text-[13px] font-bold text-blue-500 flex items-center gap-1">
                                {t('dashboard_comp.continue')}
                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isRtl ? 'group-hover/footer:-translate-x-0.5 rotate-180' : 'group-hover/footer:translate-x-0.5'}`} height="12" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                            </span>
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className={isRtl ? "rotate-180 mr-0.5" : "ml-0.5"} height="14" width="14" xmlns="http://www.w3.org/2000/svg"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default UserCourses;
