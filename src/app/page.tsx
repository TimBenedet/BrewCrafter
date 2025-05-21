
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
import Link from 'next/link';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import type { RecipeSummary } from '@/types/recipe';
import { FileWarning, FilterIcon, AlertTriangle, RefreshCw, PlusCircle, LogIn, LogOut } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HomePage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const { toast } = useToast();
  const router = useRouter();

  const handleAdminLogin = () => {
    if (passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setIsPasswordDialogOpen(false);
      setLoginError('');
      setPasswordInput(''); // Clear password input
      toast({
        title: 'Connexion Admin Réussie',
        description: 'Les fonctionnalités d\'administration sont maintenant activées.',
      });
    } else {
      setLoginError('Mot de passe incorrect.');
    }
  };

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
      {/* Left-aligned item: "New recipe" button */}
      <div className="flex items-center">
        {isAdminAuthenticated && (
          <Button asChild variant="outline">
            <Link href="/recipes/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New recipe
            </Link>
          </Button>
        )}
      </div>

      {/* Right-aligned items: Filter, Refresh, Admin Login/Logout */}
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
        
        {/* Admin Login/Logout Button */}
        {!isAdminAuthenticated && (
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Admin Login">
                <LogIn className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Connexion Administrateur</DialogTitle>
                <DialogDescription>
                  Entrez le mot de passe administrateur pour accéder aux fonctionnalités de gestion.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="admin-password" className="text-right">
                    Mot de passe
                  </Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="col-span-3"
                    onKeyPress={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
                  />
                </div>
                {loginError && <p className="col-span-4 text-sm text-destructive text-center">{loginError}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Annuler</Button>
                </DialogClose>
                <Button type="button" onClick={handleAdminLogin}>Se connecter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
         {isAdminAuthenticated && (
            <Button variant="outline" size="icon" aria-label="Déconnexion Admin" onClick={() => {
                setIsAdminAuthenticated(false);
                toast({ title: 'Déconnexion Admin', description: 'Vous êtes déconnecté.' });
            }}>
                <LogOut className="h-4 w-4" />
            </Button>
        )}
      </div>
    </div>
  );

  if (isLoading && recipes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center"> {/* Placeholder for New Recipe */}
                 <div className="animate-pulse h-10 w-36 bg-muted rounded-md"></div>
            </div>
            <div className="flex items-center gap-2"> {/* Placeholder for Filter, Refresh, Admin Login */}
                 <div className="animate-pulse h-10 w-[220px] bg-muted rounded-md"></div>
                 <div className="animate-pulse h-10 w-10 bg-muted rounded-md"></div>
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
             {isAdminAuthenticated ? ' Vous pouvez en créer une avec le bouton "New recipe".' : 'Connectez-vous en tant qu\'admin pour ajouter des recettes.'}
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
