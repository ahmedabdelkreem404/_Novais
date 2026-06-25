import React, { useEffect, useState } from 'react';
import AdminTable from './components/adminstable';
import { serverURL } from '../constants';
import axios from 'axios';
import { toast } from 'react-toastify';

const Admins = () => {
    const [admins, setAdmin] = useState([]);
    const [users, setUser] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAdmins = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            };
            const postURL = serverURL + `/admin/admins`;
            const response = await axios.get(postURL, config);
            setAdmin(response.data.admins)
            setUser(response.data.users)
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [isDemoteModalOpen, setIsDemoteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const handlePromote = (id) => {
        const userToPromote = users.find(u => u.id === id);
        setSelectedUser(userToPromote);
        setIsPromoteModalOpen(true);
    };

    const confirmPromote = async () => {
        if (!selectedUser) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${serverURL}/admin/users/promote`, { email: selectedUser.email }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("تم الترقية بنجاح");
            fetchAdmins(); // Refresh lists
            setIsPromoteModalOpen(false);
        } catch (error) {
            console.error("Promotion failed", error);
            toast.error("فشل في الترقية");
        }
    };

    const handleDemote = (id) => {
        const adminToDemote = admins.find(a => a.id === id);
        setSelectedUser(adminToDemote);
        setIsDemoteModalOpen(true);
    };

    const confirmDemote = async () => {
        if (!selectedUser) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${serverURL}/admin/users/demote`, { email: selectedUser.email }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("تم سحب الصلاحيات");
            fetchAdmins(); // Refresh lists
            setIsDemoteModalOpen(false);
        } catch (error) {
            console.error("Demotion failed", error);
            toast.error("فشل في سحب الصلاحيات");
        }
    };

    return (
        <div>
            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <AdminTable
                    admin={admins}
                    user={users}
                    onPromote={handlePromote}
                    onDemote={handleDemote}
                />
            )}

            {/* Promote Confirmation Modal */}
            {isPromoteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0a0a0b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 dark:border-white/5">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">ترقية المستخدم</h3>
                        <p className="text-sm text-gray-500 mb-6">هل أنت متأكد من ترقية <span className="font-bold text-gray-900 dark:text-white">{selectedUser?.name}</span> ليكون مشرفاً (Admin)؟</p>

                        <div className="flex gap-3">
                            <button
                                onClick={confirmPromote}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                نعم، ترقية
                            </button>
                            <button
                                onClick={() => setIsPromoteModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Demote Confirmation Modal */}
            {isDemoteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0a0a0b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 dark:border-white/5">
                        <h3 className="text-xl font-bold text-red-600 mb-2">سحب الصلاحيات</h3>
                        <p className="text-sm text-gray-500 mb-6">هل أنت متأكد من سحب صلاحيات الإشراف من <span className="font-bold text-gray-900 dark:text-white">{selectedUser?.name}</span>؟</p>

                        <div className="flex gap-3">
                            <button
                                onClick={confirmDemote}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                            >
                                نعم، سحب الصلاحيات
                            </button>
                            <button
                                onClick={() => setIsDemoteModalOpen(false)}
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

export default Admins;
