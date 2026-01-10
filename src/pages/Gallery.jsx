import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Filter, X, Bed, Bath, Maximize } from 'lucide-react';
import gsap from 'gsap';
import { fetchPexelsImages } from '../utils/pexels';

const Gallery = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const galleryRef = useRef(null);

  const filters = [
    { id: 'all', label: 'All Properties' },
    { id: 'residential', label: 'Residential' },
    { id: 'commercial', label: 'Commercial' },
    { id: 'luxury', label: 'Luxury' },
    { id: 'investment', label: 'Investment' }
  ];

  useEffect(() => {
    const loadProperties = async () => {
      const photos = await fetchPexelsImages('UK luxury architecture real estate mansion', 12);
      if (photos.length > 0) {
        const propertyTypes = ['residential', 'commercial', 'luxury', 'investment'];
        const formattedProperties = photos.map((photo, index) => ({
          id: photo.id,
          title: `Exclusive Property ${index + 1}`,
          location: ['Mayfair, London', 'Knightsbridge', 'Belgravia', 'Chelsea', 'Kensington', 'Hampstead'][index % 6],
          type: propertyTypes[index % propertyTypes.length],
          price: `£${(Math.random() * 10 + 2).toFixed(1)}M`,
          bedrooms: Math.floor(Math.random() * 6) + 3,
          bathrooms: Math.floor(Math.random() * 4) + 2,
          sqft: Math.floor(Math.random() * 4000) + 2000,
          image: photo.src.large2x,
          description: 'An exceptional property offering unparalleled luxury and sophistication in one of London\'s most prestigious locations.'
        }));
        setProperties(formattedProperties);
        setFilteredProperties(formattedProperties);
      }
      setLoading(false);
    };
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredProperties(properties);
    } else {
      setFilteredProperties(properties.filter(prop => prop.type === selectedFilter));
    }
  }, [selectedFilter, properties]);

  useEffect(() => {
    if (!loading && filteredProperties.length > 0) {
      gsap.from('.property-card', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      });
    }
  }, [loading, filteredProperties]);

  const handleFilterChange = (filterId) => {
    setSelectedFilter(filterId);
  };

  const openPropertyModal = (property) => {
    setSelectedProperty(property);
    document.body.style.overflow = 'hidden';
  };

  const closePropertyModal = () => {
    setSelectedProperty(null);
    document.body.style.overflow = 'unset';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl font-serif mb-4 text-[#C5A059]">Davidson & Co.</div>
          <div className="text-sm tracking-[0.3em] uppercase animate-pulse">Curating Collection...</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={galleryRef} className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/50 via-neutral-900/30 to-neutral-900 z-10"></div>
        {filteredProperties[0] && (
          <img
            src={filteredProperties[0].image}
            alt="Featured Property"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="relative z-20 text-center px-6">
          <p className="text-[#C5A059] text-xs tracking-[0.3em] uppercase mb-4">Property Portfolio</p>
          <h1 className="text-5xl md:text-7xl font-serif mb-6">Our Collection</h1>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            Discover an exclusive selection of London's finest properties, curated for the discerning client.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-5 h-5 text-[#C5A059]" />
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleFilterChange(filter.id)}
                  className={`px-4 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 ${
                    selectedFilter === filter.id
                      ? 'bg-[#C5A059] text-neutral-900'
                      : 'bg-transparent text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((property, index) => (
            <div
              key={property.id}
              className="property-card group relative overflow-hidden bg-neutral-800/50 border border-neutral-700 hover:border-[#C5A059]/50 transition-all duration-500"
            >
              {/* Image */}
              <div className="relative h-72 overflow-hidden">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
                
                {/* Type Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-[#C5A059]/90 text-neutral-900 text-[10px] tracking-[0.2em] uppercase font-bold">
                    {property.type}
                  </span>
                </div>

                {/* Price Badge */}
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-neutral-900/90 text-white text-xs font-serif">
                    {property.price}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-serif mb-1 group-hover:text-[#C5A059] transition-colors">
                      {property.title}
                    </h3>
                    <p className="text-neutral-500 text-sm flex items-center gap-2">
                      <span className="text-[#C5A059]">●</span> {property.location}
                    </p>
                  </div>
                </div>

                {/* Specs */}
                <div className="flex items-center gap-6 py-4 border-t border-b border-neutral-700 my-4">
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-sm font-serif">{property.bedrooms} Beds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-sm font-serif">{property.bathrooms} Baths</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-sm font-serif">{property.sqft.toLocaleString()} sqft</span>
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => openPropertyModal(property)}
                  className="w-full py-3 border border-neutral-600 hover:border-[#C5A059] hover:bg-[#C5A059]/10 transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                >
                  <span className="text-xs tracking-[0.2em] uppercase group-hover/btn:text-[#C5A059]">View Details</span>
                  <ArrowRight size={14} className="group-hover/btn:translate-x-2 transition-transform duration-300" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Property Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={closePropertyModal}>
          <div className="bg-neutral-900 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={closePropertyModal}
              className="absolute top-4 right-4 z-10 p-2 bg-neutral-800 hover:bg-[#C5A059] hover:text-neutral-900 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Modal Image */}
            <div className="h-64 md:h-96 overflow-hidden">
              <img
                src={selectedProperty.image}
                alt={selectedProperty.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="text-[#C5A059] text-xs tracking-[0.2em] uppercase">{selectedProperty.type}</span>
                  <h2 className="text-3xl font-serif mt-2">{selectedProperty.title}</h2>
                  <p className="text-neutral-500 flex items-center gap-2 mt-1">
                    <span className="text-[#C5A059]">●</span> {selectedProperty.location}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-serif text-[#C5A059]">{selectedProperty.price}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 py-6 border-t border-b border-neutral-800 mb-6">
                <div className="text-center">
                  <Bed className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
                  <div className="text-2xl font-serif">{selectedProperty.bedrooms}</div>
                  <div className="text-xs uppercase tracking-wider text-neutral-500">Bedrooms</div>
                </div>
                <div className="text-center">
                  <Bath className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
                  <div className="text-2xl font-serif">{selectedProperty.bathrooms}</div>
                  <div className="text-xs uppercase tracking-wider text-neutral-500">Bathrooms</div>
                </div>
                <div className="text-center">
                  <Maximize className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
                  <div className="text-2xl font-serif">{selectedProperty.sqft.toLocaleString()}</div>
                  <div className="text-xs uppercase tracking-wider text-neutral-500">Sq Ft</div>
                </div>
              </div>

              <p className="text-neutral-400 leading-relaxed mb-8">{selectedProperty.description}</p>

              <button className="w-full py-4 bg-[#C5A059] text-neutral-900 font-bold tracking-[0.2em] uppercase hover:bg-[#D4AF37] transition-colors">
                Enquire About This Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <section className="py-24 bg-neutral-800/30 text-center">
        <h2 className="text-3xl md:text-4xl font-serif mb-6">Interested in a Property?</h2>
        <p className="text-neutral-400 mb-8 max-w-xl mx-auto">
          Our private office offers discreet consultations for qualified clients. Contact us to discuss your requirements.
        </p>
        <a
          href="mailto:info@davidsoncolondon.com"
          className="inline-block px-8 py-4 border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-neutral-900 transition-all duration-300 text-xs tracking-[0.2em] uppercase"
        >
          Schedule a Consultation
        </a>
      </section>
    </div>
  );
};

export default Gallery;9] hover:bg-[#C5A05