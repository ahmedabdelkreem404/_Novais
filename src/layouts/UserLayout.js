import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/common/Sidebar';
import DashboardNavbar from '../components/common/DashboardNavbar';

const UserLayout = () => {
    const { i18n } = useTranslation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-white dark:bg-[#0f0f0f] overflow-hidden">

            {/* Mobile Header */}
            <DashboardNavbar onOpenSidebar={() => setIsSidebarOpen(true)} />

            {/* Desktop Sidebar / Mobile Drawer */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <main className={`flex-1 overflow-auto custom-scrollbar transition-all duration-300 relative pt-14 md:pt-0 ${i18n.language.startsWith('ar') ? 'md:mr-[255px]' : 'md:ml-[255px]'}`}>
                <div className="min-h-full">
                    <Outlet />
                </div>
            </main>

        </div>
    );
};

export default UserLayout;
