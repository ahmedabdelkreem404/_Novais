import React from 'react';
import Logo from '../res/img/logo.svg';
import DarkLogo from '../res/img/logo.svg';
import { websiteURL } from '../constants';

const LogoComponent = ({ isDarkMode, className = "h-10 w-auto" }) => {
    // We check session storage as fallback if prop isn't passed/updated
    const isDark = isDarkMode === 'true' || isDarkMode === true || localStorage.getItem('darkMode') === 'true';

    function redirectHome() {
        window.location.href = websiteURL;
    }

    return (
        <img
            alt='logo'
            src={isDark ? DarkLogo : Logo}
            className={`${className} object-contain transition-all duration-300`}
            onClick={redirectHome}
        />
    );
};

export default LogoComponent;
