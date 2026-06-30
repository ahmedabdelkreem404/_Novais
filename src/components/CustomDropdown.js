import React, { useState, useRef, useEffect } from 'react';
import { LuChevronDown, LuSearch } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomDropdown({
    options, // Array of { value, label, subtitle, isPremium } or simple strings
    value,
    onChange,
    placeholder = 'Select option',
    searchPlaceholder = 'Search...',
    icon: Icon = null,
    showSearch = false,
    renderOption = null,
    className = '',
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);

    // Normalize options
    const normalizedOptions = options.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
            return {
                value: opt.value ?? '',
                label: opt.label ?? '',
                subtitle: opt.subtitle ?? '',
                isPremium: opt.isPremium ?? false,
                raw: opt
            };
        }
        return {
            value: String(opt),
            label: String(opt),
            subtitle: '',
            isPremium: false,
            raw: opt
        };
    });

    const selectedOption = normalizedOptions.find(opt => opt.value === value) || null;

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = normalizedOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`relative w-full ${className}`} ref={dropdownRef}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full bg-gray-50 dark:bg-[#151515] border ${isOpen ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'} rounded-xl p-3.5 md:p-4 text-sm font-medium flex items-center justify-between cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className="text-gray-700 dark:text-gray-200 flex items-center gap-2 max-w-[85%] truncate">
                    {Icon && <Icon className="text-blue-500 shrink-0" size={16} />}
                    {selectedOption ? (
                        renderOption ? renderOption(selectedOption) : selectedOption.label
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </span>
                <LuChevronDown className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl max-h-64 overflow-hidden flex flex-col"
                    >
                        {showSearch && (
                            <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                                <LuSearch className="text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none placeholder-gray-400"
                                />
                            </div>
                        )}
                        <div className="overflow-y-auto max-h-52 custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className={`p-3 text-sm font-medium cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                                            ${value === opt.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-300'}
                                        `}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span>{opt.label}</span>
                                            {opt.subtitle && (
                                                <span className="text-xs text-gray-400 font-normal">{opt.subtitle}</span>
                                            )}
                                        </div>
                                        {opt.isPremium && (
                                            <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full shrink-0">
                                                PREMIUM
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-sm text-gray-400 text-center italic">No results found</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
