import Link from 'next/link';
import { BeerIcon } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TopTabs } from '@/components/layout/TopTabs';

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* SidebarTrigger for mobile, managed by ui/sidebar component's CSS */}
          <SidebarTrigger className="md:hidden" /> 
          {/* GitBrew logo and text link removed from here */}
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <TopTabs />
        </div>
        {/* SidebarTrigger for desktop */}
        <div>
           <SidebarTrigger className="hidden md:flex" />
        </div>
      </div>
    </header>
  );
}
