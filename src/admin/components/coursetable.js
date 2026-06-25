import React from 'react';
import Card from '../../components/ui/Card';
import { LuVideo, LuBookOpen, LuUser, LuPencil, LuTrash2, LuEye } from "react-icons/lu";
import { useTranslation } from 'react-i18next';

const CourseTable = ({ datas = [], onDelete, onView, onEdit }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    return (
        <Card className="overflow-hidden border-none shadow-sm bg-white dark:bg-white/5 backdrop-blur-xl">
            <div className="overflow-x-auto">
                <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} border-collapse min-w-[900px]`} dir={isRtl ? 'rtl' : 'ltr'}>
                    <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                        <tr>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.tables.course_info')}</th>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.tables.author')}</th>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.tables.type')}</th>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.tables.status')}</th>
                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-left' : 'text-right'}`}>{t('admin.tables.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {datas.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    {t('admin.tables.no_courses')}
                                </td>
                            </tr>
                        ) : (
                            datas.map((course) => (
                                <tr key={course.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{course.title || 'Untitled Course'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                                                <LuUser size={12} />
                                            </div>
                                            {course.user?.name || course.author_name || 'System'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {course.type === 'video' ? (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[10px] font-bold uppercase">
                                                    <LuVideo size={12} />
                                                    {t('admin.course_types.video')}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold uppercase">
                                                    <LuBookOpen size={12} />
                                                    {t('admin.course_types.text')}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${course.status === 'published'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'
                                            }`}>
                                            {course.status === 'published' ? t('admin.status.published') : t('admin.status.draft')}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 ${isRtl ? 'text-left' : 'text-right'}`}>
                                        <div className={`flex ${isRtl ? 'justify-end' : 'justify-end'} gap-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            <button
                                                onClick={() => onView && onView(course)}
                                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                title={t('admin.tables.view')}
                                            >
                                                <LuEye size={18} />
                                            </button>
                                            <button
                                                onClick={() => onEdit && onEdit(course)}
                                                className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                                                title={t('admin.tables.edit')}
                                            >
                                                <LuPencil size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete && onDelete(course.id);
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                title={t('admin.tables.delete_course')}
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

export default CourseTable;
