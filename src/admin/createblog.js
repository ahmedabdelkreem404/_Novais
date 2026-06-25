import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { serverURL } from '../constants';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { LuSignature, LuSave } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

const CreateBlog = () => {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !slug || !content) {
            toast.error(t('auth.fill_fields'));
            return;
        }

        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const postURL = `${serverURL}/admin/blogs`;
            await axios.post(postURL, { title, slug, content }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(t('admin.dashboard.blog.create_success'));
            navigate('/admin/manage-blogs');
        } catch (error) {
            console.error("Failed to create blog", error);
            toast.error(t('admin.dashboard.blog.create_fail'));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white mb-4">
                        <LuSignature size={20} />
                        <h2 className="font-bold text-lg">{t('admin.dashboard.blog.post_details')}</h2>
                    </div>

                    <Input
                        label={t('admin.dashboard.blog.blog_title')}
                        placeholder={t('admin.dashboard.blog.title_placeholder')}
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            setSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                        }}
                        required
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
                            {t('admin.dashboard.blog.content_label')}
                        </label>
                        <textarea
                            className="w-full min-h-[300px] p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder={t('admin.dashboard.blog.content_placeholder')}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                    </div>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigate('/admin/manage-blogs')}
                    >
                        {t('common.cancel')}
                    </Button>
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
                        <span>{t('admin.dashboard.blog.save_post')}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateBlog;
