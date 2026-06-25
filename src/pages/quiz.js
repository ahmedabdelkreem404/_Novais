import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { serverURL } from '../constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
// Icons
import { LuCircleCheck, LuTrophy, LuTimer, LuArrowRight, LuArrowLeft, LuRefreshCw, LuBrain, LuBookOpen } from "react-icons/lu";
import StyledText from '../components/styledText';

const QuizPage = () => {
    const { courseId: urlCourseId } = useParams();
    const location = useLocation();
    const { state } = location;
    const { courseId: stateCourseId, courseTitle } = state || {};
    const courseId = stateCourseId || urlCourseId;
    const navigate = useNavigate();

    // State Recovery Key
    const storageKey = `quiz_state_${courseId}`;

    const getSavedState = useCallback(() => {
        const saved = localStorage.getItem(storageKey);
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse quiz state", e);
            return null;
        }
    }, [storageKey]);

    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(() => {
        const state = getSavedState();
        return state ? state.currentQIndex : 0;
    });
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const [answers, setAnswers] = useState(() => {
        const state = getSavedState();
        return state ? state.answers : {};
    }); // { 0: 'Option A', 1: 'Option B' }
    const [isSubmitted, setIsSubmitted] = useState(() => {
        const state = getSavedState();
        return state ? state.isSubmitted || false : false;
    });
    const [score, setScore] = useState(() => {
        const state = getSavedState();
        return state ? state.score || 0 : 0;
    });

    // Timer States
    const [timeLeft, setTimeLeft] = useState(null);
    const [isTimeUp, setIsTimeUp] = useState(false);

    const generateQuiz = useCallback(async () => {
        setGenerating(true);
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post(`${serverURL}/courses/${courseId}/quiz`, {}, { headers: { Authorization: `Bearer ${token}` } });
            const quizData = res.data;
            if (quizData?.questions) {
                setQuestions(quizData.questions);
                if (quizData.time_limit) {
                    const expiry = Date.now() + quizData.time_limit * 1000;
                    localStorage.setItem(`${storageKey}_expiry`, expiry.toString());
                    setTimeLeft(quizData.time_limit);
                }
                setLoading(false);
            }
        } catch (e) {
            toast.error("Failed to generate quiz.");
            setLoading(false);
        } finally {
            setGenerating(false);
        }
    }, [courseId, storageKey]);

    // Fetch Quiz
    useEffect(() => {
        if (!courseId) return navigate('/course');

        const fetchQuiz = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/signin');

            // REDIRECT TO PUBLIC ID IF CURRENT URL USES NUMERIC ID
            if (/^\d+$/.test(urlCourseId)) {
                try {
                    const resCourse = await axios.get(`${serverURL}/courses/${urlCourseId}`, { headers: { Authorization: `Bearer ${token}` } });
                    if (resCourse.data.public_id) {
                        navigate(`/course/${resCourse.data.public_id}/quiz`, {
                            replace: true,
                            state: { ...state, courseId: resCourse.data.public_id }
                        });
                        return;
                    }
                } catch (e) { console.error("Redirect check failed", e); }
            }

            // Check if we need to force a new quiz (from Course page "Take Final Exam")
            if (state?.generateNew) {
                // Clear the flag so F5 doesn't regenerate
                navigate(location.pathname, { state: { ...state, generateNew: false }, replace: true });
                generateQuiz();
                return;
            }

            try {
                // Try fetching existing quiz first
                const res = await axios.get(`${serverURL}/courses/${courseId}/quiz`, { headers: { Authorization: `Bearer ${token}` } });
                const existing = res.data?.[0]; // Get the most recent one if multiple? Backend returns array.

                if (existing?.questions?.length > 0) {
                    setQuestions(existing.questions);

                    // Recover timer from expiry timestamp
                    const savedExpiry = localStorage.getItem(`${storageKey}_expiry`);
                    if (savedExpiry) {
                        const remaining = Math.max(0, Math.floor((parseInt(savedExpiry) - Date.now()) / 1000));
                        setTimeLeft(remaining);
                        if (remaining === 0) setIsTimeUp(true);
                    } else {
                        // First time entering an existing quiz (or resumed without local timer)
                        const limit = existing.time_limit || existing.questions.length * 60;
                        const expiry = Date.now() + limit * 1000;
                        localStorage.setItem(`${storageKey}_expiry`, expiry.toString());
                        setTimeLeft(limit);
                    }

                    setLoading(false);
                } else {
                    // Start generation automatically if none exists
                    generateQuiz();
                }
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [courseId, urlCourseId, navigate, generateQuiz, storageKey, state, location.pathname]);

    // Persistence Effect
    useEffect(() => {
        if (questions.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify({
                currentQIndex,
                answers,
                isSubmitted,
                score
            }));
        }
    }, [currentQIndex, answers, questions, isSubmitted, score, storageKey]);

    const handleOptionSelect = (option) => {
        if (isSubmitted || isTimeUp) return;
        setAnswers({ ...answers, [currentQIndex]: option });
    };

    // Timer Effect
    useEffect(() => {
        if (timeLeft === null || isSubmitted || isTimeUp) return;

        if (timeLeft <= 0) {
            setIsTimeUp(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isSubmitted, isTimeUp]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRetry = () => {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}_expiry`);
        setQuestions([]);
        setAnswers({});
        setCurrentQIndex(0);
        setIsSubmitted(false);
        setIsTimeUp(false);
        setLoading(true);
        // FORCE NEW GENERATION ON RETRY
        generateQuiz();
    };


    const nextQuestion = () => {
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(currentQIndex + 1);
        } else {
            submitQuiz();
        }
    };

    const prevQuestion = () => {
        if (currentQIndex > 0) {
            setCurrentQIndex(currentQIndex - 1);
        }
    };



    const syncQuizResult = async (res) => {
        try {
            const token = localStorage.getItem('token');
            const resGet = await axios.get(`${serverURL}/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } });
            let meta = resGet.data.metadata;
            if (typeof meta === 'string') {
                try {
                    meta = JSON.parse(meta);
                } catch (e) {
                    console.error("Failed to parse metadata", e);
                }
            }

            // Logic: Only update if new score is higher OR if no score existed
            const existingResult = meta.quizResult;
            const existingScore = existingResult ? (existingResult.score || 0) : -1;

            let finalResult = res;
            if (existingScore >= res.score) {
                // Keep the old result if it's better or equal
                finalResult = existingResult;
            }

            const updated = { ...meta, quizResult: finalResult };
            await axios.put(`${serverURL}/courses/${courseId}`, {
                metadata: updated
            }, { headers: { Authorization: `Bearer ${token}` } });
            localStorage.setItem('jsonData', JSON.stringify(updated));
        } catch (e) {
            console.error("Quiz sync failed", e);
        }
    };

    const submitQuiz = () => {
        let correctCount = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] === q.correct_answer) correctCount++;
        });

        const calculatedScore = Math.round((correctCount / questions.length) * 100);
        const passed = calculatedScore >= 60; // Accuracy threshold changed to 60%

        // Grading Logic
        let grade = "Pass";
        if (calculatedScore >= 90) grade = "Excellent";
        else if (calculatedScore >= 80) grade = "Very Good";
        else if (calculatedScore >= 70) grade = "Good";
        else if (calculatedScore < 60) grade = "Fail";

        setScore(calculatedScore);
        setIsSubmitted(true);
        // Save final state immediately
        localStorage.setItem(storageKey, JSON.stringify({
            currentQIndex,
            answers,
            isSubmitted: true,
            score: calculatedScore
        }));

        const resultObj = {
            score: calculatedScore,
            grade: grade, // Include grade in results
            passed: passed,
            completedAt: new Date().toISOString(),
            courseTitle: courseTitle
        };
        syncQuizResult(resultObj);

        if (passed) {
            triggerConfetti();
            toast.success(`Exam Passed with ${calculatedScore}% (${grade})! 🏆`);
        } else {
            toast.error("Score below 60%. Please review and try again.");
        }
    };

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    };

    const currentQuestion = questions[currentQIndex];

    if (loading || generating) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#020617] relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-500/5 animate-pulse" />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="relative z-10 text-primary-500 mb-6 text-6xl"
                >
                    <LuBrain />
                </motion.div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white z-10">Crafting Challenge...</h2>
                <p className="text-gray-500 dark:text-gray-400 z-10 mt-2">Analyzing the entire course content for a strictly timed final exam</p>
            </div>
        );
    }

    // Time Up View
    if (isTimeUp) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#020617] p-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-30 blur-[100px] bg-gradient-to-br from-red-500/20 to-orange-500/20" />
                <Card className="max-w-md w-full p-10 text-center relative z-10 flex flex-col items-center border-red-500/30">
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mb-6 shadow-2xl"
                    >
                        <LuTimer className="text-white text-5xl animate-pulse" />
                    </motion.div>

                    <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Time is Up!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        The strict exam timer has expired. To maintain academic integrity, you must attempt a fresh set of questions.
                    </p>

                    <div className="flex flex-col gap-3 w-full">
                        <Button variant="primary" className="w-full !py-4 text-lg" onClick={handleRetry}>
                            Retry with New Questions
                        </Button>
                        <Button variant="secondary" className="w-full !bg-white/5 !text-gray-400 hover:!text-white" onClick={() => navigate(-1)}>
                            Back to Course
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (isSubmitted) {
        const correctCount = questions.filter((q, idx) => answers[idx] === q.correct_answer).length;
        const totalQ = questions.length;

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#020617] p-4 relative overflow-hidden">
                {/* Background Glow - Dynamic based on success */}
                <div className={`absolute inset-0 opacity-30 blur-[100px] transition-all duration-1000 ${score >= 60
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
                    : 'bg-gradient-to-br from-orange-500/20 to-red-500/20'}`}
                />

                <Card className="max-w-2xl w-full p-0 overflow-hidden relative z-10 border-white/10 shadow-2xl bg-white/90 dark:bg-white/5 backdrop-blur-2xl rounded-[32px]">
                    <div className="p-8 md:p-12 text-center flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className={`w-28 h-28 rounded-full flex items-center justify-center mb-8 shadow-2xl ${score >= 60
                                ? 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-green-500/40'
                                : 'bg-gradient-to-br from-orange-400 to-red-600 shadow-red-500/40'}`}
                        >
                            {score >= 60 ? (
                                <LuTrophy className="text-white text-5xl drop-shadow-lg" />
                            ) : (
                                <LuRefreshCw className="text-white text-5xl drop-shadow-lg" />
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                                {score}% <span className="text-2xl font-bold opacity-50 uppercase tracking-widest ml-2">Score</span>
                            </h2>
                            <p className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
                                {score >= 60
                                    ? "Exceptional! You've mastered the concepts and earned your official certification."
                                    : "Not quite there yet. Review the course materials and try again to achieve certification."
                                }
                            </p>
                        </motion.div>

                        {/* Statistics Grid */}
                        <div className="grid grid-cols-3 gap-4 w-full mb-10">
                            {[
                                { label: 'Correct', value: correctCount, color: 'text-green-500', icon: LuCircleCheck },
                                { label: 'Questions', value: totalQ, color: 'text-blue-500', icon: LuBookOpen },
                                { label: 'Accuracy', value: `${score}%`, color: 'text-purple-500', icon: LuBrain },
                            ].map((stat, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 group hover:border-blue-500/30 transition-colors">
                                    <stat.icon size={20} className={`${stat.color} mb-3 mx-auto`} />
                                    <div className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-4 w-full max-w-md">
                            {score >= 60 && (
                                <>
                                    <button
                                        onClick={() => navigate(`/course/${courseId}/certificate`, {
                                            state: {
                                                courseId,
                                                courseTitle,
                                                quizResult: { score, passed: true, completedAt: new Date().toISOString(), courseTitle }
                                            }
                                        })}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black tracking-wide shadow-xl shadow-blue-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
                                    >
                                        <LuTrophy size={22} />
                                        Claim Your Certificate
                                    </button>
                                </>
                            )}

                            <div className={`grid ${score < 100 ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mt-2`}>
                                {score < 100 && (
                                    <button
                                        onClick={handleRetry}
                                        className="py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <LuRefreshCw size={18} />
                                        {score >= 60 ? "Improve Score" : "New Attempt"}
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate(-1)}
                                    className="py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-2xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                                >
                                    Return to Course
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }


    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#020617] relative p-4 overflow-hidden transition-colors duration-300">
            {/* Sticky Exam Navbar */}
            <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white line-clamp-1 flex-1">
                        {courseTitle}
                    </h2>
                    <div className={`shrink-0 px-4 py-1.5 rounded-full border text-sm font-bold flex items-center gap-2 shadow-sm transition-all ${timeLeft < 30
                        ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-red-500/20'
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
                        }`}>
                        <LuTimer className={timeLeft < 30 ? 'animate-spin-slow' : ''} />
                        <span className="font-mono">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
                    </div>
                </div>
            </nav>

            {/* Ambient Background */}
            <div className="fixed top-16 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 z-40">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                />
            </div>

            <div className="w-full max-w-3xl z-10 pt-20">

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQIndex + '-' + questions.length}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="p-8 md:p-12 min-h-[400px] flex flex-col justify-start border-white/20 shadow-xl bg-white/80 dark:bg-white/5 backdrop-blur-xl">
                            <span className="text-[10px] items-center text-center font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-4 inline-block">
                                Question {currentQIndex + 1} of {questions.length}
                            </span>
                            <div className="mb-4">
                                <StyledText text={currentQuestion.question} variant="quiz" />
                            </div>

                            <div className="space-y-4">
                                {['A', 'B', 'C', 'D'].map((opt, index) => {
                                    // Handle both array-based options (New) and legacy key-based options
                                    const optionText = currentQuestion.options
                                        ? currentQuestion.options[index]
                                        : currentQuestion[`option_${opt.toLowerCase()}`];

                                    const isSelected = answers[currentQIndex] === optionText;

                                    return (
                                        <motion.button
                                            key={opt}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleOptionSelect(optionText)}
                                            className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${isSelected
                                                ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10'
                                                : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-primary-500/50 hover:bg-white/50 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 group-hover:bg-primary-500 group-hover:text-white transition-colors'}`}>
                                                    {opt}
                                                </span>
                                                <span className={`text-lg font-medium ${isSelected ? 'text-primary-700 dark:text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                                                    {(() => {
                                                        const cleanText = optionText.replace(/`/g, '');
                                                        // Split by common programming tokens but keep them for rendering
                                                        const parts = cleanText.split(/([A-Za-z0-9._\-+#(){}[\];]+)/g);
                                                        return parts.map((part, i) => {
                                                            if (!part) return null;
                                                            // If it's a technical token (Latin chars, numbers, symbols)
                                                            if (/^[A-Za-z0-9._]/.test(part) || /[+\-#(){}[\];]/.test(part)) {
                                                                return <code key={i} dir="ltr" className="font-mono text-[0.95em] text-blue-600 dark:text-blue-400">{part}</code>;
                                                            }
                                                            return part;
                                                        });
                                                    })()}
                                                </span>
                                            </div>
                                            {isSelected && <LuCircleCheck className="text-primary-500 text-xl" />}
                                        </motion.button>
                                    );
                                })}
                            </div>

                        </Card>
                    </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex justify-between items-center">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={prevQuestion}
                        disabled={currentQIndex === 0}
                        className={currentQIndex === 0 ? 'opacity-0 pointer-events-none' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'}
                    >
                        <LuArrowLeft className="mr-2" /> Previous
                    </Button>

                    <Button
                        size="lg"
                        onClick={nextQuestion}
                        disabled={!answers[currentQIndex]}
                        className={!answers[currentQIndex] ? 'opacity-50 cursor-not-allowed' : 'shadow-xl shadow-primary-500/20'}
                    >
                        {currentQIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'} <LuArrowRight className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;
