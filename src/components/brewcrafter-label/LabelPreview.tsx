
'use client';

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Beer } from 'lucide-react'; // Lucide Beer icon

interface LabelPreviewProps {
  beerName: string;
  breweryName: string;
  tagline: string;
  ibu: string;
  srm: string;
  srmHexColor: string;
  ingredientsSummary: string;
  abv: string;
  volume: string; // e.g., "33CL" or "75CL"
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
}

// Dimensions for the "flat" label before rotation (these are for aspect ratio and internal layout)
const FLAT_LABEL_WIDTH_PX = 500; 
const FLAT_LABEL_HEIGHT_33CL_PX = 175; // Approx 20cm x 7cm ratio
const FLAT_LABEL_HEIGHT_75CL_PX = 225; // Approx 24cm x 9cm ratio


export const LabelPreview = forwardRef<HTMLDivElement, LabelPreviewProps>(
  (
    {
      beerName,
      breweryName,
      tagline,
      ibu,
      srm,
      srmHexColor,
      ingredientsSummary,
      abv,
      volume,
      backgroundColor,
      textColor,
      backgroundImage,
    },
    ref
  ) => {
    const flatLabelContentRef = useRef<HTMLDivElement>(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const flatLabelHeight = volume === '75CL' ? FLAT_LABEL_HEIGHT_75CL_PX : FLAT_LABEL_HEIGHT_33CL_PX;
    
    useEffect(() => {
      setIsImageLoaded(false); // Reset when image changes
      if (backgroundImage) {
        const img = new window.Image();
        img.src = backgroundImage;
        img.onload = () => setIsImageLoaded(true);
      }
    }, [backgroundImage]);


    // Style for the flat label content (the div that will be captured by html2canvas)
    const flatLabelStyle: React.CSSProperties = {
      width: `${FLAT_LABEL_WIDTH_PX}px`,
      height: `${flatLabelHeight}px`,
      backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
      color: textColor,
      fontFamily: 'var(--font-inter)',
      position: 'relative', // For absolute positioning of children and overlay
      overflow: 'hidden', // Clip content to label bounds
      display: 'flex',
      flexDirection: 'column', // Main axis for top/center/bottom sections
      border: '1px solid transparent', // Placeholder for potential temporary border during dev
    };

    const beerIconSize = Math.min(FLAT_LABEL_WIDTH_PX, flatLabelHeight) * 0.3; // 30% of shorter dimension

    return (
      <div className="w-full flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2 text-center">Front Label</h3>
        {/* This is the on-screen container that shows the rotated preview */}
        <div 
          className="bg-card border-2 border-primary rounded-md shadow-lg overflow-hidden"
          style={{
            width: '200px', // Fixed width for the vertical preview container
            height: '400px', // Fixed height for the vertical preview container
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* This is the actual label content, rotated and scaled */}
          <div
            ref={ref} // This ref is for html2canvas to capture the non-rotated version
            style={{
              width: `${FLAT_LABEL_WIDTH_PX}px`,
              height: `${flatLabelHeight}px`,
              // Scale to fit, maintain aspect ratio
              transform: `rotate(90deg) scale(${Math.min(380 / FLAT_LABEL_WIDTH_PX, 180 / flatLabelHeight)})`, 
              transformOrigin: 'center center',
              border: '1px dashed hsl(var(--border))', // Visual guide for the flat label in preview
            }}
          >
            {/* Content of the label - this is what gets designed and captured */}
            <div style={flatLabelStyle} ref={flatLabelContentRef}>
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
                  }}
                />
              )}
              {backgroundImage && (
                <div 
                  style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                    backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay
                    zIndex: 1 
                  }} 
                />
              )}

              {/* Label content structure (relative to flatLabelStyle) */}
              <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '10px' }}>
                {/* Top Section (Horizontal) */}
                <div className="text-center mb-1">
                  <p className="text-[7px] leading-tight">IBU: {ibu} &nbsp;|&nbsp; SRM: {srm}</p>
                  <p className="text-[7px] leading-tight mt-0.5"><strong className="font-semibold">Ingrédients:</strong> {ingredientsSummary}</p>
                </div>

                {/* Middle Section (Flex container for vertical text and icon) */}
                <div className="flex-grow flex items-center justify-between px-1">
                  {/* Left Vertical Text */}
                  <div 
                    className="font-bebas-neue font-bold text-xl" 
                    style={{ 
                      writingMode: 'vertical-rl', 
                      transform: 'rotate(180deg)', // Corrects text orientation for vertical-rl
                      whiteSpace: 'nowrap',
                      marginLeft: '2px', // Small margin from edge
                      textAlign: 'center'
                    }}
                  >
                    {beerName}
                  </div>

                  {/* Center Icon */}
                  <div className="flex justify-center items-center flex-grow">
                    <Beer
                      style={{
                        width: `${beerIconSize}px`,
                        height: `${beerIconSize}px`,
                        fill: srmHexColor,
                        stroke: 'hsl(var(--primary))',
                        strokeWidth: 1.5,
                      }}
                    />
                  </div>

                  {/* Right Vertical Text */}
                  <div 
                    className="text-xs"
                    style={{ 
                      writingMode: 'vertical-rl', 
                      transform: 'rotate(180deg)',
                      whiteSpace: 'nowrap',
                      marginRight: '2px', // Small margin from edge
                      textAlign: 'center'
                    }}
                  >
                    {volume} - {abv}% alc.
                  </div>
                </div>

                {/* Bottom Section (Horizontal) */}
                <div className="text-center mt-1">
                  <p className="text-[10px] font-bold leading-tight" style={{color: 'hsl(var(--primary))'}}>{breweryName}</p>
                  <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{tagline}</p>
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
