import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { serverURL } from '../../constants';
import axios from 'axios';
import {
    LuUsers,
    LuVideo,
    LuDollarSign,
    LuShield,
    LuMessageSquare,
    LuFileText,
    LuLogOut,
    LuX,
    LuSun,
    LuMoon,
    LuLayers,
    LuArrowLeft,
    LuShare2,
    LuReceipt,
    LuSettings
} from "react-icons/lu";
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LogoComponent from '../../components/LogoComponent';
import DashboardNavbar from '../../components/common/DashboardNavbar';

const AdminLayout = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

    const isRtl = i18n.language.startsWith('ar');

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/signin');
                    return;
                }
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const postURL = serverURL + '/auth/user-profile';
                const response = await axios.get(postURL, config);
                const user = response.data.user || response.data;

                if (user.role !== 'admin') {
                    navigate('/dashboard');
                } else {
                    localStorage.setItem('adminEmail', user.email);
                    setUserData(user);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Admin check failed", error);
                navigate('/dashboard');
            }
        };
        checkAdmin();
    }, [navigate]);

    const menuItems = [
        { name: t('admin.users'), icon: LuUsers, path: '/admin/users' },
        { name: t('admin.courses'), icon: LuVideo, path: '/admin/courses' },
        { name: t('admin.paid_users'), icon: LuDollarSign, path: '/admin/paid' },
        { name: t('admin.offline_payments') || 'Offline Payments', icon: LuReceipt, path: '/admin/offline-payments' },
        { name: t('admin.admins'), icon: LuShield, path: '/admin/admins' },
        { name: t('admin.contacts'), icon: LuMessageSquare, path: '/admin/contacts' },
        { name: t('admin.manage_blogs'), icon: LuFileText, path: '/admin/manage-blogs' },
        { name: t('admin.create_blog'), icon: LuFileText, path: '/admin/create-blog' },
        { name: t('admin.plans'), icon: LuLayers, path: '/admin/plans' },
        { name: t('admin.platform_settings') || 'Platform Settings', icon: LuSettings, path: '/admin/platform-settings' },
        {
            name: t('admin.legal'), icon: LuFileText, subItems: [
                { name: t('admin.terms'), path: '/admin/editterms' },
                { name: t('admin.privacy'), path: '/admin/editprivacy' },
                { name: t('admin.cancellation'), path: '/admin/editcancellation' },
                { name: t('admin.refund'), path: '/admin/editrefund' },
                { name: t('admin.billing'), path: '/admin/editbilling' },
            ]
        },
        { name: t('admin.social_links') || 'Social Links', icon: LuShare2, path: '/admin/social-links' },
    ];

    const logout = () => {
        localStorage.clear();
        localStorage.clear();
        navigate('/signin');
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#020617]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-400 animate-pulse">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-[#f8fafc] dark:bg-[#02040a] flex overflow-hidden text-gray-900 dark:text-gray-100 font-sans relative ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Background Textures */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 dark:bg-blue-600/[0.03] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 dark:bg-purple-600/[0.03] rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.05] mix-blend-overlay" />
            </div>

            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col w-72 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl ${isRtl ? 'border-l right-0 box-glow-left-blue' : 'border-r left-0 box-glow-right-blue'} border-gray-200 dark:border-white/5 h-screen fixed top-0 z-40 overflow-y-auto custom-scrollbar transition-all duration-300 shadow-2xl shadow-black/5`}>
                <div className="p-6 mb-2">
                    <div
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10 cursor-pointer hover:bg-blue-500/10 transition-colors"
                    >
                        <div className="w-10 h-10 bg-white dark:bg-white/5 rounded-xl flex items-center justify-center p-1 shadow-sm border border-gray-100 dark:border-white/10 group-hover:scale-105 transition-transform duration-300">
                            <LogoComponent className="w-full h-full" isDarkMode={isDarkMode} />
                        </div>
                        <div>
                            <span className="block font-black text-sm tracking-tight text-gray-900 dark:text-white leading-none uppercase">{t('common.admin_panel')}</span>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 block">{t('admin.dashboard.blog.control_center')}</span>
                        </div>
                    </div>
                </div>

                <div className="px-4 mb-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-2xl border border-gray-100 dark:border-white/5 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 font-bold text-sm shadow-sm"
                    >
                        <LuArrowLeft size={18} className={isRtl ? 'rotate-180' : ''} />
                        <span>{t('common.back_home')}</span>
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1 py-2">
                    {menuItems.map((item, idx) => (
                        <NavItem
                            key={idx}
                            {...item}
                            isActive={location.pathname === item.path}
                            navigate={navigate}
                            location={location}
                            isRtl={isRtl}
                        />
                    ))}
                </nav>

                {/* Sidebar Bottom Profile */}
                <div className="p-4 mt-auto">
                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3 mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                            <LuShield className="text-blue-500" size={12} />
                            {t('admin.admins')}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
                                {userData?.name?.charAt(0) || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-gray-900 dark:text-white">{userData?.name || 'Admin'}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">{userData?.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button
                                onClick={async () => {
                                    const currentMode = isDarkMode || localStorage.getItem('darkMode') === 'true';
                                    const newMode = !currentMode;
                                    localStorage.setItem('darkMode', newMode);
                                    setIsDarkMode(newMode);
                                    document.documentElement.classList.toggle('dark', newMode);
                                    try {
                                        const token = localStorage.getItem('token');
                                        await axios.post(`${serverURL}/user/dark-mode`, { dark_mode: newMode }, { headers: { Authorization: `Bearer ${token}` } });
                                    } catch (e) { }
                                }}
                                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-blue-500/50 transition-colors"
                            >
                                {isDarkMode ? <LuSun size={14} /> : <LuMoon size={14} />}
                                <span className="text-[10px] font-bold">{t('admin.toggle_theme')}</span>
                            </button>
                            <button
                                onClick={logout}
                                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-red-500/50 transition-colors"
                            >
                                <LuLogOut size={14} />
                                <span className="text-[10px] font-bold">{t('common.logout')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header & Content Area */}
            <div className={`flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-[#020617] ${isRtl ? 'md:mr-72' : 'md:ml-72'}`}>

                {/* Mobile Header */}
                <DashboardNavbar onOpenSidebar={() => setIsSidebarOpen(true)} />

                {/* Mobile Drawer */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setIsSidebarOpen(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                            />
                            <motion.div
                                initial={{ x: isRtl ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: isRtl ? '100%' : '-100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className={`fixed top-0 ${isRtl ? 'right-0' : 'left-0'} h-full w-4/5 max-w-sm bg-white dark:bg-[#0a0a0b] z-50 overflow-y-auto md:hidden shadow-2xl overflow-hidden`}
                            >
                                <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 flex items-center justify-center">
                                            <LogoComponent className="w-full h-full" isDarkMode={isDarkMode} />
                                        </div>
                                        <span className="font-black text-sm tracking-tight uppercase text-gray-900 dark:text-white leading-none uppercase">Ai Course</span>
                                    </div>
                                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-400 hover:text-white">
                                        <LuX size={18} />
                                    </button>
                                </div>

                                <nav className="p-4 space-y-1">
                                    {menuItems.map((item, idx) => (
                                        <NavItem
                                            key={idx}
                                            {...item}
                                            isActive={location.pathname === item.path}
                                            navigate={navigate}
                                            location={location}
                                            isRtl={isRtl}
                                        />
                                    ))}

                                    <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/5 space-y-4">
                                        {/* Language and Home are now in Navbar */}
                                        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-500/5 rounded-xl transition-colors">
                                            <LuLogOut size={18} /> {t('common.logout')}
                                        </button>
                                    </div>
                                </nav>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Content Viewport */}
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
                        <motion.header
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="hidden md:flex flex-col gap-1 mb-12 relative z-10"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                        <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-4">
                                            {menuItems.find(item => item.path === location.pathname)?.name || t('common.dashboard')}
                                            {location.pathname === '/admin' && (
                                                <span className="px-4 py-1.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-blue-500/20 shadow-sm backdrop-blur-sm">
                                                    {t('admin.dashboard.blog.active_instance')}
                                                </span>
                                            )}
                                        </h1>
                                    </div>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm font-bold uppercase tracking-[0.15em] opacity-80 mt-2">
                                        {t('admin.welcome', { name: userData?.name || 'Admin' })} — {new Date().toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </motion.header>

                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Outlet />
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
};

const NavItem = ({ name, icon: Icon, path, subItems, isActive, navigate, location, isRtl }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasSubItems = subItems && subItems.length > 0;

    // Keep sub-menu open if active sub-item
    useEffect(() => {
        if (hasSubItems && subItems.some(sub => sub.path === location.pathname)) {
            setIsOpen(true);
        }
    }, [location.pathname, hasSubItems, subItems]);

    if (hasSubItems) {
        return (
            <div className="space-y-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-all duration-200 group ${isOpen ? 'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <Icon size={18} className={isOpen ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500 transition-colors'} />
                        <span className="text-sm font-bold">{name}</span>
                    </div>
                    <motion.div animate={{ rotate: isOpen ? 90 : 0 }}>
                        <LuFileText size={14} className="opacity-50" />
                    </motion.div>
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden ltr:ml-9 rtl:mr-9 space-y-1 border-l dark:border-white/5 ltr:pl-4 rtl:pr-4"
                        >
                            {subItems.map((sub, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(sub.path)}
                                    className={`flex items-center w-full px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${location.pathname === sub.path ? 'text-blue-500 bg-blue-500/5' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    {sub.name}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <button
            onClick={() => navigate(path)}
            className={`flex items-center w-full px-4 py-2.5 rounded-xl transition-all duration-300 group ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
        >
            <Icon className={`${isRtl ? 'ml-3' : 'mr-3'} ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'} transition-colors`} size={18} />
            <span className="text-[13px] font-bold">{name}</span>
        </button>
    );
};

export default AdminLayout;
