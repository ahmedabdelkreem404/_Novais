import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serverURL } from '../constants'; // e.g. http://localhost:8000/api
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    LuUser,
    LuMail,
    LuCalendar,
    LuShieldCheck,
    LuLogOut,
    LuAward,
    LuCreditCard,
    LuChevronRight,
    LuChevronDown,
    LuSun,
    LuMoon,
    LuGlobe
} from "react-icons/lu";

const Profile = () => {
    const { t, i18n } = useTranslation();
    const [user, setUser] = useState(null);
    const [usage, setUsage] = useState({ used: 0, limit: 1, remaining: 1, plan_name: 'Free Plan' });
    const [loading, setLoading] = useState(true);
    const [isAccountExpanded, setIsAccountExpanded] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        language: 'en',
        avatar: ''
    });
    const navigate = useNavigate();

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const stored = localStorage.getItem('darkMode');
        return stored === null ? true : stored === 'true';
    });

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('darkMode', newMode);
        document.documentElement.classList.toggle('dark', newMode);
        // Trigger a custom event for other components to listen to
        window.dispatchEvent(new Event('themeChange'));
    };

    const toggleLanguage = () => {
        const currentLang = i18n.language;
        const newLang = currentLang.startsWith('ar') ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
        const dir = newLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.setAttribute('dir', dir);
    };

    // Helper to get full avatar URL
    const getAvatarUrl = (path) => {
        if (!path) return null;
        // If it's a base64 data URL (from FileReader preview), use it directly
        if (path.startsWith('data:') || path.startsWith('http')) return path;

        // serverURL is usually "http://localhost:8000/api"
        // We need the base URL "http://localhost:8000" to append "/storage/..."
        const baseUrl = serverURL.replace('/api', '');
        return `${baseUrl}${path}`;
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/signin');
                return;
            }

            try {
                const res = await axios.get(`${serverURL}/auth/user-profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json'
                    }
                });

                const userData = res.data.user || res.data;
                setUser(userData);
                if (res.data.subscription_usage) {
                    setUsage(res.data.subscription_usage);
                }
                setFormData({
                    name: userData.name || '',
                    email: userData.email || '',
                    password: '',
                    language: userData.language || 'en',
                    avatar: userData.avatar || ''
                });
            } catch (err) {
                console.error("Failed to fetch profile", err);
                if (err.response?.status === 401) {
                    localStorage.clear();
                    localStorage.clear();
                    navigate('/signin');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        localStorage.clear();
        toast.info(t('profile.toast.logout_success'));
        navigate('/signin');
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('email', user.email);
            data.append('name', formData.name);
            data.append('language', formData.language);

            if (formData.password) {
                data.append('password', formData.password);
            }

            if (formData.avatar instanceof File) {
                data.append('avatar', formData.avatar);
            }

            // Using _method=PUT to support multipart/form-data update in Laravel
            const response = await axios.post(`${serverURL}/auth/user-profile?_method=PUT`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success(t('profile.toast.update_success'));
            setIsAccountExpanded(false);

            const updatedUser = response.data.user;
            setUser(updatedUser);

            setFormData(prev => ({
                ...prev,
                password: '',
                avatar: updatedUser.avatar
            }));

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || t('profile.toast.update_fail'));
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="animate-pulse space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800" />
                        <div className="space-y-3">
                            <div className="h-6 w-48 bg-gray-100 dark:bg-gray-800 rounded" />
                            <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const isRtl = i18n.language === 'ar';
    const planType = String(user.sub_status || user.type || 'Free').toUpperCase();

    return (
        <div className="max-w-4xl mx-auto px-6 py-12" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white text-5xl font-bold shadow-2xl overflow-hidden text-center">
                        {user.avatar ? (
                            <img
                                src={getAvatarUrl(user.avatar)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback if image fails to load
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerText = user.name?.charAt(0) || "?";
                                }}
                            />
                        ) : (
                            user.name?.charAt(0) || user.email?.charAt(0).toUpperCase()
                        )}
                    </div>
                </div>

                <div className="text-center md:text-start pt-2 flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{user.name || t('common.user')}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                            <LuMail size={16} />
                            <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                            <LuCalendar size={16} />
                            <span>{t('profile.joined', { date: new Date(user.created_at || Date.now()).toLocaleDateString() })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Subscription Card */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <LuShieldCheck className="text-blue-500" />
                            {t('profile.plan_status')}
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase 
                            ${planType === 'FREE' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                            {planType}
                        </span>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">{t('profile.current_plan')}</span>
                            <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                {typeof usage.plan_name === 'object' ? (usage.plan_name[i18n.language] || usage.plan_name['en'] || usage.plan_name['ar']) : usage.plan_name}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">{t('profile.billing_cycle')}</span>
                            <span className="font-bold text-gray-900 dark:text-white">{usage.renewal_date}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard/subscription')}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                    >
                        {planType === 'FREE' ? t('profile.upgrade_btn') : t('profile.manage_sub')}
                    </button>
                </div>

                {/* Account Stats */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-8">
                        <LuAward className="text-blue-500" />
                        {t('profile.my_progress')}
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('common.courses_limit')}</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white">
                                {usage.used} / {usage.limit === -1 ? '∞' : usage.limit}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('profile.certs_count')}</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white">0</p>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{t('profile.progress_msg')}</p>
                    </div>
                </div>

            </div>

            {/* Quick Actions */}
            <div className="mt-12 space-y-3">
                <h3 className={`text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ${isRtl ? 'mr-2' : 'ml-2'}`}>{t('profile.settings_security')}</h3>

                {/* Account Information Expandable Card */}
                <div className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-2xl transition-all group overflow-hidden">
                    <button
                        onClick={() => setIsAccountExpanded(!isAccountExpanded)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-500">
                                <LuUser size={20} />
                            </div>
                            <div className="text-start">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('profile.acc_info')}</p>
                                <p className="text-xs text-gray-500">{t('profile.acc_info_desc')}</p>
                            </div>
                        </div>
                        {isAccountExpanded ? <LuChevronDown size={20} className="text-gray-300" /> :
                            isRtl ? <LuChevronRight size={20} className="text-gray-300 group-hover:text-gray-600 transition-colors rotate-180" /> :
                                <LuChevronRight size={20} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                        }
                    </button>

                    <AnimatePresence>
                        {isAccountExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                                    <form onSubmit={handleUpdateProfile} className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* Name */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t('profile.full_name')}</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                                                placeholder={t('auth.name_placeholder')}
                                                required
                                            />
                                        </div>

                                        {/* Email (Read-Only) */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t('profile.email_addr')}</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                disabled
                                                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                            />
                                        </div>

                                        {/* Password */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t('profile.new_password')}</label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                                                placeholder={t('profile.password_placeholder')}
                                            />
                                        </div>

                                        {/* Language */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t('profile.language')}</label>
                                            <select
                                                value={formData.language}
                                                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="en">English</option>
                                                <option value="ar">Arabic</option>
                                                <option value="es">Spanish</option>
                                                <option value="fr">French</option>
                                            </select>
                                        </div>

                                        {/* Avatar Upload */}
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t('profile.profile_pic')}</label>
                                            <label className="cursor-pointer bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-2">
                                                <span className="truncate max-w-full text-gray-500 dark:text-gray-400">
                                                    {formData.avatar instanceof File ? formData.avatar.name : (formData.avatar && typeof formData.avatar === 'string' ? t('common.current_image') : t('common.upload_new'))}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            // Create instant preview using FileReader
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                // Temporarily update user state to show preview
                                                                setUser(prev => ({ ...prev, avatar: reader.result }));
                                                            };
                                                            reader.readAsDataURL(file);

                                                            setFormData({ ...formData, avatar: file });
                                                        }
                                                    }}
                                                />
                                                <span className="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-xs font-bold">{t('profile.browse')}</span>
                                            </label>
                                        </div>

                                        {/* Actions */}
                                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsAccountExpanded(false);
                                                    setFormData(prev => ({ ...prev, password: '' })); // Reset password on cancel
                                                }}
                                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                                            >
                                                {t('common.cancel')}
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                            >
                                                {t('profile.save_changes')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button className="w-full p-4 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-colors group"
                    onClick={() => navigate('/dashboard/subscription')}>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-500">
                            <LuCreditCard size={20} />
                        </div>
                        <div className="text-start">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{t('profile.payment_methods')}</p>
                            <p className="text-xs text-gray-500">{t('profile.payment_desc')}</p>
                        </div>
                    </div>
                    {isRtl ? <LuChevronRight size={20} className="text-gray-300 group-hover:text-gray-600 transition-colors rotate-180" /> : <LuChevronRight size={20} className="text-gray-300 group-hover:text-gray-600 transition-colors" />}
                </button>

                <button
                    onClick={toggleLanguage}
                    className="w-full p-4 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-500">
                            <LuGlobe size={20} />
                        </div>
                        <div className="text-start">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{i18n.language.startsWith('ar') ? 'English' : 'العربية'}</p>
                            <p className="text-xs text-gray-500">{t('profile.language')}</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={toggleTheme}
                    className="w-full p-4 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-500">
                            {isDarkMode ? <LuSun size={20} /> : <LuMoon size={20} />}
                        </div>
                        <div className="text-start">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{t('common.toggle_theme')}</p>
                            <p className="text-xs text-gray-500">{isDarkMode ? t('footer.light') : t('footer.dark')}</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full p-4 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
                >
                    <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500">
                        <LuLogOut size={20} />
                    </div>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">{t('profile.logout_app')}</span>
                </button>
            </div>

            <div className="mt-12 text-center">
                <p className="text-[10px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest">NOVAIS Platform &bull; v1.2.0</p>
            </div>

        </div>
    );
};

export default Profile;
