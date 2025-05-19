
'use client';

import React, { forwardRef, useEffect, useState } from 'react';

interface LabelPreviewProps {
  beerName: string;
  ibu: string;
  abv: string;
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
  flatLabelWidthPx: number; // Expected to be 300px
  flatLabelHeightPx: number; // Expected to be 400px
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
      backgroundColor,
      textColor,
      backgroundImage,
      flatLabelWidthPx, // This is the width of the content to be captured (e.g., 300px)
      flatLabelHeightPx, // This is the height of the content to be captured (e.g., 400px)
    },
    ref
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

    // Styles for the actual label content (the "black area")
    // This is now designed to be vertical, 300px wide x 400px high.
    const flatLabelStyle: React.CSSProperties = {
      width: `${flatLabelWidthPx}px`, // 300px
      height: `${flatLabelHeightPx}px`, // 400px
      backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
      color: textColor,
      fontFamily: 'var(--font-inter)',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    };

    // Beer name font size scaled to the width of the vertical label (300px)
    const beerNameFontSize = Math.max(24, Math.min(flatLabelWidthPx / 6, 80));

    return (
      <div className="w-full flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2 text-center">Front Label Preview</h3>
        <div
          className="bg-card border-2 border-primary rounded-md shadow-lg flex items-center justify-center overflow-hidden"
          style={{
            width: `${PREVIEW_CONTAINER_WIDTH_PX}px`, // 300px
            height: `${PREVIEW_CONTAINER_HEIGHT_PX}px`, // 400px
          }}
        >
          {/* This is the actual label content to be captured by html2canvas */}
          {/* No rotation div needed here, content is displayed as is. */}
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
            {backgroundImage && ( // Overlay for text readability on image
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

            {/* Inner wrapper for padding and content layout for the VERTICAL design */}
            <div style={{
              width: '100%', // Takes full 300px width of flatLabelStyle
              height: '100%', // Takes full 400px height of flatLabelStyle
              padding: '1rem', // Padding applied here
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              zIndex: 3, 
              boxSizing: 'border-box',
            }}>
              {/* Top row for IBU and Alc */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '1rem' /* Increased font size */ }}>
                <p style={{ textAlign: 'left' }}>IBU: {ibu}</p>
                <p style={{ textAlign: 'right' }}>Alc: {abv}%</p>
              </div>

              {/* Centered Beer Name */}
              <div style={{ textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
                <h1
                  className="font-bebas-neue leading-tight" // Use Bebas Neue
                  style={{ fontSize: `${beerNameFontSize}px`, wordBreak: 'break-word', hyphens: 'auto', lineHeight: '1.0' }}
                >
                  {beerName.split(' ').map((word, index) => (
                      <div key={index} style={{ display: 'block' }}>{word}</div>
                  ))}
                </h1>
              </div>
              
              {/* Bottom placeholder - Volume was removed, keep space balanced */}
               <div style={{ width: '100%', height: '1rem' }}>{/* Empty div to balance space */}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LabelPreview.displayName = 'LabelPreview';
