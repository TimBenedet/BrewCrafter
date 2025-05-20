
import Link from 'next/link';
import { TopTabs } from '@/components/layout/TopTabs';

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-center">
        {/* Removed SidebarTrigger for mobile */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <TopTabs />
        </div>
        {/* Removed SidebarTrigger for desktop */}
        {/* Placeholder for potential right-aligned elements if needed in the future */}
        <div className="absolute right-4">
            {/* Example: <UserButton /> or <ThemeToggle /> */}
        </div>
      </div>
    </header>
  );
}
