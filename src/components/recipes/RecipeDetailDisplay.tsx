
import type { BeerXMLRecipe, Style, Fermentable, Hop, Yeast, Misc, MashProfile, MashStep } from '@/types/recipe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Wheat, HopIcon, InfoIcon, ListChecksIcon, Microscope, Thermometer, StickyNote, Package } from 'lucide-react'; // Added Wheat, Package

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
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

const renderValue = (value: string | number | undefined, unit: string = '', precision: number = 2) => {
  if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) return <span className="text-muted-foreground">N/A</span>;
  if (typeof value === 'number') {
    return `${value.toFixed(precision)}${unit ? ` ${unit}` : ''}`;
  }
  return `${value}${unit ? ` ${unit}` : ''}`;
};

export function RecipeDetailDisplay({ recipe }: { recipe: BeerXMLRecipe }) {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">{recipe.name}</h1>
        <p className="text-xl text-muted-foreground">{recipe.type}{recipe.brewer ? ` by ${recipe.brewer}` : ''}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center"><InfoIcon className="mr-2 h-5 w-5 text-primary" />General</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Batch Size:</strong> {renderValue(recipe.batchSize, 'L')}</p>
            <p><strong>Boil Size:</strong> {renderValue(recipe.boilSize, 'L')}</p>
            <p><strong>Boil Time:</strong> {renderValue(recipe.boilTime, 'min')}</p>
            {recipe.efficiency && <p><strong>Efficiency:</strong> {renderValue(recipe.efficiency, '%')}</p>}
          </CardContent>
        </Card>
        {recipe.style && (
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center"><ListChecksIcon className="mr-2 h-5 w-5 text-primary" />Style: {recipe.style.name}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {recipe.style.category && <p><strong>Category:</strong> {recipe.style.category}</p>}
              <div className="grid grid-cols-2 gap-x-4">
                {recipe.style.ogMin && recipe.style.ogMax && <p><strong>OG Range:</strong> {renderValue(recipe.style.ogMin, '', 3)} - {renderValue(recipe.style.ogMax, '', 3)}</p>}
                {recipe.style.fgMin && recipe.style.fgMax && <p><strong>FG Range:</strong> {renderValue(recipe.style.fgMin, '', 3)} - {renderValue(recipe.style.fgMax, '', 3)}</p>}
                {recipe.style.ibuMin && recipe.style.ibuMax && <p><strong>IBU Range:</strong> {renderValue(recipe.style.ibuMin, '', 0)} - {renderValue(recipe.style.ibuMax, '', 0)}</p>}
                {recipe.style.colorMin && recipe.style.colorMax && <p><strong>Color Range (SRM):</strong> {renderValue(recipe.style.colorMin, '', 0)} - {renderValue(recipe.style.colorMax, '', 0)}</p>}
                {recipe.style.abvMin && recipe.style.abvMax && <p><strong>ABV Range:</strong> {renderValue(recipe.style.abvMin, '%', 1)} - {renderValue(recipe.style.abvMax, '%', 1)}</p>}
              </div>
            </CardContent>
          </Card>
        )}
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

      {recipe.mash && recipe.mash.mashSteps.length > 0 && (
        <DetailSection title={`Mash Profile: ${recipe.mash.name}`} icon={Thermometer}>
          {recipe.mash.grainTemp && <p className="mb-2 text-sm"><strong>Grain Temperature:</strong> {renderValue(recipe.mash.grainTemp, '°C')}</p>}
          <Table>
            <TableHeader><TableRow><TableHead>Step Name</TableHead><TableHead>Type</TableHead><TableHead>Temp</TableHead><TableHead>Time</TableHead>{recipe.mash.mashSteps.some(s => s.infuseAmount) && <TableHead>Infuse Amt.</TableHead>}</TableRow></TableHeader>
            <TableBody>
              {recipe.mash.mashSteps.map((s, i) => (
                <TableRow key={i}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.type}</TableCell>
                  <TableCell>{renderValue(s.stepTemp, '°C')}</TableCell>
                  <TableCell>{renderValue(s.stepTime, 'min')}</TableCell>
                  {recipe.mash!.mashSteps.some(step => step.infuseAmount) && <TableCell>{renderValue(s.infuseAmount, 'L')}</TableCell>}
                </TableRow>
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

      