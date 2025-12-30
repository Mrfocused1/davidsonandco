import React, { useRef, useLayoutEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SectionHero = () => {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const subTextRef = useRef(null);

    const bgImage = "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2700&auto=format&fit=crop";

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

            // Animate letters spreading out and background parallax
            tl.to(letters, {
                x: (i) => {
                    const mid = (letters.length - 1) / 2;
                    return (i - mid) * 40;
                },
                opacity: 0.5,
                scale: 1.1,
                ease: "power2.out",
            }, 0);

            // Hero text internal parallax
            tl.to(letters, {
                backgroundPosition: "50% 100%",
                ease: "none"
            }, 0);

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
    }, []);

    return (
        <section ref={containerRef} className="relative h-screen flex flex-col justify-center items-center bg-[#fdfdfd] overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

            <div ref={textRef} className="relative z-10 flex flex-col items-center w-full px-4 mix-blend-darken overflow-visible space-y-4 md:space-y-6">
                {["DAVIDSON", "&", "CO"].map((line, lineIndex) => (
                    <div key={lineIndex} className="flex justify-center flex-nowrap">
                        {line.split("").map((char, charIndex) => (
                            <span
                                key={`${lineIndex}-${charIndex}`}
                                className="hero-char text-[12vw] md:text-[15vw] font-serif font-black leading-[0.85] text-transparent bg-clip-text bg-cover bg-center select-none"
                                style={{
                                    backgroundImage: `url(${bgImage})`,
                                    backgroundPosition: '50% 0%'
                                }}
                            >
                                {char}
                            </span>
                        ))}
                    </div>
                ))}
            </div>

            <div className="absolute bottom-20 flex flex-col items-center gap-4">
                <p ref={subTextRef} className="text-xs md:text-sm tracking-[0.4em] uppercase text-neutral-500 font-medium">
                    Discreet Property Advisory
                </p>
                <ArrowDown className="text-neutral-300 animate-bounce" size={20} />
            </div>
        </section>
    );
};

export default SectionHero;
