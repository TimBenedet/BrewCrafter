
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
    <div className=""> 
      <Tabs value={pathname} className=""> 
        <TabsList className="flex flex-col space-y-1 md:space-y-0 md:flex-row md:space-x-1 md:w-auto bg-transparent p-0 h-auto">
          {navItems.map((item) => (
            <TabsTrigger 
              key={item.href} 
              value={item.href} 
              asChild
              className="w-full md:w-auto justify-center data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors px-3 py-1.5 text-sm font-medium"
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
