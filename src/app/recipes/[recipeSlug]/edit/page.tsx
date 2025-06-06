
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
  searchParams?: {
    section?: string;
  };
}

function transformBeerXMLToFormValues(recipe: BeerXMLRecipe): RecipeFormValues {
  return {
    name: recipe.name || '',
    type: recipe.type as 'All Grain' | 'Extract' | 'Partial Mash' || 'All Grain',
    brewer: recipe.brewer || '',
    status: recipe.status || 'in_progress',
    batchSize: recipe.batchSize || 0,
    boilSize: recipe.boilSize || 0,
    boilTime: recipe.boilTime || 0,
    efficiency: recipe.efficiency || 72.0,
    notes: recipe.notes || '',

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
      amount: f.amount, 
      amountUnit: 'kg', 
      yield: f.yieldPercentage,
      color: f.color,
    })),

    hops: recipe.hops.map(h => ({
      name: h.name,
      alpha: h.alpha,
      amount: h.amount, // Stored as kg in BeerXMLRecipe, form might use g
      amountUnit: 'g', // Default to g for form display, XML generation converts
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
      attenuation: (y as any).attenuation || 75, // Cast to any if BeerXMLRecipe type doesn't have attenuation
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


export default async function EditRecipePage({ params, searchParams }: EditRecipePageProps) {
  const recipeData = await getRecipeDetails(params.recipeSlug);

  if (!recipeData) {
    notFound();
  }

  const initialFormValues = transformBeerXMLToFormValues(recipeData);
  const initialOpenSection = searchParams?.section;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/recipes/${params.recipeSlug}`}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Recipe
          </Link>
        </Button>
      </div>
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <PencilIcon className="mr-3 h-7 w-7" />
          Edit Recipe: {recipeData.name}
        </h1>
        <p className="text-muted-foreground">Modify the fields below to update your recipe.</p>
      </header>
      <RecipeForm
        mode="edit"
        initialData={initialFormValues}
        recipeSlug={params.recipeSlug}
        initialOpenSection={initialOpenSection}
      />
    </div>
  );
}
