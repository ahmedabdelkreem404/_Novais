import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe } from 'react-icons/fi';

const LanguageToggle = () => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';

    const toggleLanguage = () => {
        const newLang = currentLang.startsWith('ar') ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
        console.log('Language changed to:', newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="language-toggle"
            aria-label={`Switch to ${currentLang.startsWith('ar') ? 'English' : 'Arabic'}`}
            title={`Switch to ${currentLang.startsWith('ar') ? 'English' : 'العربية'}`}
        >
            <FiGlobe size={18} />
            <span className="language-toggle__text">
                {currentLang.startsWith('ar') ? 'EN' : 'AR'}
            </span>
        </button>
    );
};

export default LanguageToggle;
