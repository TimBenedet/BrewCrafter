
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import type { RecipeSummary } from '@/types/recipe';
import { FileWarning, FilterIcon, AlertTriangle, RefreshCw, PlusCircle, UploadCloud } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Ensure this path is correct
import { addRecipesAction } from '@/app/actions/recipe-actions'; // Ensure this path is correct
import { Input } from "@/components/ui/input"; // For file input if needed directly (though hidden)

export default function HomePage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAdminAuthenticated } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRecipes = useCallback(async (showToast = false) => {
    setIsLoading(true);
    setError(null);
    console.log("HomePage: Initiating loadRecipes... Attempting to fetch from /api/recipes/summaries to display recipes from configured storage (e.g., Vercel Blob).");
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
          title: 'Recipes Updated',
          description: 'The recipe list has been reloaded.',
        });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while loading recipes.";
      console.error("HomePage: Error in loadRecipes:", errorMessage, e);
      setError(errorMessage);
      if (showToast) {
        toast({
          title: 'Loading Error',
          description: `Could not reload recipes: ${errorMessage}`,
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

  const handleFileSelectAndImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: "No file selected", description: "Please select a file.", variant: "destructive" });
      return;
    }

    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast({ title: "Invalid file type", description: "Please select a BeerXML (.xml) file.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) {
        toast({ title: "File read error", description: "Could not read file content.", variant: "destructive" });
        return;
      }

      toast({ title: "Importing...", description: `Importing ${file.name}. Please wait.` });

      try {
        const result = await addRecipesAction([{ fileName: file.name, content }]);
        if (result.success && result.count !== undefined && result.count > 0) {
          toast({
            title: "Recipe Imported!",
            description: `${result.count} recipe(s) imported successfully from ${file.name}.`,
          });
          loadRecipes(true);
        } else if (result.success && result.count === 0) {
           toast({
            title: "No Recipe Imported",
            description: "The file did not contain a valid recipe or its name could not be extracted.",
            variant: "default",
          });
        } else {
          throw new Error(result.error || "An unknown error occurred during import.");
        }
      } catch (error) {
        console.error("Error importing recipe:", error);
        toast({
          title: "Import Failed",
          description: (error as Error).message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };

  const uniqueStyles = useMemo(() => {
    if (!recipes || recipes.length === 0) return [];
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
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
      {/* Left side buttons */}
      <div className="flex items-center gap-2">
        {isAdminAuthenticated && (
          <>
            <Button asChild variant="outline">
              <Link href="/recipes/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New recipe
              </Link>
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Import recipe
            </Button>
            {/* Hidden file input, triggered by the "Import recipe" button */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xml"
              onChange={handleFileSelectAndImport}
            />
          </>
        )}
      </div>

      {/* Right side filter and refresh */}
      <div className="flex items-center gap-2">
        {recipes.length > 0 && (
          <Select value={selectedStyle} onValueChange={setSelectedStyle}>
            <SelectTrigger
              id="style-filter"
              className="w-auto sm:w-[220px] bg-background text-sm"
            >
              <FilterIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All styles</SelectItem>
              {uniqueStyles.map(style => (
                <SelectItem key={style} value={style}>{style}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button onClick={() => loadRecipes(true)} variant="outline" size="icon" aria-label="Refresh recipes" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading && recipes.length > 0 ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );

  if (isLoading && recipes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                 {isAdminAuthenticated && ( // Placeholder for admin buttons
                    <>
                        <div className="animate-pulse h-9 w-32 bg-muted rounded-md"></div>
                        <div className="animate-pulse h-9 w-36 bg-muted rounded-md"></div>
                    </>
                 )}
            </div>
            <div className="flex items-center gap-2">
                 <div className="animate-pulse h-10 w-[220px] bg-muted rounded-md"></div> {/* Placeholder for filter */}
                 <div className="animate-pulse h-10 w-10 bg-muted rounded-md"></div> {/* Placeholder for refresh */}
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
        {renderTopBar()}
        <AlertTriangle className="w-16 h-16 text-destructive mb-4 mt-8" />
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Error loading recipes</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => loadRecipes(true)} variant="outline" className="mt-4">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Retry loading
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
            <p className="font-semibold">Error loading updates:</p>
            <p className="text-sm">{error}</p>
           </div>
         </div>
      )}

      {isLoading && recipes.length > 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin inline-block mr-2" />
          Loading recipes...
        </div>
      )}

      {!isLoading && recipes.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <FileWarning className="w-16 h-16 text-muted-foreground mb-4 mt-6" />
          <h2 className="text-2xl font-semibold mb-2">No recipes found</h2>
          <p className="text-muted-foreground">
            There are no recipes to display.
             {isAdminAuthenticated ? ' You can create or import one using the buttons above.' : ''}
          </p>
           {!isAdminAuthenticated && (
            <p className="text-sm text-muted-foreground mt-2">
                Log in as admin to add or import recipes.
            </p>
           )}
        </div>
      )}

      {recipesToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipesToDisplay.map((recipe: RecipeSummary) => (
            <RecipeCard key={recipe.slug} recipe={recipe} isAdmin={isAdminAuthenticated} />
          ))}
        </div>
      ) : (
        !isLoading && !error && recipes.length > 0 && (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <FileWarning className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No recipes match</h2>
            <p className="text-muted-foreground">
              No recipes match the style &quot;{selectedStyle}&quot;. Try a different filter.
            </p>
          </div>
        )
      )}
    </div>
  );
}

    