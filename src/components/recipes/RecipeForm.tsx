
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
import { SaveIcon, PlusCircleIcon, XCircleIcon, Trash2Icon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  // infuseAmount: z.coerce.number().optional(), // TODO: Add later if needed
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
  og: z.coerce.number().min(0).optional(),
  fg: z.coerce.number().min(0).optional(),
  abv: z.coerce.number().min(0).optional(),
  ibu: z.coerce.number().min(0).optional(),
  colorSrm: z.coerce.number().min(0).optional(), // Renamed from 'color' to avoid conflict with fermentable color
  notes: z.string().optional(),

  style: z.object({
    name: z.string().min(1, "Le nom du style est requis."),
    category: z.string().optional(),
    categoryNumber: z.string().optional(),
    styleLetter: z.string().optional(),
    styleGuide: z.string().optional(),
    type: z.enum(['Ale', 'Lager', 'Mead', 'Wheat', 'Mixed', 'Cider']),
    ogMin: z.coerce.number().optional(),
    ogMax: z.coerce.number().optional(),
    fgMin: z.coerce.number().optional(),
    fgMax: z.coerce.number().optional(),
    ibuMin: z.coerce.number().optional(),
    ibuMax: z.coerce.number().optional(),
    colorMin: z.coerce.number().optional(),
    colorMax: z.coerce.number().optional(),
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
  notes: '',
  style: {
    name: 'American Amber Ale',
    category: 'Amber and Brown American Beer',
    categoryNumber: '19',
    styleLetter: 'A',
    styleGuide: 'BJCP 2015',
    type: 'Ale',
    ogMin: 1.045,
    ogMax: 1.060,
    fgMin: 1.010,
    fgMax: 1.015,
    ibuMin: 25,
    ibuMax: 40,
    colorMin: 10,
    colorMax: 17,
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
  // Escape basic XML entities. Note: For production, a robust library is safer.
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
  if (data.og !== undefined) xml += `    <OG>${data.og.toFixed(3)}</OG>\n`;
  if (data.fg !== undefined) xml += `    <FG>${data.fg.toFixed(3)}</FG>\n`;
  // ABV, IBU, COLOR are often calculated, but can be manually entered.
  // For now, if user provides them, we include them.
  if (data.abv !== undefined) xml += `    <ABV>${data.abv.toFixed(2)}</ABV>\n`;
  if (data.ibu !== undefined) xml += `    <IBU>${data.ibu.toFixed(1)}</IBU>\n`;
  if (data.colorSrm !== undefined) xml += `    <COLOR>${data.colorSrm.toFixed(1)}</COLOR>\n`;

  xml += `    <STYLE>\n`;
  xml += `      <NAME>${sanitizeForXml(data.style.name)}</NAME>\n`;
  if (data.style.category) xml += `      <CATEGORY>${sanitizeForXml(data.style.category)}</CATEGORY>\n`;
  if (data.style.categoryNumber) xml += `      <CATEGORY_NUMBER>${sanitizeForXml(data.style.categoryNumber)}</CATEGORY_NUMBER>\n`;
  if (data.style.styleLetter) xml += `      <STYLE_LETTER>${sanitizeForXml(data.style.styleLetter)}</STYLE_LETTER>\n`;
  if (data.style.styleGuide) xml += `      <STYLE_GUIDE>${sanitizeForXml(data.style.styleGuide)}</STYLE_GUIDE>\n`;
  xml += `      <TYPE>${sanitizeForXml(data.style.type)}</TYPE>\n`; // Style Type
  if (data.style.ogMin !== undefined) xml += `      <OG_MIN>${data.style.ogMin.toFixed(3)}</OG_MIN>\n`;
  if (data.style.ogMax !== undefined) xml += `      <OG_MAX>${data.style.ogMax.toFixed(3)}</OG_MAX>\n`;
  if (data.style.fgMin !== undefined) xml += `      <FG_MIN>${data.style.fgMin.toFixed(3)}</FG_MIN>\n`;
  if (data.style.fgMax !== undefined) xml += `      <FG_MAX>${data.style.fgMax.toFixed(3)}</FG_MAX>\n`;
  if (data.style.ibuMin !== undefined) xml += `      <IBU_MIN>${data.style.ibuMin.toFixed(0)}</IBU_MIN>\n`;
  if (data.style.ibuMax !== undefined) xml += `      <IBU_MAX>${data.style.ibuMax.toFixed(0)}</IBU_MAX>\n`;
  if (data.style.colorMin !== undefined) xml += `      <COLOR_MIN>${data.style.colorMin.toFixed(0)}</COLOR_MIN>\n`;
  if (data.style.colorMax !== undefined) xml += `      <COLOR_MAX>${data.style.colorMax.toFixed(0)}</COLOR_MAX>\n`;
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
    xml += `        <AMOUNT>${h.amount.toFixed(4)}</AMOUNT>\n`; // Hops often in grams, but XML standard is kg, so more precision
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
    xml += `        <AMOUNT>${y.amount.toFixed(4)}</AMOUNT>\n`; // Can be small for dry yeast or starters
    if(y.laboratory) xml += `        <LABORATORY>${sanitizeForXml(y.laboratory)}</LABORATORY>\n`;
    if(y.productId) xml += `        <PRODUCT_ID>${sanitizeForXml(y.productId)}</PRODUCT_ID>\n`;
    if(y.attenuation !== undefined) xml += `        <ATTENUATION>${y.attenuation.toFixed(1)}</ATTENUATION>\n`;
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
    xml += `        <AMOUNT>${m.amount.toFixed(4)}</AMOUNT>\n`; // Amount can vary (kg, items, ml)
    xml += `      </MISC>\n`;
  });
  xml += `    </MISCS>\n`;
  
  xml += `    <WATERS/>\n`; // Placeholder for now

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
    // if (ms.infuseAmount) xml += `          <INFUSE_AMOUNT>${ms.infuseAmount.toFixed(2)}</INFUSE_AMOUNT>\n`;
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


  function onSubmit(data: RecipeFormValues) {
    const xmlData = generateBeerXml(data);
    const blob = new Blob([xmlData], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = (data.name || 'nouvelle-recette').replace(/[^a-z0-9À-ÿ_.-]/gi, '_').replace(/\.$/, '') + '.xml';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Recette prête au téléchargement',
      description: `Le fichier ${fileName} devrait commencer à se télécharger.`,
      duration: 7000,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <Card>
          <CardHeader><CardTitle>Informations Générales</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la recette</FormLabel>
                  <FormControl><Input placeholder="Ex: Ma Super Pale Ale" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de recette</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez un type" /></SelectTrigger></FormControl>
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
              <FormField
                control={form.control}
                name="brewer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brasseur (Optionnel)</FormLabel>
                    <FormControl><Input placeholder="Ex: Jean Dupont" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="batchSize" render={({ field }) => ( <FormItem> <FormLabel>Taille du lot (L)</FormLabel> <FormControl><Input type="number" step="0.1" placeholder="20" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="boilSize" render={({ field }) => ( <FormItem> <FormLabel>Taille d'ébullition (L)</FormLabel> <FormControl><Input type="number" step="0.1" placeholder="25" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="boilTime" render={({ field }) => ( <FormItem> <FormLabel>Temps d'ébullition (min)</FormLabel> <FormControl><Input type="number" step="1" placeholder="60" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            </div>
             <FormField control={form.control} name="efficiency" render={({ field }) => ( <FormItem> <FormLabel>Efficacité (%) (Optionnel)</FormLabel> <FormControl><Input type="number" step="0.1" placeholder="72" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField control={form.control} name="og" render={({ field }) => ( <FormItem> <FormLabel>OG (Optionnel)</FormLabel> <FormControl><Input type="number" step="0.001" placeholder="1.052" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="fg" render={({ field }) => ( <FormItem> <FormLabel>FG (Optionnel)</FormLabel> <FormControl><Input type="number" step="0.001" placeholder="1.012" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="abv" render={({ field }) => ( <FormItem> <FormLabel>ABV (%) (Optionnel)</FormLabel> <FormControl><Input type="number" step="0.01" placeholder="5.25" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="ibu" render={({ field }) => ( <FormItem> <FormLabel>IBU (Optionnel)</FormLabel> <FormControl><Input type="number" step="0.1" placeholder="35" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="colorSrm" render={({ field }) => ( <FormItem> <FormLabel>Couleur (SRM) (Optionnel)</FormLabel> <FormControl><Input type="number" step="0.1" placeholder="14" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Style de Bière</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="style.name" render={({ field }) => ( <FormItem> <FormLabel>Nom du Style</FormLabel> <FormControl><Input placeholder="Ex: American IPA" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="style.category" render={({ field }) => ( <FormItem> <FormLabel>Catégorie (Optionnel)</FormLabel> <FormControl><Input placeholder="Ex: Pale American Ale" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="style.type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de Style (Ale/Lager...)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez un type de style" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['Ale', 'Lager', 'Mead', 'Wheat', 'Mixed', 'Cider'].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
              )}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="style.categoryNumber" render={({ field }) => ( <FormItem> <FormLabel>N° Catégorie (Optionnel)</FormLabel> <FormControl><Input placeholder="Ex: 21" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="style.styleLetter" render={({ field }) => ( <FormItem> <FormLabel>Lettre Style (Optionnel)</FormLabel> <FormControl><Input placeholder="Ex: A" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="style.styleGuide" render={({ field }) => ( <FormItem> <FormLabel>Guide de Style (Optionnel)</FormLabel> <FormControl><Input placeholder="Ex: BJCP 2015" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            </div>
            <p className="font-medium text-sm">Gammes du Style (Optionnel)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField control={form.control} name="style.ogMin" render={({ field }) => ( <FormItem> <FormLabel>OG Min</FormLabel> <FormControl><Input type="number" step="0.001" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="style.ogMax" render={({ field }) => ( <FormItem> <FormLabel>OG Max</FormLabel> <FormControl><Input type="number" step="0.001" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="style.fgMin" render={({ field }) => ( <FormItem> <FormLabel>FG Min</FormLabel> <FormControl><Input type="number" step="0.001" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="style.fgMax" render={({ field }) => ( <FormItem> <FormLabel>FG Max</FormLabel> <FormControl><Input type="number" step="0.001" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="style.ibuMin" render={({ field }) => ( <FormItem> <FormLabel>IBU Min</FormLabel> <FormControl><Input type="number" step="1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="style.ibuMax" render={({ field }) => ( <FormItem> <FormLabel>IBU Max</FormLabel> <FormControl><Input type="number" step="1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="style.colorMin" render={({ field }) => ( <FormItem> <FormLabel>Couleur Min (SRM)</FormLabel> <FormControl><Input type="number" step="0.1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="style.colorMax" render={({ field }) => ( <FormItem> <FormLabel>Couleur Max (SRM)</FormLabel> <FormControl><Input type="number" step="0.1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            </div>
          </CardContent>
        </Card>

        {/* Fermentables Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Fermentescibles</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => appendFermentable({ name: '', type: 'Grain', amount: 0, yield: 75, color: 0 })}>
                <PlusCircleIcon className="mr-2 h-4 w-4" /> Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fermentableFields.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                <FormField control={form.control} name={`fermentables.${index}.name`} render={({ field }) => ( <FormItem> <FormLabel>Nom</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FormField control={form.control} name={`fermentables.${index}.type`} render={({ field }) => (
                    <FormItem> <FormLabel>Type</FormLabel> 
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {['Grain', 'Extract', 'Sugar', 'Adjunct', 'Dry Extract', 'Liquid Extract'].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    <FormMessage /> </FormItem> 
                  )}/>
                  <FormField control={form.control} name={`fermentables.${index}.amount`} render={({ field }) => ( <FormItem> <FormLabel>Quantité (kg)</FormLabel> <FormControl><Input type="number" step="0.001" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`fermentables.${index}.yield`} render={({ field }) => ( <FormItem> <FormLabel>Rendement (%)</FormLabel> <FormControl><Input type="number" step="0.1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`fermentables.${index}.color`} render={({ field }) => ( <FormItem> <FormLabel>Couleur (SRM)</FormLabel> <FormControl><Input type="number" step="0.1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                </div>
                <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2 text-destructive hover:text-destructive" onClick={() => removeFermentable(index)}><Trash2Icon className="h-4 w-4" /></Button>
              </div>
            ))}
            {fermentableFields.length === 0 && <p className="text-sm text-muted-foreground">Aucun fermentescible ajouté.</p>}
          </CardContent>
        </Card>

        {/* Hops Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Houblons</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => appendHop({ name: '', alpha: 0, amount: 0, use: 'Boil', time: 60, form: 'Pellet' })}>
                <PlusCircleIcon className="mr-2 h-4 w-4" /> Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hopFields.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                <FormField control={form.control} name={`hops.${index}.name`} render={({ field }) => ( <FormItem> <FormLabel>Nom</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <FormField control={form.control} name={`hops.${index}.alpha`} render={({ field }) => ( <FormItem> <FormLabel>Alpha (%)</FormLabel> <FormControl><Input type="number" step="0.1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`hops.${index}.amount`} render={({ field }) => ( <FormItem> <FormLabel>Quantité (kg)</FormLabel> <FormControl><Input type="number" step="0.001" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`hops.${index}.use`} render={({ field }) => (
                     <FormItem> <FormLabel>Usage</FormLabel> 
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {['Boil', 'Dry Hop', 'Mash', 'First Wort', 'Aroma', 'Whirlpool'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                     <FormMessage /> </FormItem> 
                  )}/>
                  <FormField control={form.control} name={`hops.${index}.time`} render={({ field }) => ( <FormItem> <FormLabel>Temps (min)</FormLabel> <FormControl><Input type="number" step="1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`hops.${index}.form`} render={({ field }) => (
                     <FormItem> <FormLabel>Forme</FormLabel> 
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {['Pellet', 'Plug', 'Leaf', 'Extract'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                     <FormMessage /> </FormItem> 
                  )}/>
                </div>
                <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2 text-destructive hover:text-destructive" onClick={() => removeHop(index)}><Trash2Icon className="h-4 w-4" /></Button>
              </div>
            ))}
             {hopFields.length === 0 && <p className="text-sm text-muted-foreground">Aucun houblon ajouté.</p>}
          </CardContent>
        </Card>

        {/* Yeasts Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Levures</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => appendYeast({ name: '', type: 'Ale', form: 'Dry', amount: 0, attenuation: 75 })}>
                <PlusCircleIcon className="mr-2 h-4 w-4" /> Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {yeastFields.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                <FormField control={form.control} name={`yeasts.${index}.name`} render={({ field }) => ( <FormItem> <FormLabel>Nom</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <FormField control={form.control} name={`yeasts.${index}.type`} render={({ field }) => (
                     <FormItem> <FormLabel>Type</FormLabel> 
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {['Ale', 'Lager', 'Wheat', 'Wine', 'Champagne'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                     <FormMessage /> </FormItem> 
                  )}/>
                  <FormField control={form.control} name={`yeasts.${index}.form`} render={({ field }) => (
                     <FormItem> <FormLabel>Forme</FormLabel> 
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                           {['Liquid', 'Dry', 'Slant', 'Culture'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                     <FormMessage /> </FormItem> 
                  )}/>
                  <FormField control={form.control} name={`yeasts.${index}.amount`} render={({ field }) => ( <FormItem> <FormLabel>Quantité</FormLabel> <FormControl><Input type="number" step="0.001" {...field} /></FormControl> <FormDescription>G (dry) ou L (liquid)</FormDescription> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`yeasts.${index}.laboratory`} render={({ field }) => ( <FormItem> <FormLabel>Laboratoire (Opt.)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`yeasts.${index}.productId`} render={({ field }) => ( <FormItem> <FormLabel>ID Produit (Opt.)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`yeasts.${index}.attenuation`} render={({ field }) => ( <FormItem> <FormLabel>Atténuation (%) (Opt.)</FormLabel> <FormControl><Input type="number" step="0.1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                </div>
                <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2 text-destructive hover:text-destructive" onClick={() => removeYeast(index)}><Trash2Icon className="h-4 w-4" /></Button>
              </div>
            ))}
            {yeastFields.length === 0 && <p className="text-sm text-muted-foreground">Aucune levure ajoutée.</p>}
          </CardContent>
        </Card>

        {/* Miscs Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Ingrédients Divers</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => appendMisc({ name: '', type: 'Spice', use: 'Boil', time: 15, amount: 0 })}>
                <PlusCircleIcon className="mr-2 h-4 w-4" /> Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {miscFields.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                <FormField control={form.control} name={`miscs.${index}.name`} render={({ field }) => ( <FormItem> <FormLabel>Nom</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   <FormField control={form.control} name={`miscs.${index}.type`} render={({ field }) => (
                     <FormItem> <FormLabel>Type</FormLabel> 
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                           {['Spice', 'Fining', 'Water Agent', 'Herb', 'Flavor', 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                     <FormMessage /> </FormItem> 
                  )}/>
                  <FormField control={form.control} name={`miscs.${index}.use`} render={({ field }) => (
                     <FormItem> <FormLabel>Usage</FormLabel> 
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                           {['Boil', 'Mash', 'Primary', 'Secondary', 'Bottling', 'Kegging'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                     <FormMessage /> </FormItem> 
                  )}/>
                  <FormField control={form.control} name={`miscs.${index}.time`} render={({ field }) => ( <FormItem> <FormLabel>Temps (min)</FormLabel> <FormControl><Input type="number" step="1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`miscs.${index}.amount`} render={({ field }) => ( <FormItem> <FormLabel>Quantité</FormLabel> <FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormDescription>Unité selon type</FormDescription> <FormMessage /> </FormItem> )}/>
                </div>
                <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2 text-destructive hover:text-destructive" onClick={() => removeMisc(index)}><Trash2Icon className="h-4 w-4" /></Button>
              </div>
            ))}
            {miscFields.length === 0 && <p className="text-sm text-muted-foreground">Aucun ingrédient divers ajouté.</p>}
          </CardContent>
        </Card>
        
        {/* Mash Section */}
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                <CardTitle>Profil d'Empâtage</CardTitle>
                 <Button type="button" variant="outline" size="sm" onClick={() => appendMashStep({ name: '', type: 'Infusion', stepTemp: 65, stepTime: 60 })}>
                    <PlusCircleIcon className="mr-2 h-4 w-4" /> Ajouter Étape
                </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="mash.name" render={({ field }) => ( <FormItem> <FormLabel>Nom du Profil d'Empâtage</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <Separator className="my-4" />
            <h4 className="font-medium text-md mb-2">Étapes d'Empâtage</h4>
            {mashStepFields.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                <FormField control={form.control} name={`mash.mashSteps.${index}.name`} render={({ field }) => ( <FormItem> <FormLabel>Nom Étape</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField control={form.control} name={`mash.mashSteps.${index}.type`} render={({ field }) => (
                     <FormItem> <FormLabel>Type Étape</FormLabel> 
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                           {['Infusion', 'Temperature', 'Decoction'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                     <FormMessage /> </FormItem> 
                  )}/>
                  <FormField control={form.control} name={`mash.mashSteps.${index}.stepTemp`} render={({ field }) => ( <FormItem> <FormLabel>Température (°C)</FormLabel> <FormControl><Input type="number" step="0.1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name={`mash.mashSteps.${index}.stepTime`} render={({ field }) => ( <FormItem> <FormLabel>Durée (min)</FormLabel> <FormControl><Input type="number" step="1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                </div>
                 <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2 text-destructive hover:text-destructive" onClick={() => removeMashStep(index)}><Trash2Icon className="h-4 w-4" /></Button>
              </div>
            ))}
            {mashStepFields.length === 0 && <p className="text-sm text-muted-foreground">Aucune étape d'empâtage ajoutée.</p>}
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ajoutez ici des notes sur la recette..."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="w-full md:w-auto">
          <SaveIcon className="mr-2 h-5 w-5" />
          Enregistrer et Télécharger la Recette (.xml)
        </Button>
      </form>
    </Form>
  );
}

