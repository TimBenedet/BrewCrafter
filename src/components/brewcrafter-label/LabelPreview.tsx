
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
      flatLabelWidthPx, // Should be 300px
      flatLabelHeightPx, // Should be 400px
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
    // This is designed to be vertical, 300px wide x 400px high.
    const flatLabelStyle: React.CSSProperties = {
      width: `${flatLabelWidthPx}px`, 
      height: `${flatLabelHeightPx}px`, 
      backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
      color: textColor,
      fontFamily: 'var(--font-inter)',
      position: 'relative',
      overflow: 'hidden', // Important for design boundaries
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    };
    
    // Calculate dynamic font size for beer name
    // Adjust multiplier for desired relative size; smaller for smaller text.
    const beerNameFontSize = Math.max(24, Math.min(flatLabelWidthPx / 4.5, 70));


    const textContentStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        paddingTop: '0.5rem', // Reduced top padding to move IBU/Alc and subsequently beer name up
        paddingRight: '0.75rem',
        paddingBottom: '0.75rem',
        paddingLeft: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between', // Pushes top elements up, bottom elements down
        position: 'relative',
        zIndex: 3, // Ensure text is above background overlays
        boxSizing: 'border-box',
    };


    return (
      <div className="w-full flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2 text-center">Front Label Preview</h3>
        <div
          className="bg-card border-2 border-primary rounded-md shadow-lg flex items-center justify-center overflow-hidden max-w-full"
          style={{
            width: `${PREVIEW_CONTAINER_WIDTH_PX}px`, 
            height: `${PREVIEW_CONTAINER_HEIGHT_PX}px`,
          }}
        >
          {/* This is the actual label content to be captured by html2canvas */}
          {/* No rotation needed here, content is designed as vertical */}
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
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                  backgroundColor: 'rgba(0,0,0,0.4)', // Adjusted overlay darkness
                  zIndex: 2 
                }} 
              />
            )}
            {/* Inner wrapper for padding and content layout for the VERTICAL design */}
            <div style={textContentStyle}>
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
                    flexGrow: 1, // Allows this section to take up available vertical space
                    display: 'flex',
                    flexDirection: 'column', // Ensure children stack vertically if beer name wraps
                    alignItems: 'center',
                    justifyContent: 'center', // Vertically centers the content
                    padding: '0.25rem 0', // Small vertical padding around beer name
                    }}
                >
                    <h1
                    className="font-bebas-neue" // Ensure Bebas Neue is applied
                    style={{
                        fontSize: `${beerNameFontSize}px`,
                        wordBreak: 'break-word', 
                        hyphens: 'auto',
                        lineHeight: '1.0', // Tight line height for multi-word names
                        margin: 0, // Remove default h1 margin
                    }}
                    >
                    {/* Handle multi-word beer names by splitting and rendering each word in a block
                        This helps with centering and line breaking for the Bebas Neue font.
                    */}
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
