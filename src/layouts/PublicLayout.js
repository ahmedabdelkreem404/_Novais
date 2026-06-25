import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footers from '../components/footers';
import MouseBackground from '../components/common/MouseBackground';
import { useTranslation } from 'react-i18next';

const PublicLayout = () => {
    const { i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    return (
        <div className={`public-shell ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <MouseBackground />
            <Navbar />
            <main className="public-main">
                <Outlet />
            </main>
            <Footers />
        </div>
    );
};

export default PublicLayout;
