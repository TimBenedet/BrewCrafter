
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import type { RecipeSummary } from '@/types/recipe';
import { FileWarning, FilterIcon, AlertTriangle, RefreshCw, FilePlus2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Keep for GitHub import dialog
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';


interface RecipeFile {
  fileName: string;
  content: string;
}

// Helper to decode base64 - useful if Vercel Blob client or GitHub API returns base64
function b64DecodeUnicode(str: string) {
  try {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    console.error("Failed to decode base64 string:", e);
    return "";
  }
}


export default function HomePage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [isGitHubImportDialogOpen, setIsGitHubImportDialogOpen] = useState(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);


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


  const handleGitHubImport = async () => {
    if (!githubRepoUrl.match(/^https:\/\/github\.com\/[^/]+\/[^/]+(\/tree\/[^/]+)?(\/)?$/i)) {
      toast({ title: "URL Invalide", description: "Veuillez entrer une URL de dépôt GitHub valide (ex: https://github.com/owner/repo).", variant: "destructive" });
      return;
    }
    setIsGitHubLoading(true);
    const urlParts = githubRepoUrl.replace(/^https:\/\/github\.com\//i, '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];
    let repoPath = 'Recipes'; // Default path within the repo
    let branch = ''; // Will be fetched

    // Check for /tree/branch/path structure
    const treeIndex = urlParts.findIndex(part => part.toLowerCase() === 'tree');
    if (treeIndex !== -1 && treeIndex + 1 < urlParts.length) {
        branch = urlParts[treeIndex + 1];
        if (treeIndex + 2 < urlParts.length) {
            repoPath = urlParts.slice(treeIndex + 2).join('/').replace(/\/$/, ''); // Get path after /tree/branch/ and remove trailing slash
        } else {
          // If no path after branch, assume root for tree API but we are interested in 'Recipes' anyway
        }
    }
    
    console.log(`Importing from GitHub: owner=${owner}, repo=${repo}, branch=${branch || 'default'}, path=${repoPath}`);

    try {
      // 1. Get default branch if not specified
      if (!branch) {
        const repoInfoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!repoInfoResponse.ok) {
          throw new Error(`Dépôt GitHub non trouvé ou inaccessible: ${repoInfoResponse.statusText}`);
        }
        const repoInfo = await repoInfoResponse.json();
        branch = repoInfo.default_branch;
        console.log(`Default branch fetched: ${branch}`);
      }

      // 2. Get tree for the specified path (e.g., 'Recipes') recursively
      const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
      if (!treeResponse.ok) throw new Error(`Impossible de lire l'arborescence du dépôt (branche: ${branch}): ${treeResponse.statusText}`);
      const treeData = await treeResponse.json();

      if (!treeData.tree) {
        throw new Error("L'arborescence du dépôt est vide ou inaccessible.");
      }
      if (treeData.truncated) {
        console.warn("GitHub tree data was truncated. Some files might be missing.");
      }

      const xmlFilesToFetch: { path: string; url: string, name: string }[] = [];
      for (const item of treeData.tree) {
        // Ensure item.path is relative to the repo root. We filter for items within the target repoPath.
        if (item.type === 'blob' && 
            item.path.toLowerCase().startsWith(repoPath.toLowerCase() + '/') && 
            item.path.toLowerCase().endsWith('.xml')) {
          
          // Extract the recipe slug (folder name directly under repoPath)
          // e.g. if repoPath = 'Recipes', item.path = 'Recipes/My-IPA/recipe.xml' -> slug = 'My-IPA'
          // e.g. if repoPath = 'Beerrecipes/ales', item.path = 'Beerrecipes/ales/My-IPA/recipe.xml' -> slug = 'My-IPA'
          const relativePath = item.path.substring(repoPath.length + 1); // Path relative to repoPath
          const slugCandidate = relativePath.split('/')[0]; // First part is the slug folder
          
          xmlFilesToFetch.push({ path: item.path, url: item.url, name: slugCandidate || item.path.split('/').pop() || 'recette.xml' });
          console.log(`Found XML file to fetch: ${item.path}, using slug candidate: ${slugCandidate}`);
        }
      }

      if (xmlFilesToFetch.length === 0) {
        toast({ title: "Aucune recette trouvée", description: `Aucun fichier .xml trouvé dans le dossier '${repoPath}' du dépôt (branche: ${branch}).`, variant: "default" });
        setIsGitHubLoading(false);
        setIsGitHubImportDialogOpen(false);
        return;
      }

      const recipeFilesToImport: RecipeFile[] = [];
      for (const fileInfo of xmlFilesToFetch) {
        const blobDetailResponse = await fetch(fileInfo.url); 
        if (!blobDetailResponse.ok) {
          console.warn(`Impossible de récupérer les détails du blob ${fileInfo.path}: ${blobDetailResponse.statusText}`);
          continue;
        }
        const blobDetail = await blobDetailResponse.json();
        let content = '';
        if (blobDetail.encoding === 'base64' && blobDetail.content) {
           content = b64DecodeUnicode(blobDetail.content);
        } else if (blobDetail.download_url) { 
          const contentResponse = await fetch(blobDetail.download_url);
          if (contentResponse.ok) {
            content = await contentResponse.text();
          } else {
            console.warn(`Impossible de télécharger le contenu de ${fileInfo.path}: ${contentResponse.statusText}`);
            continue;
          }
        } else {
            // Try fetching directly if content is not base64 (e.g. for smaller files it might be plain text)
            const directContentResponse = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fileInfo.path}`);
            if (directContentResponse.ok) {
                content = await directContentResponse.text();
            } else {
                console.warn(`Aucun contenu ou download_url pour ${fileInfo.path}, et direct fetch échoué.`);
                continue;
            }
        }
        
        // Use the original XML filename for the RecipeFile object sent to addRecipesAction
        // addRecipesAction will derive the slug from the <NAME> tag in the XML content
        const originalFileName = fileInfo.path.split('/').pop() || 'recette_importee.xml';
        recipeFilesToImport.push({ fileName: originalFileName, content });
        console.log(`Prepared to import: ${originalFileName}`);
      }
      
      if (recipeFilesToImport.length > 0) {
        const result = await addRecipesAction(recipeFilesToImport);
        if (result.success) {
            toast({
                title: `${result.count} recette(s) importée(s) depuis GitHub!`,
                description: `Les fichiers BeerXML ont été importés et sauvegardés.`,
            });
            loadRecipes(true); // Refresh the list from the backend (Vercel Blob)
            router.refresh(); // Force refresh to ensure UI consistency
        } else {
            throw new Error(result.error || "Échec de l'importation des recettes GitHub.");
        }
      } else {
        toast({ title: "Aucune recette valide", description: "Aucun fichier XML valide n'a pu être traité depuis le dépôt GitHub.", variant: "default" });
      }

    } catch (error) {
      console.error('Error importing from GitHub:', error);
      toast({ title: "Erreur d'importation GitHub", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsGitHubLoading(false);
      setIsGitHubImportDialogOpen(false);
      setGithubRepoUrl('');
    }
  };


  const renderTopBar = () => (
    <div className="mb-6 flex flex-wrap items-center justify-start gap-2">
      <Dialog open={isGitHubImportDialogOpen} onOpenChange={setIsGitHubImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-github" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
            </svg>
            Importer depuis GitHub
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Importer des Recettes depuis GitHub</DialogTitle>
            <DialogDescription>
              Entrez l'URL d'un dépôt GitHub public (ex: https://github.com/owner/repo).
              L'application cherchera des fichiers .xml dans le dossier `Recipes/` (et ses sous-dossiers) à la racine de la branche par défaut.
              Vous pouvez aussi spécifier une branche et un chemin : https://github.com/owner/repo/tree/branch_name/chemin_vers_dossier_recipes
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="github-url"
              placeholder="https://github.com/votre_nom/vos_recettes"
              value={githubRepoUrl}
              onChange={(e) => setGithubRepoUrl(e.target.value)}
              disabled={isGitHubLoading}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isGitHubLoading}>Annuler</Button>
            </DialogClose>
            <Button type="button" onClick={handleGitHubImport} disabled={isGitHubLoading}>
              {isGitHubLoading ? "Chargement..." : "Charger les recettes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
            <div className="animate-pulse h-10 w-[200px] bg-muted rounded-md"></div>
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
            Importez des recettes depuis GitHub ou créez votre première recette en utilisant les boutons ci-dessus.
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

