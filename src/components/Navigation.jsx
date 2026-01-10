import React, { useState } from 'react';
import { X } from 'lucide-react';
import logo from '../assets/logo.png';

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 w-full z-50 text-white px-6 py-4 flex justify-between items-center transition-all duration-500 mix-blend-difference">
            <a href="/" className="block">
                <img src={logo} alt="Davidson & Co" className="h-10 md:h-12 object-contain" />
            </a>
            <div className="flex items-center gap-8">
                <a href="/gallery" className="hidden md:block text-xs tracking-[0.2em] uppercase hover:text-gray-300 transition-colors">
                    Gallery
                </a>
                <button className="hidden md:block text-xs tracking-[0.2em] uppercase hover:text-gray-300 transition-colors">
                    Private Office
                </button>
                <button className="hidden md:block text-xs tracking-[0.2em] uppercase hover:text-gray-300 transition-colors">
                    Valuation
                </button>
                <button onClick={() => setIsOpen(!isOpen)} className="group flex flex-col gap-1.5 cursor-pointer z-[60]">
                    <span className={`h-[1px] bg-white transition-all duration-300 ${isOpen ? 'w-6 rotate-45 translate-y-[7px]' : 'w-8'}`}></span>
                    <span className={`h-[1px] bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : 'w-6 ml-auto'}`}></span>
                    <span className={`h-[1px] bg-white transition-all duration-300 ${isOpen ? 'w-6 -rotate-45 -translate-y-[7px]' : 'w-4 ml-auto'}`}></span>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`fixed inset-0 bg-[#0a0a0a]/95 backdrop-blur-md text-white flex items-center justify-center transition-transform duration-700 ease-[0.16,1,0.3,1] z-50 ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}>
                <ul className="text-center space-y-8">
                    {['Residences', 'Advisory', 'Private Office', 'Journal', 'Contact'].map((item, i) => (
                        <li key={i} className="overflow-hidden">
                            <a
                                href="#"
                                onClick={() => setIsOpen(false)}
                                className="block text-4xl md:text-5xl font-serif hover:italic transition-all duration-300 text-neutral-400 hover:text-white"
                            >
                                {item}
                            </a>
                        </li>
                    ))}
                </ul>
                <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 p-4">
                    <X size={24} />
                </button>
            </div>
        </nav>
    );
};

export default Navigation;
