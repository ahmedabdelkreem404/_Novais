import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { serverURL } from '../constants';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const SocialCallback = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            // 1. Store Token
            localStorage.setItem('token', token);
            localStorage.setItem('auth', true);

            // 2. Fetch User Profile to populate session
            const fetchProfile = async () => {
                try {
                    const response = await axios.get(`${serverURL}/auth/user-profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const user = response.data.user || response.data;
                    localStorage.setItem('email', user.email);
                    localStorage.setItem('mName', user.name);
                    localStorage.setItem('uid', user.id);
                    localStorage.setItem('type', user.sub_status || 'free');
                    localStorage.setItem('role', user.role || 'user');

                    toast.success(t('auth.login_success'));
                    navigate('/dashboard');
                } catch (error) {
                    console.error("Profile fetch failed", error);
                    toast.error('Login failed. Please try again.');
                    navigate('/signin');
                }
            };

            fetchProfile();
        } else {
            toast.error('No token received.');
            navigate('/signin');
        }
    }, [token, navigate, t]);

    return (
        <div className={`flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#111] ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
            >
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('auth.authenticating')}</h2>
            </motion.div>
        </div>
    );
};

export default SocialCallback;
