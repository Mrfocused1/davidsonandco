import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchPexelsImages } from '../utils/pexels';

gsap.registerPlugin(ScrollTrigger);

const SectionPortfolio = () => {
    const sectionRef = useRef(null);
    const containerRef = useRef(null);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState({});

    useEffect(() => {
        const loadProperties = async () => {
            const photos = await fetchPexelsImages('UK luxury architecture real estate', 6);
            if (photos.length > 0) {
                const formattedProperties = photos.map((photo, index) => ({
                    loc: photo.alt || `Exclusive Property ${index + 1}`,
                    type: "Premium Collection",
                    img: photo.src.large || photo.src.medium, // Use smaller images for faster loading
                    placeholder: photo.src.small, // Add low-res placeholder
                    id: photo.id
                }));
                setProperties(formattedProperties);
            }
            setLoading(false);
        };
        loadProperties();
    }, []);

    useLayoutEffect(() => {
        if (loading || properties.length === 0) return;

        const ctx = gsap.context(() => {
            const panels = gsap.utils.toArray(".portfolio-panel");

            const updateScroll = () => {
                if (!containerRef.current) return;
                const totalScrollWidth = containerRef.current.scrollWidth;
                const amountToScroll = totalScrollWidth - window.innerWidth;

                gsap.to(containerRef.current, {
                    x: -amountToScroll,
                    ease: "none",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        pin: true,
                        scrub: 1,
                        snap: {
                            snapTo: 1 / (panels.length - 1),
                            duration: { min: 0.2, max: 0.3 },
                            delay: 0
                        },
                        end: () => "+=" + amountToScroll,
                        invalidateOnRefresh: true,
                        anticipatePin: 1
                    }
                });
            };

            // Small delay to ensure DOM is ready after React render
            const timer = setTimeout(() => {
                updateScroll();
                window.addEventListener('resize', updateScroll);
            }, 100);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', updateScroll);
            };
        }, sectionRef);

        return () => ctx.revert();
    }, [loading, properties]);

    if (loading) {
        return (
            <section className="h-screen bg-neutral-900 flex items-center justify-center text-white">
                <div className="text-xl font-serif animate-pulse tracking-widest uppercase">Curating Collection...</div>
            </section>
        );
    }

    return (
        <section ref={sectionRef} className="relative h-screen bg-neutral-900 overflow-hidden text-white">
            <div className="absolute top-12 left-12 z-20">
                <h3 className="text-xs font-bold tracking-widest uppercase text-[#C5A059]">Pexels Showcase - UK Property</h3>
            </div>

            <div ref={containerRef} className="h-full flex will-change-transform" style={{ width: `${properties.length * 100}vw` }}>
                {properties.map((prop, i) => (
                    <div key={i} className="portfolio-panel w-screen h-full flex flex-col md:flex-row relative">
                        <div className="w-full md:w-3/4 h-full overflow-hidden relative group">
                            <img
                                src={prop.img}
                                className={`w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 ${
                                    imagesLoaded[i] ? 'opacity-100' : 'opacity-0'
                                }`}
                                alt={prop.loc}
                                loading="lazy"
                                onLoad={() => setImagesLoaded(prev => ({ ...prev, [i]: true }))}
                                style={{
                                    transition: 'opacity 0.5s ease-in-out',
                                    background: prop.placeholder ? `url(${prop.placeholder})` : '#1c1c1c',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500"></div>
                        </div>
                        <div className="w-full md:w-1/4 h-32 md:h-full bg-neutral-900 border-l border-neutral-800 flex flex-col justify-center px-12 md:px-16 z-10">
                            <span className="text-[#C5A059] font-serif text-4xl md:text-6xl absolute top-12 md:static opacity-20 -translate-x-4">0{i + 1}</span>
                            <h4 className="text-2xl md:text-3xl font-serif mt-4 line-clamp-2 uppercase tracking-tight leading-tight">{prop.loc}</h4>
                            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mt-4">{prop.type}</p>
                            <button className="mt-8 flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase hover:text-[#C5A059] transition-colors group">
                                Explore Detail <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default SectionPortfolio;
