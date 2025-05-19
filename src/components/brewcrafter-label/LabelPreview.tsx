
'use client';

import React, { forwardRef, useEffect, useState } from 'react';

interface LabelPreviewProps {
  beerName: string;
  ibu: string;
  abv: string;
  // volume: string; // Removed volume from simplified front label as per last screenshot
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
  flatLabelWidthPx: number; // Expected to be 400px (design canvas width)
  flatLabelHeightPx: number; // Expected to be 300px (design canvas height)
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
      // volume,
      backgroundColor,
      textColor,
      backgroundImage,
      flatLabelWidthPx, // This is the width of the content to be captured (e.g., 400px)
      flatLabelHeightPx, // This is the height of the content to be captured (e.g., 300px)
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
    const flatLabelStyle: React.CSSProperties = {
      width: `${flatLabelWidthPx}px`, // e.g., 400px
      height: `${flatLabelHeightPx}px`, // e.g., 300px
      backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
      color: textColor,
      fontFamily: 'var(--font-inter)',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    };

    // Scale the rotated content to fit the preview container
    // After 90deg rotation, flatLabelWidth becomes height, and flatLabelHeight becomes width
    const scaleToFit = Math.min(
        PREVIEW_CONTAINER_WIDTH_PX / flatLabelHeightPx, // e.g., 300 / 300 = 1
        PREVIEW_CONTAINER_HEIGHT_PX / flatLabelWidthPx  // e.g., 400 / 400 = 1
    ); 
    // No * 0.9x multiplier, to make the "black area" fill the preview when rotated.

    const beerNameFontSize = Math.max(16, Math.min(flatLabelWidthPx / 8, 70)); // Adjusted for potentially larger canvas

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
          {/* This div handles the rotation and scaling for preview */}
          <div
            style={{
              width: `${flatLabelWidthPx}px`, // 400px
              height: `${flatLabelHeightPx}px`, // 300px
              transform: `rotate(90deg) scale(${scaleToFit})`, // Rotate 90deg right
              transformOrigin: 'center center',
            }}
          >
            {/* This is the actual label content to be captured by html2canvas */}
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

              {/* Inner wrapper for padding and content layout for the horizontal design */}
              <div style={{
                width: '100%', // Takes full 400px width of flatLabelStyle
                height: '100%', // Takes full 300px height of flatLabelStyle
                padding: '1rem', // Padding applied here
                display: 'flex',
                flexDirection: 'column', // Main axis for simplified layout
                justifyContent: 'space-between', // Pushes IBU/Alc and BeerName apart
                alignItems: 'center', // Center BeerName horizontally
                position: 'relative',
                zIndex: 3, 
                boxSizing: 'border-box',
              }}>
                {/* Top row for IBU and Alc */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '14px' }}>
                  <p style={{ textAlign: 'left' }}>IBU: {ibu}</p>
                  <p style={{ textAlign: 'right' }}>Alc: {abv}%</p>
                </div>

                {/* Centered Beer Name */}
                <div style={{ textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
                  <h1
                    className="font-bebas-neue leading-tight"
                    style={{ fontSize: `${beerNameFontSize}px`, wordBreak: 'break-word', hyphens: 'auto', lineHeight: '1.0' }}
                  >
                    {/* Handle multi-word beer names, allowing them to stack */}
                    {beerName.split(' ').map((word, index) => (
                        <div key={index} style={{ display: 'block' }}>{word}</div>
                    ))}
                  </h1>
                </div>
                
                {/* Volume was removed as per screenshot matching
                <div style={{ width: '100%', textAlign: 'center', fontSize: '14px' }}>
                  <p>{volume}</p>
                </div>
                */}
                {/* Placeholder for bottom content if volume is re-added or other elements */}
                 <div style={{ width: '100%', height: '14px' }}>{/* Empty div to balance space if no bottom element*/}</div>


              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LabelPreview.displayName = 'LabelPreview';
