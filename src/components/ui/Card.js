import React from 'react';
import { motion } from 'framer-motion';
import { Tilt } from 'react-tilt';

const defaultTiltOptions = {
    reverse: false,
    max: 8,         // Reduced tilt for professional look
    perspective: 1000,
    scale: 1.01,
    speed: 1000,
    transition: true,
    axis: null,
    reset: true,
    easing: "cubic-bezier(.03,.98,.52,.99)",
};

const Card = ({
    children,
    className,
    hover = true,
    tilt = false,
    glass = false, // Deprecated/Unused but kept for prop compatibility
    ...props
}) => {
    const baseClasses = [
        'card',
        hover ? 'card-hover' : '',
        className || ''
    ].filter(Boolean).join(' ');

    const Content = (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className={baseClasses}
            {...props}>
            {children}
        </motion.div>
    );

    if (tilt) {
        return (
            <Tilt options={defaultTiltOptions}>
                {Content}
            </Tilt>
        );
    }

    return Content;
};

export default Card;
