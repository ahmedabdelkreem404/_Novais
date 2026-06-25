import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LuArrowLeft, LuPlay } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

const CourseDetail = () => {
    const { t } = useTranslation();
    const { state } = useLocation();
    const { courseId: urlCourseId } = useParams();
    const navigate = useNavigate();
    const [courseData, setCourseData] = useState(null);

    // Fallback source from session storage if state is missing
    const getStoredData = () => {
        try {
            return JSON.parse(localStorage.getItem('jsonData'));
        } catch {
            return null;
        }
    };

    const jsonData = state?.jsonData || getStoredData();
    const mainTopic = state?.mainTopic || (jsonData ? (jsonData.title || jsonData.mainTopic) : null);
    // const type = state?.type || 'text & image course'; // Unused
    const photo = state?.photo; // Photo might be missing in session fallback, implies optional
    const courseId = urlCourseId || state?.courseId || localStorage.getItem('courseId');

    useEffect(() => {
        if (!jsonData || !mainTopic) {
            navigate('/dashboard/audio-courses');
            return;
        }

        // Parse the course data
        let parsedData = jsonData;
        if (typeof jsonData === 'string') {
            try {
                parsedData = JSON.parse(jsonData);
            } catch (e) {
                console.error('Failed to parse course data');
            }
        }
        setCourseData(parsedData);
    }, [jsonData, mainTopic, navigate]);

    const getCourseTopics = (data, topic) => {
        if (!data) return null;
        const topics = data[topic] || data[topic.toLowerCase()] || data[topic.toUpperCase()] || data[topic.trim()];
        if (topics && Array.isArray(topics)) return topics;
        if (data.chapters && Array.isArray(data.chapters)) return data.chapters;
        if (data.topics && Array.isArray(data.topics)) return data.topics;
        const firstArray = Object.values(data).find(val => Array.isArray(val));
        if (firstArray) return firstArray;
        return null;
    };

    const handleStartLesson = (topic, subtopic) => {
        localStorage.setItem('courseId', courseId);
        localStorage.setItem('jsonData', JSON.stringify(courseData));

        navigate(`/audio-player/${courseId}`, {
            state: {
                lessonTitle: subtopic.title || 'Lesson',
                sectionTitle: topic.title || 'Section',
                lessonContent: subtopic.content || subtopic.description || null,
                mainTopic: mainTopic,
                photo: photo,
                courseId: courseId
            }
        });
    };

    const topics = courseData ? getCourseTopics(courseData, mainTopic) : null;

    if (!courseData) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/dashboard/audio-courses')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium mb-6 transition-colors"
            >
                <LuArrowLeft size={16} />
                <span>{t('common.back_to_courses')}</span>
            </button>

            {/* Course Image */}
            <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden mb-6">
                <img
                    src={photo || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop'}
                    alt={mainTopic}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Course Title */}
            <h1 className="text-2xl font-bold text-blue-500 mb-6 uppercase">
                {mainTopic}
            </h1>

            {/* Topics and Lessons */}
            <div className="space-y-6">
                {topics && topics.map((topic, topicIdx) => (
                    <div key={topic.title || topicIdx}>
                        {/* Section Header */}
                        <div className="bg-blue-500 text-white px-4 py-2.5 rounded-lg mb-3">
                            <h2 className="text-sm font-medium">
                                {topic.title || `Chapter ${topicIdx + 1}`}
                            </h2>
                        </div>

                        {/* Lessons */}
                        <div className="space-y-2">
                            {(topic.subtopics || topic.sections || topic.lessons || []).map((subtopic, subIdx) => (
                                <div
                                    key={subtopic.title || subIdx}
                                    onClick={() => handleStartLesson(topic, subtopic)}
                                    className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group"
                                >
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        {subtopic.title || `Lesson ${subIdx + 1}`}
                                    </span>
                                    <button className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white flex-shrink-0 transition-colors group-hover:scale-105">
                                        <LuPlay size={14} className="ml-0.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* If no topics found, show a message */}
                {(!topics || topics.length === 0) && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">
                            {t('audio.no_content')}
                        </p>
                        <button
                            onClick={() => navigate('/dashboard/audio-courses')}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                            {t('common.back_to_courses')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseDetail;
