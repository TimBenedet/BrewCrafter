
'use client';

import React, { forwardRef, useEffect, useState } from 'react';

interface LabelPreviewProps {
  beerName: string;
  ibu: string;
  abv: string;
  volume: string;
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
  flatLabelWidthPx: number;
  flatLabelHeightPx: number;
}

// On-screen preview container dimensions
const PREVIEW_CONTAINER_WIDTH_PX = 300;
const PREVIEW_CONTAINER_HEIGHT_PX = 400;

export const LabelPreview = forwardRef<HTMLDivElement, LabelPreviewProps>(
  (
    {
      beerName,
      ibu,
      abv,
      volume,
      backgroundColor,
      textColor,
      backgroundImage,
      flatLabelWidthPx,
      flatLabelHeightPx,
    },
    ref // This ref is for the INNER, UNROTATED content div (flatLabelContentRef)
  ) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    useEffect(() => {
      setIsImageLoaded(false);
      if (backgroundImage) {
        const img = new window.Image();
        img.src = backgroundImage;
        img.onload = () => setIsImageLoaded(true);
      }
    }, [backgroundImage]);

    const flatLabelStyle: React.CSSProperties = {
      width: `${flatLabelWidthPx}px`,
      height: `${flatLabelHeightPx}px`,
      backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
      color: textColor,
      fontFamily: 'var(--font-inter)',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    };

    const scaleToFit = Math.min(
        PREVIEW_CONTAINER_WIDTH_PX / flatLabelHeightPx, 
        PREVIEW_CONTAINER_HEIGHT_PX / flatLabelWidthPx  
    ) * 0.93; 

    const beerNameFontSize = Math.max(12, Math.min(flatLabelWidthPx / 7, 70));

    return (
      <div className="w-full flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2 text-center">Front Label Preview</h3>
        <div
          className="bg-card border-2 border-primary rounded-md shadow-lg flex items-center justify-center overflow-hidden"
          style={{
            width: `${PREVIEW_CONTAINER_WIDTH_PX}px`,
            height: `${PREVIEW_CONTAINER_HEIGHT_PX}px`,
          }}
        >
          <div
            style={{
              width: `${flatLabelWidthPx}px`,
              height: `${flatLabelHeightPx}px`,
              transform: `rotate(-90deg) scale(${scaleToFit})`, // Changed to -90deg
              transformOrigin: 'center center',
            }}
          >
            <div style={flatLabelStyle} ref={ref} className="flat-label-content-for-capture">
              {backgroundImage && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: isImageLoaded ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out',
                    zIndex: 1,
                  }}
                />
              )}
              {backgroundImage && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.4)', 
                    zIndex: 2,
                  }}
                />
              )}

              {/* Inner wrapper for padding and content layout */}
              <div style={{
                width: '100%',
                height: '100%',
                padding: '1rem', // Padding applied here
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                zIndex: 3, // Content on top of background/overlay
                boxSizing: 'border-box',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px' }}>
                  <p>IBU: {ibu}</p>
                  <p>Alc: {abv}%</p>
                </div>

                <div style={{ textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
                  <h1
                    className="font-bebas-neue leading-tight"
                    style={{ fontSize: `${beerNameFontSize}px`, wordBreak: 'break-word', hyphens: 'auto', lineHeight: '1.0' }}
                  >
                    {beerName.split(' ').map((word, index, arr) => (
                        <div key={index} style={{ display: 'block' }}>{word}</div>
                    ))}
                  </h1>
                </div>

                <div style={{ width: '100%', textAlign: 'center', fontSize: '12px' }}>
                  <p>{volume}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LabelPreview.displayName = 'LabelPreview';
