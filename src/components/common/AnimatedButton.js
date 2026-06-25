import React from 'react';
import { motion } from 'framer-motion';
import { LuLoader } from 'react-icons/lu';
import { twMerge } from 'tailwind-merge';

const AnimatedButton = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    icon: Icon,
    iconPosition = 'left', // 'left' | 'right'
    ...props
}) => {

    // Base styles
    const baseStyles = "relative inline-flex items-center justify-center font-bold tracking-wide rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";

    // Size variants
    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base",
        xl: "px-10 py-5 text-lg"
    };

    // Style variants
    const variants = {
        primary: "bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5",
        secondary: "bg-white/10 border border-white/10 text-white hover:bg-white/20 hover:border-white/20",
        ghost: "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10",
        gradient: "bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5"
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={twMerge(baseStyles, sizes[size], variants[variant], className)}
            {...props}
        >
            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-inherit">
                    <LuLoader className="animate-spin" />
                </div>
            )}

            {/* Content */}
            <div className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 16 : 20} />}
                {children}
                {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 16 : 20} />}
            </div>

            {/* Shine Effect for Gradient Buttons */}
            {variant === 'gradient' && (
                <div className="absolute inset-0 -translate-x-[120%] animate-[shine_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
            )}
        </motion.button>
    );
};

export default AnimatedButton;
