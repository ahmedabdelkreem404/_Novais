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

    const handleEdit = (course) => {
        setSelectedCourse(course);
        setEditTitle(course.title);
        setIsEditModalOpen(true);
    };

    const confirmEdit = async () => {
        if (!selectedCourse || !editTitle || editTitle === selectedCourse.title) {
            setIsEditModalOpen(false);
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
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Update failed", error);
            toast.error("فشل تحديث الدورة");
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

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0a0a0b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 dark:border-white/5">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">تعديل الدورة</h3>
                        <p className="text-sm text-gray-500 mb-6">تغيير عنوان الدورة للدورة الحالية.</p>

                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="عنوان الدورة"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={confirmEdit}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                حفظ التغييرات
                            </button>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Courses;
