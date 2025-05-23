
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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { addRecipesAction } from '@/app/actions/recipe-actions'; // Import the server action


export default function HomePage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAdminAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);


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

  const handleFileSelectAndImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: "Aucun fichier sélectionné", variant: "destructive" });
      return;
    }

    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast({ title: "Fichier invalide", description: "Veuillez sélectionner un fichier .xml.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) {
        toast({ title: "Erreur de lecture", description: "Impossible de lire le contenu du fichier.", variant: "destructive" });
        return;
      }

      setIsImportDialogOpen(false); // Close dialog before processing
      toast({ title: "Importation en cours...", description: `Importation de ${file.name}.` });

      try {
        const result = await addRecipesAction([{ fileName: file.name, content }]);
        if (result.success && result.count !== undefined && result.count > 0) {
          toast({
            title: "Recette importée !",
            description: `${result.count} recette(s) ont été importée(s) avec succès.`,
          });
          loadRecipes(true); // Refresh the list
        } else if (result.success && result.count === 0) {
           toast({
            title: "Aucune recette importée",
            description: "Le fichier ne contenait pas de recette valide ou le nom n'a pu être extrait.",
            variant: "default",
          });
        } else {
          throw new Error(result.error || "Erreur lors de l'importation de la recette.");
        }
      } catch (error) {
        console.error("Error importing recipe:", error);
        toast({
          title: "Échec de l'importation",
          description: (error as Error).message || "Un problème est survenu.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    // Reset file input to allow selecting the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {isAdminAuthenticated && (
          <>
            <Button asChild variant="outline">
              <Link href="/recipes/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New recipe
              </Link>
            </Button>
            <AlertDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Import recipe
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Importer une recette</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sélectionnez la source pour importer votre recette.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col space-y-2">
                   <Button variant="default" onClick={() => fileInputRef.current?.click()}>
                    Depuis mon ordinateur
                  </Button>
                  {/* Placeholder for future Google Drive integration */}
                  <Button variant="outline" disabled>
                    Depuis Google Drive (Bientôt)
                  </Button>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsImportDialogOpen(false)}>Annuler</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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

      <div className="flex items-center gap-2">
        {recipes.length > 0 && (
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
                {/* Placeholders for admin buttons if needed, or leave empty if only visible when logged in */}
            </div>
            <div className="flex items-center gap-2">
                 <div className="animate-pulse h-10 w-[220px] bg-muted rounded-md"></div>
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
        {renderTopBar()}
        <AlertTriangle className="w-16 h-16 text-destructive mb-4 mt-8" />
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
          <FileWarning className="w-16 h-16 text-muted-foreground mb-4 mt-6" />
          <h2 className="text-2xl font-semibold mb-2">Aucune recette trouvée</h2>
          <p className="text-muted-foreground">
            Il n'y a pas de recettes à afficher.
             {isAdminAuthenticated ? ' Vous pouvez en créer ou importer une avec les boutons ci-dessus.' : 'Connectez-vous en tant qu\'admin pour ajouter ou importer des recettes.'}
          </p>
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

    