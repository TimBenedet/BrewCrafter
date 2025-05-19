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
import { FolderPlus, Home, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from 'next/navigation';
import { addRecipesAction } from '@/app/actions/recipe-actions';

export function AppSidebar() {
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRecipesClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      toast({
        title: "Aucun dossier sélectionné",
        description: "Veuillez sélectionner un dossier contenant des fichiers BeerXML.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    const recipeFiles: Array<{ fileName: string; content: string }> = [];
    let hasXmlFile = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith('.xml')) {
        hasXmlFile = true;
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
          return; // Stop processing if one file fails
        }
      }
    }

    if (!hasXmlFile) {
        toast({
            title: "Aucun fichier XML trouvé",
            description: "Le dossier sélectionné ne contient aucun fichier BeerXML (.xml).",
            variant: "destructive",
            duration: 5000,
        });
        // Reset file input to allow re-selection of the same folder if needed
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        return;
    }

    if (recipeFiles.length > 0) {
      toast({
        title: "Traitement en cours...",
        description: `Ajout de ${recipeFiles.length} recette(s).`,
        duration: 3000,
      });

      try {
        const result = await addRecipesAction(recipeFiles);
        if (result.success) {
          toast({
            title: "Recettes ajoutées !",
            description: `${result.count} recette(s) ont été ajoutées avec succès.`,
            duration: 5000,
          });
          router.refresh(); // Refresh the page to show new recipes
        } else {
          throw new Error(result.error || "Une erreur inconnue est survenue.");
        }
      } catch (error) {
        console.error("Error in server action:", error);
        toast({
          title: "Échec de l'ajout des recettes",
          description: (error as Error).message,
          variant: "destructive",
          duration: 5000,
        });
      }
    }
    // Reset file input to allow re-selection of the same folder if needed
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
              onClick={handleAddRecipesClick}
              tooltip={{ children: 'Ajouter des recettes depuis un dépôt', side: 'right' }}
            >
              <UploadCloud className="h-5 w-5" /> {/* Changed icon to UploadCloud for better semantics */}
              <span>Ajouter des recettes</span>
            </SidebarMenuButton>
            <input
              type="file"
              /* @ts-ignore: webkitdirectory is a non-standard attribute but widely supported */
              webkitdirectory="true"
              directory="true"
              multiple
              accept=".xml"
              ref={fileInputRef}
              onChange={handleFilesSelected}
              style={{ display: 'none' }}
              id="recipe-folder-input"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
