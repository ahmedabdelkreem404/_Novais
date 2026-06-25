import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuGlobe, LuMenu, LuX, LuLayoutDashboard, LuLogOut } from "react-icons/lu";
import LogoComponent from './LogoComponent';
import DarkModeToggle from './DarkModeToggle';
import Button from './ui/Button';
import { name, serverURL } from '../constants';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ isHome, className = '', disableFixed = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const isRtl = i18n.language === 'ar';

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auth & Admin Check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);

      if (token) {
        // Check for admin status if not already set or cached
        if (localStorage.getItem('adminEmail') === localStorage.getItem('email') && localStorage.getItem('email')) {
          setIsAdmin(true);
        } else {
          try {
            const config = {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            };
            const response = await axios.get(`${serverURL}/auth/user-profile`, config);
            const user = response.data.user || response.data;
            if (user.role === 'admin') {
              localStorage.setItem('adminEmail', user.email);
              setIsAdmin(true);
            }
          } catch (error) {
            console.error("Auth check failed", error);
          }
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAuth();
  }, [location.pathname]); // Re-check on navigation

  const logout = () => {
    localStorage.clear();
    toast.success(t('common.success') || 'Logged out successfully');
    navigate("/signin");
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsMobileOpen(false);
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(isRtl ? 'en' : 'ar');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const scrollToSection = (id) => {
    if (location.pathname !== '/' && id !== 'features') { // Allow features to just navigate if simple
      // If we are not on home, navigating to home with hash might be needed, 
      // but strictly following "links" logic:
      navigate('/', { state: { scrollTo: `#${id}` } });
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/', { state: { scrollTo: `#${id}` } });
      }
    }
    setIsMobileOpen(false);
  };

  // Define Links
  const publicLinks = [
    { name: t('common.features'), action: () => scrollToSection('features') },
    { name: t('common.process'), action: () => scrollToSection('how-it-works') },
    { name: t('nav.pricing'), action: () => scrollToSection('pricing') },
  ];

  const activeLinks = publicLinks;
  // Actually, for "Whole Website" request, the user likely wants the Visual Style universal.
  // Content can adapt.

  return (
    <header
      className={`public-nav ${isScrolled ? 'public-nav--scrolled' : ''} ${disableFixed ? '!relative' : ''} ${className}`}
      style={{ transform: 'none', direction: 'ltr' }} // Force LTR for layout alignment if needed, or let app handle it.
    >
      <div className={`public-nav__inner app-container ${isRtl ? 'flex-row-reverse' : ''}`}>
        {/* Brand */}
        <button type="button" className="public-nav__brand" onClick={() => handleNavigation(isLoggedIn ? '/dashboard' : '/')} aria-label="Go to home">
          <span className="public-nav__logo" aria-hidden="true">
            <LogoComponent className="h-full w-full object-contain" />
          </span>
          <span className="public-nav__name">{name}</span>
        </button>

        {/* Desktop Links */}
        <nav className="public-nav__links" aria-label="Primary navigation">
          {/* If on Landing, show landing links. If on App, maybe show nothing or App links? */}
          {/* The design provided has specific "Features | Process | Pricing" look. */}
          {/* We will render them if isHome. If not isHome (App), we show App Links. */}

          {activeLinks.map((link, idx) => (
            link.Path ? (
              <button key={idx} onClick={() => handleNavigation(link.Path)} className="public-nav__link">
                {link.name}
              </button>
            ) : (
              <button key={idx} onClick={link.action} className="public-nav__link">
                {link.name}
              </button>
            )
          ))}
        </nav>

        {/* Actions */}
        <div className={`public-nav__actions ${isRtl ? 'flex-row-reverse' : ''}`}>
          {/* Language */}
          <div className="public-nav__theme">
            <button className="language-toggle" onClick={toggleLanguage} aria-label={isRtl ? "Switch to English" : "Switch to Arabic"}>
              <LuGlobe size={18} />
              <span className="language-toggle__text">{isRtl ? 'EN' : 'AR'}</span>
            </button>
          </div>

          {/* Theme */}
          <div className="public-nav__theme">
            <DarkModeToggle />
          </div>

          {/* Auth Buttons */}
          {!isLoggedIn ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="public-nav__auth"
                onClick={() => handleNavigation('/signin')}
              >
                <span>{t('common.signin') || 'Log In'}</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="public-nav__auth"
                onClick={() => handleNavigation('/signup')}
              >
                <span>{t('common.signup') || 'Sign Up'}</span>
              </Button>
            </>
          ) : (
            <>
              {!isHome && (
                <button onClick={logout} className="public-nav__link text-red-500 hover:text-red-600 hidden md:block">
                  <LuLogOut size={20} />
                </button>
              )}
              <Button
                variant="primary"
                size="sm"
                className="public-nav__auth"
                onClick={() => handleNavigation('/dashboard')}
              >
                <div className="flex items-center gap-2">
                  <LuLayoutDashboard size={16} />
                  <span>{t('nav.dashboard') || 'Dashboard'}</span>
                </div>
              </Button>
            </>
          )}

          {/* Mobile Toggle */}
          <button
            type="button"
            className="public-nav__mobileToggle"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-expanded={isMobileOpen}
            aria-label="Open menu"
          >
            {isMobileOpen ? <LuX size={22} /> : <LuMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
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
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="public-nav__mobileHeader">
                <span className="public-nav__name text-lg">{name}</span>
                <button className="public-nav__closeBtn" onClick={() => setIsMobileOpen(false)}>
                  <LuX size={24} />
                </button>
              </div>

              <div className="public-nav__mobileInner">
                {/* Links */}
                {activeLinks.map((link, idx) => (
                  <button
                    key={idx}
                    onClick={() => { link.Path ? handleNavigation(link.Path) : link.action(); }}
                    className="public-nav__mobileLink"
                  >
                    {link.name}
                  </button>
                ))}

                <div className="public-nav__divider"></div>

                {/* Toggles */}
                <div className="public-nav__mobileToggles">
                  <button className="language-toggle" onClick={toggleLanguage}>
                    <LuGlobe size={18} />
                    <span className="language-toggle__text">{isRtl ? 'EN' : 'AR'}</span>
                  </button>
                  <DarkModeToggle />
                </div>

                {/* Auth */}
                <div className="public-nav__mobileActions">
                  {!isLoggedIn ? (
                    <>
                      <Button variant="secondary" onClick={() => handleNavigation('/signin')}>
                        {t('common.signin') || 'Log In'}
                      </Button>
                      <Button variant="primary" onClick={() => handleNavigation('/signup')}>
                        {t('common.signup') || 'Sign Up'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="primary" onClick={() => handleNavigation('/dashboard')}>
                        {t('nav.dashboard') || 'Dashboard'}
                      </Button>
                      <Button variant="ghost" className="text-red-500" onClick={logout}>
                        {t('common.logout') || 'Log Out'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
