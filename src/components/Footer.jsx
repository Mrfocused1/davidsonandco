import React from 'react';
import { Instagram, Linkedin, Twitter, Mail } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-100 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
                    <div className="col-span-1 md:col-span-1">
                        <span className="text-2xl font-serif tracking-tighter">DAVIDSON <span className="text-[#C5A059]">&</span> CO</span>
                        <p className="mt-6 text-slate-500 text-sm leading-relaxed max-w-xs">
                            Redefining luxury real estate advisory through discretion, expertise, and a global network of excellence.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-serif text-lg mb-6">Expertise</h4>
                        <ul className="space-y-4 text-slate-500 text-sm">
                            <li><a href="#" className="hover:text-[#C5A059] transition-colors">Residential Sales</a></li>
                            <li><a href="#" className="hover:text-[#C5A059] transition-colors">Portfolio Management</a></li>
                            <li><a href="#" className="hover:text-[#C5A059] transition-colors">Private Office</a></li>
                            <li><a href="#" className="hover:text-[#C5A059] transition-colors">Advisory</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-serif text-lg mb-6">Offices</h4>
                        <ul className="space-y-4 text-slate-500 text-sm">
                            <li>London (HQ)</li>
                            <li>Dubai</li>
                            <li>New York</li>
                            <li>Monaco</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-serif text-lg mb-6">Contact</h4>
                        <ul className="space-y-4 text-slate-500 text-sm">
                            <li>+44 (0) 20 7123 4567</li>
                            <li>advisory@davidson.co</li>
                        </ul>
                        <div className="flex gap-4 mt-8">
                            <a href="#" className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><Instagram size={18} /></a>
                            <a href="#" className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><Linkedin size={18} /></a>
                            <a href="#" className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><Twitter size={18} /></a>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-xs tracking-widest uppercase">
                    <p>© 2024 Davidson & Co. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Terms of Business</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
