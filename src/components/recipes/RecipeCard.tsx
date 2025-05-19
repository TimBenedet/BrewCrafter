
import Link from 'next/link';
import type { RecipeSummary } from '@/types/recipe';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRightIcon, BeerIcon, Palette, Percent, Thermometer, AlertTriangle } from 'lucide-react';

interface RecipeCardProps {
  recipe: RecipeSummary;
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


export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.slug}`} passHref legacyBehavior>
      <a className="block hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg group">
        <Card className="h-full flex flex-col transition-all duration-200 ease-in-out group-hover:shadow-xl group-hover:border-primary/50 group-focus-within:shadow-xl group-focus-within:border-primary/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl mb-0.5 leading-tight text-primary">{recipe.name}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{recipe.styleName || recipe.type}</CardDescription>
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
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full justify-between text-primary group-hover:bg-primary/10">
              View Recipe
              <ChevronRightIcon className="h-4 w-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </CardFooter>
        </Card>
      </a>
    </Link>
  );
}
