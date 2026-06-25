import React from 'react';
import { motion } from 'framer-motion';

const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
};

const sizeClass = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    xl: 'btn-xl',
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading,
    icon: Icon,
    ...props
}) => {
    const classes = [
        'btn',
        variantClass[variant] || variantClass.primary,
        sizeClass[size] || sizeClass.md,
        isLoading || props.disabled ? 'btn-disabled' : '',
        className || ''
    ].filter(Boolean).join(' ');

    return (
        <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={classes}
            disabled={isLoading || props.disabled}
            {...props}>
            {isLoading ? (
                <svg className="btn-loader" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : Icon ? (
                <Icon size={18} />
            ) : null}
            {children && <span>{children}</span>}
        </motion.button>
    );
};

export default Button;
