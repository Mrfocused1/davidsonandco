import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SectionServices = () => {
    const sectionRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const services = sectionRef.current.querySelectorAll('.service-item');

            services.forEach((service) => {
                gsap.fromTo(service.querySelector('h3'),
                    { y: 100, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        scrollTrigger: {
                            trigger: service,
                            start: "top 85%",
                            end: "top 50%",
                            scrub: 1
                        }
                    }
                );

                gsap.fromTo(service.querySelector('.service-line'),
                    { scaleX: 0 },
                    {
                        scaleX: 1,
                        transformOrigin: "left",
                        scrollTrigger: {
                            trigger: service,
                            start: "top 75%",
                            end: "top 45%",
                            scrub: 1
                        }
                    }
                );
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    const services = [
        { title: "Acquisition", desc: "Sourcing off-market assets globally." },
        { title: "Management", desc: "Operational excellence for absent owners." },
        { title: "Design", desc: "Architectural curation and interiors." },
    ];

    return (
        <section ref={sectionRef} className="py-32 bg-white px-6 md:px-24">
            <div className="max-w-7xl mx-auto space-y-32">
                {services.map((s, i) => (
                    <div key={i} className="service-item group cursor-default">
                        <div className="overflow-hidden">
                            <h3 className="text-6xl md:text-9xl font-serif text-neutral-900 group-hover:italic transition-all duration-500 py-2">
                                {s.title}
                            </h3>
                        </div>
                        <div className="service-line h-[1px] bg-neutral-200 mt-8 mb-6"></div>
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-bold tracking-widest text-neutral-400">0{i + 1}</span>
                            <p className="text-lg md:text-xl text-neutral-600 max-w-md text-right">{s.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default SectionServices;
