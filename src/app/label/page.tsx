
import { getRecipeSummaries } from '@/lib/recipe-utils';
import { LabelStudioClient } from '@/components/brewcrafter-label/LabelStudioClient';
import type { RecipeSummary } from '@/types/recipe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Paintbrush } from 'lucide-react';

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

export default async function BrewCrafterLabelPage() {
  let recipes: RecipeSummary[] = [];
  let error: string | null = null;

  try {
    recipes = await getRecipeSummaries();
  } catch (e) {
    console.error("Failed to load recipes for label page:", e);
    error = "Could not load recipe list. Please try again later.";
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bebas-neue tracking-wide text-primary">
            <Paintbrush className="mr-3 h-7 w-7" />
            BrewCrafter Label Studio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Design simple front and back labels for your craft beer. Experiment with text, colors, and background images.
          </p>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4 text-center text-destructive">
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <LabelStudioClient initialRecipes={recipes} />
    </div>
  );
}
