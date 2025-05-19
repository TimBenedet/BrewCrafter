import Link from 'next/link';
import { BeerIcon } from 'lucide-react'; // Using a generic BeerIcon, replace if a more specific one is needed

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/90 transition-colors">
          <BeerIcon className="h-7 w-7" />
          <span>GitBrew</span>
        </Link>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl font-medium text-foreground">My Beer Recipes</h1>
        </div>
        {/* Placeholder for potential future actions like theme toggle or GitHub link */}
        <div></div>
      </div>
    </header>
  );
}
