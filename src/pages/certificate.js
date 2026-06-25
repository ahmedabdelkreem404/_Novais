import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { name as appName, serverURL } from '../constants';
import AnimatedButton from '../components/common/AnimatedButton';
import { LuShare2, LuCircleCheck, LuArrowLeft, LuTrophy, LuImage, LuFileDown } from 'react-icons/lu';
import { FaAward } from 'react-icons/fa';
import { jsPDF } from 'jspdf';

const Certificate = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { courseId: urlCourseId } = useParams();
    const [localData, setLocalData] = useState(null);
    const [fetching, setFetching] = useState(false);
    const [translatedTitle, setTranslatedTitle] = useState("");

    const { courseTitle, quizResult } = state || localData || {};
    const courseId = urlCourseId || quizResult?.courseId || localStorage.getItem('courseId');

    useEffect(() => {
        if (!courseId) return;

        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            setFetching(true);
            try {
                const res = await axios.get(`${serverURL}/courses/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = res.data;

                // REDIRECT TO PUBLIC ID IF CURRENT URL USES NUMERIC ID
                if (data.public_id && data.public_id !== urlCourseId) {
                    navigate(`/course/${data.public_id}/certificate`, {
                        replace: true,
                        state: { ...state, courseId: data.public_id }
                    });
                    return;
                }

                let meta = data.metadata;
                if (typeof meta === 'string') {
                    try {
                        meta = JSON.parse(meta);
                    } catch (e) {
                        console.error("Failed to parse metadata", e);
                    }
                }

                if (meta.quizResult) {
                    setLocalData({
                        courseTitle: data.title,
                        quizResult: meta.quizResult
                    });
                }
            } catch (e) {
                console.error("Failed to fetch certificate data", e);
            } finally {
                setFetching(false);
            }
        };

        const sendCertificateEmail = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                await axios.post(`${serverURL}/courses/${courseId}/certificate`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (e) {
                console.error("Email trigger failed", e);
            }
        };

        fetchData();
        sendCertificateEmail();
    }, [courseId, urlCourseId, navigate, state]);

    // Separate Translation Effect (Always run if title exists)
    useEffect(() => {
        const titleToTranslate = courseTitle || quizResult?.courseTitle;
        if (!titleToTranslate) return;

        // Only translate if it contains non-English characters (Basic detection)
        const hasNonEnglish = /[^\x20-\x7E]/.test(titleToTranslate);
        if (!hasNonEnglish) {
            setTranslatedTitle(titleToTranslate);
            return;
        }

        const translate = async () => {
            const token = localStorage.getItem('token');
            try {
                const transRes = await axios.post(`${serverURL}/translate-title`, { title: titleToTranslate }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (transRes.data.translated) {
                    setTranslatedTitle(transRes.data.translated);
                }
            } catch (err) {
                console.error("Translation failed", err);
                setTranslatedTitle(titleToTranslate); // Fallback
            }
        };
        translate();
    }, [courseTitle, quizResult]);
    const userName = localStorage.getItem('mName') || "Student Name";
    const issuedDate = quizResult?.completedAt ? new Date(quizResult.completedAt).toLocaleDateString() : new Date().toLocaleDateString();


    const certificateRef = useRef(null);
    const [downloading, setDownloading] = useState(false);

    const handleDownloadImage = async () => {
        if (certificateRef.current === null) return;
        setDownloading(true);

        try {
            const dataUrl = await toPng(certificateRef.current, { cacheBust: true, pixelRatio: 3 });
            const link = document.createElement('a');
            link.download = `Certificate-${(courseTitle || 'Course').replace(/\s+/g, '-')}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Image Downloaded!");
        } catch (err) {
            console.error(err);
            toast.error("Image download failed.");
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (certificateRef.current === null) return;
        setDownloading(true);

        try {
            // Capture image first (high quality)
            const dataUrl = await toPng(certificateRef.current, { cacheBust: true, pixelRatio: 3 });

            // Calculate dimensions
            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => (img.onload = resolve));

            // Create PDF (A4 landscape is usually 297x210mm)
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Add image to PDF
            pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);
            pdf.save(`Certificate-${(courseTitle || 'Course').replace(/\s+/g, '-')}.pdf`);

            toast.success("PDF Downloaded!");
        } catch (err) {
            console.error(err);
            toast.error("PDF download failed.");
        } finally {
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        const shareTitle = `My Certificate for ${translatedTitle || courseTitle}`;
        const shareText = `I just earned my certificate in ${translatedTitle || courseTitle} on ${appName}! Check it out:`;
        const shareUrl = window.location.href;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl
                });
                toast.success("Shared successfully!");
            } else {
                await navigator.clipboard.writeText(shareUrl);
                toast.success("Link copied to clipboard! You can now share it.");
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error sharing:', err);
                toast.error("Sharing failed. Try copying the link manually.");
            }
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
                <motion.div
                    animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="text-primary-500 text-6xl mb-6"
                >
                    <LuTrophy />
                </motion.div>
                <h2 className="text-white text-xl font-bold">Verifying Academic Achievement...</h2>
            </div>
        );
    }

    if (!courseTitle && !quizResult) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#020617] text-white flex-col gap-4 p-6 text-center">
                <FaAward className="text-gray-700 text-8xl mb-4 opacity-20" />
                <h2 className="text-2xl font-bold">Credential Not Found</h2>
                <p className="text-gray-400 max-w-md">We couldn't locate your certificate. Please ensure you've passed the final exam with at least 60%.</p>
                <AnimatedButton onClick={() => navigate('/dashboard')}>Return to Dashboard</AnimatedButton>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-900/20 via-[#020617] to-[#020617] pointer-events-none" />

            <div className="z-10 w-full max-w-5xl flex flex-col items-center gap-8">

                {/* Header Actions */}
                <div className="w-full flex justify-between items-center text-white px-4">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 hover:text-primary-400 transition-colors font-medium">
                        <LuArrowLeft /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-3 py-1 rounded-full border border-green-500/30">
                        <LuCircleCheck /> Verified Credential
                    </div>
                </div>

                {/* THE CERTIFICATE (This part gets printed) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full aspect-[1.414/1] bg-[#F8FAFF] text-black shadow-2xl rounded-sm overflow-hidden"
                    ref={certificateRef}
                >
                    {/* Border Frame */}
                    <div className="absolute inset-[3%] border-[0.6vw] lg:border-[6px] border-double border-[#2563EB] pointer-events-none" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-20 mix-blend-multiply pointer-events-none" />

                    {/* Corner Ornaments */}
                    <div className="absolute top-[3%] left-[3%] w-[10%] lg:w-16 aspect-square border-t-[0.6vw] lg:border-t-[6px] border-l-[0.6vw] lg:border-l-[6px] border-[#2563EB]" />
                    <div className="absolute top-[3%] right-[3%] w-[10%] lg:w-16 aspect-square border-t-[0.6vw] lg:border-t-[6px] border-r-[0.6vw] lg:border-r-[6px] border-[#2563EB]" />
                    <div className="absolute bottom-[3%] left-[3%] w-[10%] lg:w-16 aspect-square border-b-[0.6vw] lg:border-b-[6px] border-l-[0.6vw] lg:border-l-[6px] border-[#2563EB]" />
                    <div className="absolute bottom-[3%] right-[3%] w-[10%] lg:w-16 aspect-square border-b-[0.6vw] lg:border-b-[6px] border-r-[0.6vw] lg:border-r-[6px] border-[#2563EB]" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-[8%] lg:p-16 gap-[2.5%] lg:gap-6">

                        {/* Logo / Header */}
                        <div className="flex flex-col items-center">
                            <h1 className="text-[4.5vw] lg:text-5xl font-serif text-[#1E40AF] tracking-widest uppercase leading-none">Certificate</h1>
                            <p className="text-[1.8vw] lg:text-xl font-serif text-[#3B82F6] tracking-[0.4em] uppercase opacity-70 leading-none mt-[0.5vw] lg:mt-2">Of Achievement</p>
                        </div>

                        <div className="w-[15%] lg:w-32 h-[0.1vw] lg:h-0.5 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent my-[0.5vw] lg:my-2" />

                        <p className="font-serif italic text-gray-500 text-[1.6vw] lg:text-lg mb-[-0.5vw]">This certifies that</p>

                        <h2 className="text-[5.5vw] lg:text-6xl font-serif font-bold text-gray-900 leading-none">{userName}</h2>

                        <p className="font-serif italic text-gray-500 text-[1.6vw] lg:text-lg mb-[-0.5vw]">Has successfully demonstrated mastery in</p>

                        <h3 className="text-[3vw] lg:text-3xl font-serif font-bold text-[#1a1a1a] max-w-[85%] lg:max-w-3xl leading-tight">
                            {translatedTitle || courseTitle || quizResult?.courseTitle}
                        </h3>

                        <div className="mt-[0.5vw]">
                            <p className="font-serif text-[2.2vw] lg:text-2xl text-gray-900 font-bold">
                                {quizResult?.grade || "Passed"} ({quizResult?.score || 0}%)
                            </p>
                        </div>

                        {/* Signatures/Footer */}
                        <div className="flex items-end justify-between w-full max-w-[85%] lg:max-w-2xl mt-auto pb-[2%] lg:pb-0">
                            <div className="flex flex-col items-center">
                                <span className="font-bold font-serif text-[1.6vw] lg:text-lg leading-none mb-[0.2vw] lg:mb-1">{issuedDate}</span>
                                <div className="w-[12vw] lg:w-40 h-[0.05vw] lg:h-px bg-gray-400"></div>
                                <span className="text-[1vw] lg:text-xs uppercase tracking-widest text-gray-500 mt-[0.5vw] lg:mt-2">Date Issued</span>
                            </div>

                            {/* Blue Seal */}
                            <div className="relative w-[11vw] lg:w-32 h-[11vw] lg:h-32 flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1E40AF] rounded-full shadow-lg p-[3%] lg:p-1">
                                    <div className="w-full h-full border-[0.2vw] lg:border-2 border-[#fff] border-dashed rounded-full bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center">
                                        <FaAward className="text-white text-[4.5vw] lg:text-5xl drop-shadow-md" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <span className="font-bold font-serif text-[1.6vw] lg:text-lg font-signature leading-none mb-[0.2vw] lg:mb-1">{appName} AI</span>
                                <div className="w-[12vw] lg:w-40 h-[0.05vw] lg:h-px bg-gray-400"></div>
                                <span className="text-[1vw] lg:text-xs uppercase tracking-widest text-gray-500 mt-[0.5vw] lg:mt-2">Verified By</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Actions */}
                <div className="flex flex-wrap justify-center gap-4">
                    <AnimatedButton
                        size="lg"
                        variant="gradient"
                        onClick={handleDownloadPDF}
                        isLoading={downloading}
                        className="shadow-glow-primary hover:scale-105 min-w-[200px]"
                    >
                        <LuFileDown className="mr-2" /> Download PDF
                    </AnimatedButton>
                    <AnimatedButton
                        size="lg"
                        variant="gradient"
                        onClick={handleDownloadImage}
                        isLoading={downloading}
                        className="shadow-glow-primary hover:scale-105 min-w-[200px] !from-emerald-600 !to-teal-600"
                    >
                        <LuImage className="mr-2" /> Download Image
                    </AnimatedButton>
                    <AnimatedButton
                        size="lg"
                        variant="secondary"
                        onClick={handleShare}
                        className="min-w-[140px]"
                    >
                        <LuShare2 className="mr-2" /> Share
                    </AnimatedButton>
                </div>

            </div>
        </div>
    );
};

export default Certificate;
