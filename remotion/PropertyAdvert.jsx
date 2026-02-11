import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  staticFile,
  Sequence,
} from 'remotion';
import { IoBedOutline } from 'react-icons/io5';
import { TbToolsKitchen2 } from 'react-icons/tb';
import { LuBath } from 'react-icons/lu';
import { BiCar } from 'react-icons/bi';

export const PropertyAdvert = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Subtle film grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.02,
          backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuNSIvPjwvc3ZnPg==)',
          pointerEvents: 'none',
          zIndex: 100,
        }}
      />

      {/* Scene 1: Logo Intro (0-60) */}
      <Sequence from={0} durationInFrames={60}>
        <LogoIntro />
      </Sequence>

      {/* Scene 2: Hero Property (50-110) */}
      <Sequence from={50} durationInFrames={60}>
        <HeroProperty />
      </Sequence>

      {/* Scene 3: Interior Showcase (100-220) */}
      <Sequence from={100} durationInFrames={120}>
        <InteriorShowcase />
      </Sequence>

      {/* Scene 4: Property Details (210-270) */}
      <Sequence from={210} durationInFrames={60}>
        <PropertyDetails />
      </Sequence>

      {/* Scene 5: Final CTA (260-300) */}
      <Sequence from={260} durationInFrames={40}>
        <FinalCTA />
      </Sequence>
    </AbsoluteFill>
  );
};

// Clean Logo Intro
const LogoIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20, 40, 55], [0, 1, 1, 0]);
  const scale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        opacity,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ transform: `scale(${scale})` }}>
          <Img
            src={staticFile('assets/logo.png')}
            style={{
              width: 380,
              height: 'auto',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Hero Property Shot
const HeroProperty = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imageScale = interpolate(frame, [0, 60], [1.15, 1.05]);
  const overlayOpacity = interpolate(frame, [0, 20], [1, 0.3]);

  const titleOpacity = interpolate(frame, [15, 30, 45, 60], [0, 1, 1, 0]);
  const titleY = spring({
    frame: frame - 15,
    fps,
    config: { damping: 80 },
  });

  const lineWidth = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <Img
          src={staticFile('assets/house.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${imageScale})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.1), rgba(0,0,0,0.6))',
            opacity: overlayOpacity,
          }}
        />
      </div>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          transform: `translateY(calc(-50% + ${(1 - titleY) * 30}px))`,
          opacity: titleOpacity,
          textAlign: 'center',
          padding: '0 80px',
        }}
      >
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 90,
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-2px',
            lineHeight: 1.1,
            marginBottom: 25,
          }}
        >
          EXCEPTIONAL
          <br />
          PROPERTY
        </div>
        <div
          style={{
            width: `${lineWidth * 250}px`,
            height: 3,
            background: '#C5A059',
            margin: '0 auto 25px',
          }}
        />
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 28,
            fontWeight: 300,
            color: '#C5A059',
            letterSpacing: '8px',
            textTransform: 'uppercase',
          }}
        >
          Available Now
        </div>
      </div>

      {/* Logo */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: titleOpacity,
        }}
      >
        <Img
          src={staticFile('assets/logo.png')}
          style={{
            width: 280,
            height: 'auto',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Interior Showcase - Clean slideshow
const InteriorShowcase = () => {
  const frame = useCurrentFrame();

  const interiors = [
    'interior1.jpg',
    'interior2.jpg',
    'interior3.jpg',
    'interior4.jpg',
    'interior5.jpg',
    'interior6.jpg',
  ];

  const duration = 20; // frames per image
  const currentIndex = Math.floor(frame / duration) % interiors.length;
  const progress = (frame % duration) / duration;

  const currentImage = interiors[currentIndex];
  const nextImage = interiors[(currentIndex + 1) % interiors.length];

  // Smooth cross-fade
  const currentOpacity = interpolate(progress, [0.7, 1], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const nextOpacity = interpolate(progress, [0.7, 1], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const scale = interpolate(frame % duration, [0, duration], [1, 1.08]);

  const ImageLayer = ({ src, opacity }) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
      }}
    >
      <Img
        src={staticFile(`assets/${src}`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), transparent, rgba(0,0,0,0.3))',
        }}
      />
    </div>
  );

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <ImageLayer src={currentImage} opacity={currentOpacity} />
      <ImageLayer src={nextImage} opacity={nextOpacity} />

      {/* Logo watermark */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Img
          src={staticFile('assets/logo.png')}
          style={{
            width: 240,
            height: 'auto',
            opacity: 0.9,
          }}
        />
      </div>

      {/* Progress indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        {interiors.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentIndex ? 50 : 10,
              height: 3,
              background: i === currentIndex ? '#C5A059' : 'rgba(255,255,255,0.3)',
              borderRadius: 2,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Property Details - Minimal grid
const PropertyDetails = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { icon: IoBedOutline, label: '4 Bedrooms' },
    { icon: TbToolsKitchen2, label: '2 Kitchens' },
    { icon: LuBath, label: '2 Bathrooms' },
    { icon: BiCar, label: 'Off-Street Parking' },
  ];

  const bgOpacity = interpolate(frame, [0, 15], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: '#0f0f0f',
        opacity: bgOpacity,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '100px 80px',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 64,
            fontWeight: 700,
            color: '#fff',
            marginBottom: 80,
            opacity: interpolate(frame, [5, 20], [0, 1]),
          }}
        >
          Property Features
        </div>

        {/* Features Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 40,
            maxWidth: 900,
            width: '100%',
          }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const delay = 15 + index * 8;

            const itemOpacity = interpolate(frame, [delay, delay + 15], [0, 1], {
              extrapolateRight: 'clamp',
            });

            const itemY = spring({
              frame: frame - delay,
              fps,
              config: { damping: 100 },
            });

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 25,
                  padding: 35,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(197, 160, 89, 0.2)',
                  borderRadius: 12,
                  opacity: itemOpacity,
                  transform: `translateY(${(1 - itemY) * 20}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 52,
                    color: '#C5A059',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                  }}
                >
                  <Icon />
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 26,
                    fontWeight: 400,
                    color: '#fff',
                    letterSpacing: '1px',
                  }}
                >
                  {feature.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Final CTA - Clean and elegant
const FinalCTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1]);

  const logoScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 100 },
  });

  const textOpacity = interpolate(frame, [10, 25], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        opacity,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 50,
        }}
      >
        {/* Logo */}
        <div style={{ transform: `scale(${logoScale})` }}>
          <Img
            src={staticFile('assets/logo.png')}
            style={{
              width: 380,
              height: 'auto',
            }}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            width: 200,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #C5A059, transparent)',
            opacity: textOpacity,
          }}
        />

        {/* Text */}
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 32,
            fontWeight: 300,
            color: '#fff',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          Contact Us Today
        </div>

        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 42,
            fontWeight: 600,
            color: '#C5A059',
            opacity: textOpacity,
          }}
        >
          Davidson & Co
        </div>
      </div>
    </AbsoluteFill>
  );
};
