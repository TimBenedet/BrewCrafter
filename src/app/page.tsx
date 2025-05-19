import { getRecipeSummaries } from '@/lib/recipe-utils';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import type { RecipeSummary } from '@/types/recipe';
import { FileWarning } from 'lucide-react';

export default async function HomePage() {
  const recipes = await getRecipeSummaries();

  if (!recipes || recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <FileWarning className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Recipes Found</h2>
        <p className="text-muted-foreground">
          Make sure you have BeerXML files in the <code>public/Recipes</code> directory.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe: RecipeSummary) => (
        <RecipeCard key={recipe.slug} recipe={recipe} />
      ))}
    </div>
  );
}
