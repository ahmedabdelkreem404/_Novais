import React, { useState } from 'react';
import axios from 'axios';
import { serverURL, logo } from '../constants';
import FingerprintService from '../services/FingerprintService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { LuMail, LuLock, LuArrowRight, LuLoader, LuEye, LuEyeOff } from "react-icons/lu";
import { useTranslation } from 'react-i18next';
import Header from '../components/header';
import Footers from '../components/footers';
import MouseBackground from '../components/common/MouseBackground';

const SignIn = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    // Prevent back navigation loop if already logged in
    React.useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) navigate('/dashboard', { replace: true });
    }, [navigate]);

    const showToast = (msg, type = 'default') => {
        if (type === 'error') toast.error(msg);
        else if (type === 'success') toast.success(msg);
        else toast(msg);
    };

    const handleGoogleLogin = async () => {
        const deviceId = await FingerprintService.getDeviceId();
        const isDesktop = window.location.protocol === 'file:' || /electron/i.test(navigator.userAgent);
        const authUrl = `${serverURL}/auth/google?device_id=${deviceId}&platform=${isDesktop ? 'desktop' : 'web'}`;

        if (isDesktop && window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('google-login', authUrl);

            ipcRenderer.once('google-login-success', (event, token) => {
                if (token) {
                    localStorage.setItem('token', token);
                    localStorage.setItem('auth', true);
                    navigate('/dashboard');
                    showToast(t('auth.login_success'), 'success');
                }
            });
        } else {
            window.location.href = authUrl;
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!email || !password) {
            showToast(t('auth.fill_fields'), 'error');
            return;
        }

        if (password.length < 8) {
            showToast(t('auth.password_min_length') || 'Password must be at least 8 characters', 'error');
            return;
        }

        const postURL = serverURL + '/auth/login';
        try {
            setProcessing(true);
            const deviceId = await FingerprintService.getDeviceId();
            const response = await axios.post(postURL, { email, password, device_id: deviceId }, {
                headers: { 'Accept': 'application/json' }
            });

            if (response.data.access_token) {
                showToast(t('auth.login_success'), 'success');
                const user = response.data.user || {};
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('email', user.email || email);
                localStorage.setItem('mName', user.name || 'User');
                localStorage.setItem('auth', true);
                localStorage.setItem('uid', user.id);
                localStorage.setItem('type', user.sub_status || 'free');
                localStorage.setItem('role', user.role || 'user');
                navigate('/dashboard');
            } else {
                showToast(t('common.error'), 'error');
            }
        } catch (error) {
            console.error(error);
            if (error.response?.status === 403 && error.response?.data?.verification_required) {
                showToast(t(error.response.data.message || 'auth.verification_required'), 'error');
                navigate('/signup', { state: { verifyEmail: email } });
                return;
            }
            const messageCode = error.response?.data?.message || 'common.error';
            showToast(t(messageCode), 'error');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <MouseBackground />
            <Header isHome={false} />
            <div className="min-h-screen w-full flex items-center justify-center bg-transparent px-4 py-6 font-sans overflow-hidden pt-24">
                <div className="w-full max-w-md perspective-2000">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-xl dark:shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-10 relative overflow-hidden"
                    >
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-[100px] -mr-8 -mt-8 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-tr-[80px] -ml-6 -mb-6 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 mb-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden p-2">
                                    <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{t('auth.welcome_back')}</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    {t('auth.signin_subtitle', 'Continue your learning journey')}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>

                                {/* Email Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">
                                        {t('auth.email_label')}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                            <LuMail size={20} />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t('auth.email_placeholder')}
                                            className="w-full bg-white/60 dark:bg-gray-800/50 border border-gray-300/60 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm placeholder-gray-400"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            {t('auth.password_label')}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/forgotpassword')}
                                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                        >
                                            {t('auth.forgot_password')}
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                            <LuLock size={20} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-white/60 dark:bg-gray-800/50 border border-gray-300/60 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm placeholder-gray-400"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                        >
                                            {showPassword ? <LuEyeOff size={20} /> : <LuEye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-blue-600/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <LuLoader size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            {t('auth.signin_btn')}
                                            {isRtl ? <LuArrowRight size={18} className="rotate-180" /> : <LuArrowRight size={18} />}
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="my-8 flex items-center gap-4">
                                <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1" />
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">{t('auth.or')}</span>
                                <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1" />
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full py-3 px-4 bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4" />
                                    <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853" />
                                    <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05" />
                                    <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335" />
                                </svg>
                                {t('auth.google_signin')}
                            </button>

                            <div className="mt-8 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('auth.no_account')} {' '}
                                    <button
                                        onClick={() => navigate('/signup')}
                                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        {t('auth.signup_link')}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
            <Footers />
        </>
    );
};

export default SignIn;
