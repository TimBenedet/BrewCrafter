
'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LabelFormSchema, type LabelFormValues } from '@/types/label';
import type { RecipeSummary } from '@/types/recipe';
import { getRecipeDetailsAction } from '@/app/actions/recipe-actions';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

import { LabelControls } from './LabelControls';
import { LabelPreview } from './LabelPreview';
import { BackLabelPreview } from './BackLabelPreview';
import { srmToHex, summarizeIngredients } from '@/lib/utils';

interface LabelStudioClientProps {
  initialRecipes: RecipeSummary[];
}

// Define the design canvas dimensions (pre-rotation for preview)
const DESIGN_CANVAS_WIDTH_PX = 400;
const DESIGN_CANVAS_HEIGHT_PX = 300;

const PHYSICAL_LABEL_DIMENSIONS = {
  '33CL': { widthCM: 20, heightCM: 7 },
  '75CL': { widthCM: 26, heightCM: 9 },
};

export function LabelStudioClient({ initialRecipes }: LabelStudioClientProps) {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<RecipeSummary[]>(initialRecipes);
  const [selectedRecipeSlug, setSelectedRecipeSlug] = useState<string | undefined>(undefined);
  
  const [displayIbu, setDisplayIbu] = useState<string>('N/A');
  const [displaySrm, setDisplaySrm] = useState<string>('N/A');
  const [currentSrmHexColor, setCurrentSrmHexColor] = useState<string>('#CCCCCC');
  const [ingredientsSummaryForLabel, setIngredientsSummaryForLabel] = useState<string>('N/A');
  const [displayAbv, setDisplayAbv] = useState<string>('N/A');
  
  const frontLabelContentRef = useRef<HTMLDivElement>(null);
  const backLabelContentRef = useRef<HTMLDivElement>(null);


  const form = useForm<LabelFormValues>({
    resolver: zodResolver(LabelFormSchema),
    defaultValues: {
      selectedRecipeSlug: '',
      volume: '33CL',
      beerName: 'Cosmic Haze IPA',
      description: 'A juicy and hazy IPA, bursting with tropical fruit aromas and a smooth, pillowy mouthfeel. Perfect for exploring the cosmos or just chilling on your couch.',
      ingredients: 'Water, Barley Malts (Pilsen, Vienna, CaraPils), Flaked Oats, Wheat Malt, Hops (Citra, Mosaic, Galaxy), Yeast.',
      brewingDate: 'Brewed on: 15/07/2024',
      brewingLocation: 'Starbase Brewery, Alpha Nebula',
      breweryName: 'Galaxy Brews Co.',
      tagline: 'Crafted with passion, enjoyed with friends.',
      backgroundImage: undefined,
      backgroundColor: '#000000', // Default to black for the "black area"
      textColor: '#FFFFFF',
    },
  });

  const watchedVolume = form.watch('volume');
  const watchedBackgroundColor = form.watch('backgroundColor');
  const watchedTextColor = form.watch('textColor');
  const watchedBackgroundImage = form.watch('backgroundImage');
  const watchedBeerName = form.watch('beerName');
  const watchedBreweryName = form.watch('breweryName'); // This was missing, added it.
  const watchedTagline = form.watch('tagline'); // This was missing, added it.
  const watchedDescription = form.watch('description');
  const watchedIngredients = form.watch('ingredients');
  const watchedBrewingDate = form.watch('brewingDate');
  const watchedBrewingLocation = form.watch('brewingLocation');

  // flatLabelWidthPx and flatLabelHeightPx now refer to the design canvas dimensions
  const flatLabelWidthPx = DESIGN_CANVAS_WIDTH_PX;
  const flatLabelHeightPx = DESIGN_CANVAS_HEIGHT_PX;

  useEffect(() => {
    const fetchAndSetRecipeData = async () => {
      if (selectedRecipeSlug && selectedRecipeSlug !== 'none') {
        const result = await getRecipeDetailsAction(selectedRecipeSlug);
        if (result.success && result.recipe) {
          const recipeData = result.recipe;
          form.reset({
            ...form.getValues(), // Keep current form values for fields not in recipe
            selectedRecipeSlug: selectedRecipeSlug,
            beerName: recipeData.name || form.getValues('beerName'),
            description: recipeData.notes || form.getValues('description'),
            ingredients: summarizeIngredients(recipeData.fermentables, recipeData.hops, recipeData.yeasts) || form.getValues('ingredients'),
            // Retain existing color/image choices unless we want to override them
            backgroundColor: form.getValues('backgroundColor'),
            textColor: form.getValues('textColor'),
            backgroundImage: form.getValues('backgroundImage'),
            breweryName: form.getValues('breweryName'),
            tagline: form.getValues('tagline'),
            brewingDate: form.getValues('brewingDate'), // These might not be in recipe
            brewingLocation: form.getValues('brewingLocation'), // These might not be in recipe
            volume: form.getValues('volume'), // Keep selected volume
          });

          setDisplayIbu(recipeData.ibu?.toFixed(0) || 'N/A');
          setDisplaySrm(recipeData.color?.toFixed(0) || 'N/A');
          setCurrentSrmHexColor(srmToHex(recipeData.color));
          setIngredientsSummaryForLabel(summarizeIngredients(recipeData.fermentables, recipeData.hops, recipeData.yeasts));
          setDisplayAbv(recipeData.abv?.toFixed(1) || 'N/A');
          
          toast({ title: "Recipe Loaded", description: `${recipeData.name} data has been pre-filled.` });
        } else {
          toast({ title: "Error", description: `Failed to load recipe: ${result.error}`, variant: "destructive" });
          setDisplayIbu('N/A');
          setDisplaySrm('N/A');
          setCurrentSrmHexColor('#CCCCCC');
          setIngredientsSummaryForLabel('N/A');
          setDisplayAbv('N/A');
        }
      } else if (selectedRecipeSlug === 'none') {
         form.reset({
            ...LabelFormSchema.parse({}), // Resets to Zod default values
            selectedRecipeSlug: 'none',
            volume: form.getValues('volume'), // Keep selected volume
            // Explicitly keep design choices if user switches to "None"
            backgroundColor: form.getValues('backgroundColor'),
            textColor: form.getValues('textColor'),
            backgroundImage: form.getValues('backgroundImage'),
            breweryName: form.getValues('breweryName'),
            tagline: form.getValues('tagline'),
         });
        setDisplayIbu('N/A');
        setDisplaySrm('N/A');
        setCurrentSrmHexColor('#CCCCCC');
        setIngredientsSummaryForLabel('N/A');
        setDisplayAbv('N/A');
        toast({ title: "Manual Entry", description: "Fields cleared for manual input (design choices preserved)." });
      }
    };
    fetchAndSetRecipeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecipeSlug, form.reset, toast]);

  const handleDownloadImage = async (labelContentRef: React.RefObject<HTMLDivElement>, labelName: string) => {
    if (!labelContentRef.current) {
      toast({ title: 'Error', description: 'Label content element not found.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Download Started', description: `Generating ${labelName} image...` });

    const elementToCapture = labelContentRef.current;
    
    const originalTransform = elementToCapture.style.transform;
    // Note: We are capturing the element as it is designed (400x300, horizontal content)
    // No border/shadow/margin reset needed here as these styles are on the preview container, not the capture ref.
    
    elementToCapture.style.transform = 'none'; // Ensure no stray transforms interfere with capture size
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = elementToCapture.offsetHeight; 

    const physicalDimensions = PHYSICAL_LABEL_DIMENSIONS[watchedVolume];
    const dpi = 300;
    
    // The downloaded image should reflect the physical label's aspect ratio and DPI.
    // The capture source is DESIGN_CANVAS_WIDTH_PX x DESIGN_CANVAS_HEIGHT_PX (400x300).
    // If the physical label is, e.g., 20cm W x 7cm H.
    const physicalWidthInches = physicalDimensions.widthCM / 2.54;
    const physicalHeightInches = physicalDimensions.heightCM / 2.54;
    
    const targetPixelWidth = Math.round(physicalWidthInches * dpi); // e.g., for 20cm -> ~2362px
    const targetPixelHeight = Math.round(physicalHeightInches * dpi); // e.g., for 7cm -> ~827px

    // elementToCapture dimensions are DESIGN_CANVAS_WIDTH_PX and DESIGN_CANVAS_HEIGHT_PX
    const elementWidth = DESIGN_CANVAS_WIDTH_PX; // 400
    const elementHeight = DESIGN_CANVAS_HEIGHT_PX; // 300

    // Calculate scale to map the 400x300 canvas to the targetPixelWidth x targetPixelHeight
    // This will stretch/squash if aspect ratios don't match.
    // For example, if physical is 20x7 (ratio 2.85) and design is 400x300 (ratio 1.33), it will be squashed vertically.
    // This is intentional if the design canvas is fixed but output needs to match varying physical shapes.
    const scaleX = targetPixelWidth / elementWidth;
    const scaleY = targetPixelHeight / elementHeight;
    
    // To maintain aspect ratio of the *design*, we should use the smaller scale factor
    // and then the canvas will be sized accordingly. Or, if we want to fill the target dimensions,
    // html2canvas needs to be told the target canvas size.
    // For best quality, we scale up the capture.
    const scale = Math.min(scaleX, scaleY, 8); // Cap scale to avoid memory issues, e.g. 8x

    try {
      const canvas = await html2canvas(elementToCapture, {
        scale: scale, // Use the calculated scale
        width: elementWidth, 
        height: elementHeight,
        backgroundColor: null, 
        useCORS: true,
        logging: true,
        scrollX: 0, 
        scrollY: 0,
        windowWidth: elementWidth, 
        windowHeight: elementHeight,
      });

      // If we want the output image to strictly be targetPixelWidth x targetPixelHeight,
      // we might need to draw the captured canvas onto a new canvas of those dimensions.
      // For now, html2canvas with scale will produce canvas.width = elementWidth * scale.
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${form.getValues('beerName').replace(/\s+/g, '_') || 'my_beer'}_${labelName}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
      toast({ title: 'Download Error', description: 'Could not generate label image.', variant: 'destructive' });
    } finally {
      if (elementToCapture) {
        elementToCapture.style.transform = originalTransform;
      }
    }
  };

  const labelDataForPreview = {
    beerName: watchedBeerName,
    // breweryName: watchedBreweryName, // Not used in simplified front label
    // tagline: watchedTagline, // Not used in simplified front label
    ibu: displayIbu,
    // srm: displaySrm, // Not used directly in simplified front label elements
    // srmHexColor: currentSrmHexColor, // Not used in simplified front label
    // ingredientsSummary: ingredientsSummaryForLabel, // Not used in simplified front label
    abv: displayAbv,
    volume: watchedVolume,
    backgroundColor: watchedBackgroundColor,
    textColor: watchedTextColor,
    backgroundImage: watchedBackgroundImage,
    description: watchedDescription,
    ingredientsList: watchedIngredients,
    brewingDate: watchedBrewingDate,
    brewingLocation: watchedBrewingLocation,
    flatLabelWidthPx: flatLabelWidthPx, // Should be 400
    flatLabelHeightPx: flatLabelHeightPx, // Should be 300
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <LabelControls
          form={form}
          recipes={recipes}
          onRecipeSelect={setSelectedRecipeSlug}
          selectedRecipeSlug={selectedRecipeSlug}
        />
      </div>
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-bebas-neue tracking-wide">Label Previews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <LabelPreview {...labelDataForPreview} ref={frontLabelContentRef} />
              <BackLabelPreview {...labelDataForPreview} ref={backLabelContentRef} />
            </div>
            <div className="flex flex-col items-center space-y-2 mt-4">
              <Button 
                onClick={() => handleDownloadImage(frontLabelContentRef, 'front_label')} 
                className="w-full sm:w-auto"
                disabled={!frontLabelContentRef.current}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Front Label
              </Button>
              <Button 
                onClick={() => handleDownloadImage(backLabelContentRef, 'back_label')} 
                className="w-full sm:w-auto"
                variant="outline"
                disabled={!backLabelContentRef.current}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Back Label
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
