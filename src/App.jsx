import React from 'react';
import Navigation from './components/Navigation';
import SectionHero from './components/SectionHero';
import SectionAbout from './components/SectionAbout';
import SectionServices from './components/SectionServices';
import SectionPortfolio from './components/SectionPortfolio';
import SectionPrivateOffice from './components/SectionPrivateOffice';
import SectionWhyUs from './components/SectionWhyUs';
import Footer from './components/Footer';

function App() {
  return (
    <div className="font-sans antialiased text-neutral-900 selection:bg-[#C5A059] selection:text-white overflow-x-hidden">
      <Navigation />

      <main>
        <SectionHero />
        <SectionAbout />
        <SectionServices />
        <SectionPortfolio />
        <SectionPrivateOffice />
        <SectionWhyUs />

        {/* Call to Action Section */}
        <section className="py-48 bg-neutral-50 flex flex-col items-center justify-center text-center px-6 relative z-10">
          <h2 className="text-4xl md:text-6xl font-serif mb-12">Begin the Conversation</h2>
          <button className="group relative px-12 py-5 border border-neutral-900 overflow-hidden bg-transparent text-neutral-900 transition-colors">
            <span className="relative z-10 text-sm tracking-[0.2em] uppercase font-bold group-hover:text-white transition-colors duration-500">Enquire Now</span>
            <div className="absolute inset-0 bg-neutral-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
