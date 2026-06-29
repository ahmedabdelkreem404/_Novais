import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuCircleCheckBig, LuExternalLink, LuRefreshCw } from 'react-icons/lu';

import { serverURL, websiteURL } from '../constants';

const Pending = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');
    const navigate = useNavigate();
    const { state } = useLocation();
    const { sub, link } = state || {};
    const [processing, setProcessing] = useState(false);

    const userName = localStorage.getItem('mName') || (isRtl ? 'المستخدم' : 'there');
    const hasGatewayPayment = Boolean(sub || link);

    const showToast = (msg) => {
        setProcessing(false);
        toast(msg, {
            position: 'bottom-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    const refresh = async () => {
        if (!sub) {
            showToast(isRtl ? 'طلب الدفع قيد المراجعة من الإدارة' : 'Payment request is waiting for admin review');
            return;
        }

        try {
            setProcessing(true);
            const postURL = `${serverURL}/api/razorapypending`;
            const res = await axios.post(postURL, { sub });

            if (res.data.status === 'active') {
                window.location.href = `${websiteURL}/success?subscription_id=${sub}`;
                return;
            }

            if (res.data.status === 'expired' || res.data.status === 'cancelled') {
                window.location.href = `${websiteURL}/failed`;
                return;
            }

            showToast(isRtl ? 'الدفع ما زال قيد الانتظار' : 'Payment is still pending');
        } catch (error) {
            showToast(isRtl ? 'تعذر التحقق من حالة الدفع الآن' : 'Unable to verify payment status right now');
        }
    };

    const redirect = () => {
        if (link) {
            window.open(link, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <section
            dir={isRtl ? 'rtl' : 'ltr'}
            className="min-h-full bg-gray-50 px-4 py-8 dark:bg-[#020617] sm:px-6 lg:px-8"
        >
            <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-4xl items-center justify-center py-10">
                <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/40 dark:border-white/10 dark:bg-[#0b1120] dark:shadow-black/30">
                    <div className="border-b border-gray-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-5 py-7 text-center dark:border-white/10 dark:from-blue-950/40 dark:via-[#0b1120] dark:to-cyan-950/20 sm:px-8">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                            <LuCircleCheckBig className="h-8 w-8" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                            {isRtl ? 'حالة الدفع' : 'Payment status'}
                        </p>
                        <h1 className="mt-3 text-2xl font-black leading-tight text-gray-950 dark:text-white sm:text-3xl">
                            {hasGatewayPayment
                                ? (isRtl ? 'الدفع قيد الانتظار' : 'Payment pending')
                                : (isRtl ? 'طلب الدفع تحت المراجعة' : 'Payment request under review')}
                        </h1>
                        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300 sm:text-base">
                            {hasGatewayPayment
                                ? (isRtl
                                    ? `${userName}، أكمل الدفع من الرابط ثم تحقق من الحالة هنا.`
                                    : `${userName}, complete the payment from the link, then verify the status here.`)
                                : (isRtl
                                    ? `${userName}، تم إرسال طلبك للإدارة. سنراجع بيانات التحويل ونفعل الاشتراك بعد التأكيد.`
                                    : `${userName}, your request was sent to the admin team. We will review the transfer details and activate the subscription after confirmation.`)}
                        </p>
                    </div>

                    <div className="grid gap-4 px-5 py-6 sm:px-8 md:grid-cols-2">
                        {hasGatewayPayment && (
                            <button
                                type="button"
                                onClick={redirect}
                                disabled={!link}
                                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
                            >
                                <LuExternalLink className="h-4 w-4" />
                                <span>{isRtl ? 'فتح رابط الدفع' : 'Open payment link'}</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={refresh}
                            disabled={processing}
                            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
                        >
                            <LuRefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
                            <span>{isRtl ? 'تحديث الحالة' : 'Verify status'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 md:col-span-2"
                        >
                            <LuArrowLeft className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                            <span>{t('nav.dashboard') || (isRtl ? 'لوحة التحكم' : 'Dashboard')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pending;
