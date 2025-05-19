import Link from 'next/link';
import type { RecipeSummary } from '@/types/recipe';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotebookTextIcon, ChevronRightIcon } from 'lucide-react';

interface RecipeCardProps {
  recipe: RecipeSummary;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.slug}`} passHref legacyBehavior>
      <a className="block hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg group">
        <Card className="h-full flex flex-col transition-all duration-200 ease-in-out group-hover:shadow-xl group-hover:border-primary/50 group-focus-within:shadow-xl group-focus-within:border-primary/50">
          <CardHeader className="flex-grow">
            <div className="flex items-start gap-3">
              <NotebookTextIcon className="h-8 w-8 text-primary mt-1 shrink-0" />
              <div>
                <CardTitle className="text-xl mb-1 leading-tight">{recipe.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">{recipe.type}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full justify-between text-primary group-hover:bg-primary/10">
              View Details
              <ChevronRightIcon className="h-4 w-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </CardFooter>
        </Card>
      </a>
    </Link>
  );
}
