import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { serverURL } from '../constants';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import { LuPen, LuCreditCard } from "react-icons/lu";
import { useTranslation } from 'react-i18next';

const AdminPlans = () => {
    const { t, i18n } = useTranslation();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        name: { ar: '', en: '' },
        price_egp: 0,
        course_limit: 0,
        description: { ar: '', en: '' },
        features: { ar: '', en: '' }
    });
    const [activeTab, setActiveTab] = useState('ar');

    const isRtl = i18n.language.startsWith('ar');

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${serverURL}/admin/plans`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlans(res.data);
        } catch (err) {
            console.error(err);
            toast.error(t('admin.plan_mgmt.fetch_fail'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEdit = (plan) => {
        setEditingId(plan.id);
        setEditForm({
            name: { ar: plan.name?.ar || '', en: plan.name?.en || '' },
            price_egp: plan.price_egp,
            course_limit: plan.course_limit,
            description: { ar: plan.description?.ar || '', en: plan.description?.en || '' },
            features: {
                ar: Array.isArray(plan.features?.ar) ? plan.features.ar.join('\n') : '',
                en: Array.isArray(plan.features?.en) ? plan.features.en.join('\n') : ''
            }
        });
        setActiveTab(isRtl ? 'ar' : 'en');
    };

    const handleUpdate = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...editForm,
                features: {
                    ar: editForm.features.ar.split('\n').filter(f => f.trim() !== ''),
                    en: editForm.features.en.split('\n').filter(f => f.trim() !== '')
                }
            };
            await axios.put(`${serverURL}/admin/plans/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(t('admin.plan_mgmt.update_success'));
            setEditingId(null);
            fetchPlans();
        } catch (err) {
            console.error(err);
            toast.error(t('admin.plan_mgmt.update_fail'));
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-400">{t('admin.plan_mgmt.loading')}</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.id} className="relative overflow-hidden group border-none shadow-sm h-full flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.slug === 'free' ? 'bg-gray-100 text-gray-500' :
                                    plan.slug === 'pro' ? 'bg-blue-100 text-blue-600' :
                                        'bg-amber-100 text-amber-600'
                                    }`}>
                                    <LuCreditCard size={24} />
                                </div>
                                {editingId !== plan.id && (
                                    <button
                                        onClick={() => handleEdit(plan)}
                                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <LuPen size={18} />
                                    </button>
                                )}
                            </div>

                            {editingId === plan.id ? (
                                <div className="space-y-3">
                                    {/* Language Tabs */}
                                    <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg mb-2">
                                        <button
                                            onClick={() => setActiveTab('ar')}
                                            className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === 'ar' ? 'bg-white dark:bg-white/10 shadow-sm text-blue-600' : 'text-gray-400'}`}
                                        >
                                            العربية
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('en')}
                                            className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === 'en' ? 'bg-white dark:bg-white/10 shadow-sm text-blue-600' : 'text-gray-400'}`}
                                        >
                                            English
                                        </button>
                                    </div>

                                    <input
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg px-3 py-2 text-xs"
                                        value={editForm.name[activeTab]}
                                        onChange={(e) => setEditForm({ ...editForm, name: { ...editForm.name, [activeTab]: e.target.value } })}
                                        placeholder={activeTab === 'ar' ? 'اسم الخطة بالعربية' : 'Plan name in English'}
                                    />

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-widest">{t('admin.plan_mgmt.price_label')}</label>
                                            <input
                                                type="number"
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg px-3 py-2 text-xs"
                                                value={editForm.price_egp}
                                                onChange={(e) => setEditForm({ ...editForm, price_egp: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-widest">{t('admin.plan_mgmt.limit_label')}</label>
                                            <input
                                                type="number"
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg px-3 py-2 text-xs"
                                                value={editForm.course_limit}
                                                placeholder={t('admin.plan_mgmt.limit_hint')}
                                                onChange={(e) => setEditForm({ ...editForm, course_limit: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <textarea
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg px-3 py-2 text-xs h-16"
                                        value={editForm.description[activeTab]}
                                        onChange={(e) => setEditForm({ ...editForm, description: { ...editForm.description, [activeTab]: e.target.value } })}
                                        placeholder={activeTab === 'ar' ? 'وصف الخطة بالعربية' : 'Plan description in English'}
                                    />

                                    <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-widest">
                                        {activeTab === 'ar' ? 'المميزات (سطر لكل ميزة)' : 'Features (one per line)'}
                                    </label>
                                    <textarea
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg px-3 py-2 text-xs h-24"
                                        value={editForm.features[activeTab]}
                                        onChange={(e) => setEditForm({ ...editForm, features: { ...editForm.features, [activeTab]: e.target.value } })}
                                        placeholder="Feature 1&#10;Feature 2"
                                    />

                                    <div className="flex gap-2 pt-2">
                                        <button onClick={() => handleUpdate(plan.id)} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
                                            {t('common.save')}
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name?.[isRtl ? 'ar' : 'en'] || plan.name?.ar || plan.name}</h3>
                                        <span className="text-[10px] bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-gray-400 uppercase font-bold">{isRtl ? 'AR' : 'EN'}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-6 line-clamp-2">{plan.description?.[isRtl ? 'ar' : 'en'] || plan.description?.ar || plan.description}</p>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 text-center">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('admin.plan_mgmt.price_stat')}</p>
                                            <p className="font-black text-gray-900 dark:text-white uppercase leading-none">{plan.price_egp} {t('common.egp')}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 text-center">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('admin.plan_mgmt.limit_stat')}</p>
                                            <p className="font-black text-gray-900 dark:text-white uppercase leading-none">{plan.course_limit === -1 ? '∞' : plan.course_limit}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('common.features')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(plan.features?.[isRtl ? 'ar' : 'en'] || plan.features?.ar || []).map((f, i) => (
                                                <span key={i} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold border border-blue-100 dark:border-blue-900/30 line-clamp-1">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                ))}
                {plans.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10">
                        <p className="text-gray-500">{t('admin.plan_mgmt.no_plans') || 'No plans found.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPlans;
