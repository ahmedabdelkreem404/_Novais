import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuX, LuMonitor, LuFileText, LuLoaderCircle } from 'react-icons/lu';
import { jsPDF } from "jspdf";
import { toast } from 'react-toastify';

const ExportModal = ({ isOpen, onClose, jsonData, mainTopic }) => {
    const [isGenerating, setIsGenerating] = useState(null); // 'ppt' | 'pdf' | null
    const [isLibLoaded, setIsLibLoaded] = useState(false);

    // Dynamic library injection to bypass Webpack bundling issues with node:https
    useEffect(() => {
        if (!isOpen) return;

        if (window.PptxGenJS) {
            setIsLibLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
        script.async = true;
        script.onload = () => setIsLibLoaded(true);
        script.onerror = () => toast.error("Failed to load PPT engine. Please check your connection.");
        document.body.appendChild(script);
    }, [isOpen]);

    const getAllContent = () => {
        if (!jsonData) return [];
        const possibleKeys = ['chapters', 'topics', 'content'];
        let content = [];
        for (const key of possibleKeys) {
            if (Array.isArray(jsonData[key])) {
                content = jsonData[key];
                break;
            }
        }
        if (content.length === 0 && mainTopic && Array.isArray(jsonData[mainTopic])) {
            content = jsonData[mainTopic];
        }
        return content;
    };

    const getBase64ImageFromURL = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.setAttribute('crossOrigin', 'anonymous');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            };
            img.onerror = (error) => reject(error);
            img.src = url;
        });
    };

    const handleExportPPT = async () => {
        if (!isLibLoaded || !window.PptxGenJS) {
            return toast.error("PPT engine is still loading. Please wait a moment.");
        }

        const topics = getAllContent();
        if (topics.length === 0) return toast.error("No content to export");

        setIsGenerating('ppt');
        try {
            const PptxGenJS = window.PptxGenJS;
            let pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_WIDE';

            // Title Slide
            let titleSlide = pptx.addSlide();
            titleSlide.background = { color: 'FFFFFF' };

            // Accent Bar
            titleSlide.addShape(pptx.ShapeType.rect, { x: 0, y: '85%', w: '100%', h: '15%', fill: { color: '1D4ED8' } });

            titleSlide.addText(mainTopic?.toUpperCase() || "NOVAIS", {
                x: 0, y: '35%', w: '100%', align: 'center', fontSize: 54, bold: true, color: '1D4ED8', fontFace: 'Arial'
            });
            titleSlide.addText("PROFESSIONAL LEARNING SERIES", {
                x: 0, y: '50%', w: '100%', align: 'center', fontSize: 14, color: '6B7280', charSpacing: 4, fontFace: 'Arial'
            });
            titleSlide.addText(`© ${new Date().getFullYear()} NOVAIS`, {
                x: 0, y: '90%', w: '100%', align: 'center', fontSize: 12, color: 'FFFFFF', fontFace: 'Arial'
            });

            // Content Slides
            for (const topic of topics) {
                const subtopics = topic.subtopics || topic.sections || [];
                for (const sub of subtopics) {
                    const rawText = (sub.theory || sub.content || "").replace(/[#*`]/g, '');
                    const imageUrl = sub.image_url || sub.image || sub.media;
                    const hasImage = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:'));

                    // Split text into chunks to prevent overflow (word-aware)
                    const chunkSize = hasImage ? 700 : 1200;
                    const words = rawText.split(' ');
                    const textChunks = [];
                    let currentChunk = "";

                    words.forEach(word => {
                        if ((currentChunk + word).length > chunkSize) {
                            textChunks.push(currentChunk);
                            currentChunk = word + " ";
                        } else {
                            currentChunk += word + " ";
                        }
                    });
                    if (currentChunk) textChunks.push(currentChunk);

                    if (textChunks.length === 0) textChunks.push(""); // Fallback for empty content

                    textChunks.forEach((chunk, index) => {
                        let slide = pptx.addSlide();

                        // Header Design
                        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.7, fill: { color: 'F1F5F9' } });
                        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0.65, w: '100%', h: 0.05, fill: { color: '1D4ED8' } });

                        const seqSuffix = textChunks.length > 1 ? ` (${index + 1}/${textChunks.length})` : '';
                        slide.addText(sub.title + seqSuffix, {
                            x: 0.5, y: 0.15, w: '90%', fontSize: 28, bold: true, color: '1E293B', fontFace: 'Arial'
                        });

                        if (hasImage && index === 0) {
                            // Two-Column Layout for images (only on the first chunk slide)
                            slide.addText(chunk, {
                                x: 0.5, y: 1.0, w: '55%', h: '70%', fontSize: 13, color: '334155', align: 'left', valign: 'top', fontFace: 'Arial', lineSpacing: 22
                            });
                            try {
                                slide.addImage({ path: imageUrl, x: '60%', y: 1.0, w: '35%', h: '70%', sizing: { type: 'contain' } });
                            } catch (imgErr) {
                                console.warn("Failed to add image to PPT slide", imgErr);
                            }
                        } else {
                            // Full-width layout
                            slide.addText(chunk, {
                                x: 0.5, y: 1.0, w: '90%', h: '75%', fontSize: 14, color: '334155', align: 'left', valign: 'top', fontFace: 'Arial', lineSpacing: 24
                            });
                        }

                        // Footer
                        slide.addText(`NOVAIS - ${mainTopic}`, { x: 0.5, y: 7.1, fontSize: 10, color: '94A3B8', fontFace: 'Arial' });
                        slide.addText(`${slide.slideNumber}`, { x: '92%', y: 7.1, w: 0.5, align: 'right', fontSize: 10, color: '94A3B8' });
                    });
                }
            }

            await pptx.writeFile({ fileName: `${(mainTopic || 'Course').replace(/\s+/g, '_')}.pptx` });
            toast.success("PowerPoint Exported!");
        } catch (error) {
            console.error(error);
            toast.error("PPT Export failed.");
        } finally {
            setIsGenerating(null);
            onClose();
        }
    };

    const handleExportPDF = async () => {
        const topics = getAllContent();
        if (topics.length === 0) return toast.error("No content found to export.");

        setIsGenerating('pdf');
        try {
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);

            // COVER PAGE
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            doc.setFillColor(29, 78, 216);
            doc.rect(0, pageHeight - 40, pageWidth, 40, 'F');

            doc.setFontSize(36);
            doc.setTextColor(29, 78, 216);
            doc.setFont("helvetica", "bold");
            doc.text(mainTopic?.toUpperCase() || "NOVAIS", pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });

            doc.setFontSize(16);
            doc.setTextColor(71, 85, 105);
            doc.setFont("helvetica", "normal");
            doc.text("Professional Course Material", pageWidth / 2, pageHeight / 2 + 8, { align: 'center' });

            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255);
            doc.text(`Generated by NOVAIS Engine • ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

            // CONTENT PAGES
            for (const topic of topics) {
                const subtopics = topic.subtopics || topic.sections || [];
                for (const sub of subtopics) {
                    doc.addPage();
                    let yPos = 25;

                    // Header on every page
                    doc.setFontSize(8);
                    doc.setTextColor(148, 163, 184);
                    doc.text(`NOVAIS | ${mainTopic}`, margin, 12);
                    doc.line(margin, 15, pageWidth - margin, 15);

                    // Title
                    doc.setFontSize(22);
                    doc.setTextColor(15, 23, 42);
                    doc.setFont("helvetica", "bold");
                    doc.text(sub.title, margin, yPos);

                    doc.setDrawColor(37, 99, 235);
                    doc.setLineWidth(1.5);
                    doc.line(margin, yPos + 3, margin + 25, yPos + 3);
                    yPos += 18;

                    const imageUrl = sub.image_url || sub.image || sub.media;
                    if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:'))) {
                        try {
                            const base64 = await getBase64ImageFromURL(imageUrl);
                            const imgWidth = 80;
                            const imgHeight = 60; // Approximate, jsPDF handles aspect ratio if needed
                            doc.addImage(base64, 'PNG', pageWidth - margin - imgWidth, yPos, imgWidth, imgHeight);

                            // Text alongside image (Left side)
                            doc.setFontSize(11);
                            doc.setTextColor(51, 65, 85);
                            doc.setFont("helvetica", "normal");
                            const rawText = (sub.theory || sub.content || "").replace(/[#*`]/g, '');
                            const lines = doc.splitTextToSize(rawText, contentWidth - imgWidth - 5);

                            lines.forEach(line => {
                                if (yPos > 270) {
                                    doc.addPage();
                                    yPos = 25;
                                    doc.setFontSize(8); doc.setTextColor(148, 163, 184);
                                    doc.text(`NOVAIS | ${mainTopic}`, margin, 12);
                                    doc.line(margin, 15, pageWidth - margin, 15);
                                }
                                doc.text(line, margin, yPos);
                                yPos += 7;
                            });
                            // Ensure yPos moves past the image if text was short
                            yPos = Math.max(yPos, 25 + 18 + imgHeight + 10);
                        } catch (imgErr) {
                            console.warn("Failed to add image to PDF", imgErr);
                        }
                    } else {
                        doc.setFontSize(11);
                        doc.setTextColor(51, 65, 85);
                        doc.setFont("helvetica", "normal");
                        const rawText = (sub.theory || sub.content || "").replace(/[#*`]/g, '');
                        const lines = doc.splitTextToSize(rawText, contentWidth);

                        lines.forEach(line => {
                            if (yPos > 275) {
                                doc.addPage();
                                yPos = 25;
                                doc.setFontSize(8); doc.setTextColor(148, 163, 184);
                                doc.text(`NOVAIS | ${mainTopic}`, margin, 12);
                                doc.line(margin, 15, pageWidth - margin, 15);
                            }
                            doc.text(line, margin, yPos);
                            yPos += 7;
                        });
                    }

                    // Footer page numbers
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(148, 163, 184);
                    doc.text(`Page ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
                }
            }

            doc.save(`${(mainTopic || 'Course').replace(/\s+/g, '_')}.pdf`);
            toast.success("Professional PDF Ready!");
        } catch (error) {
            console.error(error);
            toast.error("PDF Export failed.");
        } finally {
            setIsGenerating(null);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-[480px] bg-white rounded-[32px] shadow-2xl overflow-hidden p-10"
                    >
                        <button onClick={onClose} className="absolute top-8 right-8 p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <LuX size={24} />
                        </button>

                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 scale-110 shadow-sm border border-blue-100">
                                <LuMonitor size={32} />
                            </div>
                            <h2 className="text-[28px] font-black text-gray-900 tracking-tight mb-1">Export Pro</h2>
                            <p className="text-gray-400 text-sm font-medium tracking-wide uppercase italic opacity-80">High-Resolution Documents</p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleExportPPT}
                                disabled={isGenerating !== null || !isLibLoaded}
                                className="w-full flex items-center gap-6 p-6 bg-white border border-gray-100 rounded-[24px] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group disabled:opacity-50 text-left relative overflow-hidden active:scale-[0.98]"
                            >
                                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    {(isGenerating === 'ppt' || !isLibLoaded) ? <LuLoaderCircle size={28} className="animate-spin" /> : <LuMonitor size={28} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[17px] font-black text-slate-800 mb-0.5 uppercase tracking-wide group-hover:text-blue-700 transition-colors">
                                        PowerPoint (.pptx)
                                    </h3>
                                    <p className="text-sm text-slate-400 font-bold opacity-70">
                                        {!isLibLoaded ? "Loading engine..." : "Rich Slides + Image Support"}
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={handleExportPDF}
                                disabled={isGenerating !== null}
                                className="w-full flex items-center gap-6 p-6 bg-white border border-gray-100 rounded-[24px] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group disabled:opacity-50 text-left relative overflow-hidden active:scale-[0.98]"
                            >
                                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    {isGenerating === 'pdf' ? <LuLoaderCircle size={28} className="animate-spin" /> : <LuFileText size={28} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[17px] font-black text-slate-800 mb-0.5 uppercase tracking-wide group-hover:text-blue-700 transition-colors">
                                        Professional PDF (.pdf)
                                    </h3>
                                    <p className="text-sm text-slate-400 font-bold opacity-70">
                                        Portrait Layout + Branding
                                    </p>
                                </div>
                            </button>
                        </div>

                        <div className="mt-8 text-center border-t border-gray-50 pt-8">
                            <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em]">
                                NOVAIS Pro &bull; {mainTopic}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ExportModal;
