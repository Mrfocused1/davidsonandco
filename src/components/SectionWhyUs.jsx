import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

const SectionWhyUs = () => {
    const sectionRef = useRef(null);
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const items = containerRef.current.querySelectorAll('.morph-word');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top top",
                    end: "+=300%",
                    pin: true,
                    scrub: 1
                }
            });

            // Crossfade words
            items.forEach((item, i) => {
                if (i === 0) {
                    tl.to(item, { opacity: 0, duration: 1 }, "+=0.5");
                } else if (i === items.length - 1) {
                    tl.fromTo(item, { opacity: 0 }, { opacity: 1, duration: 1 }, "<");
                } else {
                    tl.fromTo(item, { opacity: 0 }, { opacity: 1, duration: 1 }, "<")
                        .to(item, { opacity: 0, duration: 1 }, "+=1");
                }
            });

        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="h-screen bg-neutral-100 flex items-center justify-center text-center px-6 z-10 relative">
            <div ref={containerRef} className="relative h-32 flex items-center justify-center w-full">
                <p className="absolute -top-12 left-1/2 -translate-x-1/2 text-sm uppercase tracking-widest text-neutral-400">Our Foundation</p>
                <h2 className="morph-word absolute text-6xl md:text-9xl font-serif text-neutral-900 opacity-100">Integrity.</h2>
                <h2 className="morph-word absolute text-6xl md:text-9xl font-serif text-neutral-900 opacity-0">Discretion.</h2>
                <h2 className="morph-word absolute text-6xl md:text-9xl font-serif text-neutral-900 opacity-0">Insight.</h2>
            </div>
        </section>
    );
};

export default SectionWhyUs;
