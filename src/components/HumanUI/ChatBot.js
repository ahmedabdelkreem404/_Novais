import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuMessageSquare, LuX, LuSend, LuMinimize2, LuBot } from 'react-icons/lu';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { serverURL } from '../../constants';

const ChatBot = ({ courseId, courseContext, mainTopic, chatHistory = [], onUpdateHistory }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(chatHistory.length > 0 ? chatHistory : [
        { role: 'assistant', content: t('chatbot.welcome', { topic: mainTopic }) || `Hi! I'm your AI tutor for "${mainTopic}". Ask me anything about this lesson or the platform! 🎓` }
    ]);
    const [input, setInput] = useState('');
    const containerRef = useRef(null);
    const constraintsRef = useRef(null);
    const [positionStyle, setPositionStyle] = useState({
        flexDirection: 'column',
        alignItems: 'flex-end'
    });

    const updatePositionStyle = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            const isTop = rect.top < viewportHeight / 2;
            const isLeft = rect.left < viewportWidth / 2;
            
            setPositionStyle({
                flexDirection: isTop ? 'column-reverse' : 'column',
                alignItems: isLeft ? 'flex-start' : 'flex-end'
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            setTimeout(updatePositionStyle, 50);
        }
    }, [isOpen]);

    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Update messages when chatHistory changes from parent
    useEffect(() => {
        if (chatHistory && chatHistory.length > 0) {
            setMessages(chatHistory);
        }
    }, [chatHistory]);

    // Sync welcome message on language change if no chat has started
    useEffect(() => {
        if (messages.length === 1 && messages[0].role === 'assistant' && (!chatHistory || chatHistory.length === 0)) {
            setMessages([
                { role: 'assistant', content: t('chatbot.welcome', { topic: mainTopic }) || `Hi! I'm your AI tutor for "${mainTopic}". Ask me anything about this lesson or the platform! 🎓` }
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [i18n.language, mainTopic]);

    // Fetch history from backend
    useEffect(() => {
        const fetchHistory = async () => {
            if (courseId) {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;

                    const res = await axios.get(`${serverURL}/courses/${courseId}/chat/history`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                        const formatted = res.data.map(msg => ({
                            role: msg.role,
                            content: msg.content
                        }));
                        setMessages(formatted);
                    }
                } catch (error) {
                    console.error("Failed to fetch chat history", error);
                }
            }
        };
        fetchHistory();
    }, [courseId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "Please sign in to use the AI tutor."
                }]);
                setLoading(false);
                return;
            }

            const response = await axios.post(`${serverURL}/chat`, {
                message: input,
                context: typeof courseContext === 'string' ? courseContext : JSON.stringify(courseContext || ''),
                topic: String(mainTopic || ''),
                courseId: courseId ? String(courseId) : null,
                history: newMessages.slice(-10) // Send recent context
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const aiMsg = {
                role: 'assistant',
                content: response.data.reply || response.data.message || "I'm sorry, I couldn't process that. Please try again."
            };
            const finalMessages = [...newMessages, aiMsg];
            setMessages(finalMessages);
            if (onUpdateHistory) onUpdateHistory(finalMessages);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Network error. Please try again."
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div ref={constraintsRef} className="fixed inset-6 pointer-events-none z-[120]" />
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-[125] bg-transparent pointer-events-auto cursor-default"
                />
            )}
            <motion.div
                ref={containerRef}
                drag
                dragConstraints={constraintsRef}
                dragElastic={0}
                dragMomentum={false}
                onDrag={updatePositionStyle}
                className="fixed right-6 bottom-28 z-[130] flex gap-3 pointer-events-auto"
                style={{ 
                    touchAction: 'none',
                    flexDirection: positionStyle.flexDirection,
                    alignItems: positionStyle.alignItems
                }}
            >
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.96 }}
                            onClick={(event) => event.stopPropagation()}
                            className="w-[350px] sm:w-[380px] max-w-[calc(100vw-32px)] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-[24px] shadow-2xl flex flex-col overflow-hidden"
                            style={{ height: 'min(460px, calc(100vh - 200px))' }}
                            dir={i18n.dir()}
                        >
                            {/* Header */}
                            <div className="bg-slate-900 dark:bg-slate-950 p-4 flex justify-between items-center border-b border-white/5 cursor-move">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                        <LuBot size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-[13px]">{t('chatbot.title') || 'AI Professor'}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">{t('chatbot.status') || 'Active Helper'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors">
                                    <LuMinimize2 size={16} />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-900/50 custom-scrollbar">
                                {messages.map((msg, idx) => {
                                    const msgIsArabic = isArabic(msg.content);
                                    const isUser = msg.role === 'user';
                                    const alignment = isRTL
                                        ? (isUser ? 'justify-start' : 'justify-end')
                                        : (isUser ? 'justify-end' : 'justify-start');

                                    return (
                                        <div key={idx} className={`flex ${alignment}`}>
                                            <div
                                                dir={msgIsArabic ? 'rtl' : 'ltr'}
                                                className={`max-w-[85%] min-w-0 rounded-2xl p-3.5 text-[13px] font-medium leading-relaxed shadow-sm break-words overflow-hidden ${isUser
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-tl-none'
                                                    }`}
                                            >
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc ms-5 mb-2" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal ms-5 mb-2" {...props} />,
                                                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                        strong: ({ node, ...props }) => <strong className="font-bold text-blue-600 dark:text-blue-400" {...props} />,
                                                        code: ({ node, ...props }) => <code className="break-words whitespace-pre-wrap bg-black/5 dark:bg-white/10 rounded px-1" {...props} />,
                                                        pre: ({ node, ...props }) => <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words" {...props} />,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    );
                                })}
                                {loading && (
                                    <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-slate-500 rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-slate-500 rounded-full animate-bounce delay-75" />
                                            <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-slate-500 rounded-full animate-bounce delay-150" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={t('chatbot.placeholder') || "Ask about this lesson..."}
                                    className="flex-1 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/20 dark:text-white outline-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <LuSend size={18} />
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 bg-blue-600 rounded-full text-white shadow-2xl shadow-blue-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                    {isOpen ? <LuX size={24} /> : <LuMessageSquare size={24} />}
                </button>
            </motion.div>
        </>
    );
};

export default ChatBot;
