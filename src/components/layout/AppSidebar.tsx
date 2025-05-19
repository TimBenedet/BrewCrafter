
'use client';
import { useRef } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Home, UploadCloud, FilePlus2 } from 'lucide-react'; 
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from 'next/navigation';
import { addRecipesAction } from '@/app/actions/recipe-actions';

export function AppSidebar() {
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRecipeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "Aucun fichier sélectionné",
        description: "Veuillez sélectionner un fichier BeerXML (.xml).",
        variant: "destructive",
        duration: 5000,
      });
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
      return;
    }

    if (!file.name.endsWith('.xml')) {
        toast({
            title: "Fichier non XML",
            description: "Le fichier sélectionné n'est pas un fichier BeerXML (.xml). Veuillez en sélectionner un autre.",
            variant: "destructive",
            duration: 5000,
        });
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        return;
    }

    const recipeFiles: Array<{ fileName: string; content: string }> = [];
    try {
      const content = await file.text();
      recipeFiles.push({ fileName: file.name, content });
    } catch (error) {
      console.error("Error reading file:", file.name, error);
      toast({
        title: `Erreur de lecture du fichier ${file.name}`,
        description: (error as Error).message,
        variant: "destructive",
        duration: 5000,
      });
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
      return;
    }

    if (recipeFiles.length > 0) {
      toast({
        title: "Traitement en cours...",
        description: `Ajout de la recette ${file.name}.`,
        duration: 3000,
      });

      try {
        const result = await addRecipesAction(recipeFiles); // Server action expects an array
        if (result.success && result.count === 1) {
          toast({
            title: "Recette ajoutée !",
            description: `La recette ${file.name} a été ajoutée avec succès.`,
            duration: 5000,
          });
          router.refresh(); 
        } else if (result.success && result.count === 0) {
          toast({
            title: "Recette non ajoutée",
            description: `Le fichier ${file.name} n'a pas pu être traité ou était déjà présent (vérifiez la console pour plus de détails).`,
            variant: "destructive",
            duration: 5000,
          });
        } else {
          throw new Error(result.error || "Une erreur inconnue est survenue lors de l'ajout de la recette.");
        }
      } catch (error) {
        console.error("Error in server action:", error);
        toast({
          title: "Échec de l'ajout de la recette",
          description: (error as Error).message,
          variant: "destructive",
          duration: 5000,
        });
      }
    }
    
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-2">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-sidebar-primary hover:text-sidebar-primary/90 transition-colors px-2 py-1">
          <span>GitBrew Menu</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/'}
              tooltip={{ children: 'Accueil', side: 'right' }}
            >
              <Link href="/">
                <Home className="h-5 w-5" />
                <span>Accueil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleAddRecipeClick}
              tooltip={{ children: 'Ajouter une recette (fichier BeerXML)', side: 'right' }}
            >
              <UploadCloud className="h-5 w-5" />
              <span>Ajouter une recette</span>
            </SidebarMenuButton>
            <input
              type="file"
              accept=".xml"
              ref={fileInputRef}
              onChange={handleFileSelected}
              style={{ display: 'none' }}
              id="recipe-file-input"
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/recipes/new'}
              tooltip={{ children: 'Créer une nouvelle recette', side: 'right' }}
            >
              <Link href="/recipes/new">
                <FilePlus2 className="h-5 w-5" />
                <span>Nouvelle Recette</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
