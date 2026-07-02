import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuX, LuMonitor, LuFileText, LuLoaderCircle } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { serverURL } from '../constants';

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const filenameFromDisposition = (header, fallback) => {
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header || '');
    return match ? decodeURIComponent(match[1]) : fallback;
};

const ExportModal = ({ isOpen, onClose, courseId, mainTopic }) => {
    const [isGenerating, setIsGenerating] = useState(null);

    const handleBackendExport = async (type) => {
        if (!courseId) {
            toast.error('Course is still loading. Please try again.');
            return;
        }

        setIsGenerating(type);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${serverURL}/courses/${courseId}/export/${type}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: type === 'pdf'
                        ? 'application/pdf'
                        : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                },
            });

            if (!response.ok) {
                throw new Error(`Export failed with status ${response.status}`);
            }

            const blob = await response.blob();
            const ext = type === 'pdf' ? 'pdf' : 'pptx';
            const fallback = `${(mainTopic || 'Course').replace(/\s+/g, '_')}.${ext}`;
            const filename = filenameFromDisposition(response.headers.get('content-disposition'), fallback);
            downloadBlob(blob, filename);
            toast.success(type === 'pdf' ? 'PDF exported.' : 'PowerPoint exported.');
        } catch (error) {
            console.error(error);
            toast.error(type === 'pdf' ? 'PDF export failed.' : 'PPT export failed.');
        } finally {
            setIsGenerating(null);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(event) => event.stopPropagation()}
                        className="relative w-full max-w-[480px] bg-white dark:bg-slate-950 rounded-[24px] shadow-2xl overflow-hidden p-6 sm:p-10 border border-gray-100 dark:border-white/10"
                    >
                        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <LuX size={24} />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100 dark:border-blue-500/20">
                                <LuMonitor size={32} />
                            </div>
                            <h2 className="text-[28px] font-black text-gray-900 dark:text-white tracking-tight mb-1">Export Pro</h2>
                            <p className="text-gray-400 dark:text-gray-500 text-sm font-medium tracking-wide uppercase">Backend-rendered files</p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => handleBackendExport('ppt')}
                                disabled={isGenerating !== null}
                                className="w-full flex items-center gap-5 p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-[18px] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group disabled:opacity-50 text-left active:scale-[0.98]"
                            >
                                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    {isGenerating === 'ppt' ? <LuLoaderCircle size={28} className="animate-spin" /> : <LuMonitor size={28} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[17px] font-black text-slate-800 dark:text-white mb-0.5 uppercase tracking-wide group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                        PowerPoint (.pptx)
                                    </h3>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">
                                        Structured slides from saved course content
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleBackendExport('pdf')}
                                disabled={isGenerating !== null}
                                className="w-full flex items-center gap-5 p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-[18px] hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 transition-all group disabled:opacity-50 text-left active:scale-[0.98]"
                            >
                                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                                    {isGenerating === 'pdf' ? <LuLoaderCircle size={28} className="animate-spin" /> : <LuFileText size={28} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[17px] font-black text-slate-800 dark:text-white mb-0.5 uppercase tracking-wide group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
                                        PDF Document
                                    </h3>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">
                                        Clean pages, table of contents, readable lessons
                                    </p>
                                </div>
                            </button>

                            <button
                                disabled={true}
                                className="w-full flex items-center gap-5 p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-[18px] opacity-60 cursor-not-allowed text-left"
                            >
                                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0">
                                    <LuFileText size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[17px] font-black text-slate-400 mb-0.5 uppercase tracking-wide">
                                        Word Document (.docx)
                                    </h3>
                                    <p className="text-sm text-amber-600 dark:text-amber-500 font-black">
                                        تصدير Word قريبًا / Word export is coming soon
                                    </p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ExportModal;
