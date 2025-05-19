
'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import { Beer } from 'lucide-react';

interface LabelPreviewProps {
  beerName: string;
  breweryName: string;
  tagline: string;
  ibu: string;
  srm: string;
  srmHexColor: string;
  ingredientsSummary: string;
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
      display: 'flex', // Added for safety, though children are absolute
      flexDirection: 'column',
      padding: '1rem', // p-4 equivalent
    };

    // Scale factor for fitting the rotated flat label into the preview container
    // Ensure it fits both width-wise (when rotated) and height-wise
    const scaleToFit = Math.min(
      (PREVIEW_CONTAINER_HEIGHT_PX - 20) / flatLabelWidthPx, // -20 for some padding in preview
      (PREVIEW_CONTAINER_WIDTH_PX - 20) / flatLabelHeightPx,
      0.75 // Max scale to ensure it's not too large
    ); 
    
    const beerIconSize = Math.min(flatLabelWidthPx, flatLabelHeightPx) * 0.4; // 40% of shorter dimension of flat label

    return (
      <div className="w-full flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2 text-center">Front Label</h3>
        <div
          className="bg-card border-2 border-primary rounded-md shadow-lg flex items-center justify-center overflow-hidden"
          style={{
            width: `${PREVIEW_CONTAINER_WIDTH_PX}px`,
            height: `${PREVIEW_CONTAINER_HEIGHT_PX}px`,
          }}
        >
          {/* This div is for rotating and scaling the flatLabelContent for on-screen preview */}
          <div
            style={{
              width: `${flatLabelWidthPx}px`,
              height: `${flatLabelHeightPx}px`,
              transform: `rotate(90deg) scale(${scaleToFit})`,
              transformOrigin: 'center center',
            }}
          >
            {/* This is the actual label content (flatLabelContentRef) */}
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
                    zIndex: 1,
                  }}
                />
              )}

              {/* Label elements - ZIndex 2 to be above overlay */}
              <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
                {/* Top Information Block */}
                <div
                  className="text-center px-1"
                  style={{
                    position: 'absolute',
                    top: '0.5rem', // top-2 from padding edge
                    left: '0', 
                    right: '0',
                    color: 'hsl(var(--primary))', // text-primary
                  }}
                >
                  <p className="text-[7px] whitespace-nowrap overflow-hidden text-ellipsis">
                    IBU: {ibu} &nbsp;|&nbsp; SRM: {srm}
                  </p>
                  <p className="text-[7px] mt-0.5 whitespace-normal">
                    <span className="font-semibold">Ingrédients:</span> {ingredientsSummary}
                  </p>
                </div>

                {/* Left Side Text (Beer Name) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '0.5rem', // 0.5rem from left padding edge
                    transform: 'translateY(-50%) rotate(180deg)',
                    writingMode: 'vertical-rl',
                    maxHeight: `calc(100% - ${flatLabelHeightPx * 0.25}px)`, // Approx space, adjust as needed
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'hsl(var(--primary))', // text-primary
                  }}
                  className="font-bebas-neue text-xl font-bold" // font-heading
                >
                  {beerName}
                </div>

                {/* Right Side Text (Volume & ABV) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '0.5rem', // 0.5rem from right padding edge
                    transform: 'translateY(-50%) rotate(180deg)',
                    writingMode: 'vertical-rl',
                    maxHeight: `calc(100% - ${flatLabelHeightPx * 0.25}px)`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'hsl(var(--primary))', // text-primary
                  }}
                  className="text-xs"
                >
                  <span>{volume} - {abv}% alc.</span>
                </div>
                
                {/* Center Icon */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 'auto', // For flex centering
                  }}
                >
                  <Beer
                    style={{
                      width: `${beerIconSize}px`,
                      height: `${beerIconSize}px`,
                      fill: srmHexColor,
                      stroke: 'hsl(var(--primary))',
                      strokeWidth: 1.5,
                      transform: 'rotate(-90deg)', // Handle points "up" on flat horizontal label
                    }}
                  />
                </div>

                {/* Bottom Centered Text */}
                <div
                  className="text-center px-2"
                  style={{
                    position: 'absolute',
                    bottom: '0.5rem', // bottom-2 from padding edge
                    left: '0',
                    right: '0',
                  }}
                >
                  <p className="text-[10px] font-semibold" style={{color: 'hsl(var(--primary))'}}>{breweryName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{tagline}</p>
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
