import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { serverURL } from '../../constants';
import { LuFileText, LuCalendar } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

const PolicyLayout = ({ title, slug, icon: Icon = LuFileText }) => {
    const { i18n } = useTranslation();
    const isAr = i18n.language === 'ar';

    const [content, setContent] = useState('');
    const [pageTitle, setPageTitle] = useState(title);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState('');

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${serverURL}/pages/${slug}`);
                if (response.data) {
                    const data = response.data;
                    // Use localized content based on language
                    if (isAr) {
                        setContent(data.content_ar || data.content || '');
                        if (data.title_ar) setPageTitle(data.title_ar);
                    } else {
                        setContent(data.content || '');
                        setPageTitle(data.title || title);
                    }
                    setLastUpdated(data.updated_at);
                }
            } catch (error) {
                console.error(`Failed to load ${slug} policy`, error);
                setContent(isAr
                    ? `<p>تجري حالياً تحديث ${title}. يرجى المحاولة لاحقاً.</p>`
                    : `<p>The ${title} is currently being updated. Please check back later.</p>`
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPolicy();
        window.scrollTo(0, 0);
    }, [slug, title, isAr]);

    return (
        <div className="policy-page" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="policy-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="policy-card"
                >
                    <div className="policy-header">
                        <div className={`flex items-center gap-3 mb-6 ${isAr ? 'flex-row-reverse' : ''}`}>
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <Icon size={24} />
                            </div>
                            <h1 className="policy-title">{pageTitle}</h1>
                        </div>

                        {lastUpdated && (
                            <div className={`policy-meta flex items-center gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                                <LuCalendar size={14} />
                                <span>{isAr ? 'آخر تحديث: ' : 'Last Updated: '}{new Date(lastUpdated).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                            </div>
                        )}
                    </div>


                    {loading ? (
                        <div className="policy-loading">
                        <div className="policy-spinner"></div>
                        <p className="text-gray-400 font-medium">
                            {isAr ? 'جاري تحميل المستند...' : 'Loading document...'}
                        </p>
                    </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="policy-content"
                        >
                            <div
                                className="prose prose-lg dark:prose-invert max-w-none prose-img:rounded-2xl prose-a:text-blue-600 hover:prose-a:text-blue-700"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        </motion.div>
                    )}
                </motion.div>


            </div>
        </div>
    );
};

export default PolicyLayout;
