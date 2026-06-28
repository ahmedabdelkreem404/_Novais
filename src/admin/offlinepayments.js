import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LuCheck, LuEye, LuRefreshCw, LuX } from 'react-icons/lu';
import { serverURL } from '../constants';

const OfflinePayments = () => {
    const [requests, setRequests] = useState([]);
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    const authConfig = (extra = {}) => ({
        ...extra,
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            ...(extra.headers || {})
        }
    });

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${serverURL}/admin/offline-payments?status=${status}`, authConfig());
            const payload = res.data?.data;
            setRequests(Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []));
        } catch (err) {
            console.error(err);
            toast.error('تعذر تحميل طلبات الدفع اليدوي');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const approve = async (request) => {
        const adminNote = window.prompt('ملاحظة الأدمن (اختياري)', 'تم التحقق من التحويل') || '';
        setBusyId(request.id);
        try {
            await axios.post(`${serverURL}/admin/offline-payments/${request.id}/approve`, { admin_note: adminNote }, authConfig());
            toast.success('تم تفعيل الاشتراك');
            fetchRequests();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'تعذر قبول الطلب');
        } finally {
            setBusyId(null);
        }
    };

    const reject = async (request) => {
        const adminNote = window.prompt('سبب الرفض');
        if (!adminNote) return;

        setBusyId(request.id);
        try {
            await axios.post(`${serverURL}/admin/offline-payments/${request.id}/reject`, { admin_note: adminNote }, authConfig());
            toast.success('تم رفض الطلب');
            fetchRequests();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'تعذر رفض الطلب');
        } finally {
            setBusyId(null);
        }
    };

    const openProof = async (request) => {
        setBusyId(request.id);
        try {
            const res = await axios.get(
                `${serverURL}/admin/offline-payments/${request.id}/proof`,
                authConfig({ responseType: 'blob' })
            );
            const url = URL.createObjectURL(res.data);
            window.open(url, '_blank', 'noopener,noreferrer');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (err) {
            console.error(err);
            toast.error('لا توجد صورة إثبات متاحة');
        } finally {
            setBusyId(null);
        }
    };

    const statusClasses = {
        pending: 'bg-amber-50 text-amber-700 border-amber-100',
        approved: 'bg-green-50 text-green-700 border-green-100',
        rejected: 'bg-red-50 text-red-700 border-red-100',
        cancelled: 'bg-gray-50 text-gray-600 border-gray-100',
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {['pending', 'approved', 'rejected', 'cancelled'].map(item => (
                        <button
                            key={item}
                            onClick={() => setStatus(item)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase border transition-all ${status === item ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500'}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
                <button
                    onClick={fetchRequests}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm font-bold text-gray-600 dark:text-gray-300"
                >
                    <LuRefreshCw size={16} />
                    تحديث
                </button>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-400 animate-pulse">جاري تحميل طلبات الدفع...</div>
            ) : requests.length === 0 ? (
                <div className="p-12 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 text-center text-gray-400">
                    لا توجد طلبات بهذه الحالة.
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {requests.map(request => (
                        <div key={request.id} className="bg-white dark:bg-[#0a0a0b] border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="min-w-0">
                                    <h3 className="font-black text-gray-900 dark:text-white truncate">
                                        {request.user?.name || 'User'} · {request.plan?.slug || 'plan'}
                                    </h3>
                                    <p className="text-xs text-gray-500 truncate">{request.user?.email}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase ${statusClasses[request.status] || statusClasses.pending}`}>
                                    {request.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                <Info label="Method" value={request.method} />
                                <Info label="Cycle" value={request.billing_cycle || 'monthly'} />
                                <Info label="Amount" value={`${request.amount} ${request.currency}`} />
                                <Info label="Reference" value={request.transaction_reference || '-'} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                <Info label="Sender" value={request.sender_name || '-'} />
                                <Info label="Phone" value={request.sender_phone || '-'} />
                            </div>

                            {request.admin_note && (
                                <p className="mb-4 rounded-xl bg-gray-50 dark:bg-white/5 p-3 text-xs text-gray-500">
                                    {request.admin_note}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => openProof(request)}
                                    disabled={!request.proof_image_path || busyId === request.id}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold disabled:opacity-40"
                                >
                                    <LuEye size={14} />
                                    إثبات الدفع
                                </button>
                                {request.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => approve(request)}
                                            disabled={busyId === request.id}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-bold disabled:opacity-60"
                                        >
                                            <LuCheck size={14} />
                                            قبول
                                        </button>
                                        <button
                                            onClick={() => reject(request)}
                                            disabled={busyId === request.id}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold disabled:opacity-60"
                                        >
                                            <LuX size={14} />
                                            رفض
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const Info = ({ label, value }) => (
    <div className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-3 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">{label}</p>
        <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{value}</p>
    </div>
);

export default OfflinePayments;
