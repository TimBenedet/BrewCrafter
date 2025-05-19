
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

const FLAT_LABEL_BASE_WIDTH_PX = 500;
const PHYSICAL_LABEL_DIMENSIONS = {
  '33CL': { widthCM: 20, heightCM: 7 },  // Physical: 20cm W x 7cm H
  '75CL': { widthCM: 26, heightCM: 9 },  // Physical: 26cm W x 9cm H
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
      backgroundColor: '#333333',
      textColor: '#FFFFFF',
    },
  });

  const watchedVolume = form.watch('volume');
  const watchedBackgroundColor = form.watch('backgroundColor');
  const watchedTextColor = form.watch('textColor');
  const watchedBackgroundImage = form.watch('backgroundImage');
  const watchedBeerName = form.watch('beerName');
  const watchedBreweryName = form.watch('breweryName');
  const watchedTagline = form.watch('tagline');
  const watchedDescription = form.watch('description');
  const watchedIngredients = form.watch('ingredients');
  const watchedBrewingDate = form.watch('brewingDate');
  const watchedBrewingLocation = form.watch('brewingLocation');

  const [flatLabelWidthPx, setFlatLabelWidthPx] = useState(FLAT_LABEL_BASE_WIDTH_PX);
  const [flatLabelHeightPx, setFlatLabelHeightPx] = useState(
    FLAT_LABEL_BASE_WIDTH_PX * (PHYSICAL_LABEL_DIMENSIONS['33CL'].heightCM / PHYSICAL_LABEL_DIMENSIONS['33CL'].widthCM)
  );

  useEffect(() => {
    const physicalDims = PHYSICAL_LABEL_DIMENSIONS[watchedVolume];
    const newHeight = FLAT_LABEL_BASE_WIDTH_PX * (physicalDims.heightCM / physicalDims.widthCM);
    setFlatLabelHeightPx(Math.round(newHeight));
  }, [watchedVolume]);


  useEffect(() => {
    const fetchAndSetRecipeData = async () => {
      if (selectedRecipeSlug && selectedRecipeSlug !== 'none') {
        const result = await getRecipeDetailsAction(selectedRecipeSlug);
        if (result.success && result.recipe) {
          const recipeData = result.recipe;
          form.reset({
            ...form.getValues(),
            selectedRecipeSlug: selectedRecipeSlug,
            beerName: recipeData.name || form.getValues('beerName'),
            description: recipeData.notes || form.getValues('description'),
            ingredients: summarizeIngredients(recipeData.fermentables, recipeData.hops, recipeData.yeasts) || form.getValues('ingredients'),
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
            ...LabelFormSchema.parse({}), 
            selectedRecipeSlug: 'none',
            volume: form.getValues('volume'),
            backgroundColor: form.getValues('backgroundColor'),
            textColor: form.getValues('textColor'),
            backgroundImage: form.getValues('backgroundImage')
         });
        setDisplayIbu('N/A');
        setDisplaySrm('N/A');
        setCurrentSrmHexColor('#CCCCCC');
        setIngredientsSummaryForLabel('N/A');
        setDisplayAbv('N/A');
        toast({ title: "Manual Entry", description: "Fields cleared for manual input." });
      }
    };
    fetchAndSetRecipeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecipeSlug, form.reset, toast]); // form.getValues removed as per lint

  const handleDownloadImage = async (labelContentRef: React.RefObject<HTMLDivElement>, labelName: string) => {
    if (!labelContentRef.current) {
      toast({ title: 'Error', description: 'Label content element not found.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Download Started', description: `Generating ${labelName} image...` });

    const elementToCapture = labelContentRef.current;
    
    // Store original styles to restore them later
    const originalTransform = elementToCapture.style.transform;
    const originalBorder = elementToCapture.style.border;
    const originalBoxShadow = elementToCapture.style.boxShadow;
    const originalMargin = elementToCapture.style.margin;

    // Temporarily apply styles for capture
    elementToCapture.style.transform = 'none';
    elementToCapture.style.border = 'none'; 
    elementToCapture.style.boxShadow = 'none';
    elementToCapture.style.margin = '0'; 
    
    // Force a reflow might be needed in some complex cases, but try without first
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = elementToCapture.offsetHeight; 

    const physicalDimensions = PHYSICAL_LABEL_DIMENSIONS[watchedVolume];
    const dpi = 300;
    const physicalWidthInches = physicalDimensions.widthCM / 2.54;
    const physicalHeightInches = physicalDimensions.heightCM / 2.54;
    
    const targetPixelWidth = Math.round(physicalWidthInches * dpi);
    const targetPixelHeight = Math.round(physicalHeightInches * dpi);

    const elementWidth = elementToCapture.offsetWidth;
    const elementHeight = elementToCapture.offsetHeight;

    // Calculate scale to match DPI
    // Choose scale to fit either width or height, maintaining aspect ratio, up to a max practical scale (e.g., 4)
    const scaleX = targetPixelWidth / elementWidth;
    const scaleY = targetPixelHeight / elementHeight;
    const scale = Math.min(scaleX, scaleY, 4);


    try {
      const canvas = await html2canvas(elementToCapture, {
        scale: scale,
        width: elementWidth, // Use element's current on-screen width/height for html2canvas internal calculations
        height: elementHeight,
        backgroundColor: null, // Capture with transparency if background image is used
        useCORS: true,
        logging: true,
        scrollX: 0, // Ensure content from the start is captured
        scrollY: 0,
        windowWidth: elementWidth, // Provide explicit dimensions to html2canvas
        windowHeight: elementHeight,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${form.getValues('beerName').replace(/\s+/g, '_') || 'my_beer'}_${labelName}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
      toast({ title: 'Download Error', description: 'Could not generate label image.', variant: 'destructive' });
    } finally {
      // Restore original styles
      if (elementToCapture) {
        elementToCapture.style.transform = originalTransform;
        elementToCapture.style.border = originalBorder;
        elementToCapture.style.boxShadow = originalBoxShadow;
        elementToCapture.style.margin = originalMargin;
      }
    }
  };

  const labelDataForPreview = {
    beerName: watchedBeerName,
    breweryName: watchedBreweryName,
    tagline: watchedTagline,
    ibu: displayIbu,
    srm: displaySrm,
    srmHexColor: currentSrmHexColor,
    ingredientsSummary: ingredientsSummaryForLabel,
    abv: displayAbv,
    volume: watchedVolume,
    backgroundColor: watchedBackgroundColor,
    textColor: watchedTextColor,
    backgroundImage: watchedBackgroundImage,
    description: watchedDescription,
    ingredientsList: watchedIngredients,
    brewingDate: watchedBrewingDate,
    brewingLocation: watchedBrewingLocation,
    flatLabelWidthPx: flatLabelWidthPx,
    flatLabelHeightPx: flatLabelHeightPx,
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
