'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { FolderPlus, Home } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { usePathname } from 'next/navigation';

export function AppSidebar() {
  const { toast } = useToast();
  const pathname = usePathname();

  const handleAddRecipes = () => {
    toast({
      title: "Fonctionnalité à venir",
      description: "La sélection du dépôt de recettes sera bientôt disponible.",
      duration: 3000,
    });
    console.log("Add recipes from repo clicked");
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
              onClick={handleAddRecipes}
              tooltip={{ children: 'Ajouter des recettes depuis un dépôt', side: 'right' }}
            >
              <FolderPlus className="h-5 w-5" />
              <span>Ajouter des recettes</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
