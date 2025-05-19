
import type { BeerXMLRecipe } from '@/types/recipe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Wheat, 
  HopIcon, 
  InfoIcon, 
  ListChecksIcon, 
  Microscope, 
  Thermometer, 
  StickyNote, 
  Package,
  Container, // For Batch Volume
  Clock,     // For Boil Time
  Percent,   // For Efficiency and ABV
  Palette,   // For Color
  BarChart3  // For Target Stats title
} from 'lucide-react';

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const DetailSection: React.FC<SectionProps> = ({ title, icon: Icon, children }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center text-xl">
        <Icon className="mr-3 h-6 w-6 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

const renderValue = (value: string | number | undefined, unit: string = '', precision: number = 2, showUnitBefore: boolean = false) => {
  if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) return <span className="text-muted-foreground">N/A</span>;
  let displayValue: string;
  if (typeof value === 'number') {
    displayValue = value.toFixed(precision);
  } else {
    displayValue = value;
  }
  return showUnitBefore ? `${unit}${displayValue}` : `${displayValue}${unit ? ` ${unit}` : ''}`;
};


// Helper for Target Stat item with Progress bar
interface TargetStatProps {
  icon: React.ElementType;
  label: string;
  value?: number;
  unit?: string;
  precision?: number;
  progressValue?: number; // Percentage for the progress bar (0-100)
  valueDisplayOverride?: string; // To display something like "1.052" instead of "1.05"
}

const TargetStatItem: React.FC<TargetStatProps> = ({
  icon: Icon,
  label,
  value,
  unit = '',
  precision = 1,
  progressValue = 0,
  valueDisplayOverride
}) => {
  const displayVal = valueDisplayOverride ?? (value !== undefined ? renderValue(value, unit, precision) : <span className="text-muted-foreground">N/A</span>);
  
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex items-center gap-2 w-2/5 sm:w-1/3 md:w-2/5 lg:w-1/2 shrink-0">
        <Icon className="h-5 w-5 text-primary" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex-grow">
        <Progress value={progressValue} className="h-2" />
      </div>
      <div className="w-16 text-right text-sm font-medium">
        {displayVal}
      </div>
    </div>
  );
};

// Normalization functions for progress bars
const normalizeGravity = (gravity?: number): number => {
  if (gravity === undefined || isNaN(gravity)) return 0;
  const minG = 1.000;
  const maxGVisual = 1.120; // Visual max, adjust as needed
  if (gravity <= minG) return 0;
  if (gravity >= maxGVisual) return 100;
  return ((gravity - minG) / (maxGVisual - minG)) * 100;
};

const normalizeAbv = (abv?: number): number => {
  if (abv === undefined || isNaN(abv)) return 0;
  const maxAbvVisual = 15; // Visual max %
  if (abv <= 0) return 0;
  if (abv >= maxAbvVisual) return 100;
  return (abv / maxAbvVisual) * 100;
};

const normalizeIbu = (ibu?: number): number => {
  if (ibu === undefined || isNaN(ibu)) return 0;
  const maxIbuVisual = 120; // Visual max
  if (ibu <= 0) return 0;
  if (ibu >= maxIbuVisual) return 100;
  return (ibu / maxIbuVisual) * 100;
};

const normalizeColor = (srm?: number): number => {
  if (srm === undefined || isNaN(srm)) return 0;
  const maxColorVisual = 40; // Visual max SRM (Lager=2-6, Stout=30-40+)
  if (srm <= 0) return 0;
  if (srm >= maxColorVisual) return 100;
  return (srm / maxColorVisual) * 100;
};


