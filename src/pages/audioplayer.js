import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LuArrowLeft, LuPlay, LuPause, LuChevronDown, LuCheck } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { cleanNarrationText, containsArabic } from '../utils/textCleanup';

// Custom Arabic voices using external TTS
const ARABIC_VOICES = [
    { name: 'Arabic Male', lang: 'ar', gender: 'male', key: 'audio.voices.ar_male' },
    { name: 'Arabic Female', lang: 'ar', gender: 'female', key: 'audio.voices.ar_female' },
];

const hasResponsiveVoiceKey = Boolean(process.env.REACT_APP_RESPONSIVEVOICE_KEY);

const responsiveVoiceScriptUrl = () => {
    const key = process.env.REACT_APP_RESPONSIVEVOICE_KEY;
    const baseUrl = 'https://code.responsivevoice.org/responsivevoice.js';

    return key ? `${baseUrl}?key=${encodeURIComponent(key)}` : baseUrl;
};

const AudioPlayer = () => {
    const { t } = useTranslation();
    const { state } = useLocation();
    const { courseId } = useParams();
    const navigate = useNavigate();

    // Core State
    const [isPlaying, setIsPlaying] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isArabicVoice, setIsArabicVoice] = useState(false);

    // Highlighting State
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);


    const utteranceRef = useRef(null);
    const { lessonTitle, sectionTitle, lessonContent, photo } = state || {};

    // Generate Text Content based on language
    const textContent = useMemo(() => {
        let content = lessonContent || '';

        if (!content || content.trim().length === 0) {
            return t('audio.no_content');
        }

        return cleanNarrationText(content);
    }, [t, lessonContent]);

    // Split text into words for highlighting
    const words = useMemo(() => {
        return textContent.split(/(\s+)/).filter(w => w.length > 0);
    }, [textContent]);

    // Map character index to word index
    const charToWordIndex = useMemo(() => {
        let mapping = [];
        let currentCharCount = 0;
        words.forEach((word, index) => {
            for (let i = 0; i < word.length; i++) {
                mapping[currentCharCount + i] = index;
            }
            currentCharCount += word.length;
        });
        return mapping;
    }, [words]);

    useEffect(() => {
        // Load ResponsiveVoice script
        if (hasResponsiveVoiceKey && !window.responsiveVoice) {
            const script = document.createElement('script');
            script.src = responsiveVoiceScriptUrl();
            script.async = true;
            document.body.appendChild(script);
        }

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            const allVoices = [];

            availableVoices.filter(v => v.lang.startsWith('ar')).forEach(v => {
                allVoices.push({ name: v.name, lang: v.lang, isArabic: true, nativeVoice: v });
            });

            if (hasResponsiveVoiceKey) {
                ARABIC_VOICES.forEach(v => allVoices.push({ ...v, isArabic: true }));
            }

            availableVoices.filter(v => v.lang.startsWith('en')).forEach(v => {
                allVoices.push({ name: v.name, lang: v.lang, isArabic: false, nativeVoice: v });
            });

            setVoices(allVoices);

            const contentIsArabic = containsArabic(textContent);
            const firstArabic = allVoices.find(v => v.isArabic);
            const davidVoice = allVoices.find(v => v.name.includes('David'));
            const firstEnglish = allVoices.find(v => !v.isArabic);
            const selected = contentIsArabic ? (firstArabic || allVoices[0]) : (davidVoice || firstEnglish || allVoices[0]);
            setSelectedVoice(selected);
            setIsArabicVoice(Boolean(selected?.isArabic || selected?.lang?.startsWith('ar') || contentIsArabic));
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.cancel();
            if (window.responsiveVoice) window.responsiveVoice.cancel();
        };
    }, [textContent]);

    const speakText = (text) => {
        if (selectedVoice?.isArabic && !selectedVoice?.nativeVoice) {
            // ResponsiveVoice for Arabic
            if (window.responsiveVoice) {
                const voiceName = selectedVoice.gender === 'female' ? 'Arabic Female' : 'Arabic Male';
                const estimatedDuration = text.length / 15;
                const startTime = Date.now();

                window.responsiveVoice.speak(text, voiceName, {
                    onstart: () => {
                        setIsPlaying(true);
                        const interval = setInterval(() => {
                            if (!window.responsiveVoice.isPlaying()) {
                                clearInterval(interval);
                                return;
                            }
                            const elapsed = (Date.now() - startTime) / 1000;
                            const p = Math.min((elapsed / estimatedDuration) * 100, 100);
                            setProgress(p);

                            const charPos = Math.floor((p / 100) * text.length);

                            if (charToWordIndex[charPos] !== undefined) {
                                setCurrentWordIndex(charToWordIndex[charPos]);
                            }

                        }, 100);
                    },
                    onend: () => {
                        setIsPlaying(false);
                        setProgress(100);
                        setCurrentWordIndex(-1);
                    },
                    onerror: () => setIsPlaying(false),
                });
            }
        } else {
            // Native SpeechSynthesis
            const utterance = new SpeechSynthesisUtterance(text);
            if (selectedVoice?.nativeVoice) {
                utterance.voice = selectedVoice.nativeVoice;
                utterance.lang = selectedVoice.lang;
            }

            utterance.onstart = () => setIsPlaying(true);
            utterance.onend = () => {
                setIsPlaying(false);
                setProgress(100);
                setCurrentWordIndex(-1);
            };
            utterance.onerror = () => setIsPlaying(false);

            utterance.onboundary = (event) => {
                if (event.name === 'word' || event.name === 'sentence') {
                    const charIdx = event.charIndex;


                    if (text.length > 0) {
                        setProgress((charIdx / text.length) * 100);
                    }

                    let runningLength = 0;
                    for (let i = 0; i < words.length; i++) {
                        const wordLength = words[i].length;
                        if (charIdx >= runningLength && charIdx < runningLength + wordLength) {
                            setCurrentWordIndex(i);
                            break;
                        }
                        runningLength += wordLength;
                    }
                }
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handlePlay = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            if (window.responsiveVoice) window.responsiveVoice.cancel();
            setIsPlaying(false);
            return;
        }

        // Reset if starting from end
        if (progress === 100) {
            setProgress(0);
            setCurrentWordIndex(-1);
        }

        speakText(textContent);
    };

    const selectVoice = (voice) => {
        setSelectedVoice(voice);
        const isArabic = voice.isArabic || voice.lang.startsWith('ar');
        setIsArabicVoice(isArabic);
        setShowVoiceDropdown(false);

        window.speechSynthesis.cancel();
        if (window.responsiveVoice) window.responsiveVoice.cancel();
        setIsPlaying(false);
        setProgress(0);
        setCurrentWordIndex(-1);
    };

    // Determine direction
    const dir = isArabicVoice || containsArabic(textContent) ? 'rtl' : 'ltr';
    const alignClass = isArabicVoice ? 'text-right' : 'text-left';

    return (
        <div className={`min-h-screen bg-white dark:bg-[#0f0f0f] ${dir === 'rtl' ? 'rtl' : 'ltr'}`} dir={dir}>
            <style>{`
                ::selection { background-color: #fef08a; color: #000; }
            `}</style>

            <div className="w-full px-[2%] py-8 pb-80 md:pb-64">
                {/* Back Button */}
                <button
                    onClick={() => navigate(`/dashboard/audio-courses/${courseId}`)}
                    className={`flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:white text-sm font-medium mb-8 transition-colors ${isArabicVoice ? 'flex-row-reverse' : ''}`}
                >
                    <LuArrowLeft size={16} className={isArabicVoice ? 'rotate-180' : ''} />
                    <span>{t('audio.back_to_courses')}</span>
                </button>

                {/* Lesson Title */}
                <h1 className={`text-2xl md:text-3xl font-bold text-blue-500 mb-8 ${alignClass}`}>
                    {lessonTitle || t('common.untitled')}
                </h1>

                {/* Lesson Content with Smart Formatting */}
                <div className={`text-gray-700 dark:text-gray-300 leading-loose text-lg ${alignClass}`}>
                    {(() => {
                        const renderedBlocks = [];
                        let currentBlockWords = [];

                        const flushBlock = () => {
                            if (currentBlockWords.length === 0) return;

                            const blockText = currentBlockWords.map(b => b.text).join('');
                            const isHeading = blockText.length < 100 && (blockText.trim().endsWith('?') || blockText.trim().endsWith(':') || blockText.trim().startsWith('##'));

                            const BlockTag = isHeading ? 'h2' : 'p';
                            const blockClasses = isHeading
                                ? 'text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4'
                                : 'mb-6 text-gray-700 dark:text-gray-300 leading-relaxed';

                            renderedBlocks.push(
                                <BlockTag key={renderedBlocks.length} className={blockClasses}>
                                    {currentBlockWords.map((item, idx) => {
                                        const { text, globalIndex } = item;
                                        const isWhitespace = /^\s+$/.test(text);
                                        const isActive = globalIndex === currentWordIndex && !isWhitespace;

                                        if (isWhitespace) return <span key={globalIndex}>{text}</span>;

                                        return (
                                            <span
                                                key={globalIndex}
                                                className={`transition-colors duration-100 rounded px-0.5 box-decoration-clone ${isActive
                                                    ? 'bg-yellow-300 dark:bg-yellow-600/60 text-gray-900 dark:text-white font-medium shadow-sm'
                                                    : ''
                                                    }`}
                                            >
                                                {text}
                                            </span>
                                        );
                                    })}
                                </BlockTag>
                            );
                            currentBlockWords = [];
                        };

                        words.forEach((word, index) => {
                            if (word.includes('\n\n')) {
                                flushBlock();
                            } else {
                                currentBlockWords.push({ text: word, globalIndex: index });
                            }
                        });

                        flushBlock();
                        return renderedBlocks;
                    })()}
                </div>
            </div>

            {/* Fixed Bottom Player Container */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
                <div className="w-full px-[2%] py-4">

                    {/* 1. Track Info & Card */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-blue-100 border border-gray-100 dark:border-gray-800">
                            <img
                                src={photo || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop'}
                                alt={lessonTitle}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className={`text-sm font-semibold text-gray-900 dark:text-white truncate ${alignClass}`}>
                                {lessonTitle || t('common.untitled')}
                            </h3>
                            <p className={`text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate ${alignClass}`}>
                                {sectionTitle}
                            </p>
                        </div>
                    </div>

                    {/* 2. Slider */}
                    <div className="relative w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer group mb-6">
                        <div
                            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                        <div
                            className="absolute top-1/2 -mt-2 w-4 h-4 rounded-full bg-white border border-blue-100 shadow-md transform transition-all duration-100 group-hover:scale-110"
                            style={{ left: `${progress}%`, marginLeft: '-6px' }}
                        />
                    </div>

                    {/* 3. Controls */}
                    <div className="flex items-center justify-between">
                        {/* Play Button */}
                        <button
                            onClick={handlePlay}
                            className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
                        >
                            {isPlaying ? <LuPause size={20} fill="currentColor" /> : <LuPlay size={20} fill="currentColor" className="ml-0.5" />}
                        </button>

                        {/* Voice Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                            >
                                <span className="max-w-[180px] truncate block text-left">
                                    {selectedVoice?.key ? t(selectedVoice.key) : (selectedVoice?.name || t('audio.select_voice'))}
                                </span>
                                <LuChevronDown size={16} className={`text-gray-400 transition-transform ${showVoiceDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Voice Dropdown */}
                            {showVoiceDropdown && (
                                <div className={`absolute bottom-full mb-2 w-72 max-h-64 overflow-y-auto bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 ${isArabicVoice ? 'left-0' : 'right-0'}`}>
                                    {/* Arabic */}
                                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 text-left">
                                        <span className="text-xs font-bold text-gray-500 uppercase">{t('profile.language')}: عربي</span>
                                    </div>
                                    {voices.filter(v => v.isArabic).map((voice, idx) => (
                                        <button
                                            key={`ar-${idx}`}
                                            onClick={() => selectVoice(voice)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-gray-800
                                                ${selectedVoice?.name === voice.name ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/10' : 'text-gray-700 dark:text-gray-300'}`}
                                        >
                                            {selectedVoice?.name === voice.name && <LuCheck size={14} />}
                                            <span className={selectedVoice?.name === voice.name ? '' : 'ml-6'}>{voice.key ? t(voice.key) : voice.name}</span>
                                        </button>
                                    ))}
                                    {voices.filter(v => v.isArabic).length === 0 && (
                                        <div className="px-4 py-3 text-xs text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20">
                                            Arabic voice is not available in this browser. English voices remain available.
                                        </div>
                                    )}
                                    {/* English */}
                                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 text-left">
                                        <span className="text-xs font-bold text-gray-500 uppercase">{t('profile.language')}: English</span>
                                    </div>
                                    {voices.filter(v => !v.isArabic).map((voice, idx) => (
                                        <button
                                            key={`en-${idx}`}
                                            onClick={() => selectVoice(voice)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0
                                                ${selectedVoice?.name === voice.name ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/10' : 'text-gray-700 dark:text-gray-300'}`}
                                        >
                                            {selectedVoice?.name === voice.name && <LuCheck size={14} />}
                                            <span className={selectedVoice?.name === voice.name ? '' : 'ml-6'}>{voice.key ? t(voice.key) : voice.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
