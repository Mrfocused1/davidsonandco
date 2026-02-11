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

export const KeynoteVersion = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#fff' }}>
      {/* Slide 1: Title Slide (0-60) */}
      <Sequence from={0} durationInFrames={60}>
        <TitleSlide />
      </Sequence>

      {/* Slide 2: Hero Image (55-115) */}
      <Sequence from={55} durationInFrames={60}>
        <HeroSlide />
      </Sequence>

      {/* Slide 3: Statement (110-170) */}
      <Sequence from={110} durationInFrames={60}>
        <StatementSlide />
      </Sequence>

      {/* Slide 4: Interior Gallery (165-225) */}
      <Sequence from={165} durationInFrames={60}>
        <InteriorSlide />
      </Sequence>

      {/* Slide 5: Features (220-280) */}
      <Sequence from={220} durationInFrames={60}>
        <FeaturesSlide />
      </Sequence>

      {/* Slide 6: Final (275-300) */}
      <Sequence from={275} durationInFrames={25}>
        <FinalSlide />
      </Sequence>
    </AbsoluteFill>
  );
};

// Slide 1: Title
const TitleSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20, 40, 55], [0, 1, 1, 0]);

  const logoY = spring({
    frame: frame - 5,
    fps,
    config: { damping: 100 },
  });

  const textY = spring({
    frame: frame - 15,
    fps,
    config: { damping: 100 },
  });

  return (
    <AbsoluteFill style={{ background: '#fff', opacity }}>
      {/* Logo */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          transform: `translateY(${(1 - logoY) * 30}px)`,
        }}
      >
        <Img
          src={staticFile('assets/logo.png')}
          style={{
            width: 420,
            height: 'auto',
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
          transform: `translateY(calc(-50% + ${(1 - textY) * 40}px))`,
          textAlign: 'center',
          padding: '0 120px',
        }}
      >
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 110,
            fontWeight: 900,
            color: '#1d1d1f',
            letterSpacing: '-4px',
            lineHeight: 1.1,
          }}
        >
          Exceptional
          <br />
          Living
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: interpolate(frame, [25, 40], [0, 1]),
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 32,
            fontWeight: 400,
            color: '#86868b',
            letterSpacing: '1px',
          }}
        >
          Introducing a new standard of luxury
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Slide 2: Hero Image
const HeroSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0]);
  const scale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 100 },
  });

  return (
    <AbsoluteFill style={{ background: '#fff', opacity }}>
      {/* Large Hero Image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 100,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 30,
            overflow: 'hidden',
            boxShadow: '0 40px 120px rgba(0, 0, 0, 0.15)',
            transform: `scale(${0.9 + scale * 0.1})`,
          }}
        >
          <Img
            src={staticFile('assets/house.jpg')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>

      {/* Caption */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: interpolate(frame, [20, 35], [0, 1]),
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 28,
            fontWeight: 600,
            color: '#1d1d1f',
            marginBottom: 8,
          }}
        >
          Your future home.
        </div>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 24,
            fontWeight: 400,
            color: '#86868b',
          }}
        >
          Perfectly located. Beautifully designed.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Slide 3: Bold Statement
const StatementSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0]);

  const wordY = spring({
    frame: frame - 10,
    fps,
    config: { damping: 100 },
  });

  return (
    <AbsoluteFill style={{ background: '#f5f5f7', opacity }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 150px',
          gap: 60,
          transform: `translateY(${(1 - wordY) * 40}px)`,
        }}
      >
        {/* Main Statement */}
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 120,
            fontWeight: 900,
            color: '#1d1d1f',
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: '-5px',
          }}
        >
          Spacious.
          <br />
          Modern.
          <br />
          Yours.
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 120,
            height: 6,
            background: '#C5A059',
            borderRadius: 3,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Slide 4: Interior Gallery
const InteriorSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0]);

  const scale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 100 },
  });

  const interiors = [
    'interior1.jpg',
    'interior2.jpg',
    'interior3.jpg',
    'interior4.jpg',
  ];

  return (
    <AbsoluteFill style={{ background: '#fff', opacity }}>
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 72,
            fontWeight: 700,
            color: '#1d1d1f',
            letterSpacing: '-2px',
          }}
        >
          Every detail matters
        </div>
      </div>

      {/* Image Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          padding: '220px 100px 100px 100px',
          transform: `scale(${0.95 + scale * 0.05})`,
        }}
      >
        {interiors.map((img, i) => (
          <div
            key={i}
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Img
              src={staticFile(`assets/${img}`)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Slide 5: Features
const FeaturesSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0]);

  const features = [
    { icon: IoBedOutline, num: 4, label: 'Bedrooms' },
    { icon: TbToolsKitchen2, num: 2, label: 'Kitchens' },
    { icon: LuBath, num: 2, label: 'Bathrooms' },
    { icon: BiCar, num: null, label: 'Parking', displayText: '✓' },
  ];

  return (
    <AbsoluteFill style={{ background: '#f5f5f7', opacity }}>
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 72,
            fontWeight: 700,
            color: '#1d1d1f',
            letterSpacing: '-2px',
          }}
        >
          Everything you need
        </div>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 32,
            fontWeight: 400,
            color: '#86868b',
            marginTop: 20,
          }}
        >
          And nothing you don't
        </div>
      </div>

      {/* Features Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 50,
          padding: '300px 120px 120px 120px',
          alignItems: 'start',
        }}
      >
        {features.map((feature, i) => {
          const Icon = feature.icon;
          const delay = 10 + i * 8;

          const itemY = spring({
            frame: frame - delay,
            fps,
            config: { damping: 100 },
          });

          const itemOpacity = interpolate(frame, [delay, delay + 15], [0, 1], {
            extrapolateRight: 'clamp',
          });

          // Count up animation
          const countStart = delay + 10;
          const countDuration = 20;
          const countProgress = interpolate(
            frame,
            [countStart, countStart + countDuration],
            [0, 1],
            { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
          );

          // Smooth count up with easing
          const easedProgress = countProgress * countProgress * (3 - 2 * countProgress); // Smoothstep
          const currentNumber = feature.num !== null
            ? Math.floor(easedProgress * feature.num)
            : null;

          const displayValue = feature.displayText
            ? (countProgress >= 1 ? feature.displayText : '')
            : currentNumber;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                opacity: itemOpacity,
                transform: `translateY(${(1 - itemY) * 30}px)`,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  fontSize: 80,
                  color: '#C5A059',
                }}
              >
                <Icon />
              </div>

              {/* Number with count-up animation */}
              <div
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 96,
                  fontWeight: 700,
                  color: '#1d1d1f',
                  lineHeight: 1,
                  minHeight: 96,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {displayValue}
              </div>

              {/* Label */}
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 24,
                  fontWeight: 500,
                  color: '#86868b',
                }}
              >
                {feature.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Slide 6: Final
const FinalSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 10], [0, 1]);

  const scale = spring({
    frame: frame - 3,
    fps,
    config: { damping: 100 },
  });

  return (
    <AbsoluteFill style={{ background: '#fff', opacity }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 60,
        }}
      >
        {/* Logo */}
        <div style={{ transform: `scale(${scale})` }}>
          <Img
            src={staticFile('assets/logo.png')}
            style={{
              width: 450,
              height: 'auto',
            }}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            width: 120,
            height: 4,
            background: '#C5A059',
            borderRadius: 2,
          }}
        />

        {/* CTA */}
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 40,
              fontWeight: 600,
              color: '#1d1d1f',
              marginBottom: 15,
            }}
          >
            Available now
          </div>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 28,
              fontWeight: 400,
              color: '#86868b',
            }}
          >
            Contact us to schedule a viewing
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
