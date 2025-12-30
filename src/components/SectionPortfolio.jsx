import React, { useRef, useLayoutEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SectionPortfolio = () => {
    const sectionRef = useRef(null);
    const containerRef = useRef(null);

    const properties = [
        { loc: "Mayfair, London", type: "Penthouse Collection", img: "https://images.unsplash.com/photo-1600596542815-3ad19eb6a262?q=80&w=2675&auto=format&fit=crop" },
        { loc: "Cap Ferrat, France", type: "Coastal Estate", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop" },
        { loc: "Kyoto, Japan", type: "Modern Sanctuary", img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2574&auto=format&fit=crop" },
        { loc: "Aspen, USA", type: "Mountain Retreat", img: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=2565&auto=format&fit=crop" },
    ];

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const panels = gsap.utils.toArray(".portfolio-panel");

            const updateScroll = () => {
                const totalScrollWidth = containerRef.current.scrollWidth;
                const amountToScroll = totalScrollWidth - window.innerWidth;

                gsap.to(containerRef.current, {
                    x: -amountToScroll,
                    ease: "none",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        pin: true,
                        scrub: 1,
                        // Snap to each panel
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

            // Ensure images are loaded or dimensions are set before calculating scroll
            window.addEventListener('load', updateScroll);
            updateScroll(); // Initial call

            return () => window.removeEventListener('load', updateScroll);
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="relative h-screen bg-neutral-900 overflow-hidden text-white">
            <div className="absolute top-12 left-12 z-20">
                <h3 className="text-xs font-bold tracking-widest uppercase text-[#C5A059]">Selected Works</h3>
            </div>

            <div ref={containerRef} className="h-full w-[400vw] flex will-change-transform">
                {properties.map((prop, i) => (
                    <div key={i} className="portfolio-panel w-screen h-full flex flex-col md:flex-row relative">
                        <div className="w-full md:w-3/4 h-full overflow-hidden relative group">
                            <img
                                src={prop.img}
                                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                                alt={prop.loc}
                            />
                            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500"></div>
                        </div>
                        <div className="w-full md:w-1/4 h-32 md:h-full bg-neutral-900 border-l border-neutral-800 flex flex-col justify-center px-12 md:px-16 z-10">
                            <span className="text-[#C5A059] font-serif text-4xl md:text-6xl absolute top-12 md:static opacity-20 -translate-x-4">0{i + 1}</span>
                            <h4 className="text-3xl md:text-4xl font-serif mt-4">{prop.loc}</h4>
                            <p className="text-sm uppercase tracking-widest text-neutral-500 mt-2">{prop.type}</p>
                            <button className="mt-8 flex items-center gap-2 text-xs tracking-widest uppercase hover:text-[#C5A059] transition-colors group">
                                View Property <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default SectionPortfolio;
