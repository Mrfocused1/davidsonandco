import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  staticFile,
} from 'remotion';
import { PropertyAdvert } from './PropertyAdvert.jsx';

export const MobileMockup = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone entrance animation
  const phoneY = spring({
    frame: frame - 10,
    fps,
    config: { damping: 80 },
  });

  const phoneRotation = interpolate(phoneY, [0, 1], [5, 0]);
  const phoneOpacity = interpolate(frame, [0, 20], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at center, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      }}
    >
      {/* Subtle grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(197, 160, 89, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(197, 160, 89, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.3,
        }}
      />

      {/* Logo watermark */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: 0.6,
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

      {/* Mobile Phone Frame */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: phoneOpacity,
          transform: `translateY(${(1 - phoneY) * 50}px) rotate(${phoneRotation}deg)`,
        }}
      >
        {/* Phone Container */}
        <div
          style={{
            position: 'relative',
            width: 430,
            height: 880,
            background: '#000',
            borderRadius: 60,
            padding: 12,
            boxShadow: `
              0 0 0 8px #1a1a1a,
              0 0 0 10px #2a2a2a,
              0 40px 80px rgba(0, 0, 0, 0.8),
              0 20px 40px rgba(0, 0, 0, 0.6)
            `,
          }}
        >
          {/* Screen */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background: '#000',
              borderRadius: 50,
              overflow: 'hidden',
            }}
          >
            {/* Notch */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 200,
                height: 35,
                background: '#000',
                borderRadius: '0 0 20px 20px',
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Speaker */}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 60,
                  height: 6,
                  background: '#1a1a1a',
                  borderRadius: 3,
                }}
              />
              {/* Camera */}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 60,
                  width: 12,
                  height: 12,
                  background: '#0a0a0a',
                  borderRadius: '50%',
                  border: '1px solid #2a2a2a',
                }}
              />
            </div>

            {/* Status Bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 30px',
                zIndex: 10,
                fontSize: 16,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                color: '#fff',
              }}
            >
              <div>9:41</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Signal */}
                <div style={{ display: 'flex', gap: 2 }}>
                  <div style={{ width: 3, height: 8, background: '#fff', borderRadius: 1 }} />
                  <div style={{ width: 3, height: 10, background: '#fff', borderRadius: 1 }} />
                  <div style={{ width: 3, height: 12, background: '#fff', borderRadius: 1 }} />
                  <div style={{ width: 3, height: 14, background: '#fff', borderRadius: 1 }} />
                </div>
                {/* WiFi */}
                <svg width="18" height="14" viewBox="0 0 18 14" fill="white">
                  <path d="M9 14C7.89543 14 7 13.1046 7 12C7 10.8954 7.89543 10 9 10C10.1046 10 11 10.8954 11 12C11 13.1046 10.1046 14 9 14Z" />
                </svg>
                {/* Battery */}
                <div
                  style={{
                    width: 28,
                    height: 14,
                    border: '2px solid #fff',
                    borderRadius: 4,
                    padding: 2,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: -4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 2,
                      height: 6,
                      background: '#fff',
                      borderRadius: '0 2px 2px 0',
                    }}
                  />
                  <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: 2 }} />
                </div>
              </div>
            </div>

            {/* App Header */}
            <div
              style={{
                position: 'absolute',
                top: 50,
                left: 0,
                right: 0,
                height: 70,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 25px',
                zIndex: 10,
                borderBottom: '1px solid rgba(197, 160, 89, 0.2)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#C5A059',
                  letterSpacing: '1px',
                }}
              >
                DAVIDSON & CO
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    background: '#C5A059',
                    borderRadius: '50%',
                  }}
                />
                <div
                  style={{
                    width: 6,
                    height: 6,
                    background: '#C5A059',
                    borderRadius: '50%',
                  }}
                />
                <div
                  style={{
                    width: 6,
                    height: 6,
                    background: '#C5A059',
                    borderRadius: '50%',
                  }}
                />
              </div>
            </div>

            {/* Video Content */}
            <div
              style={{
                position: 'absolute',
                top: 120,
                left: 0,
                right: 0,
                bottom: 100,
                overflow: 'hidden',
              }}
            >
              <PropertyAdvert />
            </div>

            {/* Bottom Navigation */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 100,
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                borderTop: '1px solid rgba(197, 160, 89, 0.2)',
                zIndex: 10,
                paddingBottom: 20,
              }}
            >
              {['Home', 'Search', 'Saved', 'Profile'].map((label, i) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: i === 0 ? '#C5A059' : 'transparent',
                      border: i === 0 ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 12,
                      fontWeight: 500,
                      color: i === 0 ? '#C5A059' : 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Home Indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 140,
              height: 5,
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 3,
            }}
          />
        </div>
      </div>

      {/* Text Label */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 15,
          opacity: interpolate(frame, [30, 50], [0, 1]),
        }}
      >
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 38,
            fontWeight: 700,
            color: '#C5A059',
            letterSpacing: '2px',
          }}
        >
          Experience Luxury
        </div>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 18,
            fontWeight: 300,
            color: 'rgba(255, 255, 255, 0.7)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}
        >
          On Your Mobile Device
        </div>
      </div>
    </AbsoluteFill>
  );
};
