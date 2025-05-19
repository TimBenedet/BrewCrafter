
'use client';

import React, { forwardRef, useEffect, useState } from 'react';

interface LabelPreviewProps {
  beerName: string;
  ibu: string; // Now expects the direct string value from the form
  abv: string; // Now expects the direct string value from the form
  volume: '33CL' | '75CL';
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
      volume,
      backgroundColor,
      textColor,
      backgroundImage,
      flatLabelWidthPx, 
      flatLabelHeightPx, 
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
            width: `${PREVIEW_CONTAINER_WIDTH_PX}px`, 
            height: `${PREVIEW_CONTAINER_HEIGHT_PX}px`, 
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

            <div style={{
              width: '100%', 
              height: '100%', 
              padding: '1rem', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between', // Pushes top and bottom content to edges
              alignItems: 'center', // Centers beer name and volume
              position: 'relative',
              zIndex: 3, 
              boxSizing: 'border-box',
            }}>
              {/* Top row for IBU and Alc */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem' }}>
                <div style={{ textAlign: 'left' }}>
                  <p className="font-semibold">IBU</p>
                  <p>{ibu}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="font-semibold">Alc.</p>
                  <p>{abv}%</p>
                </div>
              </div>

              {/* Centered Beer Name and Volume */}
              <div style={{ textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
                <h1
                  className="font-bebas-neue leading-tight" 
                  style={{ fontSize: `${beerNameFontSize}px`, wordBreak: 'break-word', hyphens: 'auto', lineHeight: '1.0' }}
                >
                  {beerName.split(' ').map((word, index) => (
                      <div key={index} style={{ display: 'block' }}>{word}</div>
                  ))}
                </h1>
                <p style={{ fontSize: '1rem', marginTop: '0.5rem' }}>{volume}</p>
              </div>
              
              {/* Bottom placeholder - to ensure space-between works correctly */}
               <div style={{ width: '100%', height: '1.2rem' }}>{/* Empty div to balance space, height matches approx top row */}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LabelPreview.displayName = 'LabelPreview';
