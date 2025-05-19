
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { SaveIcon, PlusCircleIcon, Trash2Icon, InfoIcon, ListChecksIcon, Wheat, Hop, Microscope, Package, Thermometer, StickyNote, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEffect } from 'react';

// Sub-schemas for array elements
const fermentableSchema = z.object({
  name: z.string().min(1, "Le nom du fermentescible est requis."),
  type: z.enum(['Grain', 'Extract', 'Sugar', 'Adjunct', 'Dry Extract', 'Liquid Extract']),
  amount: z.coerce.number().positive("La quantité doit être positive."),
  yield: z.coerce.number().min(0).max(100, "Le rendement doit être entre 0 et 100."),
  color: z.coerce.number().min(0, "La couleur (SRM) doit être positive."),
});

const hopSchema = z.object({
  name: z.string().min(1, "Le nom du houblon est requis."),
  alpha: z.coerce.number().min(0).max(100, "L'alpha acide doit être entre 0 et 100."),
  amount: z.coerce.number().positive("La quantité (en kg) doit être positive."),
  use: z.enum(['Boil', 'Dry Hop', 'Mash', 'First Wort', 'Aroma', 'Whirlpool']),
  time: z.coerce.number().min(0, "Le temps doit être positif ou nul."),
  form: z.enum(['Pellet', 'Plug', 'Leaf', 'Extract']),
});

const yeastSchema = z.object({
  name: z.string().min(1, "Le nom de la levure est requis."),
  type: z.enum(['Ale', 'Lager', 'Wheat', 'Wine', 'Champagne']),
  form: z.enum(['Liquid', 'Dry', 'Slant', 'Culture']),
  amount: z.coerce.number().positive("La quantité doit être positive."),
  laboratory: z.string().optional(),
  productId: z.string().optional(),
  attenuation: z.coerce.number().min(0).max(100, "L'atténuation doit être entre 0 et 100.").optional(),
});

const miscSchema = z.object({
  name: z.string().min(1, "Le nom de l'ingrédient divers est requis."),
  type: z.enum(['Spice', 'Fining', 'Water Agent', 'Herb', 'Flavor', 'Other']),
  use: z.enum(['Boil', 'Mash', 'Primary', 'Secondary', 'Bottling', 'Kegging']),
  time: z.coerce.number().min(0, "Le temps doit être positif ou nul."),
  amount: z.coerce.number().positive("La quantité doit être positive."),
});

const mashStepSchema = z.object({
  name: z.string().min(1, "Le nom de l'étape est requis."),
  type: z.enum(['Infusion', 'Temperature', 'Decoction']),
  stepTemp: z.coerce.number().positive("La température doit être positive."),
  stepTime: z.coerce.number().positive("La durée doit être positive."),
});

// Main recipe schema
const recipeFormSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  type: z.enum(['All Grain', 'Extract', 'Partial Mash'], { required_error: 'Le type de recette est requis.' }),
  brewer: z.string().optional(),
  batchSize: z.coerce.number().positive({ message: 'La taille du lot (BATCH_SIZE) doit être un nombre positif.' }),
  boilSize: z.coerce.number().positive({ message: 'La taille d\'ébullition (BOIL_SIZE) doit être un nombre positif.' }),
  boilTime: z.coerce.number().int().positive({ message: 'Le temps d\'ébullition (BOIL_TIME) doit être un entier positif.'}),
  efficiency: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),

  // Target Stats moved to their own section in UI, but remain top-level in schema for now
  og: z.coerce.number().min(0).optional(),
  fg: z.coerce.number().min(0).optional(),
  abv: z.coerce.number().min(0).optional(),
  ibu: z.coerce.number().min(0).optional(),
  colorSrm: z.coerce.number().min(0).optional(),

  style: z.object({
    name: z.string().min(1, "Le nom du style est requis."),
    category: z.string().optional(),
    styleGuide: z.string().optional(),
    type: z.enum(['Ale', 'Lager', 'Mead', 'Wheat', 'Mixed', 'Cider']),
  }),

  fermentables: z.array(fermentableSchema).optional(),
  hops: z.array(hopSchema).optional(),
  yeasts: z.array(yeastSchema).optional(),
  miscs: z.array(miscSchema).optional(),

  mash: z.object({
    name: z.string().min(1, "Le nom du profil d'empâtage est requis."),
    mashSteps: z.array(mashStepSchema).optional(),
  }),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

