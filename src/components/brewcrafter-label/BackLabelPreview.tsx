
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

const PREVIEW_CONTAINER_WIDTH_PX = 300;
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
    boxSizing: 'border-box',
  };

  const scaleToFit = Math.min(
      PREVIEW_CONTAINER_WIDTH_PX / flatLabelHeightPx, 
      PREVIEW_CONTAINER_HEIGHT_PX / flatLabelWidthPx  
  ) * 0.93;

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
            transform: `rotate(-90deg) scale(${scaleToFit})`, // Changed to -90deg
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
                  backgroundColor: 'rgba(0,0,0,0.5)', 
                  zIndex: 2 
                }} 
              />
            )}
            {/* Inner wrapper for padding and content layout */}
            <div style={{
              width: '100%',
              height: '100%',
              padding: '1rem', // Padding applied here
              position: 'relative',
              zIndex: 3, // Content on top of background/overlay
              boxSizing: 'border-box',
              display: 'flex', // Added to allow ScrollArea to fill height
              flexDirection: 'column', // Added for ScrollArea
            }}>
              <ScrollArea className="h-full w-full" style={{ flexGrow: 1 }}> {/* ScrollArea takes remaining space */}
                <div className="space-y-2 p-1">
                  <div>
                    <p className="font-semibold text-sm mb-0.5">Description</p>
                    <p className="text-xs leading-snug">{description}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-0.5">Ingredients</p>
                    <p className="text-xs leading-snug whitespace-pre-wrap">{ingredientsList}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-0.5">Brewed on:</p>
                    <p className="text-xs leading-snug">{brewingDate}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-0.5">Brewed by:</p>
                    <p className="text-xs leading-snug">{brewingLocation}</p>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
);
BackLabelPreview.displayName = 'BackLabelPreview';
