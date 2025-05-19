import Link from 'next/link';
import { BeerIcon } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* SidebarTrigger for mobile, managed by ui/sidebar component's CSS */}
          <SidebarTrigger className="md:hidden" /> 
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/90 transition-colors">
            <BeerIcon className="h-7 w-7" />
            <span>GitBrew</span>
          </Link>
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl font-medium text-foreground">My Beer Recipes</h1>
        </div>
        {/* SidebarTrigger for desktop */}
        <div>
           <SidebarTrigger className="hidden md:flex" />
        </div>
      </div>
    </header>
  );
}
