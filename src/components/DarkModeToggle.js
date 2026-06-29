import React, { useState, useEffect } from 'react';
import { HiSun, HiMoon } from "react-icons/hi";


const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const storedTheme = localStorage.getItem('darkMode');
        return storedTheme === null ? true : storedTheme === 'true';
    });

    const [systemThemeMode, setSystemThemeMode] = useState(() => {
        return localStorage.getItem('systemThemeMode') || 'user_choice';
    });

    useEffect(() => {
        const handleThemeChange = () => {
            const currentMode = localStorage.getItem('systemThemeMode') || 'user_choice';
            setSystemThemeMode(currentMode);

            // Re-sync local isDarkMode state in case of forced overrides
            if (currentMode === 'light_only') {
                setIsDarkMode(false);
            } else if (currentMode === 'dark_only') {
                setIsDarkMode(true);
            } else {
                const storedTheme = localStorage.getItem('darkMode');
                setIsDarkMode(storedTheme === null ? true : storedTheme === 'true');
            }
        };

        window.addEventListener('themeChange', handleThemeChange);
        return () => window.removeEventListener('themeChange', handleThemeChange);
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('darkMode', newMode);
        window.dispatchEvent(new Event('themeChange'));
    };

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    if (systemThemeMode === 'light_only' || systemThemeMode === 'dark_only') {
        return null;
    }

    return (
        <button

            onClick={toggleDarkMode}
            aria-label="Toggle Dark Mode">
            {isDarkMode ? <HiMoon size={20} /> : <HiSun size={20} />}
        </button>
    );
};

export default DarkModeToggle;
