
'use client';
import { useRef, useState } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Home, UploadCloud, FilePlus2, Tags, CalculatorIcon as CalculatorLucideIcon, BeerIcon, HardDrive, Cloud } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from 'next/navigation';
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
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddRecipeDialogOpen, setIsAddRecipeDialogOpen] = useState(false);

  const handleLocalFileSelectClick = () => {
    fileInputRef.current?.click();
    setIsAddRecipeDialogOpen(false); // Close dialog after initiating file selection
  };

  const handleGoogleDriveClick = () => {
    toast({
      title: "Fonctionnalité à venir",
      description: "L'intégration avec Google Drive est prévue prochainement.",
      duration: 5000,
    });
    setIsAddRecipeDialogOpen(false);
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      // No need to toast if no file was selected, user might have cancelled
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
        const result = await addRecipesAction(recipeFiles);
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
    <>
      <Sidebar>
        <SidebarHeader className="p-2">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-sidebar-primary hover:text-sidebar-primary/90 transition-colors px-2 py-1">
            <BeerIcon className="h-7 w-7" />
            <span>GitBrew</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip={{ children: 'Mes Recettes', side: 'right' }}
              >
                <Link href="/">
                  <Home className="h-5 w-5" />
                  <span>Mes Recettes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/label'}
                tooltip={{ children: 'GitBrew Label', side: 'right' }}
              >
                <Link href="/label">
                  <Tags className="h-5 w-5" />
                  <span>GitBrew Label</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/calculator'}
                tooltip={{ children: 'GitBrew Calculator', side: 'right' }}
              >
                <Link href="/calculator">
                  <CalculatorLucideIcon className="h-5 w-5" />
                  <span>GitBrew Calculator</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <AlertDialog open={isAddRecipeDialogOpen} onOpenChange={setIsAddRecipeDialogOpen}>
                <AlertDialogTrigger asChild>
                  <SidebarMenuButton
                    tooltip={{ children: 'Ajouter une recette (fichier BeerXML)', side: 'right' }}
                  >
                    <UploadCloud className="h-5 w-5" />
                    <span>Ajouter une recette</span>
                  </SidebarMenuButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ajouter une recette depuis...</AlertDialogTitle>
                    <AlertDialogDescription>
                      Choisissez la source de votre fichier de recette BeerXML.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                    <Button variant="outline" onClick={handleLocalFileSelectClick} className="w-full">
                      <HardDrive className="mr-2 h-5 w-5" />
                      Mon ordinateur
                    </Button>
                    <Button variant="outline" onClick={handleGoogleDriveClick} className="w-full">
                      <Cloud className="mr-2 h-5 w-5" />
                      Google Drive
                    </Button>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
      <input
        type="file"
        accept=".xml"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: 'none' }}
        id="recipe-file-input"
      />
    </>
  );
}
