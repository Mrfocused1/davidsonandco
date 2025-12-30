import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SectionAbout = () => {
    const sectionRef = useRef(null);
    const textRef = useRef(null);
    const lineRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top top",
                    end: "+=150%",
                    pin: true,
                    scrub: 1,
                }
            });

            tl.fromTo(textRef.current.querySelectorAll('span'), {
                opacity: 0.1,
                y: 40,
                filter: "blur(12px)"
            }, {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                stagger: 0.2,
                ease: "power3.out"
            })
                .fromTo(lineRef.current, {
                    scaleX: 0
                }, {
                    scaleX: 1,
                    duration: 1.5,
                    ease: "power4.inOut"
                }, "<0.2");

        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="h-screen w-full bg-[#f4f4f0] flex items-center justify-center px-6 md:px-24">
            <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                <div className="md:col-span-4">
                    <h2 className="text-5xl md:text-7xl font-serif text-neutral-900 leading-tight">
                        The Art of <br />
                        <span className="italic text-neutral-400">Arrival.</span>
                    </h2>
                    <div ref={lineRef} className="h-[2px] bg-[#C5A059] mt-8 w-full origin-left"></div>
                </div>
                <div ref={textRef} className="md:col-span-8 text-xl md:text-3xl font-light leading-relaxed text-neutral-800 space-y-2">
                    <span className="block">True luxury is not just seen.</span>
                    <span className="block">It is felt in the details,</span>
                    <span className="block">orchestrated in silence,</span>
                    <span className="block">and delivered with absolute</span>
                    <span className="block italic font-serif text-neutral-900">precision.</span>
                </div>
            </div>
        </section>
    );
};

export default SectionAbout;
