
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import type { RecipeSummary } from '@/types/recipe';
import { FileWarning, FilterIcon, AlertTriangle, RefreshCw, UploadCloud, FilePlus2, HardDriveIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddRecipeDialogOpen, setIsAddRecipeDialogOpen] = useState(false);

  const [isGitHubImportDialogOpen, setIsGitHubImportDialogOpen] = useState(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);


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
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while loading recipes.";
      setError(errorMessage);
      // Only show toast if it's a refresh action, not initial load
      if (showToast) {
        toast({
          title: 'Erreur de chargement',
          description: `Impossible de recharger les recettes: ${errorMessage}`,
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
      toast({ title: "Aucun fichier sélectionné", description: "Veuillez sélectionner un ou plusieurs fichiers BeerXML.", variant: "destructive" });
      return;
    }

    const recipeFilesToImport: RecipeFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.xml')) {
        toast({ title: "Format de fichier invalide", description: `Le fichier "${file.name}" n'est pas un .xml et a été ignoré.`, variant: "destructive" });
        continue;
      }
      try {
        const content = await file.text();
        recipeFilesToImport.push({ fileName: file.name, content });
      } catch (error) {
        console.error("Error reading file:", file.name, error);
        toast({
          title: "Erreur de lecture de fichier",
          description: `Impossible de lire le contenu du fichier "${file.name}".`,
          variant: "destructive",
        });
      }
    }

    if (recipeFilesToImport.length > 0) {
      const result = await addRecipesAction(recipeFilesToImport);
      if (result.success) {
        toast({
          title: `${result.count} recette(s) importée(s) !`,
          description: `Les fichiers BeerXML ont été importés avec succès. (Note: La sauvegarde sur Vercel nécessite une configuration Blob adaptée)`,
        });
        loadRecipes(true);
        router.refresh();
      } else {
        toast({
          title: "Échec de l'importation",
          description: result.error || "Un problème est survenu lors de l'importation des recettes.",
          variant: "destructive",
        });
      }
    } else if (files.length > 0) {
        toast({ title: "Aucun fichier XML valide", description: "Aucun fichier XML valide n'a été trouvé pour l'importation.", variant: "default" });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectFileFromComputer = () => {
     if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGitHubImport = async () => {
    if (!githubRepoUrl.match(/^https:\/\/github\.com\/[^/]+\/[^/]+$/)) {
      toast({ title: "URL Invalide", description: "Veuillez entrer une URL de dépôt GitHub valide (ex: https://github.com/owner/repo).", variant: "destructive" });
      return;
    }
    setIsGitHubLoading(true);
    const [owner, repo] = githubRepoUrl.replace('https://github.com/', '').split('/');

    try {
      // 1. Get default branch
      const repoInfoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!repoInfoResponse.ok) {
        throw new Error(`Dépôt GitHub non trouvé ou inaccessible: ${repoInfoResponse.statusText}`);
      }
      const repoInfo = await repoInfoResponse.json();
      const defaultBranch = repoInfo.default_branch;

      // 2. Get tree for Recipes directory recursively
      const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
      if (!treeResponse.ok) throw new Error(`Impossible de lire l'arborescence du dépôt: ${treeResponse.statusText}`);
      const treeData = await treeResponse.json();

      if (!treeData.tree || treeData.truncated) {
        throw new Error("L'arborescence du dépôt est trop grande ou inaccessible.");
      }

      const xmlFilesToFetch: { path: string; url: string }[] = [];
      for (const item of treeData.tree) {
        if (item.type === 'blob' && item.path.toLowerCase().startsWith('recipes/') && item.path.toLowerCase().endsWith('.xml')) {
          xmlFilesToFetch.push({ path: item.path, url: item.url });
        }
      }

      if (xmlFilesToFetch.length === 0) {
        toast({ title: "Aucune recette trouvée", description: "Aucun fichier .xml trouvé dans le dossier 'Recipes/' du dépôt.", variant: "default" });
        setIsGitHubLoading(false);
        setIsGitHubImportDialogOpen(false);
        return;
      }

      const recipeFilesToImport: RecipeFile[] = [];
      for (const fileInfo of xmlFilesToFetch) {
        // For blobs, fileInfo.url is the API URL to get blob details, not direct content
        const blobDetailResponse = await fetch(fileInfo.url); // This URL gives blob metadata including content or download_url
        if (!blobDetailResponse.ok) {
          console.warn(`Impossible de récupérer les détails du blob ${fileInfo.path}: ${blobDetailResponse.statusText}`);
          continue;
        }
        const blobDetail = await blobDetailResponse.json();
        let content = '';
        if (blobDetail.content) { // Content is base64 encoded
           content = b64DecodeUnicode(blobDetail.content);
        } else if (blobDetail.download_url) { // Fallback if content is not directly in blobDetail (should not happen for small files)
          const contentResponse = await fetch(blobDetail.download_url);
          if (contentResponse.ok) {
            content = await contentResponse.text();
          } else {
            console.warn(`Impossible de télécharger le contenu de ${fileInfo.path}: ${contentResponse.statusText}`);
            continue;
          }
        } else {
            console.warn(`Aucun contenu ou download_url pour ${fileInfo.path}`);
            continue;
        }
        
        const fileName = fileInfo.path.split('/').pop() || 'recette.xml'; // Use actual filename
        recipeFilesToImport.push({ fileName, content });
      }
      
      if (recipeFilesToImport.length > 0) {
         // On Vercel, this won't write to filesystem. We will add to local state.
        const isVercel = process.env.VERCEL === "1";
        if (isVercel || true) { // Forcing this path for now for consistency
            const newSummaries = recipeFilesToImport.map(rf => {
                const slug = rf.fileName.replace(/\.xml$/i, '').toLowerCase().replace(/\s+/g, '-');
                return parseXmlToRecipeSummary(rf.content, slug);
            }).filter(Boolean) as RecipeSummary[];

            setRecipes(prev => [...prev, ...newSummaries]);
            toast({
                title: `${newSummaries.length} recette(s) chargée(s) depuis GitHub`,
                description: "Ces recettes sont disponibles pour cette session. Elles ne sont pas sauvegardées de manière permanente sur cette version déployée.",
            });
        } else {
            // This path is for local dev if we ever re-enable direct writing
            // const result = await addRecipesAction(recipeFilesToImport);
            // if (result.success) {
            //     toast({
            //         title: `${result.count} recette(s) importée(s) depuis GitHub!`,
            //         description: `Les fichiers BeerXML ont été importés.`,
            //     });
            //     loadRecipes(true);
            //     router.refresh();
            // } else {
            //     throw new Error(result.error || "Échec de l'importation des recettes GitHub.");
            // }
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
      <AlertDialog open={isAddRecipeDialogOpen} onOpenChange={setIsAddRecipeDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline">
            <UploadCloud className="mr-2 h-4 w-4" /> Importer une recette
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Source d'importation</AlertDialogTitle>
            <AlertDialogDescription>
              Choisissez d'où importer votre fichier de recette BeerXML.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col space-y-2 pt-4">
            <Button onClick={() => { selectFileFromComputer(); setIsAddRecipeDialogOpen(false); }} className="w-full justify-start">
              <HardDriveIcon className="mr-2 h-4 w-4" /> Mon ordinateur
            </Button>
            {/* Placeholder for future Google Drive integration
            <Button variant="outline" onClick={() => { toast({ title: "Google Drive à venir", description: "L'intégration est prévue."}); setIsAddRecipeDialogOpen(false); }} className="w-full justify-start">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.36 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5c0-2.64-2.05-4.78-4.64-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
              Google Drive
            </Button>
            */}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full mt-2 sm:mt-0">Annuler</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xml"
        multiple
        onChange={handleFilesSelected}
      />
      <Button variant="outline" asChild>
        <Link href="/recipes/new">
          <FilePlus2 className="mr-2 h-4 w-4" /> Nouvelle recette
        </Link>
      </Button>

      <div className="flex items-center gap-2 ml-auto">
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
    </div>
  );


  if (isLoading && recipes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-10 w-[180px] bg-muted rounded-md"></div>
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
      
      {error && recipes.length > 0 && ( // Display error inline if recipes were previously loaded
         <div className="mb-4 p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md flex items-start">
           <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 shrink-0" />
           <div>
            <p className="font-semibold">Erreur de chargement des mises à jour :</p>
            <p className="text-sm">{error}</p>
           </div>
         </div>
      )}

      {isLoading && recipes.length > 0 && ( // Display inline loading if refreshing existing list
        <div className="text-center py-4 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin inline-block mr-2" />
          Chargement des recettes...
        </div>
      )}

      {!isLoading && recipes.length === 0 && !error && ( // Message for no recipes after successful load
        <div className="flex flex-col items-center justify-center text-center py-10">
          <FileWarning className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucune recette trouvée</h2>
          <p className="text-muted-foreground">
            Importez ou créez votre première recette en utilisant les boutons ci-dessus.
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
        !isLoading && !error && recipes.length > 0 && ( // Message if filters result in no matches
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
