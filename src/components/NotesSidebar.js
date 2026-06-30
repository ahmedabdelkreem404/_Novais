import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverURL } from '../constants';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { LuX, LuLoader } from 'react-icons/lu';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTranslation } from 'react-i18next';

const NotesSidebar = ({ isOpen, onClose, courseId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);

    // Quill Toolbar Configuration
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'direction': 'rtl' }], // Handle RTL
            ['link'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'direction',
        'link'
    ];

    const isArabic = (text) => {
        const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return arabicPattern.test(text);
    };

    const fetchNotes = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/signin');
                return;
            }
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            };
            const res = await axios.get(`${serverURL}/notes?course_id=${courseId}`, config);
            setNotes(res.data);
            if (res.data.length > 0) {
                setNewNote(res.data[0].content);
            }
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401) navigate('/signin');
        } finally {
            setLoading(false);
        }
    }, [courseId, navigate]);

    useEffect(() => {
        if (isOpen && courseId) {
            fetchNotes();
        }
    }, [isOpen, courseId, fetchNotes]);

    const addNote = async () => {
        setAdding(true);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            };

            const existingNote = notes.find(n => parseInt(n.course_id) === parseInt(courseId));

            if (existingNote) {
                await axios.put(`${serverURL}/notes/${existingNote.id}`, { content: newNote }, config);
                toast.success(t('sidebar.note_update_success'));
            } else {
                const data = {
                    course_id: courseId,
                    content: newNote
                };
                const res = await axios.post(`${serverURL}/notes`, data, config);
                setNotes([res.data, ...notes]);
                toast.success(t('sidebar.note_save_success'));
            }
            onClose();
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401) {
                navigate('/signin');
            } else {
                toast.error(t('sidebar.note_save_error'));
            }
        } finally {
            setAdding(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(event) => event.stopPropagation()}
                        className="relative w-full max-w-[700px] max-h-[90vh] bg-white dark:bg-slate-950 rounded-[16px] shadow-2xl overflow-hidden flex flex-col font-sans border border-gray-100 dark:border-white/10"
                    >
                        <style>{`
                            .novais-notes-editor .ql-toolbar {
                                border-color: rgb(229 231 235);
                                background: rgb(248 250 252);
                                display: flex;
                                flex-wrap: wrap;
                                gap: 2px;
                            }
                            .dark .novais-notes-editor .ql-toolbar {
                                border-color: rgba(255,255,255,.1);
                                background: rgb(15 23 42);
                            }
                            .novais-notes-editor .ql-container {
                                border-color: rgb(229 231 235);
                                color: rgb(17 24 39);
                                font-size: 15px;
                            }
                            .dark .novais-notes-editor .ql-container {
                                border-color: rgba(255,255,255,.1);
                                color: rgb(226 232 240);
                                background: rgb(2 6 23);
                            }
                            .dark .novais-notes-editor .ql-stroke { stroke: rgb(203 213 225); }
                            .dark .novais-notes-editor .ql-fill { fill: rgb(203 213 225); }
                            .dark .novais-notes-editor .ql-picker { color: rgb(203 213 225); }
                            .novais-notes-editor .ql-editor { min-height: 280px; max-height: 52vh; overflow-y: auto; }
                        `}</style>

                        <div className="px-5 sm:px-8 py-5 sm:py-6 flex items-center justify-between">
                            <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">{t('sidebar.course_notes')}</h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                            >
                                <LuX size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col min-h-[320px]">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                                    <LuLoader className="animate-spin mb-4" size={32} />
                                    <span className="text-sm">{t('sidebar.loading_notes')}</span>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-hidden novais-notes-editor" dir={isArabic(newNote) ? 'rtl' : 'ltr'}>
                                    <ReactQuill
                                        theme="snow"
                                        value={newNote}
                                        onChange={setNewNote}
                                        modules={modules}
                                        formats={formats}
                                        placeholder={t('sidebar.no_notes')}
                                        className="h-full flex flex-col"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="px-5 sm:px-8 py-5 sm:py-6 border-t border-gray-100 dark:border-white/10 flex justify-end bg-gray-50/80 dark:bg-slate-900/80">
                            <button
                                onClick={addNote}
                                disabled={adding || (!newNote.trim() && notes.length === 0)}
                                className="px-10 py-3.5 bg-[#007bff] text-white rounded-[10px] font-bold text-[15px] hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {adding ? <LuLoader className="animate-spin inline mr-2" /> : null}
                                {t('sidebar.save_note')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default NotesSidebar;
