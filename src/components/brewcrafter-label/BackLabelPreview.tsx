
'use client';

import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BackLabelPreviewProps {
  description: string;
  ingredientsList: string;
  brewingDate: string;
  brewingLocation: string;
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
}

export function BackLabelPreview({
  description,
  ingredientsList,
  brewingDate,
  brewingLocation,
  backgroundColor,
  textColor,
  backgroundImage,
}: BackLabelPreviewProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
    
  useEffect(() => {
    setIsImageLoaded(false);
    if (backgroundImage) {
      const img = new window.Image();
      img.src = backgroundImage;
      img.onload = () => setIsImageLoaded(true);
    }
  }, [backgroundImage]);

  // Fixed dimensions for the on-screen preview container (similar to front label's container)
  const PREVIEW_CONTAINER_WIDTH = '200px';
  const PREVIEW_CONTAINER_HEIGHT = '200px'; // Back label might be shorter or different aspect ratio

  // Style for the actual content of the back label
  const backLabelStyle: React.CSSProperties = {
    width: '100%', // Fill the preview container
    height: '100%',
    backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
    color: textColor,
    fontFamily: 'var(--font-inter)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px', // Internal padding for the content
    fontSize: '10px', // Smaller base font for back label
    lineHeight: '1.4',
  };

  return (
    <div className="w-full flex flex-col items-center">
      <h3 className="text-lg font-semibold mb-2 text-center">Back Label</h3>
      <div 
        className="bg-card border-2 border-primary rounded-md shadow-lg"
        style={{
          width: PREVIEW_CONTAINER_WIDTH,
          height: PREVIEW_CONTAINER_HEIGHT,
        }}
      >
        <div style={backLabelStyle} className="back-label-content-ref"> {/* Add ref here if downloading separately */}
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
                backgroundColor: 'rgba(0,0,0,0.5)', // Darker overlay for back text readability
                zIndex: 1 
              }} 
            />
          )}
          <ScrollArea className="h-full w-full" style={{position: 'relative', zIndex: 2}}>
            <div className="p-2 space-y-1.5"> {/* Padding inside scroll area */}
              <div>
                <strong className="font-semibold">Description:</strong>
                <p className="text-xs">{description}</p>
              </div>
              <div>
                <strong className="font-semibold">Ingredients:</strong>
                <p className="text-xs whitespace-pre-wrap">{ingredientsList}</p>
              </div>
              <div>
                <strong className="font-semibold">Brewing Date:</strong>
                <p className="text-xs">{brewingDate}</p>
              </div>
              <div>
                <strong className="font-semibold">Brewing Location:</strong>
                <p className="text-xs">{brewingLocation}</p>
              </div>
              {/* Placeholder for more content */}
              <p className="text-xs mt-2 text-muted-foreground">
                Store in a cool, dark place. Enjoy responsibly.
              </p>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
