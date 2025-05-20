
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

// Define the design canvas dimensions (vertical label)
const DESIGN_CANVAS_WIDTH_PX = 300;
const DESIGN_CANVAS_HEIGHT_PX = 400;

// Physical dimensions for a typical VERTICAL label on a bottle
// Adjusted 33CL width to maintain 0.75 aspect ratio (300/400)
const PHYSICAL_LABEL_DIMENSIONS = {
  '33CL': { widthCM: 7.5, heightCM: 10 }, 
  '75CL': { widthCM: 9, heightCM: 12 }, 
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
      ibuForLabel: '65', 
      abvForLabel: '6.8', 
      description: 'A juicy and hazy IPA, bursting with tropical fruit aromas and a smooth, pillowy mouthfeel. Perfect for exploring the cosmos or just chilling on your couch.',
      ingredients: 'Water, Barley Malts (Pilsen, Vienna, CaraPils), Flaked Oats, Wheat Malt, Hops (Citra, Mosaic, Galaxy), Yeast.',
      brewingDate: 'Brewed on: 15/07/2024',
      brewingLocation: 'Starbase Brewery, Alpha Nebula',
      breweryName: 'Galaxy Brews Co.',
      tagline: 'Crafted with passion, enjoyed with friends.',
      backgroundImage: undefined,
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
    },
  });

  const watchedVolume = form.watch('volume');
  const watchedBackgroundColor = form.watch('backgroundColor');
  const watchedTextColor = form.watch('textColor');
  const watchedBackgroundImage = form.watch('backgroundImage');
  const watchedBeerName = form.watch('beerName');
  const watchedIbuForLabel = form.watch('ibuForLabel');
  const watchedAbvForLabel = form.watch('abvForLabel');
  const watchedDescription = form.watch('description');
  const watchedIngredients = form.watch('ingredients');
  const watchedBrewingDate = form.watch('brewingDate');
  const watchedBrewingLocation = form.watch('brewingLocation');

  const flatLabelWidthPx = DESIGN_CANVAS_WIDTH_PX;
  const flatLabelHeightPx = DESIGN_CANVAS_HEIGHT_PX;

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
            ibuForLabel: recipeData.ibu?.toFixed(0) || 'N/A',
            abvForLabel: recipeData.abv?.toFixed(1) || 'N/A',
            description: recipeData.notes || form.getValues('description'),
            ingredients: summarizeIngredients(recipeData.fermentables, recipeData.hops, recipeData.yeasts) || form.getValues('ingredients'),
            backgroundColor: form.getValues('backgroundColor'),
            textColor: form.getValues('textColor'),
            backgroundImage: form.getValues('backgroundImage'),
            breweryName: form.getValues('breweryName'),
            tagline: form.getValues('tagline'),
            brewingDate: form.getValues('brewingDate'), 
            brewingLocation: form.getValues('brewingLocation'), 
            volume: form.getValues('volume'),
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
            ...LabelFormSchema.parse({ 
                ibuForLabel: 'N/A',
                abvForLabel: 'N/A',
            }), 
            selectedRecipeSlug: 'none', 
            volume: form.getValues('volume'),
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
    
    const physicalDimensions = PHYSICAL_LABEL_DIMENSIONS[watchedVolume];
    const dpi = 300;
    
    const physicalWidthInches = physicalDimensions.widthCM / 2.54; 
    const physicalHeightInches = physicalDimensions.heightCM / 2.54;
    
    const targetPixelWidth = Math.round(physicalWidthInches * dpi);
    const targetPixelHeight = Math.round(physicalHeightInches * dpi);

    const elementWidth = DESIGN_CANVAS_WIDTH_PX; 
    const elementHeight = DESIGN_CANVAS_HEIGHT_PX;

    const scaleX = targetPixelWidth / elementWidth;
    const scaleY = targetPixelHeight / elementHeight;
    const scale = Math.min(scaleX, scaleY, 8); 

    try {
      const canvas = await html2canvas(elementToCapture, {
        scale: scale, 
        width: elementWidth, 
        height: elementHeight,
        backgroundColor: null, 
        useCORS: true, 
        logging: false, 
        scrollX: 0, 
        scrollY: 0,
        windowWidth: elementWidth, 
        windowHeight: elementHeight,
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${form.getValues('beerName').replace(/\s+/g, '_') || 'my_beer'}_${labelName}.png`;
      link.href = image;
      link.click();
      toast({ title: 'Download Complete!', description: `${labelName} has been downloaded.` });
    } catch (err) {
      console.error("Error generating image:", err);
      toast({ title: 'Download Error', description: 'Could not generate label image.', variant: 'destructive' });
    }
  };

  const labelDataForPreview = {
    beerName: watchedBeerName,
    ibu: watchedIbuForLabel, 
    abv: watchedAbvForLabel, 
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
            <CardTitle className="font-semibold uppercase tracking-wide text-foreground">Label Previews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start justify-center"> 
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

    
