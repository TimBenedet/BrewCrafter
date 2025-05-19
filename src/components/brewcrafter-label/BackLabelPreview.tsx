
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
  flatLabelWidthPx: number; // Expected to be 400px
  flatLabelHeightPx: number; // Expected to be 300px
}

// On-screen preview container dimensions
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
    flatLabelWidthPx, // e.g., 400px
    flatLabelHeightPx, // e.g., 300px
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

  // Styles for the actual label content (the "black area")
  const backLabelStyle: React.CSSProperties = {
    width: `${flatLabelWidthPx}px`, // 400px
    height: `${flatLabelHeightPx}px`, // 300px
    backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
    color: textColor,
    fontFamily: 'var(--font-inter)',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  // Scale the rotated content to fit the preview container
  const scaleToFit = Math.min(
      PREVIEW_CONTAINER_WIDTH_PX / flatLabelHeightPx, // 300 / 300 = 1
      PREVIEW_CONTAINER_HEIGHT_PX / flatLabelWidthPx  // 400 / 400 = 1
  );

  return (
    <div className="w-full flex flex-col items-center">
      <h3 className="text-lg font-semibold mb-2 text-center">Back Label Preview</h3>
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
            {backgroundImage && ( // Overlay for text readability on image
              <div 
                style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                  backgroundColor: 'rgba(0,0,0,0.5)', 
                  zIndex: 2 
                }} 
              />
            )}
            {/* Inner wrapper for padding and content layout for the horizontal design */}
            <div style={{
              width: '100%', // Takes full 400px width
              height: '100%', // Takes full 300px height
              padding: '1rem', 
              position: 'relative',
              zIndex: 3, 
              boxSizing: 'border-box',
              display: 'flex', 
              flexDirection: 'column', 
            }}>
              <ScrollArea className="h-full w-full" style={{ flexGrow: 1 }}>
                <div className="space-y-2 p-1"> {/* Added small padding inside scroll area */}
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
