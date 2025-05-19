
'use client';

import { useState, useEffect, useMemo } from 'react';
// Removed direct import: import { getRecipeSummaries } from '@/lib/recipe-utils';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import type { RecipeSummary } from '@/types/recipe';
import { FileWarning, FilterIcon, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecipes() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/recipes/summaries');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorData.error || `Failed to fetch recipes: ${response.statusText}`);
        }
        const fetchedRecipes: RecipeSummary[] = await response.json();
        setRecipes(fetchedRecipes);
      } catch (e) {
        console.error("Error loading recipes:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred while loading recipes.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRecipes();
  }, []);

  const uniqueStyles = useMemo(() => {
    if (!recipes) return [];
    const styles = new Set<string>();
    recipes.forEach(recipe => {
      if (recipe.styleName) {
        styles.add(recipe.styleName);
      }
    });
    return Array.from(styles).sort();
  }, [recipes]);

  const recipesToDisplay = useMemo(() => {
    if (!recipes) return [];
    if (selectedStyle === 'all') {
      return recipes;
    }
    return recipes.filter(recipe => recipe.styleName === selectedStyle);
  }, [recipes, selectedStyle]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="w-full md:w-1/3 lg:w-1/4">
          <CardContent className="p-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="space-y-2 mt-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Erreur lors du chargement des recettes</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <p className="text-sm text-muted-foreground">
          Veuillez vérifier la console du navigateur et du serveur pour plus de détails.
        </p>
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <FileWarning className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Aucune recette trouvée</h2>
        <p className="text-muted-foreground">
          Assurez-vous d'avoir des fichiers BeerXML dans le dossier <code>public/Recipes</code> ou ajoutez-en via le menu.
        </p>
      </div>
    );
  }

  return (
    <div>
      {uniqueStyles.length > 0 && (
        <Card className="mb-6 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center">
              <FilterIcon className="h-5 w-5 mr-2 text-primary" />
              <Label htmlFor="style-filter" className="text-lg font-semibold">Filtrer par style</Label>
            </div>
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger id="style-filter" className="w-full sm:w-[250px] bg-background">
                <SelectValue placeholder="Tous les styles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les styles</SelectItem>
                {uniqueStyles.map(style => (
                  <SelectItem key={style} value={style}>{style}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {recipesToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipesToDisplay.map((recipe: RecipeSummary) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <FileWarning className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucune recette ne correspond</h2>
          <p className="text-muted-foreground">
            Aucune recette ne correspond au style &quot;{selectedStyle}&quot;. Essayez un autre filtre.
          </p>
        </div>
      )}
    </div>
  );
}
