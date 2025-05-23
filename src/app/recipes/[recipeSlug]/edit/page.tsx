
import { getRecipeDetails } from '@/lib/recipe-utils';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import type { RecipeFormValues } from '@/components/recipes/RecipeForm';
import type { BeerXMLRecipe } from '@/types/recipe';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, PencilIcon } from 'lucide-react';

interface EditRecipePageProps {
  params: {
    recipeSlug: string;
  };
}

function transformBeerXMLToFormValues(recipe: BeerXMLRecipe): RecipeFormValues {
  return {
    name: recipe.name || '',
    type: recipe.type as 'All Grain' | 'Extract' | 'Partial Mash' || 'All Grain',
    brewer: recipe.brewer || '',
    batchSize: recipe.batchSize || 0,
    boilSize: recipe.boilSize || 0,
    boilTime: recipe.boilTime || 0,
    efficiency: recipe.efficiency || 72.0,
    notes: recipe.notes || '',
    stepsMarkdown: recipe.stepsMarkdown || '', // Added stepsMarkdown

    og: recipe.og,
    fg: recipe.fg,
    abv: recipe.abv,
    ibu: recipe.ibu,
    colorSrm: recipe.color,

    style: {
      name: recipe.style?.name || '',
      category: recipe.style?.category || '',
      styleGuide: recipe.style?.styleGuide || '',
      type: recipe.style?.type as 'Ale' | 'Lager' | 'Mead' | 'Wheat' | 'Mixed' | 'Cider' || 'Ale',
    },

    fermentables: recipe.fermentables.map(f => ({
      name: f.name,
      type: f.type as 'Grain' | 'Extract' | 'Sugar' | 'Adjunct' | 'Dry Extract' | 'Liquid Extract' || 'Grain',
      amount: f.amount, // Stored as kg
      amountUnit: 'kg', // Default display unit
      yield: f.yieldPercentage,
      color: f.color,
    })),

    hops: recipe.hops.map(h => ({
      name: h.name,
      alpha: h.alpha,
      amount: h.amount, // Stored as kg
      amountUnit: 'g', // Default display unit for form
      use: h.use as 'Boil' | 'Dry Hop' | 'Mash' | 'First Wort' | 'Aroma' | 'Whirlpool' || 'Boil',
      time: h.time,
      form: h.form as 'Pellet' | 'Plug' | 'Leaf' | 'Extract' || 'Pellet',
    })),

    yeasts: recipe.yeasts.map(y => ({
      name: y.name,
      type: y.type as 'Ale' | 'Lager' | 'Wheat' | 'Wine' | 'Champagne' || 'Ale',
      form: y.form as 'Liquid' | 'Dry' | 'Slant' | 'Culture' || 'Dry',
      amount: y.amount,
      laboratory: y.laboratory || '',
      productId: y.productId || '',
      attenuation: y.attenuation || 75,
    })),

    miscs: recipe.miscs.map(m => ({
      name: m.name,
      type: m.type as 'Spice' | 'Fining' | 'Water Agent' | 'Herb' | 'Flavor' | 'Other' || 'Spice',
      use: m.use as 'Boil' | 'Mash' | 'Primary' | 'Secondary' | 'Bottling' | 'Kegging' || 'Boil',
      time: m.time,
      amount: m.amount,
    })),

    mash: {
      name: recipe.mash?.name || 'Single Infusion',
      mashSteps: recipe.mash?.mashSteps.map(ms => ({
        name: ms.name,
        type: ms.type as 'Infusion' | 'Temperature' | 'Decoction' || 'Infusion',
        stepTemp: ms.stepTemp,
        stepTime: ms.stepTime,
      })) || [{ name: 'Saccharification', type: 'Infusion', stepTemp: 67, stepTime: 60 }],
    },
  };
}


export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const recipeData = await getRecipeDetails(params.recipeSlug);

  if (!recipeData) {
    notFound();
  }

  const initialFormValues = transformBeerXMLToFormValues(recipeData);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/recipes/${params.recipeSlug}`}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Retour à la Recette
          </Link>
        </Button>
      </div>
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <PencilIcon className="mr-3 h-7 w-7" />
          Modifier la Recette : {recipeData.name}
        </h1>
        <p className="text-muted-foreground">Modifiez les champs ci-dessous pour mettre à jour votre recette et ses étapes.</p>
      </header>
      <RecipeForm
        mode="edit"
        initialData={initialFormValues}
        recipeSlug={params.recipeSlug}
      />
    </div>
  );
}
