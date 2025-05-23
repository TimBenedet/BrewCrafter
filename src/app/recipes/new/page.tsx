import { RecipeForm } from '@/components/recipes/RecipeForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';

export default function NewRecipePage() {
  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to recipes
          </Link>
        </Button>
      </div>
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-primary">Create New Recipe</h1>
        <p className="text-muted-foreground">Fill in the fields below to define your recipe.</p>
      </header>
      <RecipeForm />
    </div>
  );
}