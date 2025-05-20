
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { List, Tag, Calculator, Menu as MenuIcon } from 'lucide-react'; // Added MenuIcon

const navItems = [
  { href: '/', label: 'My Recipes', icon: List },
  { href: '/label', label: 'GitBrew Label', icon: Tag },
  { href: '/calculator', label: 'GitBrew Calculator', icon: Calculator },
];

export function TopTabs() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Dropdown Menu */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MenuIcon className="h-6 w-6" />
              <span className="sr-only">Ouvrir le menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {navItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className={`flex items-center gap-2 w-full ${pathname === item.href ? 'text-primary font-semibold' : ''}`}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden md:flex">
        <Tabs value={pathname} className="">
          <TabsList className="flex flex-row space-x-1 bg-transparent p-0 h-auto">
            {navItems.map((item) => (
              <TabsTrigger
                key={item.href}
                value={item.href}
                asChild
                className="w-auto justify-center data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-transparent hover:text-primary/80 data-[state=inactive]:text-muted-foreground transition-colors px-3 py-1.5 text-sm font-medium"
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
    </>
  );
}
