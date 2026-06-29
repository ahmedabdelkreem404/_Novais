import React, { useState } from 'react';
import axios from 'axios';
import { serverURL, logo } from '../constants';
import FingerprintService from '../services/FingerprintService';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { LuMail, LuLock, LuUser, LuArrowRight, LuLoader, LuCheck, LuEye, LuEyeOff } from "react-icons/lu";
import { useTranslation } from 'react-i18next';

// Removed css import in favor of inline tailwind

const SignUp = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [verificationRequired, setVerificationRequired] = useState(false);
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [resendTimer, setResendTimer] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        if (location.state?.verifyEmail) {
            setEmail(location.state.verifyEmail);
            setVerificationRequired(true);
            // Auto-send code if redirecting from login
            handleResend(location.state.verifyEmail);
        }

        // Check for persistent timer
        const storedExpiry = localStorage.getItem('resend_timer_expiry');
        if (storedExpiry) {
            const remaining = Math.ceil((parseInt(storedExpiry) - Date.now()) / 1000);
            if (remaining > 0) {
                setResendTimer(remaining);
            } else {
                localStorage.removeItem('resend_timer_expiry');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    React.useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        localStorage.removeItem('resend_timer_expiry');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Determine navigation direction (SignUp usually is "next" page, so coming from SignIn is forward)

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) navigate('/dashboard', { replace: true });
    }, [navigate]);

    const showToast = (msg, type = 'default') => {
        if (type === 'error') toast.error(msg);
        else if (type === 'success') toast.success(msg);
        else toast(msg);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!email || !firstName || !lastName || !password || !confirmPassword) {
            showToast(t('auth.fill_fields'), 'error');
            return;
        }

        if (password.length < 8) {
            showToast(t('auth.password_min_length') || 'Password must be at least 8 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast(t('auth.passwords_do_not_match') || 'Passwords do not match', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast(t('auth.passwords_do_not_match') || 'Passwords do not match', 'error');
            return;
        }

        if (!agreeToTerms) {
            showToast(t('auth.agree_toast'), 'error');
            return;
        }

        const postURL = serverURL + '/auth/register';
        const fullName = `${firstName} ${lastName}`.trim();

        try {
            setProcessing(true);
            const deviceId = await FingerprintService.getDeviceId();
            const response = await axios.post(postURL, { email, name: fullName, first_name: firstName, last_name: lastName, password, device_id: deviceId }, {
                headers: {
                    'Accept': 'application/json',
                    'X-Device-ID': deviceId
                }
            });

            if (response.data.verification_required) {
                setVerificationRequired(true);
                showToast(t(response.data.message || 'auth.verification_sent'), 'success');
            } else if (response.data.success || response.data.access_token) {
                showToast(t(response.data.message || 'common.success'), 'success');
                const user = response.data.user || {};
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('email', user.email || email);
                localStorage.setItem('mName', user.name || `${firstName} ${lastName}`.trim());
                localStorage.setItem('auth', true);
                localStorage.setItem('uid', user.id);
                localStorage.setItem('type', user.sub_status || 'free');
                localStorage.setItem('role', user.role || 'user');
                navigate('/dashboard');
            } else {
                showToast(t('common.error'));
            }
        } catch (error) {
            // Only log non-403 errors to keep console clean for expected behaviors
            if (error.response?.status !== 403) {
                console.error(error);
            }
            const messageCode = error.response?.data?.message || 'common.error';
            showToast(t(messageCode), 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const code = verificationCode.join('');
        if (code.length < 6) {
            showToast(t('auth.enter_valid_code') || 'Please enter the 6-digit code', 'error');
            return;
        }

        try {
            setProcessing(true);
            const deviceId = await FingerprintService.getDeviceId();
            const response = await axios.post(serverURL + '/auth/verify-email',
                { email, code },
                { headers: { 'Accept': 'application/json', 'X-Device-ID': deviceId } }
            );

            if (response.data.access_token) {
                showToast(t(response.data.message || 'common.success'), 'success');
                const user = response.data.user || {};
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('email', user.email || email);
                localStorage.setItem('mName', user.name || `${firstName} ${lastName}`.trim());
                localStorage.setItem('auth', true);
                localStorage.setItem('uid', user.id);
                localStorage.setItem('type', user.sub_status || 'free');
                localStorage.setItem('role', user.role || 'user');
                navigate('/dashboard');
            }
        } catch (error) {
            if (error.response?.status !== 403) {
                console.error(error);
            }
            const messageCode = error.response?.data?.message || 'common.error';
            showToast(t(messageCode), 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleResend = async (emailOverride = null) => {
        if (resendTimer > 0) return;

        // Ensure emailOverride is a string (it might be an event object from onClick)
        const targetEmail = (typeof emailOverride === 'string' && emailOverride) ? emailOverride : email;

        try {
            const deviceId = await FingerprintService.getDeviceId();
            const response = await axios.post(serverURL + '/auth/resend-verification',
                { email: targetEmail },
                { headers: { 'Accept': 'application/json', 'X-Device-ID': deviceId } }
            );
            showToast(t(response.data.message || 'auth.code_resent'), 'success');

            // Set timer and persist to localStorage
            setResendTimer(60);
            localStorage.setItem('resend_timer_expiry', Date.now() + 60000);
            localStorage.setItem('resend_timer_expiry', Date.now() + 60000);
        } catch (error) {
            if (error.response?.status !== 403) {
                console.error(error);
            }
            const messageCode = error.response?.data?.message || 'common.error';
            showToast(t(messageCode), 'error');
        }
    };

    const handleCodeChange = (index, value) => {
        // Normalize Arabic numerals to English
        const englishValue = value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

        if (!/^\d*$/.test(englishValue)) return;

        const newCode = [...verificationCode];
        newCode[index] = englishValue.slice(-1);
        setVerificationCode(newCode);

        // Auto focus next input
        if (englishValue && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-transparent px-4 py-6 font-sans overflow-hidden pt-24">
            {/* Book Page Container - Pivot Right/Left depending on perception */}
            <div className="w-full max-w-md perspective-2000">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-xl dark:shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-10 relative overflow-hidden"
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-br-[100px] -ml-8 -mt-8 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/10 rounded-tl-[80px] -mr-6 -mb-6 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="mb-6 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-gray-800 mb-4 shadow-sm border border-gray-100 dark:border-gray-700 p-2">
                                <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('auth.create_account')}</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {t('auth.signup_subtitle', 'Start learning today')}
                            </p>
                        </div>

                        {verificationRequired ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        {t('auth.enter_code_msg', 'We sent a 6-digit code to')} <br />
                                        <span className="font-bold text-gray-900 dark:text-white">{email}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerify} className="space-y-6">
                                    <div className="flex justify-between gap-1 sm:gap-2" dir="ltr">
                                        {verificationCode.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                id={`code-${idx}`}
                                                type="text"
                                                maxLength="1"
                                                value={digit}
                                                onChange={(e) => handleCodeChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                                className="w-10 h-12 sm:w-12 sm:h-14 text-center bg-white/60 dark:bg-gray-800/50 border border-gray-300/60 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl text-lg sm:text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
                                                required
                                            />
                                        ))}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-purple-600/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {processing ? <LuLoader size={20} className="animate-spin" /> : t('auth.verify_btn', 'Verify Email')}
                                    </button>
                                </form>

                                <div className="text-center">
                                    <button
                                        onClick={handleResend}
                                        disabled={resendTimer > 0}
                                        className={`text-sm font-bold ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600 dark:text-purple-400 hover:underline'}`}
                                    >
                                        {resendTimer > 0 ? `${t('auth.resend_in', 'Resend in')} ${resendTimer}s` : t('auth.resend_btn', 'Resend Code')}
                                    </button>
                                </div>

                                <button
                                    onClick={() => setVerificationRequired(false)}
                                    className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    {t('auth.back_to_signup', 'Back to Signup')}
                                </button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">

                                {/* Name Input Split */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">
                                            {t('auth.first_name')}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                                                <LuUser size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder={t('auth.first_name')}
                                                className="w-full bg-white/60 dark:bg-gray-800/50 border border-gray-300/60 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-sm placeholder-gray-400"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">
                                            {t('auth.last_name')}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                                                <LuUser size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder={t('auth.last_name')}
                                                className="w-full bg-white/60 dark:bg-gray-800/50 border border-gray-300/60 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-sm placeholder-gray-400"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Email Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">
                                        {t('auth.email_label')}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                                            <LuMail size={20} />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t('auth.email_placeholder')}
                                            className="w-full bg-white/60 dark:bg-gray-800/50 border border-gray-300/60 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-sm placeholder-gray-400"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">
                                        {t('auth.password_label')}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                                            <LuLock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-white/60 dark:bg-gray-800/50 border border-gray-300/60 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-sm placeholder-gray-400"
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
                                    <p className="text-[10px] text-gray-400 pl-1 font-medium">{t('auth.password_requirements', 'Must be at least 8 characters')}</p>
                                </div>

                                {/* Confirm Password Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">
                                        {t('auth.confirm_password')}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                                            <LuLock size={18} />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-white/60 dark:bg-gray-800/50 border border-gray-300/60 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-sm placeholder-gray-400"
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

                                {/* Terms Checkbox */}
                                <label className="flex items-start gap-3 cursor-pointer group pl-1">
                                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${agreeToTerms ? 'bg-purple-600 border-purple-600' : 'bg-transparent border-gray-300 dark:border-gray-600 group-hover:border-purple-500'}`}>
                                        {agreeToTerms && <LuCheck size={12} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={agreeToTerms}
                                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                                        className="hidden"
                                    />
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 pt-0.5">
                                        {t('auth.agree_terms')}
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-purple-600/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <LuLoader size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            {t('auth.signup_btn')}
                                            {isRtl ? <LuArrowRight size={18} className="rotate-180" /> : <LuArrowRight size={18} />}
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        <div className="my-6 flex items-center gap-4">
                            <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1" />
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">{t('auth.or')}</span>
                            <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1" />
                        </div>

                        <button
                            type="button"
                            onClick={() => window.location.href = `${serverURL}/auth/google`}
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
                                {t('auth.have_account')} {' '}
                                <button
                                    onClick={() => navigate('/signin')}
                                    className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                    {t('auth.signin_link')}
                                </button>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SignUp;
