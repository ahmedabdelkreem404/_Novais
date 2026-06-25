import React from 'react';
import { useTranslation } from 'react-i18next';
import { LuGlobe } from 'react-icons/lu';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const currentLang = i18n.language;
        const newLang = currentLang.startsWith('ar') ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-sm font-bold text-gray-700 dark:text-gray-300"
        >
            <LuGlobe size={16} />
            <span>{i18n.language.startsWith('ar') ? 'English' : 'العربية'}</span>
        </button>
    );
};

export default LanguageSwitcher;
