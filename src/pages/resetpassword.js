import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serverURL } from '../constants';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LuLock, LuEye, LuEyeOff, LuLoader, LuArrowRight, LuCircleCheck, LuMail } from "react-icons/lu";
import Header from '../components/header';
import Footers from '../components/footers';
import MouseBackground from '../components/common/MouseBackground';

const ResetPassword = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { token: paramToken } = useParams();
    const location = useLocation();
    const queryToken = new URLSearchParams(location.search).get('token');
    const token = paramToken || queryToken;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmail = async () => {
            if (!token) return;
            try {
                const response = await axios.get(`${serverURL}/auth/validate-reset-token/${token}`);
                if (response.data.valid && response.data.email) {
                    setEmail(response.data.email);
                }
            } catch (error) {
                console.error("Error validating token:", error);
                toast.error(t('auth.invalid_reset_token') || "Invalid or expired reset link.");
            }
        };
        fetchEmail();
    }, [token, t]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error(t('auth.fill_fields') || "Please fill all fields");
            return;
        }

        if (password !== confirmPassword) {
            toast.error(t('auth.passwords_do_not_match') || "Passwords do not match");
            return;
        }

        if (password.length < 8) {
            toast.error(t('auth.password_min_length') || "Password must be at least 8 characters");
            return;
        }

        setProcessing(true);
        try {
            await axios.post(`${serverURL}/auth/reset-password`, {
                token,
                email,
                password,
                password_confirmation: confirmPassword
            });
            toast.success(t('auth.password_reset_success') || 'Password reset successful. Please login.');
            navigate('/signin');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || t('common.error') || 'Failed to reset password';
            toast.error(msg);
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
                                    <div className="w-full h-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <LuLock size={28} />
                                    </div>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                                    {t('auth.set_new_password')}
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    {t('auth.enter_new_password_desc') || "Please enter your new password below."}
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
                                            readOnly
                                            disabled // Keep redundant disabled for semantics
                                            placeholder={t('auth.email_placeholder') || "you@example.com"}
                                            className="w-full bg-gray-100/80 dark:bg-gray-800/80 border border-gray-300/60 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none cursor-not-allowed transition-all font-medium text-sm select-none"
                                        />
                                    </div>
                                </div>

                                {/* New Password Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">
                                        {t('auth.new_password')}
                                    </label>
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
                                            minLength={8}
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

                                {/* Confirm Password Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">
                                        {t('auth.confirm_password')}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                            <LuCircleCheck size={20} />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-white/60 dark:bg-gray-800/50 border border-gray-300/60 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm placeholder-gray-400"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                        >
                                            {showConfirmPassword ? <LuEyeOff size={20} /> : <LuEye size={20} />}
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
                                            {t('auth.reset_password')}
                                            {isRtl ? <LuArrowRight size={18} className="rotate-180" /> : <LuArrowRight size={18} />}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
            <Footers />
        </>
    );
};

export default ResetPassword;
