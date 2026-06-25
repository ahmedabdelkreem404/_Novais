import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslations },
            ar: { translation: arTranslations }
        },
        fallbackLng: 'ar',
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage']
        }
    });

// Update document direction on language change
// Update document direction on language change
i18n.on('languageChanged', (lng) => {
    const isRtl = lng.startsWith('ar');
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
});

// Initialize direction
document.documentElement.dir = i18n.language?.startsWith('ar') ? 'rtl' : 'ltr';
document.documentElement.lang = i18n.language;

export default i18n;
