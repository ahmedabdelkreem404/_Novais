import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { serverURL } from '../constants';
import { Link } from 'react-router-dom'; // Make sure react-router-dom is installed
import { LuArrowRight } from "react-icons/lu";

const Blog = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [blogs, setBlogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await axios.get(`${serverURL}/blogs`);
                setBlogs(response.data.data || response.data);
            } catch (error) {
                console.error("Failed to fetch blogs", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlogs();
    }, []);

    return (
        <div className={`blog ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <section className="blog-hero">
                <div className="app-container blog-hero__inner">
                    <h1 className="h1 blog-hero__title">{t('nav.blog')}</h1>
                    <p className="blog-hero__subtitle">
                        {t('blog.subtitle')}
                    </p>
                </div>
            </section>

            <section className="blog-section">
                <div className="app-container">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : blogs.length > 0 ? (
                        <div className="blog-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {blogs.map((blog) => (
                                <Link to={`/blog/${blog.slug}`} key={blog.id} className="block group h-full">
                                    <article className="blog-card card card-hover h-full flex flex-col p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:shadow-xl transition-all">
                                        <div className="mb-4">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
                                                {t('blog.article_tag')}
                                            </span>
                                            <span className="text-xs text-gray-400 mx-2">
                                                {new Date(blog.created_at).toLocaleDateString(i18n.language)}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                                            {isRtl ? (blog.title_ar || blog.title) : blog.title}
                                        </h2>
                                        <div className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 mb-4 flex-grow">
                                            {/* Strip HTML tags for preview if content is HTML */}
                                            {((isRtl ? (blog.content_ar || blog.content) : blog.content) || '').replace(/<[^>]+>/g, '').substring(0, 150)}...
                                        </div>
                                        <div className="flex items-center text-blue-600 font-bold text-sm mt-auto">
                                            {t('blog.read_more')} <LuArrowRight className={`ml-2 transform group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            <h3 className="text-xl font-bold mb-2">{t('blog.no_articles')}</h3>
                            <p>{t('blog.check_back')}</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Blog;
