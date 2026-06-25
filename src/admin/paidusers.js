import React, { useEffect, useState } from 'react';
import UserTable from './components/usertable';
import { serverURL } from '../constants';
import axios from 'axios';

const PaidUsers = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${serverURL}/admin/plans`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlans(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            };
            const postURL = serverURL + `/admin/paid-users`;
            const response = await axios.get(postURL, config);
            setData(response.data.data || response.data)
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchPlans();
    }, []);

    const handleAssignPlan = (user) => {
        setSelectedUser(user);
        setIsAssignModalOpen(true);
    };

    const confirmAssignment = async (planSlug) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${serverURL}/admin/users/${selectedUser.id}/premium`, { plan_slug: planSlug }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local data to reflect change
            setData(data.map(u => u.id === selectedUser.id ? { ...u, sub_status: planSlug, role: planSlug === 'free' ? 'user' : 'premium' } : u));
            setIsAssignModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedUser) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${serverURL}/admin/users/${selectedUser.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(data.filter(u => u.id !== selectedUser.id));
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <UserTable datas={data} onDelete={handleDelete} onAssignPlan={handleAssignPlan} />
            )}

            {/* Simple Plan Assignment Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0a0a0b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 dark:border-white/5">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">تخصيص باقة</h3>
                        <p className="text-sm text-gray-500 mb-6">تغيير الباقة للمستخدم {selectedUser?.name}</p>

                        <div className="space-y-3">
                            {plans.map(plan => (
                                <button
                                    key={plan.id}
                                    onClick={() => confirmAssignment(plan.slug)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-white/10 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-right group"
                                >
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {plan.name?.ar || plan.name?.en || plan.name}
                                        </p>
                                        <p className="text-[10px] text-gray-400">{plan.course_limit === -1 ? 'غير محدود' : `${plan.course_limit} دورات`}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                        <div className="w-4 h-4 border-2 border-current rounded-full" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setIsAssignModalOpen(false)}
                            className="mt-6 w-full py-3 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0a0a0b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 dark:border-white/5">
                        <h3 className="text-xl font-bold text-red-600 mb-2">حذف المستخدم</h3>
                        <p className="text-sm text-gray-500 mb-6">هل أنت متأكد من رغبتك في حذف المستخدم <span className="font-bold text-gray-900 dark:text-white">{selectedUser?.name}</span>؟ لا يمكن التراجع عن هذا الإجراء.</p>

                        <div className="flex gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                            >
                                نعم، احذف
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
export default PaidUsers;
