import React from 'react';
import Card from '../../components/ui/Card';
import { LuUser, LuMail, LuTrash2, LuLayers } from "react-icons/lu";
import { useTranslation } from 'react-i18next';

const UserTable = ({ datas = [], onDelete, onAssignPlan }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    return (
        <Card className="overflow-hidden border-none shadow-sm bg-white dark:bg-white/5 backdrop-blur-xl">
            <div className="overflow-x-auto">
                <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} border-collapse min-w-[800px]`} dir={isRtl ? 'rtl' : 'ltr'}>
                    <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                        <tr>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.tables.user')}</th>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.tables.contact')}</th>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.tables.role_status')}</th>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-left' : 'text-right'}`}>{t('admin.tables.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {datas.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                    {t('admin.tables.no_users')}
                                </td>
                            </tr>
                        ) : (
                            datas.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <LuUser size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white">{user.name || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <LuMail size={14} className="text-gray-400" />
                                                {user.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                                                : user.role === 'premium' || user.sub_status === 'manual_premium'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                                                }`}>
                                                {user.role === 'admin'
                                                    ? t('admin.roles.admin')
                                                    : (user.sub_status && ['pro', 'elite', 'free'].includes(user.sub_status)
                                                        ? t(`admin.roles.${user.sub_status}`)
                                                        : (user.role === 'premium' ? t('admin.roles.premium') : t('admin.roles.user')))
                                                }
                                            </span>
                                            {user.sub_status === 'manual_premium' && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                                    {t('admin.roles.manual')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 ${isRtl ? 'text-left' : 'text-right'}`}>
                                        <div className={`flex ${isRtl ? 'justify-end' : 'justify-end'} gap-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            <button
                                                onClick={() => onDelete && onDelete(user)}
                                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                title={t('admin.tables.delete_user')}
                                            >
                                                <LuTrash2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => onAssignPlan && onAssignPlan(user)}
                                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                title={t('admin.tables.assign_plan')}
                                            >
                                                <LuLayers size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default UserTable;
