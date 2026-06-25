import React from 'react';

const TruncatedText = ({ text, len }) => {
    const words = text.split(' ');

    const isTruncated = words.length> len;

    const truncatedText = isTruncated ? words.slice(0, len).join(' ') + '...' : text;

    return (
        <span>
            {truncatedText}
        </span>
    );
};

export default TruncatedText;
