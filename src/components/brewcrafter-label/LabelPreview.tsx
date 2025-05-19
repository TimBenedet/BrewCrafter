
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
const PREVIEW_CONTAINER_WIDTH_PX = 300; // Updated
const PREVIEW_CONTAINER_HEIGHT_PX = 400; // Updated

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
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem', // p-4 equivalent
      boxSizing: 'border-box',
    };

    // Adjusted scaleToFit calculation
    const scaleToFit = Math.min(
        PREVIEW_CONTAINER_WIDTH_PX / flatLabelHeightPx, // After rotation, label's height becomes preview's width constraint
        PREVIEW_CONTAINER_HEIGHT_PX / flatLabelWidthPx  // After rotation, label's width becomes preview's height constraint
    ) * 0.93; // Apply a factor for some padding/margin inside the preview box

    const beerNameFontSize = Math.max(12, Math.min(flatLabelWidthPx / 7, 70)); // Adjusted divisor and max

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
              transform: `rotate(90deg) scale(${scaleToFit})`,
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
                    backgroundColor: 'rgba(0,0,0,0.4)', // bg-black/40 overlay
                    zIndex: 2,
                  }}
                />
              )}

              <div style={{ position: 'relative', zIndex: 3, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 0.5rem', fontSize: '12px' }}> {/* Increased font size slightly */}
                  <p>IBU: {ibu}</p>
                  <p>Alc: {abv}%</p>
                </div>

                <div style={{ textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
                  <h1
                    className="font-bebas-neue leading-tight"
                    style={{ fontSize: `${beerNameFontSize}px`, wordBreak: 'break-word', hyphens: 'auto', lineHeight: '1.0' }} // Ensure tight line height
                  >
                    {beerName.split(' ').map((word, index, arr) => (
                        <div key={index} style={{ display: 'block' }}>{word}</div>
                    ))}
                  </h1>
                </div>

                <div style={{ width: '100%', textAlign: 'center', padding: '0 0.5rem', fontSize: '12px' }}> {/* Increased font size slightly */}
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
