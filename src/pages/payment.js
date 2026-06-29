import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { LuCreditCard, LuUser, LuMail, LuCheck, LuSmartphone } from 'react-icons/lu';

import { serverURL } from '../constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useTranslation } from 'react-i18next';

const Payment = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { state } = useLocation();
    const { plan_id, amount } = state || {};
    const navigate = useNavigate();

    const storedName = localStorage.getItem('mName') || '';
    const nameParts = storedName.split(' ');
    const initialFirstName = nameParts[0] || '';
    const initialLastName = nameParts.slice(1).join(' ') || '';

    const [paymentMethod, setPaymentMethod] = useState('card');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState(localStorage.getItem('email') || '');
    const [mName, setName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);
    const [processing, setProcessing] = useState(false);
    const [plans, setPlans] = useState([]);
    const [offlineInstructions, setOfflineInstructions] = useState({});
    const [senderPhone, setSenderPhone] = useState('');
    const [senderName, setSenderName] = useState(storedName);
    const [transactionReference, setTransactionReference] = useState('');
    const [proofImage, setProofImage] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error(t('common.sign_in_required'));
            navigate('/signin');
            return;
        }
        if (!plan_id || !amount) {
            toast.error(t('common.invalid_payment_details'));
            navigate("/pricing");
        }
    }, [navigate, plan_id, amount, t]);

    useEffect(() => {
        const loadOfflinePaymentData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [plansRes, instructionsRes] = await Promise.all([
                    axios.get(`${serverURL}/plans`),
                    token
                        ? axios.get(`${serverURL}/offline-payments/instructions`, { headers: { Authorization: `Bearer ${token}` } })
                        : Promise.resolve({ data: { methods: {} } })
                ]);
                setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
                setOfflineInstructions(instructionsRes.data?.methods || {});
            } catch (err) {
                console.error('Failed to load offline payment data', err);
            }
        };

        loadOfflinePaymentData();
    }, []);

    const selectedPlanSlug = String(plan_id || '').split('_')[0];
    const selectedBillingCycle = String(plan_id || '').includes('yearly') ? 'yearly' : 'monthly';
    const selectedPlan = plans.find(plan => plan.slug === selectedPlanSlug);
    const isOfflinePayment = paymentMethod === 'vodafone_cash' || paymentMethod === 'instapay';
    const selectedOfflineMethodConfig = isOfflinePayment ? offlineInstructions[paymentMethod] : null;

    const handlePayment = async () => {
        if (!email || !mName || !lastName) {
            toast.error(isRtl ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
            return;
        }

        if (paymentMethod === 'wallet' && !phoneNumber) {
            toast.error(isRtl ? 'يرجى إدخال رقم المحفظة' : 'Please enter wallet number');
            return;
        }

        if (isOfflinePayment && !selectedPlan?.id) {
            toast.error(isRtl ? 'تعذر تحديد الباقة المختارة' : 'Unable to resolve selected plan');
            return;
        }

        if (isOfflinePayment && selectedOfflineMethodConfig?.configured === false) {
            toast.error(isRtl ? 'طريقة الدفع اليدوي غير مفعلة حالياً' : 'This offline payment method is not configured yet');
            return;
        }

        setProcessing(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/signin');
                return;
            }

            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (isOfflinePayment) {
                const formData = new FormData();
                formData.append('plan_id', selectedPlan.id);
                formData.append('billing_cycle', selectedBillingCycle);
                formData.append('method', paymentMethod);
                if (senderPhone) formData.append('sender_phone', senderPhone);
                if (senderName) formData.append('sender_name', senderName);
                if (transactionReference) formData.append('transaction_reference', transactionReference);
                if (proofImage) formData.append('proof_image', proofImage);

                await axios.post(`${serverURL}/offline-payments`, formData, config);
                toast.success(isRtl ? 'تم إرسال طلب الدفع للمراجعة' : 'Offline payment request submitted for review');
                navigate('/pending');
                return;
            }

            const dataToSend = {
                plan_id,
                payment_method: paymentMethod,
                phone: paymentMethod === 'wallet' ? phoneNumber : null,
                // Default values for fields hidden from user
                address: 'Cairo, Egypt',
                postal_code: '11511',
                country: 'EG'
            };

            const postURL = serverURL + '/payment/checkout';
            const res = await axios.post(postURL, dataToSend, config);

            if (res.data.url) {
                window.location.href = res.data.url;
            } else {
                toast.error(t('common.payment_init_failed'));
                setProcessing(false);
            }
        } catch (error) {
            console.error('Payment Error:', error);
            const msg = error.response?.data?.message || t('common.payment_init_failed');
            toast.error(msg);
            setProcessing(false);
        }
    };

    // Extract plan name for display
    const getPlanName = () => {
        if (!plan_id) return '';
        const parts = plan_id.split('_');
        const tier = parts[0]; // pro or elite
        const cycle = parts[1]; // monthly or yearly
        return `${tier.charAt(0).toUpperCase() + tier.slice(1)} ${cycle.charAt(0).toUpperCase() + cycle.slice(1)} Plan`;
    };

    const planName = getPlanName();
    const planPrice = amount || 0;

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-[#020617] py-20 px-4 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Left Side: Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-7"
                >
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                            {isRtl ? 'إتمام الدفع' : 'Checkout'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            {isRtl ? 'يرجى إدخال تفاصيل الفواتير الخاصة بك للمتابعة' : 'Please enter your billing details to continue'}
                        </p>
                    </div>

                    <Card className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label={isRtl ? 'الاسم الأول' : 'First Name'}
                                value={mName}
                                onChange={(e) => setName(e.target.value)}
                                icon={LuUser}
                                placeholder="John"
                            />
                            <Input
                                label={isRtl ? 'الاسم الأخير' : 'Last Name'}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                icon={LuUser}
                                placeholder="Doe"
                            />
                        </div>

                        <Input
                            label={isRtl ? 'البريد الإلكتروني' : 'Email Address'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={LuMail}
                            type="email"
                            placeholder="john@example.com"
                        />

                        {/* Payment Method Selection */}
                        <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-4">
                                {isRtl ? 'طريقة الدفع' : 'Payment Method'}
                            </label>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <button
                                    onClick={() => setPaymentMethod('card')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-white/20'}`}
                                >
                                    <LuCreditCard className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-bold">{isRtl ? 'بطاقة بنكية' : 'Card'}</span>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('wallet')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'wallet' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-white/20'}`}
                                >
                                    <LuSmartphone className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-bold">{isRtl ? 'محفظة إلكترونية' : 'Wallet'}</span>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('vodafone_cash')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'vodafone_cash' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-white/20'}`}
                                >
                                    <LuSmartphone className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-bold">{isRtl ? 'فودافون كاش' : 'Vodafone Cash'}</span>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('instapay')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'instapay' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-white/20'}`}
                                >
                                    <LuCreditCard className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-bold">{isRtl ? 'إنستا باي' : 'InstaPay'}</span>
                                </button>
                            </div>

                            {/* Wallet Phone Input */}
                            {paymentMethod === 'wallet' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-4"
                                >
                                    <Input
                                        label={isRtl ? 'رقم المحفظة' : 'Wallet Number'}
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        icon={LuSmartphone}
                                        placeholder="010xxxxxxxx"
                                    />
                                </motion.div>
                            )}

                            {isOfflinePayment && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-4"
                                >
                                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-100">
                                        <p className="font-black mb-1">
                                            {paymentMethod === 'vodafone_cash'
                                                ? (isRtl ? 'تعليمات فودافون كاش' : 'Vodafone Cash instructions')
                                                : (isRtl ? 'تعليمات إنستا باي' : 'InstaPay instructions')}
                                        </p>
                                        <p className="break-words">
                                            {isRtl ? 'بيانات الاستلام: ' : 'Receiver: '}
                                            <span className="font-bold">
                                                {selectedOfflineMethodConfig?.receiver || (isRtl ? 'غير مضاف بعد' : 'Not configured yet')}
                                            </span>
                                        </p>
                                        <p className="mt-2 text-xs opacity-80">
                                            {selectedOfflineMethodConfig?.instructions || (isRtl ? 'طريقة الدفع هذه غير مفعلة حالياً.' : 'This payment method is not configured yet.')}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label={isRtl ? 'اسم المرسل' : 'Sender Name'}
                                            value={senderName}
                                            onChange={(e) => setSenderName(e.target.value)}
                                            icon={LuUser}
                                            placeholder={isRtl ? 'اسم صاحب التحويل' : 'Transfer sender name'}
                                        />
                                        <Input
                                            label={isRtl ? 'رقم المرسل' : 'Sender Phone'}
                                            value={senderPhone}
                                            onChange={(e) => setSenderPhone(e.target.value)}
                                            icon={LuSmartphone}
                                            placeholder="010xxxxxxxx"
                                        />
                                    </div>

                                    <Input
                                        label={isRtl ? 'رقم العملية' : 'Transaction Reference'}
                                        value={transactionReference}
                                        onChange={(e) => setTransactionReference(e.target.value)}
                                        icon={LuCreditCard}
                                        placeholder={isRtl ? 'اختياري لكنه يساعد في المراجعة' : 'Optional, but helps verification'}
                                    />

                                    <label className="block">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                            {isRtl ? 'صورة إثبات الدفع' : 'Payment Proof Image'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-3 file:text-sm file:font-bold file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950/40 dark:file:text-blue-200"
                                        />
                                    </label>
                                </motion.div>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button
                                isLoading={processing}
                                variant="primary"
                                onClick={handlePayment}
                                className="w-full h-[56px] text-lg"
                            >
                                {paymentMethod === 'card' && <LuCreditCard className="mr-2" />}
                                {paymentMethod === 'wallet' && <LuSmartphone className="mr-2" />}

                                {isOfflinePayment
                                    ? (isRtl ? 'إرسال طلب الدفع' : 'Submit offline payment')
                                    : isRtl
                                        ? `دفع بواسطة ${paymentMethod === 'card' ? 'البطاقة' : 'المحفظة'}`
                                        : `Pay via ${paymentMethod === 'card' ? 'Card' : 'Wallet'}`}
                            </Button>
                        </div>
                    </Card>
                </motion.div>

                {/* Right Side: Order Summary */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-5"
                >
                    <div className="sticky top-24">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isRtl ? 'ملخص الطلب' : 'Order Summary'}
                            </h2>
                        </div>

                        <Card className="p-8 bg-blue-600 border-none shadow-2xl shadow-blue-500/20 text-white overflow-hidden relative">
                            {/* Decorative background circle */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <p className="text-blue-100 text-sm font-medium mb-1">
                                            {isRtl ? 'الباقة المختارة' : 'Selected Plan'}
                                        </p>
                                        <h3 className="text-2xl font-black">{planName}</h3>
                                    </div>
                                    <div className="bg-white/20 p-3 rounded-2xl">
                                        <LuCreditCard size={24} />
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    {[
                                        isRtl ? 'وصول كامل لجميع الكورسات' : 'Full access to all courses',
                                        isRtl ? 'تحميل الشهادات' : 'Certificate downloads',
                                        isRtl ? 'مساعد ذكاء اصطناعي 24/7' : '24/7 AI Assistant',
                                        isRtl ? 'دعم لـ 23 لغة' : 'Support for 23 languages'
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                                <LuCheck className="scale-75" />
                                            </div>
                                            <span className="text-sm font-medium text-blue-50">{item}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-white/10 pt-6 mt-8">
                                    <div className="flex justify-between items-end">
                                        <span className="text-blue-100 font-medium">{isRtl ? 'الإجمالي' : 'Total Amount'}</span>
                                        <div className="text-right">
                                            <div className="text-3xl font-black">{planPrice} <span className="text-lg font-bold">{isRtl ? 'ج.م' : 'EGP'}</span></div>
                                            <p className="text-xs text-blue-200 mt-1">{isRtl ? 'شامل الضرائب' : 'Incl. all taxes'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Payment;
