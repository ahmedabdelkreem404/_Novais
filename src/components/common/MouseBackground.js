import React, { useEffect, useRef } from 'react';

const MouseBackground = () => {
    const canvasRef = useRef(null);
    const mouse = useRef({ x: -1000, y: -1000 }); // Start off-screen

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Configuration
        const isMobile = window.innerWidth < 768;
        const starCount = isMobile ? 40 : 250; // Reduced for mobile
        const connectionDistance = isMobile ? 80 : 120;
        const mouseDistance = 150;

        let stars = [];
        let meteors = [];

        // Colors
        // Dark Mode: Brighter Whites, Electric Blues, Neon Purples
        const darkColors = ['255, 255, 255', '96, 165, 250', '192, 132, 252'];

        // Light Mode: Deep Blues, Strong Purples, Dark Slate (Maximum Contrast)
        const lightColors = ['29, 78, 216', '107, 33, 168', '51, 65, 85'];

        const getColors = () => document.body.classList.contains('dark') ? darkColors : lightColors;
        const getMeteorColor = () => document.body.classList.contains('dark') ? '147, 197, 253' : '37, 99, 235';

        const init = () => {
            resize();
            createStars();
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createStars = () => {
            const currentColors = getColors();
            stars = [];
            for (let i = 0; i < starCount; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.2, // Very slow drift
                    vy: (Math.random() - 0.5) * 0.2,
                    size: Math.random() * 2, // Varied sizes
                    color: currentColors[Math.floor(Math.random() * currentColors.length)],
                    alpha: Math.random(),
                    twinkleSpeed: Math.random() * 0.02 + 0.005,
                    isDying: false
                });
            }
        };

        const createMeteor = () => {
            // Spawn meteor from top or right side
            const x = Math.random() * canvas.width;
            meteors.push({
                x: x,
                y: -50,
                length: Math.random() * 80 + 50,
                speed: Math.random() * 10 + 10,
                size: Math.random() * 2 + 1,
                angle: Math.PI / 4, // 45 degrees
                color: getMeteorColor()
            });
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw and Update Stars
            stars.forEach((star, i) => {
                star.x += star.vx;
                star.y += star.vy;

                // Twinkle effect
                star.alpha += star.twinkleSpeed;
                if (star.alpha > 1 || star.alpha < 0.2) {
                    star.twinkleSpeed = -star.twinkleSpeed;
                }

                // Bounce off edges (keep stars in view)
                if (star.x < 0 || star.x > canvas.width) star.vx *= -1;
                if (star.y < 0 || star.y > canvas.height) star.vy *= -1;

                // Draw Star
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${star.color}, ${Math.max(0, Math.min(1, star.alpha))})`;
                ctx.fill();

                // Mouse Connection
                const dxMouse = mouse.current.x - star.x;
                const dyMouse = mouse.current.y - star.y;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                if (distMouse < mouseDistance) {
                    ctx.beginPath();
                    ctx.moveTo(star.x, star.y);
                    ctx.lineTo(mouse.current.x, mouse.current.y);
                    ctx.strokeStyle = `rgba(${star.color}, ${(1 - distMouse / mouseDistance) * 0.5})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }

                // Constellations (Links)
                for (let j = i + 1; j < stars.length; j++) {
                    const star2 = stars[j];
                    const dx = star.x - star2.x;
                    const dy = star.y - star2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        ctx.beginPath();
                        ctx.moveTo(star.x, star.y);
                        ctx.lineTo(star2.x, star2.y);
                        ctx.strokeStyle = `rgba(${star.color}, ${(1 - dist / connectionDistance) * 0.15})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });

            // 2. Draw and Update Meteors
            // Spawn chance: higher chance on larger screens? Keep it rare and special.
            if (Math.random() < 0.005) { // 0.5% chance per frame
                createMeteor();
            }

            for (let i = meteors.length - 1; i >= 0; i--) {
                const meteor = meteors[i];

                // Move Meteor
                meteor.x -= meteor.speed * 0.7; // Move Left
                meteor.y += meteor.speed * 0.7; // Move Down

                // Draw Meteor Trail (Gradient)
                const endX = meteor.x + meteor.length * 0.7;
                const endY = meteor.y - meteor.length * 0.7;

                const grad = ctx.createLinearGradient(meteor.x, meteor.y, endX, endY);
                grad.addColorStop(0, `rgba(${meteor.color}, 1)`);
                grad.addColorStop(1, `rgba(${meteor.color}, 0)`);

                ctx.beginPath();
                ctx.moveTo(meteor.x, meteor.y);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = grad;
                ctx.lineWidth = meteor.size;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Draw Head
                ctx.beginPath();
                ctx.arc(meteor.x, meteor.y, meteor.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${meteor.color}, 1)`;
                ctx.fill();

                // Remove if out of bounds
                if (meteor.x < -100 || meteor.y > canvas.height + 100) {
                    meteors.splice(i, 1);
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const handleResize = () => {
            resize();
            createStars();
        };

        const handleThemeChange = () => {
            createStars(); // Re-generate stars with new colors
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);
        window.addEventListener('themeChange', handleThemeChange);

        init();
        draw();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('themeChange', handleThemeChange);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="mouse-bg"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none', // Allow clicks to pass through
                zIndex: -1, // Behind everything
                opacity: 0.6 // Subtle overall
            }}
        />
    );
};

export default MouseBackground;
