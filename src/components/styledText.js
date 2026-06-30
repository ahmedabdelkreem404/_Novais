import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LuCopy, LuCheck } from 'react-icons/lu';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Create a strict Light Mode theme derived mechanically from vscDarkPlus
// This ensures that font weights, styles (italics etc), and layout metrics are IDENTICAL.
// We only swap the HEX colors.
const customDark = { ...vscDarkPlus };
const customLight = JSON.parse(JSON.stringify(customDark)); // Deep clone to start

// 1. Force formatting standardization (No italics, strict font sizes) for BOTH
[customDark, customLight].forEach(theme => {
    Object.keys(theme).forEach(key => {
        // Enforce normal font style universally to prevent Arabic alignment shifts
        if (theme[key].fontStyle === 'italic') {
            theme[key].fontStyle = 'normal';
        }
        // Enforce inherited font size
        theme[key].fontSize = 'inherit';
    });
});

// 2. Map Dark colors to Light colors for the Custom Light Theme
// These mappings approximate standard VS Code Light while keeping the exact Dark Mode token structure
const colorMap = {
    '#d4d4d4': '#1f2937', // Main text: Light Gray -> Dark Gray (almost black)
    '#9cdcfe': '#1f2937', // Variable/Prop: Light Blue -> Dark Gray
    '#569cd6': '#0000ff', // Keyword: Blue -> Standard Blue
    '#4ec9b0': '#267f99', // Class/Type: Teal -> Dark Teal
    '#ce9178': '#a31515', // String: Orange -> Dark Red
    '#b5cea8': '#098658', // Number: Light Green -> Dark Green
    '#6a9955': '#008000', // Comment: Green -> Strong Green
    '#dcdcaa': '#795e26', // Function: Yellow -> Brownish Gold
    '#c586c0': '#af00db', // Control Flow: Purple -> Dark Purple
    '#646695': '#0000ff', // Attributes
};

Object.keys(customLight).forEach(key => {
    const style = customLight[key];
    if (style.color) {
        // Exact match replacement
        if (colorMap[style.color]) {
            style.color = colorMap[style.color];
        }
        // Fallback for close matches (simplified)
        else if (style.color.toLowerCase() === '#d4d4d4') style.color = '#1f2937';
    }
});

// Explicit overrides to ensure clean look
customLight['comment'] = { ...customLight['comment'], color: '#008000', fontStyle: 'normal', fontWeight: '500' }; // Ensure comments are solid
customDark['comment'] = { ...customDark['comment'], fontStyle: 'normal' };

