import React from 'react';
import { Composition } from 'remotion';
import { PropertyAdvert } from './PropertyAdvert.jsx';
import { MobileMockup } from './MobileMockup.jsx';
import { KeynoteVersion } from './KeynoteVersion.jsx';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PropertyAdvert"
        component={PropertyAdvert}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="MobileMockup"
        component={MobileMockup}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="KeynoteVersion"
        component={KeynoteVersion}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
