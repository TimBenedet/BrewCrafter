
'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BackLabelPreviewProps {
  description: string;
  ingredientsList: string;
  brewingDate: string;
  brewingLocation: string;
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
  flatLabelWidthPx: number;
  flatLabelHeightPx: number;
}

// On-screen preview container dimensions (same as front)
const PREVIEW_CONTAINER_WIDTH_PX = 200;
const PREVIEW_CONTAINER_HEIGHT_PX = 400;


export const BackLabelPreview = forwardRef<HTMLDivElement, BackLabelPreviewProps>(
  ({
    description,
    ingredientsList,
    brewingDate,
    brewingLocation,
    backgroundColor,
    textColor,
    backgroundImage,
    flatLabelWidthPx, 
    flatLabelHeightPx,
  }, ref) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
    
  useEffect(() => {
    setIsImageLoaded(false);
    if (backgroundImage) {
      const img = new window.Image();
      img.src = backgroundImage;
      img.onload = () => setIsImageLoaded(true);
    }
  }, [backgroundImage]);

  const backLabelStyle: React.CSSProperties = {
    width: `${flatLabelWidthPx}px`,
    height: `${flatLabelHeightPx}px`,
    backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
    color: textColor,
    fontFamily: 'var(--font-inter)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem', // p-4
    fontSize: '10px', 
    lineHeight: '1.4',
    boxSizing: 'border-box',
  };

  const scaleToFit = Math.min(
    (PREVIEW_CONTAINER_HEIGHT_PX - 20) / flatLabelWidthPx, 
    (PREVIEW_CONTAINER_WIDTH_PX - 20) / flatLabelHeightPx,
    0.85 // Max scale, slightly increased
  );

  return (
    <div className="w-full flex flex-col items-center">
      <h3 className="text-lg font-semibold mb-2 text-center">Back Label Preview</h3>
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
          <div style={backLabelStyle} ref={ref} className="back-label-content-for-capture">
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
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                  backgroundColor: 'rgba(0,0,0,0.5)', // Darker overlay
                  zIndex: 2 
                }} 
              />
            )}
            <ScrollArea className="h-full w-full" style={{position: 'relative', zIndex: 3}}>
              <div className="space-y-3 p-1"> {/* Inner padding for scroll content */}
                <div>
                  <p className="font-semibold text-sm mb-1">Description</p>
                  <p className="text-xs leading-relaxed">{description}</p>
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">Ingredients</p>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{ingredientsList}</p>
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">Brewed on:</p>
                  <p className="text-xs leading-relaxed">{brewingDate}</p>
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">Brewed by:</p>
                  <p className="text-xs leading-relaxed">{brewingLocation}</p>
                </div>
                {/* Removed "Store in cool dark place" text to match simpler screenshot */}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
);
BackLabelPreview.displayName = 'BackLabelPreview';
