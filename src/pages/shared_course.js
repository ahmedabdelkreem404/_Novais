import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverURL } from '../constants';
import { motion } from 'framer-motion';
import MediaCard from '../components/ui/MediaCard';
import {
    LuCirclePlay,
    LuMenu,
    LuSun,
    LuMoon,
    LuGraduationCap,
    LuFileText,
    LuHouse,
    LuLock
} from "react-icons/lu";
import StyledText from '../components/styledText';

const SharedCourse = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

    // Fetch Course
    useEffect(() => {
        const fetchSharedCourse = async () => {
            try {
                const res = await axios.get(`${serverURL}/share/${id}`);
                const courseData = res.data;
                let metadata = courseData.metadata;
                if (typeof metadata === 'string') {
                    try {
                        metadata = JSON.parse(metadata);
                    } catch (e) {
                        console.error("Failed to parse metadata", e);
                    }
                }

                setCourse({
                    ...courseData,
                    metadata
                });

                // Set initial subtopic - Find first UNLOCKED topic
                const chapters = metadata.chapters || metadata.topics || [];
                for (const chapter of chapters) {
                    const subs = chapter.subtopics || chapter.sections || [];
                    const firstUnlocked = subs.find(sub => sub.content || sub.theory);
                    if (firstUnlocked) {
                        setSelectedSubtopic(firstUnlocked);
                        break;
                    }
                }
            } catch (err) {
                console.error("Failed to fetch shared course", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSharedCourse();
    }, [id]);

    // Theme Toggle
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', isDarkMode);
    }, [isDarkMode]);

    const handleSubtopicClick = (subData) => {
        // Access Control: Only allow if content exists
        if (!subData.content && !subData.theory) {
            return;
        }

        setSelectedSubtopic(subData);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f0f]">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f0f0f] px-6 text-center">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Course Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">The course you are looking for doesn't exist or hasn't been shared.</p>
                <button onClick={() => navigate('/')} className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold">Return Home</button>
            </div>
        );
    }

    const { metadata } = course;
    const chapters = metadata.chapters || metadata.topics || [];

    // Construct images/videos arrays if they exist in metadata, similar to Course.js logic
    const lessonImages = selectedSubtopic?.metadata?.images || selectedSubtopic?.images || [];
    const lessonVideos = selectedSubtopic?.metadata?.videos || selectedSubtopic?.videos || [];

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">

            {/* Header */}
            <header className="h-16 flex-none bg-white dark:bg-[#0f0f0f] border-b border-gray-100 dark:border-gray-800 z-50 px-4 md:px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <LuMenu size={20} />
                    </button>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <LuGraduationCap size={24} className="text-blue-500" />
                        <span className="font-bold text-lg hidden sm:inline-block tracking-tight uppercase">Shared <span className="text-blue-500">Course</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        {isDarkMode ? <LuSun size={20} /> : <LuMoon size={20} />}
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="hidden sm:flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
                    >
                        <LuHouse size={16} />
                        <span>Home</span>
                    </button>
                </div>
            </header>

            {/* Main Layout Body */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Sidebar */}
                <aside
                    className={`
                        fixed md:relative z-40 h-full bg-white dark:bg-[#0f0f0f] border-r border-gray-100 dark:border-gray-800
                        transition-all duration-300 ease-in-out flex flex-col
                        ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden'}
                    `}
                >
                    <div className="p-6 border-b border-gray-50 dark:border-gray-800/50">
                        <h2 className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Course Content</h2>
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{course.title}</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        {chapters.map((chapter, cIdx) => (
                            <div key={cIdx}>
                                <div className="flex items-center gap-2 px-2 mb-3">
                                    <span className="w-5 h-5 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-bold">
                                        {cIdx + 1}
                                    </span>
                                    <h4 className="text-[13px] font-black uppercase tracking-tight text-gray-600 dark:text-gray-400 truncate">
                                        {chapter.title}
                                    </h4>
                                </div>
                                <div className="space-y-1">
                                    {(chapter.subtopics || chapter.sections || []).map((sub, sIdx) => {
                                        const isSelected = selectedSubtopic?.title === sub.title;
                                        const isLocked = !sub.content && !sub.theory;

                                        return (
                                            <button
                                                key={sIdx}
                                                onClick={() => handleSubtopicClick(sub)}
                                                disabled={isLocked}
                                                className={`
                                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                                                    ${isSelected
                                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                                        : isLocked
                                                            ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-white/5'
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40'}
                                                `}
                                            >
                                                {isLocked ? (
                                                    <LuLock size={16} className="text-gray-400" />
                                                ) : (
                                                    <LuFileText size={16} className={isSelected ? 'text-white' : 'text-gray-400'} />
                                                )}
                                                <span className="text-sm font-bold truncate leading-none mt-0.5">{sub.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-gray-50/50 dark:bg-black/20 border-t border-gray-50 dark:border-gray-800 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shared via NOVAIS</p>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0a0a0a]">
                    <div className="max-w-4xl mx-auto px-6 py-12 md:px-12 lg:px-16">
                        {selectedSubtopic ? (
                            <motion.div
                                key={selectedSubtopic.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-10 tracking-tight leading-tight">
                                    {selectedSubtopic.title}
                                </h1>

                                {/* Media Display */}
                                <div className="flex flex-col gap-6 mb-12">
                                    {lessonVideos.map((video, idx) => (
                                        <MediaCard key={`video-${idx}`} media={video} type="video" selectedSubtopic={selectedSubtopic.title} />
                                    ))}
                                    {lessonImages.map((img, idx) => (
                                        <MediaCard key={`image-${idx}`} media={img} type="image" selectedSubtopic={selectedSubtopic.title} />
                                    ))}

                                    {/* Fallback for legacy single media */}
                                    {(!lessonVideos.length && !lessonImages.length) && (selectedSubtopic.video_url || selectedSubtopic.image_url || selectedSubtopic.image || selectedSubtopic.video) && (
                                        <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black">
                                            {(selectedSubtopic.video_url || selectedSubtopic.video) ? (
                                                <div className="aspect-video">
                                                    <iframe
                                                        src={`https://www.youtube.com/embed/${(selectedSubtopic.video_url || '').includes('v=') ? (selectedSubtopic.video_url || '').split('v=')[1].split('&')[0] : (selectedSubtopic.video_url || '').split('/').pop()}?rel=0`}
                                                        className="w-full h-full"
                                                        title="Lesson Video"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            ) : (
                                                <img
                                                    src={selectedSubtopic.image_url || selectedSubtopic.image}
                                                    alt={selectedSubtopic.title}
                                                    className="w-full h-auto object-cover"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="prose prose-blue dark:prose-invert max-w-none text-lg leading-relaxed text-gray-600 dark:text-gray-300 antialiased font-normal">
                                    <StyledText text={selectedSubtopic.theory || selectedSubtopic.content} />

                                    {selectedSubtopic.examples && (
                                        <div className="mt-12 p-8 rounded-3xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                                                <LuCirclePlay size={20} />
                                                <h4 className="font-black uppercase tracking-tight text-sm">Examples & Practice</h4>
                                            </div>
                                            <StyledText text={selectedSubtopic.examples} />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-20 pt-10 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center">
                                    <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Want to create your own courses like this?</p>
                                    <button
                                        onClick={() => navigate('/signup')}
                                        className="px-12 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-black text-sm tracking-widest uppercase hover:scale-105 transition-transform shadow-2xl"
                                    >
                                        Start Free Trial
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                                <LuLock size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
                                <h2 className="text-xl font-bold text-gray-400">Course content is locked or currently unavailable.</h2>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SharedCourse;
