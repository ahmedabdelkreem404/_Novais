import React from 'react';

const Input = React.forwardRef(({
    label,
    error,
    className,
    icon: Icon,
    ...props
}, ref) => {
    const inputClassName = [
        'input',
        Icon ? 'input-with-icon' : '',
        className || ''
    ].filter(Boolean).join(' ');

    return (
        <div className="field">
            {label && (
                <label className="field-label">
                    {label}
                </label>
            )}
            <div className="field-control">
                {Icon && (
                    <div className="input-icon" aria-hidden="true">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    ref={ref}
                    className={inputClassName}
                    {...props}
                />
            </div>
            {error && (
                <p className="error-text">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
