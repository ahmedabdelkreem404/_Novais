import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serverURL } from '../constants';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LuBookOpen, LuPlay } from "react-icons/lu";
import { useTranslation } from 'react-i18next';

// v2-safe-parse
const AudioCourses = () => {
    const { t } = useTranslation();
    const [courses, setCourses] = useState([]);
    const [processing, setProcessing] = useState(true);
    const navigate = useNavigate();
    const userId = localStorage.getItem('uid');

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/signin');
            return;
        }

        const fetchUserCourses = async () => {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const postURL = serverURL + `/courses?userId=${userId}`;
            try {
                const response = await axios.get(postURL, config);
                setCourses(response.data);
            } catch (error) {
                console.error("Failed to fetch user courses", error);
            } finally {
                setProcessing(false);
            }
        };
        if (userId) fetchUserCourses();
    }, [userId, navigate]);

    const handleCourse = (course) => {
        const content = course.metadata || course.content;
        if (!content) return toast.error(t('course.content_missing'));

        let jsonData;
        try {
            jsonData = typeof content === 'string' ? JSON.parse(content) : content;
        } catch (error) {
            return toast.error(t('course.invalid_data'));
        }

        const courseId = course.id || course._id;
        const mainTopic = course.title || course.mainTopic;

        localStorage.setItem('courseId', courseId);
        localStorage.setItem('jsonData', JSON.stringify(jsonData));

        navigate(`/dashboard/audio-courses/${courseId}`, {
            state: {
                jsonData,
                mainTopic: mainTopic,
                type: course.type?.toLowerCase() || 'text & image course',
                courseId,
                photo: course.photo
            }
        });
    }

    if (processing) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-blue-500 mb-6">{t('audio.title')}</h1>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-blue-500 mb-6">{t('audio.title')}</h1>
                <div
                    className="p-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => navigate('/create')}
                >
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 mb-4">
                        <LuBookOpen size={28} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('audio.no_courses')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                        {t('audio.empty_desc')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Page Title */}
            <h1 className="text-2xl font-bold text-blue-500 mb-6">{t('audio.title')}</h1>

            {/* Courses List */}
            <div className="space-y-4">
                {courses.map((course) => {
                    const courseId = course.id || course._id;
                    let modulesCount = course.modules_count || 21;
                    if (course.metadata) {
                        try {
                            const metadata = typeof course.metadata === 'string' ? JSON.parse(course.metadata) : course.metadata;
                            modulesCount = metadata.length || modulesCount;
                        } catch (e) {
                            console.error("Failed to parse metadata", e);
                        }
                    }

                    return (
                        <div
                            key={courseId}
                            className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleCourse(course)}
                        >
                            {/* Course Image */}
                            <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                    src={course.photo || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop'}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Course Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                    {course.title || course.mainTopic || t('common.untitled')}
                                </h3>
                                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <LuBookOpen size={14} />
                                    <span>{modulesCount} {t('dashboard_comp.chapters')}</span>
                                </div>
                            </div>

                            {/* Play Button */}
                            <button className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white flex-shrink-0 transition-colors">
                                <LuPlay size={18} className="ml-0.5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export default AudioCourses;
