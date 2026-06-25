import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LuImageOff, LuCircleCheck, LuYoutube, LuX, LuMaximize2 } from 'react-icons/lu';

import { useTranslation } from 'react-i18next';

/**
 * MediaCard - Educational Media Display Component with Automatic Fallbacks
 * Automatically tries fallback images if primary fails
 */
const MediaCard = ({ media, type = 'image', selectedSubtopic }) => {
    const { t } = useTranslation();
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [hasFailedAll, setHasFailedAll] = React.useState(false);

    // Build image array with fallbacks
    const imageUrls = React.useMemo(() => {
        if (type !== 'image') return [];
        const urls = [media.url];
        if (media.fallbacks && Array.isArray(media.fallbacks)) {
            urls.push(...media.fallbacks.map(f => f.url));
        }
        return urls.filter(Boolean);
    }, [media, type]);

    const currentImageUrl = imageUrls[currentImageIndex];

    // Handle image load error - try next fallback
    const handleImageError = () => {
        if (currentImageIndex < imageUrls.length - 1) {
            console.log(`Image failed, trying fallback ${currentImageIndex + 1}`);
            setCurrentImageIndex(currentImageIndex + 1);
        } else {
            console.log('All image fallbacks exhausted');
            setHasFailedAll(true);
        }
    };

    // Prevent scrolling when image is expanded
    React.useEffect(() => {
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isExpanded]);

    if (type === 'image') {
        // Don't render if no valid images
        if (!currentImageUrl) {
            return null;
        }

        const lightbox = (
            <AnimatePresence>
                {isExpanded && (
                    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-6">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExpanded(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-zoom-out"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none"
                        >
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="absolute top-0 right-0 m-4 p-3 text-white bg-gray-900/90 hover:bg-gray-900 rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-110 pointer-events-auto ring-2 ring-white/20 hover:ring-white/40"
                            >
                                <LuX size={32} />
                            </button>

                            <div className="w-screen h-screen flex items-center justify-center pointer-events-auto p-2 md:p-8 bg-white dark:bg-gray-100">
                                <img
                                    src={currentImageUrl}
                                    alt="Expanded view"
                                    className="w-full h-full object-contain"
                                    onError={handleImageError}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );

        return (
            <>
                {/* Standard Card Display */}
                <motion.div
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="mb-8 rounded-[24px] overflow-hidden bg-white dark:bg-gray-900 shadow-lg ring-1 ring-gray-200 dark:ring-white/10 relative group"
                >
                    <div
                        className="relative cursor-zoom-in group/image min-h-[120px] flex items-center justify-center bg-gray-50 dark:bg-gray-800/50"
                        onClick={() => !hasFailedAll && setIsExpanded(true)}
                    >
                        {hasFailedAll ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-600">
                                    <LuImageOff size={32} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {t('media_card.restricted')}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Source: {media.source || 'Bing'}
                                    </p>
                                </div>
                                <a
                                    href={media.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <LuMaximize2 size={12} />
                                    {t('media_card.view_original')}
                                </a>
                            </div>
                        ) : (
                            <>
                                <img
                                    src={currentImageUrl}
                                    alt={media.title || selectedSubtopic}
                                    className="w-full h-auto block"
                                    onError={handleImageError}
                                />

                                {/* Hover Hint */}
                                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                                    <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1 transform translate-y-1 group-hover/image:translate-y-0 transition-all">
                                        <LuMaximize2 size={10} />
                                        <span>Zoom</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Static Metadata Section Below Image */}
                    <div className="py-1.5 px-3 bg-gray-50 dark:bg-[#151515] border-t border-gray-100 dark:border-white/5">
                        <div className="flex flex-col gap-0.5">
                            {/* Top Row: Title & Badges */}
                            <div className="flex items-center justify-between gap-2">
                                {media.title && (
                                    <p className="flex-1 font-medium text-[10px] text-gray-400 dark:text-gray-500 leading-tight line-clamp-1">
                                        {media.title}
                                    </p>
                                )}

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {media.verified && (
                                        <div className="flex items-center gap-1 px-1 py-0 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded text-[8px] font-bold border border-green-200/50 dark:border-green-500/20">
                                            <LuCircleCheck size={8} strokeWidth={3} />
                                            <span className="hidden md:inline uppercase tracking-tighter">VERIFIED</span>
                                        </div>
                                    )}
                                    {media.score && (
                                        <div className="hidden md:block px-1 py-0 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[8px] font-bold border border-blue-200/50 dark:border-blue-500/20">
                                            {Math.round(media.score * 100)}% MATCH
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bottom Row: Source - Hidden on Mobile */}
                            {media.source && (
                                <p className="hidden md:flex text-[9px] text-gray-400 dark:text-gray-500 font-medium capitalize items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                    Source: {media.source}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Lightbox / Zoom Modal Portaled to Body */}
                {typeof document !== 'undefined' && createPortal(lightbox, document.body)}
            </>
        );
    }

    if (type === 'video') {
        return (
            <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mb-14 rounded-[28px] overflow-hidden bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-gray-200 dark:ring-white/10"
            >
                {/* Video Player */}
                <div className="aspect-video bg-black relative">
                    <iframe
                        src={media.url.includes('youtube.com/watch?v=')
                            ? media.url.replace('watch?v=', 'embed/')
                            : (media.url.includes('youtu.be/')
                                ? media.url.replace('youtu.be/', 'youtube.com/embed/')
                                : media.url)}
                        className="w-full h-full"
                        title={media.title || "Educational Video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {/* Video Metadata Card */}
                <div className="p-5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            {media.title && (
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-2">
                                    {media.title}
                                </h4>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                {media.metadata?.channel && (
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {media.metadata.channel}
                                    </span>
                                )}

                                {media.metadata?.view_count && (
                                    <span className="text-gray-500 dark:text-gray-500">
                                        {parseInt(media.metadata.view_count).toLocaleString()} views
                                    </span>
                                )}

                                {media.metadata?.duration && (
                                    <span className="text-gray-500 dark:text-gray-500">
                                        {media.metadata.duration}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Verification Badges */}
                        <div className="flex flex-col gap-2 items-end">
                            {media.verified && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500 text-white rounded-md text-xs font-bold">
                                    <LuCircleCheck size={12} />
                                    <span>Verified</span>
                                </div>
                            )}

                            {media.score && (
                                <div className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-bold">
                                    {Math.round(media.score * 100)}% Match
                                </div>
                            )}

                            {media.platform === 'youtube' && (
                                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                    <LuYoutube size={16} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return null;
};

export default MediaCard;
