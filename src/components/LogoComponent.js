import React, { useState, useEffect } from 'react';
import Logo from '../res/img/logo.svg';
import { websiteURL, serverURL } from '../constants';

const LogoComponent = ({ isDarkMode, className = "h-10 w-auto" }) => {
    const [logoSrc, setLogoSrc] = useState(() => {
        // Use custom platform logo if set, otherwise fall back to bundled SVG
        const customUrl = localStorage.getItem('platformLogoUrl');
        if (customUrl) {
            return customUrl.startsWith('http') ? customUrl : `${serverURL.replace('/api', '')}${customUrl}`;
        }
        return Logo;
    });

    useEffect(() => {
        const update = () => {
            const customUrl = localStorage.getItem('platformLogoUrl');
            if (customUrl) {
                setLogoSrc(customUrl.startsWith('http') ? customUrl : `${serverURL.replace('/api', '')}${customUrl}`);
            } else {
                setLogoSrc(Logo);
            }
        };
        window.addEventListener('brandingChange', update);
        return () => window.removeEventListener('brandingChange', update);
    }, []);

    function redirectHome() {
        window.location.href = websiteURL;
    }

    return (
        <img
            alt='logo'
            src={logoSrc}
            className={`${className} object-contain transition-all duration-300`}
            onClick={redirectHome}
            onError={() => setLogoSrc(Logo)} // fallback if custom URL breaks
        />
    );
};

export default LogoComponent;
