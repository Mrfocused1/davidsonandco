import React, { useRef, useLayoutEffect } from 'react';
import { Shield, Globe, Key } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SectionPrivateOffice = () => {
    const containerRef = useRef(null);
    const dotRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Background shift
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: "top 80%",
                end: "bottom 20%",
                onEnter: () => gsap.to(containerRef.current, { backgroundColor: "#0f172a", duration: 1 }),
                onEnterBack: () => gsap.to(containerRef.current, { backgroundColor: "#0f172a", duration: 1 }),
                // Removed onLeave and onLeaveBack white transitions to maintain dark theme throughout
            });

            // Indicator Dot Animation
            gsap.to(dotRef.current, {
                top: "95%",
                ease: "none",
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: true,
                }
            });

            // Items Scroll Animation
            const items = containerRef.current.querySelectorAll('.po-item');
            items.forEach((item) => {
                gsap.fromTo(item,
                    { opacity: 0, y: 50 },
                    {
                        opacity: 1,
                        y: 0,
                        scrollTrigger: {
                            trigger: item,
                            start: "top 85%",
                            end: "top 60%",
                            scrub: 1
                        }
                    }
                );
            });

        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} id="private-office" className="relative min-h-[250vh] text-slate-200 py-32 overflow-hidden bg-[#0f172a] z-10">
            {/* Decorative Line (Simulated Path) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-800 -translate-x-1/2"></div>
            <div ref={dotRef} className="absolute left-1/2 top-[5%] w-3 h-3 bg-[#C5A059] rounded-full -translate-x-1/2 shadow-[0_0_15px_#C5A059] z-20"></div>

            <div className="max-w-5xl mx-auto px-6 relative z-10">
                <div className="text-center mb-64 mt-32">
                    <span className="text-[#C5A059] text-xs tracking-[0.4em] uppercase">Private Office</span>
                    <h2 className="text-5xl md:text-7xl font-serif mt-6">The Inner Circle</h2>
                </div>

                <div className="space-y-[40vh]">
                    <div className="po-item grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="text-right">
                            <h4 className="text-3xl font-serif mb-4">Strictly Confidential</h4>
                            <p className="text-slate-400 leading-relaxed">We operate under the strictest non-disclosure agreements. Your portfolio and identity remain invisible to the market.</p>
                        </div>
                        <div className="hidden md:block pl-12"><Shield className="text-slate-700" size={64} /></div>
                    </div>

                    <div className="po-item grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="hidden md:flex justify-end pr-12"><Globe className="text-slate-700" size={64} /></div>
                        <div className="text-left">
                            <h4 className="text-3xl font-serif mb-4">Global Access</h4>
                            <p className="text-slate-400 leading-relaxed">From London penthouses to private islands, our reach extends beyond public listings into the private pockets of the world's elite.</p>
                        </div>
                    </div>

                    <div className="po-item grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="text-right">
                            <h4 className="text-3xl font-serif mb-4">Inter-Generational</h4>
                            <p className="text-slate-400 leading-relaxed">Advising families on legacy assets, inheritance planning, and portfolio structuring for the next century.</p>
                        </div>
                        <div className="hidden md:block pl-12"><Key className="text-slate-700" size={64} /></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SectionPrivateOffice;
