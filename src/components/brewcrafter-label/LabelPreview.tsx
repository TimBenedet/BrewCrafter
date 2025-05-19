
'use client';

import React, { forwardRef, useEffect, useState } from 'react';

interface LabelPreviewProps {
  beerName: string;
  // breweryName: string; // No longer used in this simple design
  // tagline: string; // No longer used
  ibu: string;
  // srm: string; // No longer used
  // srmHexColor: string; // No longer used
  // ingredientsSummary: string; // No longer used
  abv: string;
  volume: string;
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
  flatLabelWidthPx: number;
  flatLabelHeightPx: number;
}

// On-screen preview container dimensions
const PREVIEW_CONTAINER_WIDTH_PX = 200;
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

    // Style for the flat label content (the div that will be captured by html2canvas)
    const flatLabelStyle: React.CSSProperties = {
      width: `${flatLabelWidthPx}px`,
      height: `${flatLabelHeightPx}px`,
      backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
      color: textColor,
      fontFamily: 'var(--font-inter)', // Inter for most text
      position: 'relative',
      overflow: 'hidden',
      display: 'flex', 
      flexDirection: 'column', // Use flex column for main alignment
      justifyContent: 'space-between', // Pushes top/bottom elements
      alignItems: 'center', // Centers beer name and volume
      padding: '1rem', // p-4 equivalent
      boxSizing: 'border-box',
    };

    const scaleToFit = Math.min(
      (PREVIEW_CONTAINER_HEIGHT_PX - 20) / flatLabelWidthPx, 
      (PREVIEW_CONTAINER_WIDTH_PX - 20) / flatLabelHeightPx,
      0.85 // Max scale to ensure it's not too large, slightly increased
    ); 
    
    // Adjust beer name font size based on label width to prevent overflow
    // This is a simple heuristic, more complex logic might be needed for perfect fit
    const beerNameFontSize = Math.max(12, Math.min(flatLabelWidthPx / 8, 60)); // e.g. 500/8 = 62.5, capped at 60px

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

              {/* Content Wrapper for z-index and flex control */}
              <div style={{ position: 'relative', zIndex: 3, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Top Row: IBU and Alc */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 0.5rem' }}>
                  <p className="text-sm">IBU: {ibu}</p>
                  <p className="text-sm">Alc: {abv}%</p>
                </div>

                {/* Beer Name - Centered */}
                <div style={{ textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <h1
                    className="font-bebas-neue leading-tight" // Use leading-tight or leading-none
                    style={{ fontSize: `${beerNameFontSize}px`, wordBreak: 'break-word', hyphens: 'auto' }}
                  >
                    {beerName.split(' ').map((word, index) => <div key={index}>{word}</div>)}
                  </h1>
                </div>

                {/* Bottom: Volume */}
                <div style={{ width: '100%', textAlign: 'center', padding: '0 0.5rem' }}>
                  <p className="text-sm">{volume}</p>
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
