import axios from 'axios';
import { serverURL } from '../../constants';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TermsEdit = () => {
    const { t } = useTranslation();

    const [terms, setTerms] = useState('');
    const [termsAr, setTermsAr] = useState('');
    const [activeTab, setActiveTab] = useState('en');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        getTerms();
    }, []);

    async function getTerms() {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            };
            const response = await axios.get(serverURL + '/admin/pages/terms', config);
            if (response.data) {
                setTerms(response.data.content || '');
                setTermsAr(response.data.content_ar || '');
            }
        } catch (error) {
            console.error("Failed to load terms", error);
        }
    }

    const showToast = async (msg) => {
        toast(msg, {
            position: "bottom-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined
        });
    }

    async function saveTerms() {
        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            };
            // Update page with slug 'terms'
            const postURL = serverURL + '/admin/pages/terms';
            const response = await axios.put(postURL, {
                content: terms,
                content_ar: termsAr
            }, config);

            if (response.data) {
                localStorage.setItem('terms_en', terms);
                localStorage.setItem('terms_ar', termsAr);
                showToast(t('admin.dashboard.policies.terms_updated'));
            }
        } catch (error) {
            console.error(error);
            showToast(t('admin.dashboard.policies.update_failed'));
        } finally {
            setIsSaving(false);
        }
    }

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'list', 'bullet', 'align',
        'link', 'image'
    ];

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold dark:text-white">{t('footer.terms')}</h1>
                <button
                    onClick={saveTerms}
                    disabled={isSaving}
                    className="premium-save-btn px-6 py-2.5 rounded-xl text-sm transition-all duration-300 flex items-center"
                >
                    {isSaving && <div className="btn-loader"></div>}
                    <span>{t('common.save')}</span>
                </button>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl w-fit mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <button
                    onClick={() => setActiveTab('en')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'en'
                        ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700/50'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/30'
                        }`}
                >
                    {t('common.english')}
                </button>
                <button
                    onClick={() => setActiveTab('ar')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'ar'
                        ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700/50'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/30'
                        }`}
                >
                    {t('common.arabic')}
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[500px]">
                {activeTab === 'en' ? (
                    <div dir="ltr">
                        <ReactQuill
                            theme="snow"
                            value={terms}
                            onChange={setTerms}
                            modules={modules}
                            formats={formats}
                            className="h-[50vh] sm:h-[65vh] mb-12 dark:text-white"
                            placeholder={t('admin.dashboard.policies.terms_placeholder_en')}
                        />
                    </div>
                ) : (
                    <div dir="rtl">
                        <ReactQuill
                            theme="snow"
                            value={termsAr}
                            onChange={setTermsAr}
                            modules={modules}
                            formats={formats}
                            className="h-[50vh] sm:h-[65vh] mb-12 dark:text-white"
                            placeholder={t('admin.dashboard.policies.terms_placeholder_ar')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TermsEdit;
