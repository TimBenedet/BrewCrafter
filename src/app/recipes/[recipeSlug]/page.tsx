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

export async function generateStaticParams() {
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
    title: `${recipe.name} | GitBrew`,
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
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Recipes
          </Link>
        </Button>
      </div>
      <RecipeDetailDisplay recipe={recipe} />
    </div>
  );
}
