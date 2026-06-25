import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import { serverURL } from '../constants';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LuPlus, LuPencil, LuTrash2 } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ManageBlogs = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [blogs, setBlogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await axios.get(`${serverURL}/blogs`);
                setBlogs(response.data.data || response.data);
                setIsLoading(false);
            } catch (error) {
                console.error("Failed to fetch blogs", error);
                setIsLoading(false);
            }
        };
        fetchBlogs();
    }, []);

    const handleDeleteClick = (blog) => {
        setSelectedBlog(blog);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedBlog) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${serverURL}/admin/blogs/${selectedBlog.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlogs(blogs.filter(b => b.id !== selectedBlog.id));
            toast.success(t('common.success'));
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error("Delete failed", error);
            toast.error(t('common.error'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5 backdrop-blur-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t('admin.dashboard.blog.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.dashboard.blog.desc')}</p>
                </div>
                <button
                    onClick={() => navigate('/admin/create-blog')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <LuPlus size={18} />
                    <span>{t('admin.dashboard.blog.create_btn')}</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : blogs.length === 0 ? (
                <Card className="p-12 text-center bg-white dark:bg-white/5 backdrop-blur-xl border-none shadow-sm">
                    <p className="text-gray-500">{t('admin.dashboard.blog.no_blogs')}</p>
                </Card>
            ) : (
                <Card className="overflow-hidden border-none shadow-sm bg-white dark:bg-white/5 backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} border-collapse min-w-[800px]`} dir={isRtl ? 'rtl' : 'ltr'}>
                            <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                                <tr>
                                    <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.blog.title')}</th>
                                    <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.blog.slug')}</th>
                                    <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-left' : 'text-right'}`}>{t('admin.dashboard.blog.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {blogs.map((blog) => (
                                    <tr key={blog.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{blog.title}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-white/5 px-2 py-1 rounded w-fit">
                                                {blog.slug}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 ${isRtl ? 'text-left' : 'text-right'}`}>
                                            <div className={`flex ${isRtl ? 'justify-end' : 'justify-end'} gap-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                <button
                                                    onClick={() => navigate(`/admin/edit-blog/${blog.slug}`)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    title={t('common.edit')}
                                                >
                                                    <LuPencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(blog)}
                                                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                    title={t('common.delete')}
                                                >
                                                    <LuTrash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0a0a0b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 dark:border-white/5">
                        <h3 className="text-xl font-bold text-red-600 mb-2">{t('common.delete')}</h3>
                        <p className="text-sm text-gray-500 mb-6">{t('admin.dashboard.blog.confirm_delete')}</p>

                        <div className="flex gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                            >
                                {t('common.delete')}
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageBlogs;
