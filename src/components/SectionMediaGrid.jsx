import React, { useState, useEffect, useRef } from 'react';
import { fetchPexelsVideos } from '../utils/pexels';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SectionMediaGrid = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const sectionRef = useRef(null);

    useEffect(() => {
        const loadVideos = async () => {
            const data = await fetchPexelsVideos('luxury home tour UK', 4);
            setVideos(data);
            setLoading(false);
        };
        loadVideos();
    }, []);

    useEffect(() => {
        if (loading || videos.length === 0) return;

        const ctx = gsap.context(() => {
            gsap.from(".video-card", {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 80%",
                },
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power3.out"
            });
        }, sectionRef);

        return () => ctx.revert();
    }, [loading, videos]);

    if (loading) return null;

    return (
        <section ref={sectionRef} className="py-24 bg-white px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                    <h2 className="text-3xl md:text-5xl font-serif mb-4">Cinematic Experience</h2>
                    <p className="text-neutral-500 uppercase tracking-widest text-xs">A glimpse into the finest UK estates</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {videos.map((video, idx) => (
                        <div key={video.id} className="video-card group relative aspect-video overflow-hidden bg-neutral-100 cursor-pointer">
                            <video
                                src={video.video_files.find(f => f.quality === 'hd')?.link || video.video_files[0].link}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                muted
                                playsInline
                                onMouseEnter={(e) => e.target.play()}
                                onMouseLeave={(e) => {
                                    e.target.pause();
                                    e.target.currentTime = 0;
                                }}
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500"></div>
                            <div className="absolute bottom-6 left-6 text-white group-hover:bottom-8 transition-all duration-500">
                                <p className="text-[10px] uppercase tracking-[0.3em] opacity-80 mb-1">Estate {idx + 1}</p>
                                <h3 className="text-xl font-serif">View Film</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SectionMediaGrid;
