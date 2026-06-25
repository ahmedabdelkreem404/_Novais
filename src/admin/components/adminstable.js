import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import { LuShield, LuUser, LuUserPlus, LuShieldAlert } from "react-icons/lu";
import { useTranslation } from 'react-i18next';

const AdminTable = ({ admin = [], user = [], onPromote, onDemote }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [activeTab, setActiveTab] = useState('current'); // 'current' or 'add'

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit" dir={isRtl ? 'rtl' : 'ltr'}>
                <button
                    onClick={() => setActiveTab('current')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'current'
                        ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    {t('admin.tables.current_admins')}
                </button>
                <button
                    onClick={() => setActiveTab('add')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'add'
                        ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    {t('admin.tables.promote_users')}
                </button>
            </div>

            <Card className="overflow-hidden border-none shadow-sm bg-white dark:bg-white/5 backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} border-collapse min-w-[700px]`} dir={isRtl ? 'rtl' : 'ltr'}>
                        <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                            <tr>
                                <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.tables.identity')}</th>
                                <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.tables.role_info')}</th>
                                <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-left' : 'text-right'}`}>{t('admin.tables.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {activeTab === 'current' ? (
                                admin.length === 0 ? (
                                    <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-500 italic">{t('admin.tables.no_admins')}</td></tr>
                                ) : (
                                    admin.map((a) => (
                                        <tr key={a.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                                        <LuShield size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">{a.name}</div>
                                                        <div className="text-xs text-gray-400 italic">{a.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                                                        {t('admin.roles.super_admin')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 ${isRtl ? 'text-left' : 'text-right'}`}>
                                                <button
                                                    onClick={() => onDemote && onDemote(a.id)}
                                                    className={`p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ${isRtl ? 'float-right' : 'float-left'} md:float-none`}
                                                    title={t('admin.tables.demote')}
                                                >
                                                    <LuShieldAlert size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                user.length === 0 ? (
                                    <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-500 italic">{t('admin.tables.no_users_promote')}</td></tr>
                                ) : (
                                    user.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                        <LuUser size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">{u.name}</div>
                                                        <div className="text-xs text-gray-400 italic">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{t('admin.roles.regular_user')}</td>
                                            <td className={`px-6 py-4 ${isRtl ? 'text-left' : 'text-right'}`}>
                                                <button
                                                    onClick={() => onPromote && onPromote(u.id)}
                                                    className={`flex items-center gap-2 ${isRtl ? 'mr-auto' : 'ml-auto'} px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors opacity-0 group-hover:opacity-100`}
                                                >
                                                    <LuUserPlus size={14} /> {t('admin.tables.promote')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminTable;