const CodeBlock = ({ inline, className, children, ...props }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : 'text';

    // Helper to safely extract text from potential React children structures
    const extractText = (node) => {
        if (!node) return '';
        if (typeof node === 'string' || typeof node === 'number') return String(node);
        if (Array.isArray(node)) return node.map(extractText).join('');
        if (node.props && node.props.children) return extractText(node.props.children);
        return '';
    };

    const textContent = extractText(children).replace(/\n$/, '');

    // Aggressive Compact Mode:
    // 1. Removes empty lines.
    // 2. Merges ALL standalone comments into the code line to ensure 1-to-1 mapping with explanation steps.
    const processedCode = React.useMemo(() => {
        const cLike = ['cpp', 'c', 'c++', 'java', 'js', 'javascript', 'ts', 'typescript', 'cs', 'csharp'];
        if (!cLike.includes(lang?.toLowerCase())) return textContent;

        const lines = textContent.split('\n');
        const merged = [];
        let pendingComments = [];

        lines.forEach(line => {
            const trimmed = line.trim();

            // Skip empty lines completely
            if (!trimmed) return;

            if (trimmed.startsWith('//')) {
                // Buffer comments to attach to the next code line
                pendingComments.push(trimmed);
            } else {
                // It's a code line: Attach any buffered comments to the END of this line
                if (pendingComments.length > 0) {
                    merged.push(`${line.trimEnd()}   ${pendingComments.join('  ')}`);
                    pendingComments = [];
                } else {
                    merged.push(line);
                }
            }
        });

        // If there are trailing comments left at the end of the file, append them
        if (pendingComments.length > 0) {
            merged.push(...pendingComments);
        }

        return merged.join('\n');
    }, [textContent, lang]);

    const isSingleLine = processedCode.split('\n').length === 1;

    const handleCopy = () => {
        navigator.clipboard.writeText(textContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Handle Mermaid UML rendering dynamically via CDN (AFTER all React hooks run)
    if (lang === 'mermaid') {
        try {
            const base64 = btoa(unescape(encodeURIComponent(textContent)));
            return (
                <div className="my-8 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-3xl transition-all hover:shadow-lg">
                    <img 
                        src={`https://mermaid.ink/img/${base64}`} 
                        alt="UML/Mermaid Diagram" 
                        className="max-w-full h-auto object-contain select-none"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.nextElementSibling;
                            if (fallback) fallback.textContent = 'Diagram syntax error / network offline';
                        }}
                    />
                    <span className="mt-3 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        مخطط هيكلي / UML Architecture Diagram
                    </span>
                </div>
            );
        } catch (err) {
            console.error("Failed to encode mermaid diagram", err);
        }
    }

    if (inline) {
        return (
            <code className="bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg text-sm font-mono text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 font-bold mx-0.5" {...props}>
                {children}
            </code>
        );
    }

    // Common style props to ensure EXACT shared layout
    const commonCustomStyle = {
        margin: 0,
        padding: isSingleLine ? '0.6rem 0.8rem' : '1.5rem',
        background: 'transparent',
        fontSize: isSingleLine ? '13px' : '14px',
        lineHeight: '1.5', // Strict parity
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontWeight: isSingleLine ? '600' : 'normal',
    };

    // Simplified render for single-line
    if (isSingleLine) {
        return (
            <div className="my-2 inline-block align-middle max-w-full relative border-b-2 border-transparent hover:border-indigo-500 dark:hover:border-indigo-400 bg-transparent transition-colors duration-300">
                <div className="overflow-x-auto relative px-0 scrollbar-hide" dir="ltr">
                    <SyntaxHighlighter
                        language={lang}
                        style={isDark ? customDark : customLight}
                        showLineNumbers={false}
                        customStyle={{
                            ...commonCustomStyle,
                            padding: '0.2rem 0.2rem',   // Minimal padding
                            fontSize: '16px',           // Bigger text
                            fontWeight: '700',          // Bold
                            direction: 'ltr',
                            textAlign: 'left',
                            background: 'transparent'
                        }}
                        wrapLines={false}
                        wrapLongLines={false}
                    >
                        {processedCode}
                    </SyntaxHighlighter>
                </div>
            </div>
        );
    }

    return (
        <div className="my-8 rounded-xl overflow-hidden bg-white dark:bg-[#1e1e1e] shadow-[0_0_30px_rgba(59,130,246,0.3)] dark:shadow-[0_0_30px_rgba(59,130,246,0.2)] border border-gray-200 dark:border-white/5 group transition-all duration-300 hover:shadow-[0_0_45px_rgba(59,130,246,0.5)]">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#252526] border-b border-gray-200 dark:border-white/5 transition-colors duration-300">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm hover:brightness-110 transition-all" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm hover:brightness-110 transition-all" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm hover:brightness-110 transition-all" />
                </div>

                {lang && (
                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono absolute left-1/2 transform -translate-x-1/2">
                        {lang}
                    </span>
                )}

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                    title="Copy code"
                >
                    {isCopied ? <LuCheck size={14} className="text-green-500" /> : <LuCopy size={14} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                        {isCopied ? 'Copied!' : 'Copy'}
                    </span>
                </button>
            </div>

            <div className="overflow-x-auto relative group/code bg-white dark:bg-[#1e1e1e]" dir="ltr">
                <style>{`
                    .token.comment {
                       font-family: inherit !important;
                       font-style: normal !important;
                    }
                `}</style>
                <SyntaxHighlighter
                    language={lang}
                    style={isDark ? customDark : customLight}
                    showLineNumbers={true}
                    lineNumberStyle={{
                        minWidth: '2.5em',
                        paddingRight: '1em',
                        color: isDark ? '#4b5563' : '#9ca3af',
                        textAlign: 'right',
                        userSelect: 'none'
                    }}
                    customStyle={commonCustomStyle}
                    wrapLines={true}
                    wrapLongLines={false}
                    lineProps={(lineNumber) => ({
                        style: { display: 'block', width: 'fit-content' }
                    })}
                >
                    {processedCode}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

const StyledText = ({ text, isRtl, variant = 'default', isAcademic = false }) => {
    const isQuiz = variant === 'quiz';
    // Robust auto-detection for Arabic content
    const isArabicContent = React.useMemo(() => {
        if (isRtl) return true;
        if (!text) return false;
        const arabicPattern = /[\u0600-\u06FF]/;
        return arabicPattern.test(text.slice(0, 100)); // Check header/intro
    }, [text, isRtl]);

    const direction = isArabicContent ? 'rtl' : 'ltr';

    // Helper to process text nodes for BiDi isolation (Preserved)
    const processBiDiText = (node) => {
        if (typeof node === 'string') {
            // Enhanced regex to capture entire LTR phrases including spaces between words
            // Matches: [Word] + optional ( [Space] + [Word] ) repeated
            const parts = node.split(/([A-Za-z0-9._\-+#]+(?:\s+[A-Za-z0-9._\-+#]+)*)/g);
            return parts.map((part, i) => {
                // If the phrase starts with a Latin char/number/symbol, force LTR isolation
                if (/^[A-Za-z0-9._\-+#]/.test(part)) {
                    return <span key={i} dir="ltr">{part}</span>;
                }
                return part;
            });
        }
        if (Array.isArray(node)) {
            return node.map((child, i) => <React.Fragment key={i}>{processBiDiText(child)}</React.Fragment>);
        }
        if (React.isValidElement(node)) {
            return React.cloneElement(node, {
                children: processBiDiText(node.props.children)
            });
        }
        return node;
    };

    const BiDi = ({ children }) => <>{processBiDiText(children)}</>;

    return (
        <div className={`markdown-content w-full max-w-none ${direction}`} dir={direction}>
            <style>{`
                /* Print-like selection style */
                .markdown-content ::selection { background: rgba(59, 130, 246, 0.2); }
                .dark .markdown-content ::selection { background: rgba(60, 100, 200, 0.3); }

                /* Smooth header anchor scrolling offset if needed */
                html { scroll-padding-top: 100px; }

                /* Hide custom bullets inside ordered lists to avoid double markers */
                .markdown-content ol li .custom-bullet { display: none !important; }
            `}</style>

            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // --- TYPOGRAPHY & LAYOUT SYSTEM ---

                    // H1: Article Title Style
                    h1: ({ node, children, ...props }) => (
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-16 mb-10 leading-[1.2] tracking-tight border-b border-gray-100 dark:border-white/5 pb-6 first:mt-0" dir={isArabicContent ? 'rtl' : 'ltr'} {...props}>
                            <BiDi>{children}</BiDi>
                        </h1>
                    ),

                    // H2: Section Headers
                    h2: ({ node, children, ...props }) => (
                        <h2 className="group text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-12 mb-6 flex flex-wrap items-baseline gap-3 leading-snug" dir={isArabicContent ? 'rtl' : 'ltr'} {...props}>
                            {!isAcademic && <span className="inline-block w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 opacity-80 transform translate-y-[-4px] shrink-0" />}
                            <BiDi>{children}</BiDi>
                        </h2>
                    ),

                    // H3: Subsections
                    h3: ({ node, children, ...props }) => (
                        <h3 className={`${isQuiz ? 'text-2xl md:text-3xl mb-6' : 'text-xl md:text-2xl mt-10 mb-4'} font-bold text-slate-800 dark:text-slate-200 leading-snug`} dir={isArabicContent ? 'rtl' : 'ltr'} {...props}>
                            <BiDi>{children}</BiDi>
                        </h3>
                    ),

                    // Body Text: Optimized for Long-form Reading
                    p: ({ node, children, ...props }) => (
                        <div className={isAcademic 
                            ? "text-[16px] md:text-[17px] leading-relaxed text-slate-800 dark:text-slate-200 mb-6 font-normal tracking-wide text-justify font-serif"
                            : `${isQuiz ? 'text-[20px] md:text-[24px] mb-6' : 'text-[18px] md:text-[20px] mb-8'} leading-[1.6] text-slate-700 dark:text-slate-300 font-bold tracking-normal`
                        } dir={isArabicContent ? 'rtl' : 'ltr'} {...props}>
                            <BiDi>{children}</BiDi>
                        </div>
                    ),

                    // Lists: Clean Indentation & Markers
                    ul: ({ node, children, ...props }) => (
                        <ul dir={isArabicContent ? 'rtl' : 'ltr'} className={`my-8 space-y-4 ${isArabicContent ? 'pr-8 md:pr-12 text-right' : 'pl-8 md:pl-12 text-left'}`} {...props}>{children}</ul>
                    ),
                    ol: ({ node, children, ...props }) => (
                        <ol dir={isArabicContent ? 'rtl' : 'ltr'} className={`my-8 space-y-4 ${isArabicContent ? 'pr-8 md:pr-12 text-right' : 'pl-8 md:pl-12 text-left'} list-decimal marker:text-slate-500 dark:marker:text-slate-500 marker:font-medium`} {...props}>{children}</ol>
                    ),
                    li: ({ node, children, ...props }) => (
                        <li className={isAcademic
                            ? `text-[16px] md:text-[17px] leading-relaxed text-slate-700 dark:text-slate-300 relative ${isArabicContent ? 'pr-6 text-right list-disc' : 'pl-6 text-left list-disc'} font-normal mb-2`
                            : `text-[18px] md:text-[20px] leading-[1.8] text-slate-700 dark:text-slate-300 relative ${isArabicContent ? 'pr-2 text-right' : 'pl-2 text-left'}`
                        } dir={isArabicContent ? 'rtl' : 'ltr'} {...props}>
                            {/* Custom Bullet for Unordered Lists - Hidden via CSS for Ordered Lists */}
                            {!isAcademic && <span className={`custom-bullet absolute top-[0.65em] w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full ${isArabicContent ? '-right-5' : '-left-5'}`} />}
                            <BiDi>{children}</BiDi>
                        </li>
                    ),

                    // Blockquotes: "Note" Callouts (Calm Blue Theme)
                    blockquote: ({ node, children, ...props }) => (
                        <div className={`my-10 rounded-2xl bg-slate-50 dark:bg-[#18181b] border border-slate-100 dark:border-white/5 overflow-hidden flex ${isArabicContent ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className="w-1.5 bg-blue-500 dark:bg-blue-600" />
                            <blockquote className="flex-1 p-6 md:p-8 italic text-[19px] md:text-[21px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed" dir="auto" {...props}>
                                {children}
                            </blockquote>
                        </div>
                    ),

                    // Images: Semantic Figures
                    img: ({ node, alt, ...props }) => (
                        <figure className="my-12 flex flex-col items-center">
                            <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 shadow-lg max-w-full">
                                <img
                                    className="max-w-full h-auto object-cover hover:scale-[1.01] transition-transform duration-500"
                                    loading="lazy"
                                    alt={alt || "Lesson visual"}
                                    {...props}
                                />
                            </div>
                            {alt && <figcaption className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-center tracking-wide">{alt}</figcaption>}
                        </figure>
                    ),

                    // Horizontal Rule: Subtle Divider
                    hr: () => <hr className="my-16 border-t border-gray-100 dark:border-white/5 w-1/2 mx-auto" />,

                    // Code formatting
                    code: CodeBlock,
                    pre: ({ node, ...props }) => <div className={`not-prose ${isQuiz ? 'my-6' : 'my-10'}`} {...props} />,
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
};

export default StyledText;
