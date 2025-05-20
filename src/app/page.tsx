
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import type { RecipeSummary } from '@/types/recipe';
import { FileWarning, FilterIcon, AlertTriangle, RefreshCw, FilePlus2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


export default function HomePage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();


  const loadRecipes = useCallback(async (showToast = false) => {
    setIsLoading(true);
    setError(null);
    console.log("HomePage: Initiating loadRecipes...");
    try {
      const response = await fetch('/api/recipes/summaries');
      console.log("HomePage: Fetch response status:", response.status);
      if (!response.ok) {
        let errorData = { error: `Failed to fetch recipes: ${response.statusText}` };
        try {
            errorData = await response.json();
        } catch (parseError) {
            console.error("HomePage: Failed to parse error response from API:", parseError);
        }
        console.error("HomePage: API error response data:", errorData);
        throw new Error(errorData.error || `Failed to fetch recipes: ${response.statusText}`);
      }
      const fetchedRecipes: RecipeSummary[] = await response.json();
      console.log("HomePage: Fetched recipes count:", fetchedRecipes.length);
      setRecipes(fetchedRecipes);
      if (showToast) {
        toast({
          title: 'Recettes mises à jour',
          description: 'La liste des recettes a été rechargée.',
        });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while loading recipes.";
      console.error("HomePage: Error in loadRecipes:", errorMessage, e);
      setError(errorMessage);
      if (showToast) {
        toast({
          title: 'Erreur de chargement',
          description: `Impossible de recharger les recettes: ${errorMessage}`,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
      console.log("HomePage: loadRecipes finished.");
    }
  }, [toast]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

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


  const renderTopBar = () => (
    <div className="mb-6 flex flex-wrap items-center justify-start gap-2">
      <Button variant="outline" asChild>
        <Link href="/recipes/new">
          <FilePlus2 className="mr-2 h-4 w-4" /> Nouvelle recette
        </Link>
      </Button>

      <div className="flex items-center gap-2 ml-auto">
        {(uniqueStyles.length > 0 || recipes.length > 0) && (
          <Select value={selectedStyle} onValueChange={setSelectedStyle}>
            <SelectTrigger
              id="style-filter"
              className="w-auto sm:w-[220px] bg-background text-sm"
            >
              <FilterIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filtrer par style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les styles</SelectItem>
              {uniqueStyles.map(style => (
                <SelectItem key={style} value={style}>{style}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button onClick={() => loadRecipes(true)} variant="outline" size="icon" aria-label="Rafraîchir les recettes" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );


  if (isLoading && recipes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            {/* Placeholders for buttons */}
            <div className="animate-pulse h-10 w-[150px] bg-muted rounded-md"></div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="animate-pulse h-10 w-[200px] bg-muted rounded-md"></div>
            <div className="animate-pulse h-10 w-10 bg-muted rounded-md"></div>
          </div>
        </div>
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

  if (error && recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Erreur lors du chargement des recettes</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => loadRecipes(true)} variant="outline" className="mt-4">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Réessayer de charger
          </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderTopBar()}
      
      {error && recipes.length > 0 && ( 
         <div className="mb-4 p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md flex items-start">
           <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 shrink-0" />
           <div>
            <p className="font-semibold">Erreur de chargement des mises à jour :</p>
            <p className="text-sm">{error}</p>
           </div>
         </div>
      )}

      {isLoading && recipes.length > 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin inline-block mr-2" />
          Chargement des recettes...
        </div>
      )}

      {!isLoading && recipes.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <FileWarning className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucune recette trouvée</h2>
          <p className="text-muted-foreground">
            Créez votre première recette en utilisant le bouton ci-dessus.
          </p>
        </div>
      )}

      {recipesToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipesToDisplay.map((recipe: RecipeSummary) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      ) : (
        !isLoading && !error && recipes.length > 0 && ( 
          <div className="flex flex-col items-center justify-center text-center py-10">
            <FileWarning className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Aucune recette ne correspond</h2>
            <p className="text-muted-foreground">
              Aucune recette ne correspond au style &quot;{selectedStyle}&quot;. Essayez un autre filtre.
            </p>
          </div>
        )
      )}
    </div>
  );
}