export function RecipeDetailDisplay({ recipe }: { recipe: BeerXMLRecipe }) {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">{recipe.name}</h1>
        <p className="text-xl text-muted-foreground">{recipe.type}{recipe.brewer ? ` by ${recipe.brewer}` : ''}</p>
      </header>

      {/* Metadata and Target Stats Section - Stacked Vertically */}
      <div className="space-y-6 mb-6">
        {/* Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <InfoIcon className="mr-3 h-5 w-5 text-primary" />
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-center sm:text-left">
              <div className="py-2">
                <Container className="mx-auto sm:mx-0 mb-1 h-6 w-6 text-primary" />
                <p className="text-xs text-muted-foreground">Batch Volume</p>
                <p className="text-lg font-semibold">{renderValue(recipe.batchSize, 'L', 1)}</p>
              </div>
              <div className="py-2">
                <Clock className="mx-auto sm:mx-0 mb-1 h-6 w-6 text-primary" />
                <p className="text-xs text-muted-foreground">Boil Time</p>
                <p className="text-lg font-semibold">{renderValue(recipe.boilTime, 'min', 0)}</p>
              </div>
              <div className="py-2">
                <Percent className="mx-auto sm:mx-0 mb-1 h-6 w-6 text-primary" />
                <p className="text-xs text-muted-foreground">Efficiency</p>
                <p className="text-lg font-semibold">{renderValue(recipe.efficiency, '%', 0)}</p>
              </div>
              {recipe.boilSize && (
                <div className="py-2">
                  <ListChecksIcon className="mx-auto sm:mx-0 mb-1 h-6 w-6 text-primary" />
                  <p className="text-xs text-muted-foreground">Boil Volume</p>
                  <p className="text-lg font-semibold">{renderValue(recipe.boilSize, 'L', 1)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Target Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="mr-3 h-5 w-5 text-primary" />
              Target Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            <TargetStatItem 
              icon={Thermometer} 
              label="Original Gravity" 
              value={recipe.og}
              valueDisplayOverride={recipe.og !== undefined ? recipe.og.toFixed(3) : undefined}
              progressValue={normalizeGravity(recipe.og)} 
            />
            <Separator />
            <TargetStatItem 
              icon={Thermometer} 
              label="Final Gravity" 
              value={recipe.fg}
              valueDisplayOverride={recipe.fg !== undefined ? recipe.fg.toFixed(3) : undefined}
              progressValue={normalizeGravity(recipe.fg)} 
            />
            <Separator />
            <TargetStatItem 
              icon={Percent} 
              label="Alcohol By Volume" 
              value={recipe.abv} 
              unit="%" 
              precision={1} 
              progressValue={normalizeAbv(recipe.abv)} 
            />
            <Separator />
            <TargetStatItem 
              icon={HopIcon} 
              label="Bitterness (IBU)" 
              value={recipe.ibu} 
              precision={0} 
              progressValue={normalizeIbu(recipe.ibu)} 
            />
            <Separator />
            <TargetStatItem 
              icon={Palette} 
              label="Color (SRM)" 
              value={recipe.color} 
              precision={0} 
              progressValue={normalizeColor(recipe.color)} 
            />
          </CardContent>
        </Card>
      </div>
      
      {recipe.fermentables.length > 0 && (
        <DetailSection title="Fermentables" icon={Wheat}>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead><TableHead>Yield</TableHead><TableHead>Color</TableHead></TableRow></TableHeader>
            <TableBody>
              {recipe.fermentables.map((f, i) => (
                <TableRow key={i}><TableCell>{f.name}</TableCell><TableCell>{renderValue(f.amount, 'kg')}</TableCell><TableCell>{f.type}</TableCell><TableCell>{renderValue(f.yieldPercentage, '%')}</TableCell><TableCell>{renderValue(f.color, 'SRM')}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </DetailSection>
      )}

      {recipe.hops.length > 0 && (
        <DetailSection title="Hops" icon={HopIcon}>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Use</TableHead><TableHead>Time</TableHead><TableHead>Alpha</TableHead><TableHead>Form</TableHead></TableRow></TableHeader>
            <TableBody>
              {recipe.hops.map((h, i) => (
                <TableRow key={i}><TableCell>{h.name}</TableCell><TableCell>{renderValue(h.amount * 1000, 'g')}</TableCell><TableCell>{h.use}</TableCell><TableCell>{renderValue(h.time, 'min')}</TableCell><TableCell>{renderValue(h.alpha, '%')}</TableCell><TableCell>{h.form || 'N/A'}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </DetailSection>
      )}

      {recipe.yeasts.length > 0 && (
        <DetailSection title="Yeasts" icon={Microscope}>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead><TableHead>Form</TableHead><TableHead>Lab</TableHead><TableHead>Product ID</TableHead></TableRow></TableHeader>
            <TableBody>
              {recipe.yeasts.map((y, i) => (
                <TableRow key={i}><TableCell>{y.name}</TableCell><TableCell>{renderValue(y.amount, y.form === 'Liquid' ? 'L' : 'g')}</TableCell><TableCell>{y.type}</TableCell><TableCell>{y.form}</TableCell><TableCell>{y.laboratory || 'N/A'}</TableCell><TableCell>{y.productId || 'N/A'}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </DetailSection>
      )}
      
      {recipe.miscs.length > 0 && (
        <DetailSection title="Miscs" icon={Package}>
           <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Use</TableHead><TableHead>Time</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
            <TableBody>
              {recipe.miscs.map((m, i) => (
                <TableRow key={i}><TableCell>{m.name}</TableCell><TableCell>{renderValue(m.amount)}</TableCell><TableCell>{m.use}</TableCell><TableCell>{renderValue(m.time, 'min')}</TableCell><TableCell>{m.type}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </DetailSection>
      )}

      {recipe.notes && (
        <DetailSection title="Notes" icon={StickyNote}>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: recipe.notes.replace(/\n/g, '<br />') }} />
        </DetailSection>
      )}
    </div>
  );
}
    
