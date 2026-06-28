export const containsArabic = (text = '') => /[\u0600-\u06FF]/.test(String(text));

export const cleanNarrationText = (value = '') => {
    let text = String(value || '');

    text = text.replace(/!\[[^\]]*]\([^)]+\)/g, ' ');
    text = text.replace(/\[([^\]]+)]\([^)]+\)/g, '$1');
    text = text.replace(/```[\s\S]*?```/g, block => block.replace(/```[a-z]*|```/gi, ' '));
    text = text.replace(/`([^`]+)`/g, '$1');
    text = text.replace(/^\s{0,3}#{1,6}\s*/gm, '');
    text = text.replace(/[*_~>]+/g, '');
    text = text.replace(/^\s*[-+•]\s+/gm, '');
    text = text.replace(/\|/g, ' ');
    text = text.replace(/^\s*:?-{3,}:?\s*$/gm, '');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
};
