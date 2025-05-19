
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Tag, Calculator } from 'lucide-react';

const navItems = [
  { href: '/', label: 'My Recipes', icon: List },
  { href: '/label', label: 'GitBrew Label', icon: Tag },
  { href: '/calculator', label: 'GitBrew Calculator', icon: Calculator },
];

export function TopTabs() {
  const pathname = usePathname();

  return (
    <div className=""> {/* Removed mb-6 border-b */}
      <Tabs value={pathname} className=""> {/* Removed container mx-auto px-0 sm:px-4, handled by Header now */}
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex bg-transparent p-0 h-auto"> {/* Ensured bg-transparent, p-0, h-auto */}
          {navItems.map((item) => (
            <TabsTrigger 
              key={item.href} 
              value={item.href} 
              asChild
              className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:shadow-none hover:bg-muted/50 transition-colors px-3 py-1.5 text-sm font-medium" // Adjusted active and hover styles, ensured text styling
            >
              <Link href={item.href} className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

