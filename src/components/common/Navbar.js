import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import Button from '../ui/Button';
import { name } from '../../constants';
import LogoComponent from '../LogoComponent';
import DarkModeToggle from '../DarkModeToggle';
import LanguageToggle from '../LanguageToggle';

import { useTranslation } from 'react-i18next';

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const navigate = useNavigate();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 20);
    });

    const links = [
        { name: t('nav.features'), hash: '#features' },
        { name: t('landing.sections.process.kicker'), hash: '#how-it-works' },
        { name: t('nav.pricing'), hash: '#pricing' },
    ];

    const handleHashNav = (hash) => {
        if (location.pathname !== '/') {
            navigate('/', { state: { scrollTo: hash } });
            setIsMobileOpen(false);
            return;
        }
        const el = document.querySelector(hash);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setIsMobileOpen(false);
        }
    };

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location]);

    return (
        <motion.nav
            className={isScrolled ? 'public-nav public-nav--scrolled' : 'public-nav'}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}>
            <div className="public-nav__inner app-container">
                <button type="button" className="public-nav__brand" onClick={() => navigate('/')}
                    aria-label="Go to home">
                    <span className="public-nav__logo" aria-hidden="true">
                        <LogoComponent />
                    </span>
                    <span className="public-nav__name">{name}</span>
                </button>

                <div className="public-nav__links" aria-label="Primary navigation">
                    {links.map((link) => (
                        <button
                            key={link.name}
                            type="button"
                            className="public-nav__link"
                            onClick={() => handleHashNav(link.hash)}
                        >
                            {link.name}
                        </button>
                    ))}
                </div>

                <div className="public-nav__actions">
                    <span className="public-nav__theme">
                        <LanguageToggle />
                    </span>
                    <span className="public-nav__theme">
                        <DarkModeToggle />
                    </span>

                    <Button variant="secondary" size="sm" className="public-nav__auth" onClick={() => navigate('/signin')}>
                        {t('common.login')}
                    </Button>
                    <Button variant="primary" size="sm" className="public-nav__auth" onClick={() => navigate('/signup')}>
                        {t('common.signup')}
                    </Button>

                    <button
                        type="button"
                        className="public-nav__mobileToggle"
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        aria-expanded={isMobileOpen}
                        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
                    >
                        {isMobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Sidebar */}
            {isMobileOpen && (
                <>
                    <motion.div
                        className="public-nav__overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                    />
                    <motion.div
                        className="public-nav__mobile"
                        initial={{ x: isRtl ? '-100%' : '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: isRtl ? '-100%' : '100%' }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    >
                        <div className="public-nav__mobileInner app-container">
                            {links.map((link) => (
                                <button
                                    key={link.name}
                                    type="button"
                                    className="public-nav__mobileLink"
                                    onClick={() => handleHashNav(link.hash)}
                                >
                                    {link.name}
                                </button>
                            ))}
                            <div className="public-nav__divider" />
                            <div className="public-nav__mobileToggles">
                                <LanguageToggle />
                                <DarkModeToggle />
                            </div>
                            <div className="public-nav__mobileActions">
                                <Button variant="ghost" onClick={() => navigate('/signin')}>{t('common.login')}</Button>
                                <Button variant="primary" onClick={() => navigate('/signup')}>{t('common.signup')}</Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </motion.nav>
    );
};

export default Navbar;
