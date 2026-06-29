import React, { useEffect, useState } from 'react';
import CourseTable from './components/coursetable';
import { serverURL } from '../constants';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Courses = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            };
            const postURL = serverURL + `/admin/courses`;
            const response = await axios.get(postURL, config);
            setData(response.data.data || response.data)
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);


    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    const handleDelete = (id) => {
        const course = data.find(c => c.id === id);
        setSelectedCourse(course);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedCourse) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${serverURL}/admin/courses/${selectedCourse.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("تم حذف الدورة بنجاح");
            setData(data.filter(c => c.id !== selectedCourse.id));
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error("Delete failed", error);
            toast.error("فشل في حذف الدورة");
        }
    };

    const handleView = (course) => {
        const courseId = course.public_id || course.id;
        const jsonData = typeof course.metadata === 'string' ? JSON.parse(course.metadata) : course.metadata;

        navigate(`/course/${courseId}`, {
            state: {
                jsonData,
                mainTopic: course.title,
                courseId,
                photo: course.photo
            }
        });
    };

    const [lessons, setLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [lessonForm, setLessonForm] = useState({ title: '', content: '', media_url: '', media_type: 'none' });
    const [uploading, setUploading] = useState(false);

    const handleEdit = async (course) => {
        setSelectedCourse(course);
        setEditTitle(course.title);
        setIsEditModalOpen(true);
        setSelectedLesson(null);
        setLessons([]);
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${serverURL}/admin/courses/${course.id}/lessons`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setLessons(response.data.lessons || []);
            }
        } catch (error) {
            console.error("Failed to load lessons", error);
            toast.error("فشل في تحميل دروس الدورة");
        }
    };

    const confirmEdit = async () => {
        if (!selectedCourse || !editTitle || editTitle === selectedCourse.title) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${serverURL}/admin/courses/${selectedCourse.id}`, {
                title: editTitle
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("تم تحديث الدورة بنجاح");
            setData(data.map(c => c.id === selectedCourse.id ? { ...c, title: editTitle } : c));
        } catch (error) {
            console.error("Update failed", error);
            toast.error("فشل تحديث الدورة");
        }
    };

    const selectLesson = (lesson) => {
        setSelectedLesson(lesson);
        setLessonForm({
            title: lesson.title || '',
            content: lesson.content || '',
            media_url: lesson.media_url || '',
            media_type: lesson.media_type || 'none'
        });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${serverURL}/admin/media/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setLessonForm(prev => ({ ...prev, media_url: res.data.url }));
            toast.success("تم رفع الملف بنجاح");
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("فشل في رفع الملف");
        } finally {
            setUploading(false);
        }
    };

    const saveLesson = async () => {
        if (!selectedLesson) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${serverURL}/admin/lessons/${selectedLesson.id}`, lessonForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success("تم حفظ الدرس بنجاح");
                setLessons(lessons.map(l => l.id === selectedLesson.id ? res.data.lesson : l));
                setSelectedLesson(res.data.lesson);
            }
        } catch (error) {
            console.error("Save lesson failed", error);
            toast.error("فشل حفظ الدرس");
        }
    };

    return (
        <div>
            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <CourseTable
                    datas={data}
                    onDelete={handleDelete}
                    onView={handleView}
                    onEdit={handleEdit}
                />
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0a0a0b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 dark:border-white/5">
                        <h3 className="text-xl font-bold text-red-600 mb-2">حذف الدورة</h3>
                        <p className="text-sm text-gray-500 mb-6">هل أنت متأكد من رغبتك في حذف الدورة <span className="font-bold text-gray-900 dark:text-white">{selectedCourse?.title}</span>؟ لا يمكن التراجع عن هذا الإجراء.</p>

                        <div className="flex gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                            >
                                نعم، احذف
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full-Featured Course & Lesson Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-6xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-none">
                            <div className="flex items-center gap-3 flex-1">
                                <span className="text-sm font-bold text-gray-400">تعديل الدورة:</span>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-bold max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={confirmEdit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                                >
                                    حفظ العنوان
                                </button>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 flex overflow-hidden min-h-0">
                            {/* Lessons List Column (Left) */}
                            <div className="w-1/3 border-r border-gray-100 dark:border-white/5 overflow-y-auto p-4 space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-2">دروس الدورة</h4>
                                {lessons.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-gray-400 animate-pulse">جاري تحميل الدروس...</div>
                                ) : (
                                    lessons.map((lesson) => {
                                        const isSelected = selectedLesson?.id === lesson.id;
                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => selectLesson(lesson)}
                                                className={`w-full text-right p-3 rounded-xl transition text-xs font-bold block ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}`}
                                            >
                                                <div className="truncate mb-1">{lesson.title}</div>
                                                <div className="flex items-center gap-2 text-[10px] opacity-75">
                                                    <span>{lesson.topic_title}</span>
                                                    <span className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 capitalize">
                                                        {lesson.media_type || 'none'}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* Edit Lesson Form Column (Right) */}
                            <div className="w-2/3 p-6 overflow-y-auto space-y-4">
                                {selectedLesson ? (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2 border-gray-100 dark:border-white/5">
                                            تعديل محتوى ووسائط الدرس
                                        </h4>

                                        {/* Title */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-black uppercase text-gray-400">عنوان الدرس</label>
                                            <input
                                                type="text"
                                                value={lessonForm.title}
                                                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-black uppercase text-gray-400">محتوى الدرس</label>
                                            <textarea
                                                value={lessonForm.content}
                                                onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-xs h-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Media Type */}
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase text-gray-400 block">نوع الوسائط</label>
                                            <div className="flex gap-2">
                                                {['none', 'image', 'video'].map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setLessonForm({ ...lessonForm, media_type: type })}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition uppercase ${lessonForm.media_type === type ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300'}`}
                                                    >
                                                        {type === 'none' ? 'بدون' : type === 'image' ? 'صورة' : 'فيديو'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Media URL / Upload */}
                                        {lessonForm.media_type !== 'none' && (
                                            <div className="space-y-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-gray-400">رابط الوسائط (يوتيوب أو رابط مباشر)</label>
                                                    <input
                                                        type="text"
                                                        value={lessonForm.media_url}
                                                        onChange={(e) => setLessonForm({ ...lessonForm, media_url: e.target.value })}
                                                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="https://..."
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-gray-400 block">أو ارفع ملف من جهازك</label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="file"
                                                            onChange={handleFileUpload}
                                                            accept={lessonForm.media_type === 'image' ? 'image/*' : 'video/*'}
                                                            className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                                            disabled={uploading}
                                                        />
                                                        {uploading && <span className="text-xs text-blue-500 animate-pulse font-bold">جاري الرفع...</span>}
                                                    </div>
                                                </div>

                                                {/* Preview */}
                                                {lessonForm.media_url && (
                                                    <div className="mt-4">
                                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">معاينة الوسائط</label>
                                                        {lessonForm.media_type === 'image' ? (
                                                            <img
                                                                src={lessonForm.media_url.startsWith('/') ? `${serverURL}${lessonForm.media_url}` : lessonForm.media_url}
                                                                alt="Preview"
                                                                className="rounded-xl max-h-40 object-contain bg-black/10 border"
                                                            />
                                                        ) : (
                                                            <video
                                                                src={lessonForm.media_url.startsWith('/') ? `${serverURL}${lessonForm.media_url}` : lessonForm.media_url}
                                                                controls
                                                                className="rounded-xl max-h-40 w-full object-contain bg-black border"
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={saveLesson}
                                            className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                                        >
                                            حفظ تغييرات الدرس
                                        </button>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-center text-gray-400 font-bold text-xs py-20">
                                        اختر درساً من القائمة الجانبية لتعديله.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Courses;
