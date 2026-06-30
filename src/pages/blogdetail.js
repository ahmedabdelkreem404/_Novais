import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { serverURL } from '../constants';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuCalendar } from "react-icons/lu";

const BlogDetail = () => {
    const { slug } = useParams();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [blog, setBlog] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const response = await axios.get(`${serverURL}/blogs/${slug}`);
                setBlog(response.data);
            } catch (error) {
                console.error("Failed to fetch blog", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlog();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('common.page_not_found')}</h2>
                <Link to="/blog" className="text-blue-600 hover:underline">{t('blog.back')}</Link>
            </div>
        );
    }

    return (
        <div className={`min-h-screen py-20 px-6 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <article className="max-w-4xl mx-auto">
                <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-8 group"
                >
                    <LuArrowLeft className={`transform transition-transform ${isRtl ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
                    {t('blog.back')}
                </Link>

                <header className="mb-10 text-center">
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">
                            <LuCalendar size={14} />
                            {new Date(blog.created_at).toLocaleDateString(i18n.language)}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                        {isRtl ? (blog.title_ar || blog.title) : blog.title}
                    </h1>
                </header>

                {/* Main Content */}
                <div
                    className="prose prose-lg dark:prose-invert max-w-none prose-img:rounded-2xl prose-a:text-blue-600 hover:prose-a:text-blue-700"
                    dangerouslySetInnerHTML={{ __html: isRtl ? (blog.content_ar || blog.content) : blog.content }}
                />
            </article>
        </div>
    );
};

export default BlogDetail;
