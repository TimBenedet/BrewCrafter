
'use client';

import type { BeerXMLRecipe } from '@/types/recipe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Wheat, 
  Hop,
  InfoIcon, 
  ListChecksIcon, 
  Microscope, 
  Thermometer, 
  StickyNote, 
  Package,
  Container,
  Clock,
  Percent,
  Palette,
  BarChart3,
  FileText, 
  ListOrdered,
  GlassWater,
  PencilIcon
} from 'lucide-react';
import { RecipeStepsDisplay } from './RecipeStepsDisplay';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const DetailSectionTitle: React.FC<{ icon: React.ElementType; title: string }> = ({ icon: Icon, title }) => (
  <CardTitle className="flex items-center text-xl py-0">
    <Icon className="mr-3 h-6 w-6 text-primary" />
    {title}
  </CardTitle>
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

interface TargetStatProps {
  icon: React.ElementType;
  label: string;
  value?: number;
  unit?: string;
  precision?: number;
  progressValue?: number;
  valueDisplayOverride?: string;
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

const normalizeGravity = (gravity?: number): number => {
  if (gravity === undefined || isNaN(gravity)) return 0;
  const minG = 1.000;
  const maxGVisual = 1.120;
  if (gravity <= minG) return 0;
  if (gravity >= maxGVisual) return 100;
  return ((gravity - minG) / (maxGVisual - minG)) * 100;
};

const normalizeAbv = (abv?: number): number => {
  if (abv === undefined || isNaN(abv)) return 0;
  const maxAbvVisual = 15;
  if (abv <= 0) return 0;
  if (abv >= maxAbvVisual) return 100;
  return (abv / maxAbvVisual) * 100;
};

const normalizeIbu = (ibu?: number): number => {
  if (ibu === undefined || isNaN(ibu)) return 0;
  const maxIbuVisual = 120;
  if (ibu <= 0) return 0;
  if (ibu >= maxIbuVisual) return 100;
  return (ibu / maxIbuVisual) * 100;
};

const normalizeColor = (srm?: number): number => {
  if (srm === undefined || isNaN(srm)) return 0;
  const maxColorVisual = 40;
  if (srm <= 0) return 0;
  if (srm >= maxColorVisual) return 100;
  return (srm / maxColorVisual) * 100;
};


export function RecipeDetailDisplay({ recipe, recipeSlug }: { recipe: BeerXMLRecipe, recipeSlug: string }) {
  const { isAdminAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("details");

  const editButtonText = activeTab === "details" ? "Modifier Détails Recette" : "Modifier Étapes Recette";
  const editLink = activeTab === "steps" ? `/recipes/${recipeSlug}/edit?section=steps` : `/recipes/${recipeSlug}/edit`;

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <GlassWater className="h-12 w-12 text-primary" style={{ strokeWidth: 1.5 }} />
            <div>
              <h1 className="text-3xl font-bold text-primary">{recipe.name}</h1>
              {recipe.style?.name && (
                <p className="text-lg text-muted-foreground">{recipe.style.name}</p>
              )}
              {recipe.brewer && (
                <p className="text-sm text-muted-foreground">By: {recipe.brewer}</p>
              )}
            </div>
          </div>
          {isAdminAuthenticated && (
            <Button asChild variant="outline">
              <Link href={editLink}>
                <PencilIcon className="mr-2 h-4 w-4" />
                {editButtonText}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Recipe Details
          </TabsTrigger>
          <TabsTrigger value="steps" className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4" /> Recipe Steps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
           <Accordion type="multiple" defaultValue={['item-metadata', 'item-target-stats']} className="w-full">
            <AccordionItem value="item-metadata">
              <AccordionTrigger>
                  <CardTitle className="flex items-center text-xl">
                    <InfoIcon className="mr-3 h-5 w-5 text-primary" />
                    Metadata
                  </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-1 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-center sm:text-left">
                    <div className="py-2">
                      <Container className="mx-auto sm:mx-0 mb-1 h-6 w-6 text-primary" />
                      <p className="text-xs text-muted-foreground">Batch Volume</p>
                      <p className="text-lg font-semibold">{renderValue(recipe.batchSize, 'L', 1)}</p>
                    </div>
                     {recipe.boilSize && (
                      <div className="py-2">
                        <ListChecksIcon className="mx-auto sm:mx-0 mb-1 h-6 w-6 text-primary" />
                        <p className="text-xs text-muted-foreground">Boil Volume</p>
                        <p className="text-lg font-semibold">{renderValue(recipe.boilSize, 'L', 1)}</p>
                      </div>
                    )}
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
                  </div>
                </CardContent>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-target-stats">
               <AccordionTrigger>
                  <CardTitle className="flex items-center text-xl">
                    <BarChart3 className="mr-3 h-5 w-5 text-primary" />
                    Target Stats
                  </CardTitle>
               </AccordionTrigger>
               <AccordionContent>
                <CardContent className="space-y-2 pt-4">
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
                    icon={Hop} 
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
              </AccordionContent>
            </AccordionItem>
            
            {recipe.fermentables && recipe.fermentables.length > 0 && (
               <AccordionItem value="item-fermentables">
                <AccordionTrigger>
                  <DetailSectionTitle icon={Wheat} title="Fermentables" />
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead><TableHead>Yield</TableHead><TableHead>Color</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {recipe.fermentables.map((f, i) => (
                          <TableRow key={i}><TableCell>{f.name}</TableCell><TableCell>{renderValue(f.amount, 'kg')}</TableCell><TableCell>{f.type}</TableCell><TableCell>{renderValue(f.yieldPercentage, '%')}</TableCell><TableCell>{renderValue(f.color, 'SRM')}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </AccordionContent>
              </AccordionItem>
            )}

            {recipe.hops && recipe.hops.length > 0 && (
              <AccordionItem value="item-hops">
                <AccordionTrigger>
                  <DetailSectionTitle icon={Hop} title="Hops" />
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Use</TableHead><TableHead>Time</TableHead><TableHead>Alpha</TableHead><TableHead>Form</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {recipe.hops.map((h, i) => (
                          <TableRow key={i}><TableCell>{h.name}</TableCell><TableCell>{renderValue(h.amount * 1000, 'g')}</TableCell><TableCell>{h.use}</TableCell><TableCell>{renderValue(h.time, 'min')}</TableCell><TableCell>{renderValue(h.alpha, '%')}</TableCell><TableCell>{h.form || 'N/A'}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </AccordionContent>
              </AccordionItem>
            )}

            {recipe.yeasts && recipe.yeasts.length > 0 && (
              <AccordionItem value="item-yeasts">
                <AccordionTrigger>
                  <DetailSectionTitle icon={Microscope} title="Yeasts" />
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead><TableHead>Form</TableHead><TableHead>Lab</TableHead><TableHead>Product ID</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {recipe.yeasts.map((y, i) => (
                          <TableRow key={i}><TableCell>{y.name}</TableCell><TableCell>{renderValue(y.amount, y.form === 'Liquid' ? 'L' : 'g')}</TableCell><TableCell>{y.type}</TableCell><TableCell>{y.form}</TableCell><TableCell>{y.laboratory || 'N/A'}</TableCell><TableCell>{y.productId || 'N/A'}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {recipe.miscs && recipe.miscs.length > 0 && (
               <AccordionItem value="item-miscs">
                <AccordionTrigger>
                  <DetailSectionTitle icon={Package} title="Miscs" />
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Use</TableHead><TableHead>Time</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {recipe.miscs.map((m, i) => (
                          <TableRow key={i}><TableCell>{m.name}</TableCell><TableCell>{renderValue(m.amount)}</TableCell><TableCell>{m.use}</TableCell><TableCell>{renderValue(m.time, 'min')}</TableCell><TableCell>{m.type}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </AccordionContent>
              </AccordionItem>
            )}

            {recipe.notes && (
              <AccordionItem value="item-notes">
                <AccordionTrigger>
                  <DetailSectionTitle icon={StickyNote} title="Notes" />
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: recipe.notes.replace(/\\n/g, '<br />') }} />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </TabsContent>
        
        <TabsContent value="steps" className="mt-4">
          {recipe.stepsMarkdown ? (
            <RecipeStepsDisplay stepsMarkdown={recipe.stepsMarkdown} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">No detailed steps file (.md) found for this recipe.</p>
                  {isAdminAuthenticated && (
                    <p className="mt-2 text-sm">
                      You can <Link href={`/recipes/${recipeSlug}/edit?section=steps`} className="text-primary hover:underline">edit this recipe to add the steps</Link>.
                    </p>
                  )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

    