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
export default BlogDetail;
