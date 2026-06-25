import React, { useEffect, useState } from 'react';
import ContactTable from './components/contacttable';
import { serverURL } from '../constants';
import axios from 'axios';
import { toast } from 'react-toastify';

const Contacts = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);

    const fetchContacts = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            };
            const postURL = serverURL + `/admin/contacts`;
            const response = await axios.get(postURL, config);
            setData(response.data.data || response.data)
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleDelete = (id) => {
        const contact = data.find(c => c.id === id);
        setSelectedContact(contact);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedContact) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${serverURL}/admin/contacts/${selectedContact.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("تم حذف الرسالة بنجاح");
            setData(data.filter(c => c.id !== selectedContact.id));
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error("Delete failed", error);
            toast.error("فشل حذف الرسالة");
        }
    };

    const handleView = (contact) => {
        setSelectedContact(contact);
        setIsViewModalOpen(true);
        if (contact.status !== 'read') {
            handleMarkRead(contact.id);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${serverURL}/admin/contacts/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(data.map(c => c.id === id ? { ...c, status: 'read' } : c));
            // toast.success("تم تحديد الرسالة كمقروءة"); // Optional
        } catch (error) {
            console.error("Mark read failed", error);
        }
    };

    return (
        <div>
            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <ContactTable
                    datas={data}
                    onDelete={handleDelete}
                    onView={handleView}
                    onMarkRead={handleMarkRead}
                />
            )}

            {/* View Modal */}
            {isViewModalOpen && selectedContact && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0a0a0b] rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-gray-100 dark:border-white/5 relative">
                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">تفاصيل الرسالة</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">المرسل</label>
                                <p className="text-gray-900 dark:text-white font-medium">{selectedContact.name}</p>
                                <p className="text-sm text-gray-500">{selectedContact.email}</p>
                                {selectedContact.phone && <p className="text-sm text-gray-500">{selectedContact.phone}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">الرسالة</label>
                                <div className="mt-1 p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                    {selectedContact.message || selectedContact.msg}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0a0a0b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 dark:border-white/5">
                        <h3 className="text-xl font-bold text-red-600 mb-2">حذف الرسالة</h3>
                        <p className="text-sm text-gray-500 mb-6">هل أنت متأكد من حذف هذه الرسالة من <span className="font-bold text-gray-900 dark:text-white">{selectedContact?.name}</span>؟</p>

                        <div className="flex gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                            >
                                حذف
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contacts;
