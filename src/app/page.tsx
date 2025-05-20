
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import type { RecipeSummary } from '@/types/recipe';
import { FileWarning, FilterIcon, AlertTriangle, RefreshCw, UploadCloud, FilePlus2, HardDriveIcon, Cloud } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addRecipesAction } from '@/app/actions/recipe-actions';
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
import { useRouter } from 'next/navigation';


export default function HomePage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddRecipeDialogOpen, setIsAddRecipeDialogOpen] = useState(false);

  const loadRecipes = useCallback(async (showToast = false) => {
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
      if (showToast) {
        toast({
          title: 'Recettes mises à jour',
          description: 'La liste des recettes a été rechargée.',
        });
      }
    } catch (e) {
      console.error("Error loading recipes:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred while loading recipes.");
      if (showToast) {
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de recharger les recettes.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
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

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsAddRecipeDialogOpen(false); 
    const files = event.target.files;
    if (!files || files.length === 0) {
      toast({ title: "Aucun fichier sélectionné", description: "Veuillez sélectionner un fichier BeerXML.", variant: "destructive" });
      return;
    }

    const file = files[0];
    if (!file.name.endsWith('.xml')) {
      toast({ title: "Format de fichier invalide", description: "Veuillez sélectionner un fichier .xml.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          throw new Error("Impossible de lire le contenu du fichier.");
        }
        
        const result = await addRecipesAction([{ fileName: file.name, content }]);

        if (result.success) {
          toast({
            title: `Recette importée !`,
            description: `La recette "${file.name}" a été importée avec succès.`,
          });
          loadRecipes(); // Reload recipes to show the new one
          router.refresh(); 
        } else {
          throw new Error(result.error || "Erreur lors de l'importation de la recette.");
        }
      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          title: "Échec de l'importation",
          description: (error as Error).message || "Un problème est survenu lors de l'importation de la recette.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const selectFileFromComputer = () => {
     if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGoogleDriveSelect = () => {
    setIsAddRecipeDialogOpen(false);
    toast({
      title: "Fonctionnalité à venir",
      description: "L'intégration avec Google Drive est prévue prochainement.",
    });
  };


  if (isLoading && recipes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end items-center gap-2 mb-6">
          <div className="animate-pulse h-10 w-[150px] bg-muted rounded-md"></div>
          <div className="animate-pulse h-10 w-[150px] bg-muted rounded-md"></div>
          <div className="animate-pulse h-10 w-[200px] bg-muted rounded-md ml-auto"></div>
          <div className="animate-pulse h-10 w-10 bg-muted rounded-md"></div>
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
  
  if (!isLoading && !error && recipes.length === 0) {
    return (
       <div className="space-y-4">
        <div className="mb-6 flex flex-wrap items-center justify-start gap-2">
            <AlertDialog open={isAddRecipeDialogOpen} onOpenChange={setIsAddRecipeDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <UploadCloud className="mr-2 h-4 w-4" /> Importer une recette
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Importer une recette BeerXML</AlertDialogTitle>
                  <AlertDialogDescription>
                    D'où souhaitez-vous charger votre fichier de recette ?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                  <Button onClick={selectFileFromComputer} className="w-full">
                    <HardDriveIcon className="mr-2 h-4 w-4" /> Mon ordinateur
                  </Button>
                  <Button onClick={handleGoogleDriveSelect} variant="outline" className="w-full">
                    <Cloud className="mr-2 h-4 w-4" /> Google Drive
                  </Button>
                  <AlertDialogCancel className="w-full mt-2 sm:mt-2">Annuler</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xml" 
              onChange={handleFilesSelected}
            />
            <Button variant="outline" asChild>
              <Link href="/recipes/new">
                <FilePlus2 className="mr-2 h-4 w-4" /> Nouvelle recette
              </Link>
            </Button>
        </div>
        <div className="flex flex-col items-center justify-center text-center py-10">
          <FileWarning className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucune recette trouvée</h2>
          <p className="text-muted-foreground">
            Importez ou créez votre première recette en utilisant les boutons ci-dessus.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-start gap-2">
          <AlertDialog open={isAddRecipeDialogOpen} onOpenChange={setIsAddRecipeDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <UploadCloud className="mr-2 h-4 w-4" /> Importer une recette
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Importer une recette BeerXML</AlertDialogTitle>
                <AlertDialogDescription>
                  D'où souhaitez-vous charger votre fichier de recette ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                <Button onClick={selectFileFromComputer} className="w-full">
                  <HardDriveIcon className="mr-2 h-4 w-4" /> Mon ordinateur
                </Button>
                <Button onClick={handleGoogleDriveSelect} variant="outline" className="w-full">
                  <Cloud className="mr-2 h-4 w-4" /> Google Drive
                </Button>
                <AlertDialogCancel className="w-full mt-2 sm:mt-2">Annuler</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xml" 
            onChange={handleFilesSelected}
          />
          <Button variant="outline" asChild>
            <Link href="/recipes/new">
              <FilePlus2 className="mr-2 h-4 w-4" /> Nouvelle recette
            </Link>
          </Button>

        {(uniqueStyles.length > 0 || recipes.length > 0) && (
          <div className="flex items-center gap-2 ml-auto"> {/* ml-auto pushes this group to the right */}
            {uniqueStyles.length > 0 && (
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
        )}
      </div>
      
      {error && ( 
         <div className="mb-4 p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md flex items-start">
           <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 shrink-0" />
           <div>
            <p className="font-semibold">Erreur de chargement :</p>
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

