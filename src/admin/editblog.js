import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { serverURL } from '../constants';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { LuSignature, LuSave } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

const EditBlog = () => {
    const { t } = useTranslation();
    const { slug: routeSlug } = useParams();
    const navigate = useNavigate();

    const [id, setId] = useState(null);
    const [title, setTitle] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [contentAr, setContentAr] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                // Public endpoint uses slug
                const response = await axios.get(`${serverURL}/blogs/${routeSlug}`);
                const blog = response.data;
                setId(blog.id);
                setTitle(blog.title);
                setTitleAr(blog.title_ar || '');
                setSlug(blog.slug);
                setContent(blog.content);
                setContentAr(blog.content_ar || '');
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch blog", error);
                toast.error(t('common.error'));
                navigate('/admin/manage-blogs');
            }
        };

        if (routeSlug) {
            fetchBlog();
        }
    }, [routeSlug, navigate, t]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !slug || !content) {
            toast.error(t('auth.fill_fields'));
            return;
        }

        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            // Admin endpoint uses ID
            await axios.put(`${serverURL}/admin/blogs/${id}`, { 
                title, 
                title_ar: titleAr, 
                slug, 
                content, 
                content_ar: contentAr 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(t('admin.dashboard.blog.create_success')); // Or generic success, reusing create success for now
            navigate('/admin/manage-blogs');
        } catch (error) {
            console.error("Failed to update blog", error);
            toast.error(t('admin.dashboard.blog.create_fail'));
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white mb-4">
                        <LuSignature size={20} />
                        <h2 className="font-bold text-lg">{t('admin.dashboard.blog.post_details')}</h2>
                    </div>

                    <Input
                        label={t('admin.dashboard.blog.blog_title') + " (English)"}
                        placeholder={t('admin.dashboard.blog.title_placeholder')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <Input
                        label={t('admin.dashboard.blog.blog_title') + " (العربية)"}
                        placeholder="أدخل عنوان المقال بالعربية..."
                        value={titleAr}
                        onChange={(e) => setTitleAr(e.target.value)}
                    />

                    <Input
                        label={t('admin.dashboard.blog.url_slug')}
                        placeholder={t('admin.dashboard.blog.slug_placeholder')}
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('admin.dashboard.blog.content_label') + " (English)"}
                        </label>
                        <textarea
                            className="w-full min-h-[200px] p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder={t('admin.dashboard.blog.content_placeholder')}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('admin.dashboard.blog.content_label') + " (العربية)"}
                        </label>
                        <textarea
                            className="w-full min-h-[200px] p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="أدخل محتوى المقال باللغة العربية..."
                            value={contentAr}
                            onChange={(e) => setContentAr(e.target.value)}
                        />
                    </div>
                </Card>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/manage-blogs')}
                        className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                        ) : (
                            <LuSave size={18} />
                        )}
                        <span>{t('admin.dashboard.blog.update_post')}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditBlog;
