
'use client';

import Link from 'next/link';
import type { RecipeSummary } from '@/types/recipe';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChevronRightIcon, BeerIcon, Palette, Percent, Thermometer, AlertTriangle, Trash2, ActivityIcon, CheckCircle2Icon } from 'lucide-react';
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { deleteRecipeAction } from '@/app/actions/recipe-actions';

interface RecipeCardProps {
  recipe: RecipeSummary;
  isAdmin?: boolean;
}

const StatItem: React.FC<{ icon: React.ElementType; label: string; value: string | number | undefined; unit?: string; precision?: number }> = ({
  icon: Icon,
  label,
  value,
  unit = '',
  precision = 1
}) => {
  if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
        {label}: N/A
      </div>
    );
  }
  const displayValue = typeof value === 'number' ? value.toFixed(precision) : value;
  return (
    <div className="flex items-center text-sm">
      <Icon className="h-4 w-4 mr-2 text-primary" />
      <span className="text-muted-foreground mr-1">{label}:</span>
      <span className="font-medium">{displayValue}{unit}</span>
    </div>
  );
};


export function RecipeCard({ recipe, isAdmin }: RecipeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDeleteRecipe = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteRecipeAction(recipe.slug);
      if (result.success) {
        toast({
          title: "Recipe Deleted",
          description: `Recipe "${recipe.name}" was successfully deleted.`,
        });
        router.refresh(); 
      } else {
        throw new Error(result.error || "Error deleting recipe.");
      }
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const statusText = recipe.status === 'completed' ? 'Completed' : 'In Progress';
  const statusIcon = recipe.status === 'completed' ? CheckCircle2Icon : ActivityIcon;
  const statusVariant = recipe.status === 'completed' ? 'default' : 'secondary';

  return (
    <Card className="h-full flex flex-col transition-all duration-200 ease-in-out hover:shadow-xl hover:border-primary/50 focus-within:shadow-xl focus-within:border-primary/50 group">
      <Link href={`/recipes/${recipe.slug}`} passHref legacyBehavior>
        <a className="block hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t-lg flex-grow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center"> {/* Changed items-start to items-center */}
              <div>
                <CardTitle className="text-xl mb-0.5 leading-tight text-primary">{recipe.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">{recipe.styleName || recipe.type}</CardDescription>
              </div>
              {recipe.status && (
                <Badge variant={statusVariant} className="ml-2 whitespace-nowrap">
                  <statusIcon className="h-3.5 w-3.5 mr-1.5" />
                  {statusText}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-3 pt-0 pb-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <StatItem icon={BeerIcon} label="Volume" value={recipe.batchSize} unit=" L" precision={1} />
              <StatItem icon={Thermometer} label="OG" value={recipe.og} precision={3} />
              <StatItem icon={Palette} label="Color" value={recipe.color} unit=" SRM" precision={0} />
              <StatItem icon={Thermometer} label="FG" value={recipe.fg} precision={3} />
              <StatItem icon={Percent} label="Alcohol" value={recipe.abv} unit="%" precision={1} />
              <StatItem icon={AlertTriangle} label="Bitterness" value={recipe.ibu} unit=" IBU" precision={0} />
            </div>
          </CardContent>
        </a>
      </Link>
      <CardFooter className="flex justify-between items-center">
        <Button variant="ghost" size="sm" className="text-primary group-hover:bg-primary/10 flex-grow mr-2" asChild>
          <Link href={`/recipes/${recipe.slug}`}>
            View Recipe
            <ChevronRightIcon className="h-4 w-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Button>
        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={isDeleting} aria-label="Delete recipe">
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this recipe?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is irreversible and will delete the recipe folder &quot;{recipe.name}&quot; and all its contents (recipe.xml, steps.md) from your Vercel Blob store.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRecipe} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}
