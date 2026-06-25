import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { serverURL } from '../constants';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    LuCreditCard,
    LuCalendar,
    LuShieldCheck,
    LuClock,
    LuCircleX,
    LuCircleCheck,
    LuArrowUpRight,
    LuLoader
} from "react-icons/lu";
import { useTranslation } from 'react-i18next';

const Manage = () => {
    const { t } = useTranslation();
    const [subscription, setSubscription] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/signin');
                    return;
                }

                // Fetch user profile to get latest subscription status
                const res = await axios.get(`${serverURL}/auth/user-profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Fetch plans for pricing info
                const plansRes = await axios.get(`${serverURL}/plans`);
                const allPlans = plansRes.data;

                const user = res.data.user || res.data;
                const planType = String(user.sub_status || 'free').toLowerCase();

                // If free, redirect to pricing
                if (planType === 'free') {
                    navigate("/dashboard/pricing");
                    return;
                }

                // Construct subscription data
                const currentSub = user.current_subscription || {};
                const currentPlanConfig = allPlans.find(p => p.slug === planType);

                const subData = {
                    id: currentSub.payment_reference || 'N/A',
                    plan: planType === 'free' ? 'Free' : (planType.charAt(0).toUpperCase() + planType.slice(1)),
                    status: (currentSub.status || 'Active').toUpperCase(),
                    startTime: currentSub.start_date ? new Date(currentSub.start_date).toLocaleDateString() : (user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'),
                    nextBilling: currentSub.end_date ? new Date(currentSub.end_date).toLocaleDateString() : 'N/A',
                    amount: currentPlanConfig ? `${currentPlanConfig.price_egp} ${t('common.egp')}` : 'N/A',
                    method: currentSub.payment_method ? `${currentSub.payment_method} ${currentSub.card_last4 ? `(${currentSub.card_last4})` : ''}` : (currentSub.payment_reference ? 'Paymob' : 'N/A')
                };

                setSubscription(subData);
            } catch (error) {
                console.error("Failed to load subscription", error);
                if (error.response?.status === 401) {
                    navigate('/signin');
                } else {
                    toast.error(t('subscription.load_fail'));
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubscription();
    }, [navigate, t]);

    const handleCancelSubscription = async () => {
        if (!window.confirm(t('subscription.confirm_cancel'))) {
            return;
        }

        try {
            setProcessing(true);
            const token = localStorage.getItem('token');
            const res = await axios.post(`${serverURL}/payment/cancel-subscription`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success(t('subscription.cancel_success'));
                localStorage.setItem('type', 'free');
                navigate("/dashboard/pricing");
            } else {
                toast.error(t('subscription.cancel_fail'));
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || t('subscription.cancel_fail'));
        } finally {
            setProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12 flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <LuLoader className="animate-spin text-blue-500" size={40} />
                    <p className="text-gray-500 font-medium">{t('subscription.loading_details')}</p>
                </div>
            </div>
        );
    }

    if (!subscription) return null;

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">

            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('subscription.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400">{t('subscription.view_details')}</p>
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-xl shadow-blue-500/5 overflow-hidden relative">

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-gray-100 dark:border-gray-800 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <LuShieldCheck size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{t('subscription.current_plan')}</p>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {subscription.plan === 'Free' ? t('common.free') : (subscription.plan === 'Premium' ? t('common.premium') : subscription.plan)} {t('profile.plan_status').split(' ')[0]}
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
                                    {subscription.status === 'ACTIVE' ? t('subscription.active') : subscription.status}
                                </span>
                            </h2>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{subscription.amount}</p>
                        <p className="text-sm text-gray-500">{t('subscription.per_month')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-500">
                                <LuCalendar size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('subscription.start_date')}</p>
                                <p className="text-sm text-gray-500">{subscription.startTime}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-500">
                                <LuClock size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('subscription.next_billing')}</p>
                                <p className="text-sm text-gray-500">{subscription.nextBilling}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-500">
                                <LuCreditCard size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('subscription.payment_method')}</p>
                                <p className="text-sm text-gray-500">{subscription.method}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-500">
                                <LuCircleCheck size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('subscription.sub_id')}</p>
                                <p className="text-sm text-gray-500 font-mono">{subscription.id}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 justify-end">
                    <button
                        onClick={handleCancelSubscription}
                        disabled={processing}
                        className="px-6 py-3 rounded-xl border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {processing ? <LuLoader className="animate-spin" /> : <LuCircleX />}
                        {t('subscription.cancel_sub')}
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/pricing')}
                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                        {t('subscription.upgrade_change')}
                        <LuArrowUpRight />
                    </button>
                </div>

            </div>

            <p className="mt-8 text-center text-xs text-gray-400">
                {t('subscription.help_contact')} <a href="/contact" className="text-blue-500 hover:underline">{t('subscription.contact_support')}</a>
            </p>

        </div>
    );
};

export default Manage;
