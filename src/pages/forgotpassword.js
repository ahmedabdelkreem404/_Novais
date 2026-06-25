import React, { useState } from 'react';
import axios from 'axios';
import { serverURL, logo } from '../constants';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { LuMail, LuArrowLeft, LuArrowRight, LuLoader } from "react-icons/lu";
import { useTranslation } from 'react-i18next';
import Header from '../components/header';
import Footers from '../components/footers';
import MouseBackground from '../components/common/MouseBackground';

const ForgotPassword = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [email, setEmail] = useState('');
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error(t('auth.fill_fields') || 'Please enter your email');
            return;
        }

        setProcessing(true);
        try {
            await axios.post(`${serverURL}/auth/forgot-password`, { email });
            toast.success(t('auth.reset_link_sent') || 'Password reset link sent to your email');
        } catch (error) {
            const message = error.response?.data?.message || t('auth.reset_link_failed') || 'Failed to send reset link';
            toast.error(message);
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
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-[100px] -mr-8 -mt-8 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-tr-[80px] -ml-6 -mb-6 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 mb-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden p-2">
                                    <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                                    {t('auth.forgot_password_title') || 'Forgot Password?'}
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    {t('auth.forgot_password_subtitle') || "Enter your email and we'll send you a link to reset your password"}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
                                {/* Email Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">
                                        {t('auth.email_label') || 'Email'}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                                            <LuMail size={20} />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t('auth.email_placeholder') || 'you@example.com'}
                                            className="w-full bg-white/60 dark:bg-gray-800/50 border border-gray-300/60 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm placeholder-gray-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-indigo-600/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <LuLoader size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            {t('auth.send_reset_link') || 'Send Reset Link'}
                                            {isRtl ? <LuArrowRight size={18} className="rotate-180" /> : <LuArrowRight size={18} />}
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <button
                                    type="button"
                                    onClick={() => navigate('/signin')}
                                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-bold inline-flex items-center gap-2 transition-colors"
                                >
                                    <LuArrowLeft size={14} />
                                    {t('auth.back_to_login') || 'Back to Login'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
            <Footers />
        </>
    );
};

export default ForgotPassword;