const defaultValues: Partial<RecipeFormValues> = {
  name: '',
  type: 'All Grain',
  brewer: '',
  batchSize: 20,
  boilSize: 25,
  boilTime: 60,
  efficiency: 72.0,
  og: 1.052,
  fg: 1.012,
  abv: 5.25, 
  ibu: 35.0, 
  colorSrm: 14.0, 
  notes: '',
  style: {
    name: 'American Amber Ale',
    category: 'Amber and Brown American Beer',
    styleGuide: 'BJCP 2015',
    type: 'Ale',
  },
  fermentables: [],
  hops: [],
  yeasts: [],
  miscs: [],
  mash: {
    name: 'Single Infusion',
    mashSteps: [
      { name: 'Saccharification', type: 'Infusion', stepTemp: 67, stepTime: 60 },
    ],
  },
};

function sanitizeForXml(text: string | undefined | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateBeerXml(data: RecipeFormValues): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<RECIPES>\n`;
  xml += `  <RECIPE>\n`;
  xml += `    <NAME>${sanitizeForXml(data.name)}</NAME>\n`;
  xml += `    <VERSION>1</VERSION>\n`;
  xml += `    <TYPE>${sanitizeForXml(data.type)}</TYPE>\n`;
  if (data.brewer) xml += `    <BREWER>${sanitizeForXml(data.brewer)}</BREWER>\n`;
  xml += `    <BATCH_SIZE>${data.batchSize}</BATCH_SIZE>\n`;
  xml += `    <BOIL_SIZE>${data.boilSize}</BOIL_SIZE>\n`;
  xml += `    <BOIL_TIME>${data.boilTime}</BOIL_TIME>\n`;
  if (data.efficiency !== undefined) xml += `    <EFFICIENCY>${data.efficiency}</EFFICIENCY>\n`;
  
  const og = data.og === undefined || data.og === null || data.og === '' ? undefined : data.og;
  const fg = data.fg === undefined || data.fg === null || data.fg === '' ? undefined : data.fg;
  const abv = data.abv === undefined || data.abv === null || data.abv === '' ? undefined : data.abv;
  const ibu = data.ibu === undefined || data.ibu === null || data.ibu === '' ? undefined : data.ibu;
  const colorSrm = data.colorSrm === undefined || data.colorSrm === null || data.colorSrm === '' ? undefined : data.colorSrm;

  if (og !== undefined) xml += `    <OG>${Number(og).toFixed(3)}</OG>\n`;
  if (fg !== undefined) xml += `    <FG>${Number(fg).toFixed(3)}</FG>\n`;
  if (abv !== undefined) xml += `    <ABV>${Number(abv).toFixed(2)}</ABV>\n`;
  if (ibu !== undefined) xml += `    <IBU>${Number(ibu).toFixed(1)}</IBU>\n`;
  if (colorSrm !== undefined) xml += `    <COLOR>${Number(colorSrm).toFixed(1)}</COLOR>\n`;

  xml += `    <STYLE>\n`;
  xml += `      <NAME>${sanitizeForXml(data.style.name)}</NAME>\n`;
  if (data.style.category) xml += `      <CATEGORY>${sanitizeForXml(data.style.category)}</CATEGORY>\n`;
  if (data.style.styleGuide) xml += `      <STYLE_GUIDE>${sanitizeForXml(data.style.styleGuide)}</STYLE_GUIDE>\n`;
  xml += `      <TYPE>${sanitizeForXml(data.style.type)}</TYPE>\n`;
  // Removed categoryNumber, styleLetter, and style ranges (ogMin/Max etc.)
  xml += `    </STYLE>\n`;

  xml += `    <FERMENTABLES>\n`;
  (data.fermentables || []).forEach(f => {
    xml += `      <FERMENTABLE>\n`;
    xml += `        <NAME>${sanitizeForXml(f.name)}</NAME>\n`;
    xml += `        <VERSION>1</VERSION>\n`;
    xml += `        <TYPE>${sanitizeForXml(f.type)}</TYPE>\n`;
    xml += `        <AMOUNT>${f.amount.toFixed(3)}</AMOUNT>\n`;
    xml += `        <YIELD>${f.yield.toFixed(1)}</YIELD>\n`;
    xml += `        <COLOR>${f.color.toFixed(1)}</COLOR>\n`;
    xml += `      </FERMENTABLE>\n`;
  });
  xml += `    </FERMENTABLES>\n`;

  xml += `    <HOPS>\n`;
  (data.hops || []).forEach(h => {
    xml += `      <HOP>\n`;
    xml += `        <NAME>${sanitizeForXml(h.name)}</NAME>\n`;
    xml += `        <VERSION>1</VERSION>\n`;
    xml += `        <ALPHA>${h.alpha.toFixed(1)}</ALPHA>\n`;
    xml += `        <AMOUNT>${h.amount.toFixed(4)}</AMOUNT>\n`;
    xml += `        <USE>${sanitizeForXml(h.use)}</USE>\n`;
    xml += `        <TIME>${h.time.toFixed(0)}</TIME>\n`;
    xml += `        <FORM>${sanitizeForXml(h.form)}</FORM>\n`;
    xml += `      </HOP>\n`;
  });
  xml += `    </HOPS>\n`;

  xml += `    <YEASTS>\n`;
  (data.yeasts || []).forEach(y => {
    xml += `      <YEAST>\n`;
    xml += `        <NAME>${sanitizeForXml(y.name)}</NAME>\n`;
    xml += `        <VERSION>1</VERSION>\n`;
    xml += `        <TYPE>${sanitizeForXml(y.type)}</TYPE>\n`;
    xml += `        <FORM>${sanitizeForXml(y.form)}</FORM>\n`;
    xml += `        <AMOUNT>${y.amount.toFixed(4)}</AMOUNT>\n`;
    if(y.laboratory) xml += `        <LABORATORY>${sanitizeForXml(y.laboratory)}</LABORATORY>\n`;
    if(y.productId) xml += `        <PRODUCT_ID>${sanitizeForXml(y.productId)}</PRODUCT_ID>\n`;
    const attenuation = y.attenuation === undefined || y.attenuation === null || y.attenuation === '' ? undefined : y.attenuation;
    if(attenuation !== undefined) xml += `        <ATTENUATION>${Number(attenuation).toFixed(1)}</ATTENUATION>\n`;
    xml += `      </YEAST>\n`;
  });
  xml += `    </YEASTS>\n`;

  xml += `    <MISCS>\n`;
  (data.miscs || []).forEach(m => {
    xml += `      <MISC>\n`;
    xml += `        <NAME>${sanitizeForXml(m.name)}</NAME>\n`;
    xml += `        <VERSION>1</VERSION>\n`;
    xml += `        <TYPE>${sanitizeForXml(m.type)}</TYPE>\n`;
    xml += `        <USE>${sanitizeForXml(m.use)}</USE>\n`;
    xml += `        <TIME>${m.time.toFixed(0)}</TIME>\n`;
    xml += `        <AMOUNT>${m.amount.toFixed(4)}</AMOUNT>\n`;
    xml += `      </MISC>\n`;
  });
  xml += `    </MISCS>\n`;
  
  xml += `    <WATERS/>\n`; 

  xml += `    <MASH>\n`;
  xml += `      <NAME>${sanitizeForXml(data.mash.name)}</NAME>\n`;
  xml += `      <VERSION>1</VERSION>\n`;
  xml += `      <MASH_STEPS>\n`;
  (data.mash.mashSteps || []).forEach(ms => {
    xml += `        <MASH_STEP>\n`;
    xml += `          <NAME>${sanitizeForXml(ms.name)}</NAME>\n`;
    xml += `          <VERSION>1</VERSION>\n`;
    xml += `          <TYPE>${sanitizeForXml(ms.type)}</TYPE>\n`;
    xml += `          <STEP_TEMP>${ms.stepTemp.toFixed(1)}</STEP_TEMP>\n`;
    xml += `          <STEP_TIME>${ms.stepTime.toFixed(0)}</STEP_TIME>\n`;
    xml += `        </MASH_STEP>\n`;
  });
  xml += `      </MASH_STEPS>\n`;
  xml += `    </MASH>\n`;

  if (data.notes) {
    xml += `    <NOTES>${sanitizeForXml(data.notes)}</NOTES>\n`;
  }
  
  xml += `  </RECIPE>\n`;
  xml += `</RECIPES>\n`;
  return xml;
}

function calculateAbv(og?: number | string, fg?: number | string): number | undefined {
  const numOg = parseFloat(String(og));
  const numFg = parseFloat(String(fg));
  if (!isNaN(numOg) && !isNaN(numFg) && numOg > 0 && numFg > 0 && numOg > numFg) {
    return (numOg - numFg) * 131.25;
  }
  return undefined;
}

function getBignessFactor(og?: number | string): number {
  const numOg = parseFloat(String(og));
  if (isNaN(numOg) || numOg < 1) return 1;
  return 1.65 * Math.pow(0.000125, numOg - 1.0);
}

function getBoilTimeFactor(boilTimeMinutes?: number | string): number {
  const numBoilTime = parseFloat(String(boilTimeMinutes));
  if (isNaN(numBoilTime) || numBoilTime < 0) return 0;
  return (1.0 - Math.exp(-0.04 * numBoilTime)) / 4.15;
}

function calculateIbuTinseth(
  hops: z.infer<typeof hopSchema>[] = [],
  boilSize?: number | string,
  og?: number | string
): number | undefined {
  const numBoilSize = parseFloat(String(boilSize));
  const numOg = parseFloat(String(og));

  if (isNaN(numBoilSize) || numBoilSize <= 0 ) {
    return undefined;
  }

  let totalIbus = 0;
  const bignessFactor = getBignessFactor(numOg);

  hops.forEach(hop => {
    if (hop.use === 'Boil' && typeof hop.alpha === 'number' && typeof hop.amount === 'number' && typeof hop.time === 'number') {
      const alphaDecimal = hop.alpha / 100.0;
      const amountGrams = hop.amount * 1000.0; 
      const boilTimeFactor = getBoilTimeFactor(hop.time);
      const utilization = bignessFactor * boilTimeFactor;
      
      if (numBoilSize > 0) { 
        const ibusForHop = (alphaDecimal * amountGrams * utilization * 1000) / numBoilSize; 
        totalIbus += ibusForHop;
      }
    }
  });
  
  return isNaN(totalIbus) ? undefined : totalIbus;
}


export function RecipeForm() {
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues,
    mode: 'onChange', 
  });

  const { fields: fermentableFields, append: appendFermentable, remove: removeFermentable } = useFieldArray({
    control: form.control,
    name: "fermentables",
  });

  const { fields: hopFields, append: appendHop, remove: removeHop } = useFieldArray({
    control: form.control,
    name: "hops",
  });

  const { fields: yeastFields, append: appendYeast, remove: removeYeast } = useFieldArray({
    control: form.control,
    name: "yeasts",
  });

  const { fields: miscFields, append: appendMisc, remove: removeMisc } = useFieldArray({
    control: form.control,
    name: "miscs",
  });

   const { fields: mashStepFields, append: appendMashStep, remove: removeMashStep } = useFieldArray({
    control: form.control,
    name: "mash.mashSteps",
  });

  const watchedOg = form.watch('og');
  const watchedFg = form.watch('fg');
  const watchedBoilSize = form.watch('boilSize');
  const watchedHops = form.watch('hops'); 

  useEffect(() => {
    const abv = calculateAbv(watchedOg, watchedFg);
    if (abv !== undefined) {
      form.setValue('abv', parseFloat(abv.toFixed(2)), { shouldValidate: true });
    } else {
      form.setValue('abv', 0, { shouldValidate: true });
    }
  }, [watchedOg, watchedFg, form]);

  useEffect(() => {
    const hopsArray = Array.isArray(watchedHops) ? watchedHops : [];
    const ibu = calculateIbuTinseth(hopsArray, watchedBoilSize, watchedOg);
    if (ibu !== undefined) {
      form.setValue('ibu', parseFloat(ibu.toFixed(1)), { shouldValidate: true });
    } else {
      form.setValue('ibu', 0, { shouldValidate: true }); 
    }
  }, [watchedOg, watchedBoilSize, watchedHops, form]);


  function onSubmit(data: RecipeFormValues) {
    const xmlData = generateBeerXml(data);
    const blob = new Blob([xmlData], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileNameBase = data.name || 'nouvelle-recette';
    const sanitizedFileName = fileNameBase.replace(/[^a-z0-9À-ÿ_.-]/gi, '_').replace(/\.$/, '');
    a.download = `${sanitizedFileName}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Recette générée !",
      description: `Le fichier ${sanitizedFileName}.xml a été téléchargé.`,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* General Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
                <InfoIcon className="mr-2 h-5 w-5 text-primary" />
                Informations Générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la recette</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ma Super IPA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de recette</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="All Grain">All Grain</SelectItem>
                        <SelectItem value="Extract">Extract</SelectItem>
                        <SelectItem value="Partial Mash">Partial Mash</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="brewer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brasseur (Optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Mon Nom" {...field} value={field.value ?? ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="batchSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taille du lot (L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="boilSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taille d'ébullition (L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="boilTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temps d'ébullition (min)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
                control={form.control}
                name="efficiency"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Efficacité (%)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.1" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
        </Card>

        {/* Style Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
                <ListChecksIcon className="mr-2 h-5 w-5 text-primary" />
                Style de la Bière
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
                control={form.control}
                name="style.name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nom du Style</FormLabel>
                    <FormControl>
                        <Input {...field} value={field.value ?? ''}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="style.category"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value ?? ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="style.styleGuide"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Guide de Style</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value ?? ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="style.type"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Type (Style)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Type de style" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Ale">Ale</SelectItem>
                        <SelectItem value="Lager">Lager</SelectItem>
                        <SelectItem value="Mead">Mead</SelectItem>
                        <SelectItem value="Wheat">Wheat</SelectItem>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                        <SelectItem value="Cider">Cider</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
          </CardContent>
        </Card>
        
        {/* Target Stats Card */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                    Statistiques Cibles
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="og"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>OG (Densité Initiale)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.001" placeholder="Ex: 1.050" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="fg"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>FG (Densité Finale)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.001" placeholder="Ex: 1.010" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="abv"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>ABV (%) - Calculé</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} readOnly />
                            </FormControl>
                            <FormDescription>Calculé automatiquement à partir de OG et FG.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="ibu"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>IBU - Calculé</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} readOnly />
                            </FormControl>
                            <FormDescription>Calculé (Tinseth) à partir des houblons, OG et volume d'ébullition.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="colorSrm"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Couleur (SRM)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </CardContent>
        </Card>

        {/* Fermentables Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                    <Wheat className="mr-2 h-5 w-5 text-primary" />
                    Fermentescibles
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => appendFermentable({ name: '', type: 'Grain', amount: 0, yield: 75, color: 0 })}>
                    <PlusCircleIcon className="mr-2 h-4 w-4" /> Ajouter
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {fermentableFields.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeFermentable(index)}>
                            <Trash2Icon className="h-4 w-4" />
                        </Button>
                        <FormField control={form.control} name={`fermentables.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <FormField control={form.control} name={`fermentables.${index}.type`} render={({ field }) => (
                                <FormItem><FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Grain">Grain</SelectItem>
                                        <SelectItem value="Extract">Extract</SelectItem>
                                        <SelectItem value="Sugar">Sugar</SelectItem>
                                        <SelectItem value="Adjunct">Adjunct</SelectItem>
                                        <SelectItem value="Dry Extract">Dry Extract</SelectItem>
                                        <SelectItem value="Liquid Extract">Liquid Extract</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`fermentables.${index}.amount`} render={({ field }) => (<FormItem><FormLabel>Quantité (kg)</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`fermentables.${index}.yield`} render={({ field }) => (<FormItem><FormLabel>Rendement (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`fermentables.${index}.color`} render={({ field }) => (<FormItem><FormLabel>Couleur (SRM)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </div>
                ))}
                {fermentableFields.length === 0 && <p className="text-sm text-muted-foreground">Aucun fermentescible ajouté.</p>}
            </CardContent>
        </Card>

        {/* Hops Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                    <Hop className="mr-2 h-5 w-5 text-primary" />
                    Houblons
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => appendHop({ name: '', alpha: 0, amount: 0, use: 'Boil', time: 60, form: 'Pellet' })}>
                    <PlusCircleIcon className="mr-2 h-4 w-4" /> Ajouter
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {hopFields.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeHop(index)}>
                            <Trash2Icon className="h-4 w-4" />
                        </Button>
                        <FormField control={form.control} name={`hops.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <FormField control={form.control} name={`hops.${index}.alpha`} render={({ field }) => (<FormItem><FormLabel>Alpha (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`hops.${index}.amount`} render={({ field }) => (<FormItem><FormLabel>Quantité (kg)</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`hops.${index}.use`} render={({ field }) => (
                                <FormItem><FormLabel>Usage</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Boil">Boil</SelectItem><SelectItem value="Dry Hop">Dry Hop</SelectItem><SelectItem value="Mash">Mash</SelectItem>
                                        <SelectItem value="First Wort">First Wort</SelectItem><SelectItem value="Aroma">Aroma</SelectItem><SelectItem value="Whirlpool">Whirlpool</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`hops.${index}.time`} render={({ field }) => (<FormItem><FormLabel>Temps (min)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name={`hops.${index}.form`} render={({ field }) => (
                                <FormItem><FormLabel>Forme</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Pellet">Pellet</SelectItem><SelectItem value="Plug">Plug</SelectItem>
                                        <SelectItem value="Leaf">Leaf</SelectItem><SelectItem value="Extract">Extract</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>)} />
                        </div>
                    </div>
                ))}
                {hopFields.length === 0 && <p className="text-sm text-muted-foreground">Aucun houblon ajouté.</p>}
            </CardContent>
        </Card>

        {/* Yeasts Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                    <Microscope className="mr-2 h-5 w-5 text-primary" />
                    Levures
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => appendYeast({ name: '', type: 'Ale', form: 'Dry', amount: 0, laboratory: '', productId: '', attenuation: 75 })}>
                     <PlusCircleIcon className="mr-2 h-4 w-4" /> Ajouter
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {yeastFields.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeYeast(index)}>
                            <Trash2Icon className="h-4 w-4" />
                        </Button>
                        <FormField control={form.control} name={`yeasts.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <FormField control={form.control} name={`yeasts.${index}.type`} render={({ field }) => (
                                <FormItem><FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Ale">Ale</SelectItem><SelectItem value="Lager">Lager</SelectItem><SelectItem value="Wheat">Wheat</SelectItem>
                                        <SelectItem value="Wine">Wine</SelectItem><SelectItem value="Champagne">Champagne</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`yeasts.${index}.form`} render={({ field }) => (
                                <FormItem><FormLabel>Forme</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Liquid">Liquid</SelectItem><SelectItem value="Dry">Dry</SelectItem>
                                        <SelectItem value="Slant">Slant</SelectItem><SelectItem value="Culture">Culture</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`yeasts.${index}.amount`} render={({ field }) => (<FormItem><FormLabel>Quantité</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormDescription>L pour liquide, g pour sèche</FormDescription><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <FormField control={form.control} name={`yeasts.${index}.laboratory`} render={({ field }) => (<FormItem><FormLabel>Laboratoire</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`yeasts.${index}.productId`} render={({ field }) => (<FormItem><FormLabel>ID Produit</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`yeasts.${index}.attenuation`} render={({ field }) => (<FormItem><FormLabel>Atténuation (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </div>
                ))}
                {yeastFields.length === 0 && <p className="text-sm text-muted-foreground">Aucune levure ajoutée.</p>}
            </CardContent>
        </Card>

        {/* Miscs Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5 text-primary" />
                    Ingrédients Divers
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => appendMisc({ name: '', type: 'Spice', use: 'Boil', time: 0, amount: 0 })}>
                     <PlusCircleIcon className="mr-2 h-4 w-4" /> Ajouter
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {miscFields.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeMisc(index)}>
                            <Trash2Icon className="h-4 w-4" />
                        </Button>
                        <FormField control={form.control} name={`miscs.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                           <FormField control={form.control} name={`miscs.${index}.type`} render={({ field }) => (
                                <FormItem><FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Spice">Spice</SelectItem><SelectItem value="Fining">Fining</SelectItem><SelectItem value="Water Agent">Water Agent</SelectItem>
                                        <SelectItem value="Herb">Herb</SelectItem><SelectItem value="Flavor">Flavor</SelectItem><SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`miscs.${index}.use`} render={({ field }) => (
                                <FormItem><FormLabel>Usage</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Boil">Boil</SelectItem><SelectItem value="Mash">Mash</SelectItem><SelectItem value="Primary">Primary</SelectItem>
                                        <SelectItem value="Secondary">Secondary</SelectItem><SelectItem value="Bottling">Bottling</SelectItem><SelectItem value="Kegging">Kegging</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`miscs.${index}.time`} render={({ field }) => (<FormItem><FormLabel>Temps (min)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`miscs.${index}.amount`} render={({ field }) => (<FormItem><FormLabel>Quantité</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormDescription>Unités selon type</FormDescription><FormMessage /></FormItem>)} />
                        </div>
                    </div>
                ))}
                {miscFields.length === 0 && <p className="text-sm text-muted-foreground">Aucun ingrédient divers ajouté.</p>}
            </CardContent>
        </Card>

        {/* Mash Profile Card */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Thermometer className="mr-2 h-5 w-5 text-primary" />
                    Profil d'Empâtage
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="mash.name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nom du Profil d'Empâtage</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex flex-row items-center justify-between pt-2">
                    <h4 className="font-medium">Étapes d'Empâtage</h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendMashStep({ name: '', type: 'Infusion', stepTemp: 65, stepTime: 60 })}>
                        <PlusCircleIcon className="mr-2 h-4 w-4" /> Ajouter Étape
                    </Button>
                </div>
                {mashStepFields.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeMashStep(index)}>
                            <Trash2Icon className="h-4 w-4" />
                        </Button>
                        <FormField control={form.control} name={`mash.mashSteps.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Nom Étape</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <FormField control={form.control} name={`mash.mashSteps.${index}.type`} render={({ field }) => (
                                <FormItem><FormLabel>Type Étape</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Infusion">Infusion</SelectItem>
                                        <SelectItem value="Temperature">Temperature</SelectItem>
                                        <SelectItem value="Decoction">Decoction</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`mash.mashSteps.${index}.stepTemp`} render={({ field }) => (<FormItem><FormLabel>Temp. Étape (°C)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`mash.mashSteps.${index}.stepTime`} render={({ field }) => (<FormItem><FormLabel>Durée Étape (min)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </div>
                ))}
                {mashStepFields.length === 0 && <p className="text-sm text-muted-foreground">Aucune étape d'empâtage ajoutée.</p>}
            </CardContent>
        </Card>

        {/* Notes Card */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <StickyNote className="mr-2 h-5 w-5 text-primary" />
                    Notes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Notes de recette (Optionnel)</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Ajoutez ici vos notes sur la recette, le processus de brassage, etc."
                        className="resize-y min-h-[100px]"
                        {...field}
                        value={field.value ?? ''}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full md:w-auto">
          <SaveIcon className="mr-2 h-5 w-5" />
          Enregistrer et Télécharger la Recette (.xml)
        </Button>
      </form>
    </Form>
  );
}
