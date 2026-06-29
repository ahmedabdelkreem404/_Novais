import React, { useState, useEffect } from 'react';
import { HiSun, HiMoon } from "react-icons/hi";


const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const storedTheme = localStorage.getItem('darkMode');
        // Default to true (Dark Mode) if theme is not set
        return storedTheme === null ? true : storedTheme === 'true';
    });

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('darkMode', newMode);

        // Dispatch custom event for other components to react without reload
        window.dispatchEvent(new Event('themeChange'));
    };

    useEffect(() => {
        // Apply initial state
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    const themeMode = localStorage.getItem('systemThemeMode') || 'user_choice';
    if (themeMode === 'light_only' || themeMode === 'dark_only') {
        return null; // Locked theme, hide switch
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
