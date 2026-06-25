import React from 'react';
import Card from '../../components/ui/Card';
import { LuUser, LuMail, LuCalendar, LuCircleCheck, LuTrash2, LuEye } from "react-icons/lu";
import { useTranslation } from 'react-i18next';

const ContactTable = ({ datas = [], onDelete, onView, onMarkRead }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    return (
        <Card className="overflow-hidden border-none shadow-sm bg-white dark:bg-white/5 backdrop-blur-xl">
            <div className="overflow-x-auto">
                <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} border-collapse min-w-[800px]`} dir={isRtl ? 'rtl' : 'ltr'}>
                    <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                        <tr>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.tables.sender')}</th>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.tables.subject_message')}</th>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.tables.date')}</th>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-left' : 'text-right'}`}>{t('admin.tables.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {datas.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                    {t('admin.tables.no_messages')}
                                </td>
                            </tr>
                        ) : (
                            datas.map((msg) => (
                                <tr key={msg.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <LuUser size={14} className="text-gray-400" />
                                                {msg.name}
                                            </div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                                <LuMail size={12} />
                                                {msg.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{msg.subject || t('admin.tables.no_subject')}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{msg.message}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-gray-400 flex items-center gap-2">
                                            <LuCalendar size={14} />
                                            {new Date(msg.created_at).toLocaleDateString(i18n.language)}
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 ${isRtl ? 'text-left' : 'text-right'}`}>
                                        <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'} gap-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            <button
                                                onClick={() => onView && onView(msg)}
                                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                title={t('admin.tables.view')}
                                            >
                                                <LuEye size={18} />
                                            </button>
                                            <button
                                                onClick={() => onMarkRead && onMarkRead(msg.id)}
                                                className={`p-2 transition-colors ${msg.status === 'read' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 hover:text-green-600 dark:hover:text-green-400'}`}
                                                title={t('admin.tables.mark_read')}
                                                disabled={msg.status === 'read'}
                                            >
                                                <LuCircleCheck size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDelete && onDelete(msg.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                title={t('admin.tables.delete_inquiry')}
                                            >
                                                <LuTrash2 size={18} />
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

export default ContactTable;
