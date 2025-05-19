
'use client';

import React, { forwardRef, useEffect, useState } from 'react';

interface LabelPreviewProps {
  beerName: string;
  ibu: string;
  abv: string;
  volume: '33CL' | '75CL';
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
  flatLabelWidthPx: number;
  flatLabelHeightPx: number;
}

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
      width: `${flatLabelWidthPx}px`, // Should be 300px
      height: `${flatLabelHeightPx}px`, // Should be 400px
      backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
      color: textColor,
      fontFamily: 'var(--font-inter)',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    };

    const beerNameFontSize = Math.max(24, Math.min(flatLabelWidthPx / 4.5, 70)); // Adjusted for better fit

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

            <div
              style={{
                width: '100%',
                height: '100%',
                paddingTop: '0.5rem', // Reduced top padding to move IBU/Alc and subsequently beer name up
                paddingRight: '0.75rem',
                paddingBottom: '0.75rem',
                paddingLeft: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 3,
                boxSizing: 'border-box',
              }}
            >
              {/* Top row for IBU and Alc */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.9rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, lineHeight: '1.1', fontWeight: '600' }}>IBU</p>
                  <p style={{ margin: 0, lineHeight: '1.1' }}>{ibu}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, lineHeight: '1.1', fontWeight: '600' }}>Alc.</p>
                  <p style={{ margin: 0, lineHeight: '1.1' }}>{abv}%</p>
                </div>
              </div>

              {/* Centered Beer Name */}
              <div
                style={{
                  textAlign: 'center',
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.25rem 0', 
                }}
              >
                <h1
                  className="font-bebas-neue"
                  style={{
                    fontSize: `${beerNameFontSize}px`,
                    wordBreak: 'break-word',
                    hyphens: 'auto',
                    lineHeight: '1.0', 
                    margin: 0, 
                  }}
                >
                  {beerName.split(' ').map((word, index) => (
                    <div key={index} style={{ display: 'block', lineHeight: '1.0' }}> 
                      {word}
                    </div>
                  ))}
                </h1>
              </div>

              {/* Bottom Volume */}
              <div style={{ width: '100%', textAlign: 'center' }}>
                <p style={{ fontSize: '1rem', margin: 0, lineHeight: '1.1' }}>{volume}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LabelPreview.displayName = 'LabelPreview';
