import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchPexelsVideos } from '../utils/pexels';

gsap.registerPlugin(ScrollTrigger);

const SectionHero = () => {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const subTextRef = useRef(null);
    const videoRef = useRef(null);
    const [heroVideo, setHeroVideo] = useState(null);

    useEffect(() => {
        const loadVideo = async () => {
            const videos = await fetchPexelsVideos('London luxury architecture aerial', 1);
            if (videos.length > 0) {
                // Find a good quality mp4 link
                const hqVideo = videos[0].video_files.find(f => f.quality === 'hd' || f.quality === 'uhd') || videos[0].video_files[0];
                setHeroVideo(hqVideo.link);
            }
        };
        loadVideo();
    }, []);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "bottom top",
                    scrub: 1,
                }
            });

            const letters = textRef.current.querySelectorAll('.hero-char');

            tl.to(letters, {
                x: (i) => {
                    const mid = (letters.length - 1) / 2;
                    return (i - mid) * 40;
                },
                opacity: 0.2,
                scale: 1.2,
                ease: "power2.out",
            }, 0);

            // Parallax effect for video
            if (videoRef.current) {
                gsap.to(videoRef.current, {
                    y: 200,
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top top",
                        end: "bottom top",
                        scrub: true
                    }
                });
            }

            // Subtext fade
            gsap.to(subTextRef.current, {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "30% top",
                    scrub: true
                },
                opacity: 0,
                y: -30
            });

        }, containerRef);

        return () => ctx.revert();
    }, [heroVideo]);

    return (
        <section ref={containerRef} className="relative h-screen flex flex-col justify-center items-center bg-black overflow-hidden">
            {heroVideo && (
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-[120%] object-cover opacity-60 scale-110"
                        src={heroVideo}
                    ></video>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60"></div>
                </div>
            )}

            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-10"></div>

            <div ref={textRef} className="relative z-20 flex flex-col items-center w-full px-4 overflow-visible space-y-4 md:space-y-6">
                {["DAVIDSON", "&", "CO"].map((line, lineIndex) => (
                    <div key={lineIndex} className="flex justify-center flex-nowrap">
                        {line.split("").map((char, charIndex) => (
                            <span
                                key={`${lineIndex}-${charIndex}`}
                                className="hero-char text-[12vw] md:text-[15vw] font-serif font-black leading-[0.85] text-white/90 select-none tracking-tighter"
                            >
                                {char}
                            </span>
                        ))}
                    </div>
                ))}
            </div>

            <div className="absolute bottom-20 z-20 flex flex-col items-center gap-4">
                <p ref={subTextRef} className="text-xs md:text-sm tracking-[0.6em] uppercase text-white/70 font-medium">
                    Premier UK Property Specialists
                </p>
                <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent"></div>
            </div>
        </section>
    );
};

export default SectionHero;
