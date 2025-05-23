
import { getRecipeDetails, getRecipeSummaries } from '@/lib/recipe-utils';
import { RecipeDetailDisplay } from '@/components/recipes/RecipeDetailDisplay';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';

interface RecipePageProps {
  params: {
    recipeSlug: string;
  };
}

// Ensure this page is always dynamically rendered
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  // Fetching summaries might now rely on Vercel Blob and could be dynamic.
  // If this causes issues with build times or if summaries are relatively stable,
  // consider how often this needs to run. For fully dynamic, it can return an empty array
  // if dynamic = 'force-dynamic' is used, or fetch actual slugs.
  // For now, let's keep fetching summaries for param generation.
  const summaries = await getRecipeSummaries();
  return summaries.map((recipe) => ({
    recipeSlug: recipe.slug,
  }));
}

export async function generateMetadata({ params }: RecipePageProps) {
  const recipe = await getRecipeDetails(params.recipeSlug);
  if (!recipe) {
    return {
      title: 'Recipe Not Found',
    };
  }
  return {
    title: `${recipe.name} | BrewCrafter`,
    description: `Details for the beer recipe: ${recipe.name}. Type: ${recipe.type}.`,
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const recipe = await getRecipeDetails(params.recipeSlug);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="mb-4 flex justify-between items-center">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Recipes
          </Link>
        </Button>
      </div>
      <RecipeDetailDisplay recipe={recipe} recipeSlug={params.recipeSlug} />
    </div>
  );
}
