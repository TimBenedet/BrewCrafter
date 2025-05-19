
'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LabelFormSchema, type LabelFormValues, type LabelRecipeData } from '@/types/label';
import type { RecipeSummary, BeerXMLRecipe } from '@/types/recipe';
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

export function LabelStudioClient({ initialRecipes }: LabelStudioClientProps) {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<RecipeSummary[]>(initialRecipes);
  const [selectedRecipeSlug, setSelectedRecipeSlug] = useState<string | undefined>(undefined);
  
  // States for display values derived from selected recipe
  const [displayIbu, setDisplayIbu] = useState<string>('N/A');
  const [displaySrm, setDisplaySrm] = useState<string>('N/A');
  const [currentSrmHexColor, setCurrentSrmHexColor] = useState<string>('#CCCCCC'); // Default for BeerIcon
  const [ingredientsSummaryForLabel, setIngredientsSummaryForLabel] = useState<string>('N/A');
  const [displayAbv, setDisplayAbv] = useState<string>('N/A');
  const [displayVolumeLabel, setDisplayVolumeLabel] = useState<string>('33CL');

  const frontLabelRef = useRef<HTMLDivElement>(null);
  // const backLabelRef = useRef<HTMLDivElement>(null); // For future back label download

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

  useEffect(() => {
    setDisplayVolumeLabel(watchedVolume);
  }, [watchedVolume]);

  useEffect(() => {
    const fetchAndSetRecipeData = async () => {
      if (selectedRecipeSlug && selectedRecipeSlug !== 'none') {
        const result = await getRecipeDetailsAction(selectedRecipeSlug);
        if (result.success && result.recipe) {
          const recipeData = result.recipe;
          form.reset({
            ...form.getValues(), // Keep existing form values not pre-filled
            selectedRecipeSlug: selectedRecipeSlug,
            beerName: recipeData.name || form.getValues('beerName'),
            description: recipeData.notes || form.getValues('description'),
            ingredients: summarizeIngredients(recipeData.fermentables, recipeData.hops, recipeData.yeasts) || form.getValues('ingredients'),
            // brewingDate and brewingLocation are manual, so not reset from recipe here
          });

          setDisplayIbu(recipeData.ibu?.toFixed(0) || 'N/A');
          setDisplaySrm(recipeData.color?.toFixed(0) || 'N/A');
          setCurrentSrmHexColor(srmToHex(recipeData.color));
          setIngredientsSummaryForLabel(summarizeIngredients(recipeData.fermentables, recipeData.hops, recipeData.yeasts));
          setDisplayAbv(recipeData.abv?.toFixed(1) || 'N/A');
          
          toast({ title: "Recipe Loaded", description: `${recipeData.name} data has been pre-filled.` });
        } else {
          toast({ title: "Error", description: `Failed to load recipe: ${result.error}`, variant: "destructive" });
          // Reset to manual entry visual state if recipe fails to load
          setDisplayIbu('N/A');
          setDisplaySrm('N/A');
          setCurrentSrmHexColor('#CCCCCC');
          setIngredientsSummaryForLabel('N/A');
          setDisplayAbv('N/A');
        }
      } else if (selectedRecipeSlug === 'none') {
        // Reset to defaults or clear fields if "None" is selected
         form.reset({
            ...LabelFormSchema.parse({}), // Resets to schema defaults
            selectedRecipeSlug: 'none',
            volume: form.getValues('volume'), // keep current volume
            backgroundColor: form.getValues('backgroundColor'), // keep colors
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
  }, [selectedRecipeSlug, form, toast]);

  const handleDownloadImage = async (labelRef: React.RefObject<HTMLDivElement>, labelName: string) => {
    if (!labelRef.current) {
      toast({ title: 'Error', description: 'Label preview element not found.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Download Started', description: `Generating ${labelName} image...` });

    const originalTransform = labelRef.current.style.transform;
    const originalBorder = labelRef.current.style.border;
    const originalBoxShadow = labelRef.current.style.boxShadow;

    // Temporarily reset styles for capture
    labelRef.current.style.transform = 'none';
    labelRef.current.style.border = 'none';
    labelRef.current.style.boxShadow = 'none';
    
    // Force a reflow to apply style changes before capture
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = labelRef.current.offsetHeight;


    // Physical dimensions (example for 33CL: 20cm x 7cm)
    const physicalWidthCM = watchedVolume === '33CL' ? 20 : 24; // Example for 75CL: 24cm
    const physicalHeightCM = watchedVolume === '33CL' ? 7 : 9;  // Example for 75CL: 9cm
    const dpi = 300;
    const physicalWidthInches = physicalWidthCM / 2.54;
    const physicalHeightInches = physicalHeightCM / 2.54;
    
    const targetPixelWidth = Math.round(physicalWidthInches * dpi);
    const targetPixelHeight = Math.round(physicalHeightInches * dpi);

    // Use the actual dimensions of the flat label content for canvas
    const labelContentElement = labelRef.current;
    const elementWidth = labelContentElement.offsetWidth;
    const elementHeight = labelContentElement.offsetHeight;

    // Calculate scale to match DPI based on current element size vs target pixel size
    // This scale is for html2canvas to render at a higher resolution
    const scale = Math.min(targetPixelWidth / elementWidth, targetPixelHeight / elementHeight, 4); // Cap scale at 4x to prevent memory issues

    try {
      const canvas = await html2canvas(labelContentElement, {
        scale: scale,
        width: elementWidth,
        height: elementHeight,
        backgroundColor: null, // Use transparent background, or derive from theme
        useCORS: true, // For external images if any
        logging: true,
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
      if (labelRef.current) {
        labelRef.current.style.transform = originalTransform;
        labelRef.current.style.border = originalBorder;
        labelRef.current.style.boxShadow = originalBoxShadow;
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
    volume: displayVolumeLabel,
    backgroundColor: watchedBackgroundColor,
    textColor: watchedTextColor,
    backgroundImage: watchedBackgroundImage,
    description: watchedDescription,
    ingredientsList: watchedIngredients, // for back label
    brewingDate: watchedBrewingDate,
    brewingLocation: watchedBrewingLocation,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <LabelControls
          form={form}
          recipes={recipes}
          onRecipeSelect={setSelectedRecipeSlug}
          selectedRecipeSlug={selectedRecipeSlug}
        />
      </div>
      <div className="md:col-span-1 lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-bebas-neue tracking-wide">Label Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <LabelPreview {...labelDataForPreview} ref={frontLabelRef} />
              <BackLabelPreview {...labelDataForPreview} />
            </div>
            <Button 
              onClick={() => handleDownloadImage(frontLabelRef, 'front_label')} 
              className="w-full mt-4"
              disabled={!frontLabelRef.current}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Front Label
            </Button>
            {/* Add download for back label later */}
             {/* <Button 
              onClick={() => handleDownloadImage(backLabelRef, 'back_label')} 
              className="w-full mt-2"
              variant="outline"
              disabled={!backLabelRef.current}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Back Label (Placeholder)
            </Button> */}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
