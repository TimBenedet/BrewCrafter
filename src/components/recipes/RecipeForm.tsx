
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import { SaveIcon, PlusCircleIcon, Trash2Icon, InfoIcon, ListChecksIcon, Wheat, Hop as HopIconLucide, Microscope, Package, Thermometer, StickyNote, BarChart3, ActivityIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useEffect, useMemo } from 'react';
import { addRecipesAction, type ActionResult } from '@/app/actions/recipe-actions';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Sub-schemas for array elements
const fermentableSchema = z.object({
  name: z.string().min(1, "Fermentable name is required."),
  type: z.enum(['Grain', 'Extract', 'Sugar', 'Adjunct', 'Dry Extract', 'Liquid Extract']),
  amount: z.coerce.number().min(0, "Amount must be zero or positive."),
  amountUnit: z.enum(['kg', 'g']).default('kg'),
  yield: z.coerce.number().min(0).max(100, "Yield must be between 0 and 100."),
  color: z.coerce.number().min(0, "Color (SRM) must be positive."),
});

const hopSchema = z.object({
  name: z.string().min(1, "Hop name is required."),
  alpha: z.coerce.number().min(0).max(100, "Alpha acid must be between 0 and 100."),
  amount: z.coerce.number().min(0, "Amount must be zero or positive."),
  amountUnit: z.enum(['kg', 'g']).default('g'),
  use: z.enum(['Boil', 'Dry Hop', 'Mash', 'First Wort', 'Aroma', 'Whirlpool']),
  time: z.coerce.number().min(0, "Time must be zero or positive."),
  form: z.enum(['Pellet', 'Plug', 'Leaf', 'Extract']),
});

const yeastSchema = z.object({
  name: z.string().min(1, "Yeast name is required."),
  type: z.enum(['Ale', 'Lager', 'Wheat', 'Wine', 'Champagne']),
  form: z.enum(['Liquid', 'Dry', 'Slant', 'Culture']),
  amount: z.coerce.number().positive("Amount must be positive."),
  laboratory: z.string().optional(),
  productId: z.string().optional(),
  attenuation: z.coerce.number().min(0).max(100, "Attenuation must be between 0 and 100.").optional(),
});

const miscSchema = z.object({
  name: z.string().min(1, "Miscellaneous ingredient name is required."),
  type: z.enum(['Spice', 'Fining', 'Water Agent', 'Herb', 'Flavor', 'Other']),
  use: z.enum(['Boil', 'Mash', 'Primary', 'Secondary', 'Bottling', 'Kegging']),
  time: z.coerce.number().min(0, "Time must be zero or positive."),
  amount: z.coerce.number().positive("Amount must be positive."),
});

const mashStepSchema = z.object({
  name: z.string().min(1, "Step name is required."),
  type: z.enum(['Infusion', 'Temperature', 'Decoction']),
  stepTemp: z.coerce.number().positive("Temperature must be positive."),
  stepTime: z.coerce.number().positive("Duration must be positive."),
});

// Main recipe schema
const recipeFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long.' }),
  type: z.enum(['All Grain', 'Extract', 'Partial Mash'], { required_error: 'Recipe type is required.' }),
  brewer: z.string().optional(),
  status: z.enum(['in_progress', 'completed']).default('in_progress'),
  batchSize: z.coerce.number().positive({ message: 'Batch Size must be a positive number.' }),
  boilSize: z.coerce.number().positive({ message: 'Boil Size must be a positive number.' }),
  boilTime: z.coerce.number().int().positive({ message: 'Boil Time must be a positive integer.' }),
  efficiency: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),

  og: z.coerce.number().min(1.0, "OG must be >= 1.000").max(2.0, "OG seems too high").optional(),
  fg: z.coerce.number().min(0.9, "FG seems too low").max(2.0, "FG seems too high").optional(),
  abv: z.coerce.number().min(0).optional(),
  ibu: z.coerce.number().min(0).optional(),
  colorSrm: z.coerce.number().min(0).optional(),

  style: z.object({
    name: z.string().min(1, "Style name is required."),
    category: z.string().optional(),
    styleGuide: z.string().optional(),
    type: z.enum(['Ale', 'Lager', 'Mead', 'Wheat', 'Mixed', 'Cider']),
  }),

  fermentables: z.array(fermentableSchema).optional(),
  hops: z.array(hopSchema).optional(),
  yeasts: z.array(yeastSchema).optional(),
  miscs: z.array(miscSchema).optional(),

  mash: z.object({
    name: z.string().min(1, "Mash profile name is required."),
    mashSteps: z.array(mashStepSchema).optional(),
  }),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

interface RecipeFile {
  fileName: string;
  content: string;
}


const createDefaultValues = (): RecipeFormValues => ({
  name: '',
  type: 'All Grain',
  brewer: '',
  status: 'in_progress',
  batchSize: 20,
  boilSize: 25,
  boilTime: 60,
  efficiency: 72.0,
  og: 1.052,
  fg: 1.012,
  abv: 0, // Calculated
  ibu: 0, // Calculated
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
});

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
  if (data.status) xml += `    <BREWCRAFTER_STATUS>${sanitizeForXml(data.status)}</BREWCRAFTER_STATUS>\n`;
  xml += `    <BATCH_SIZE>${data.batchSize}</BATCH_SIZE>\n`;
  xml += `    <BOIL_SIZE>${data.boilSize}</BOIL_SIZE>\n`;
  xml += `    <BOIL_TIME>${data.boilTime}</BOIL_TIME>\n`;
  if (data.efficiency !== undefined) xml += `    <EFFICIENCY>${data.efficiency}</EFFICIENCY>\n`;

  const og = data.og === undefined || data.og === null ? undefined : data.og;
  const fg = data.fg === undefined || data.fg === null ? undefined : data.fg;
  const abv = data.abv === undefined || data.abv === null ? undefined : data.abv;
  const ibu = data.ibu === undefined || data.ibu === null ? undefined : data.ibu;
  const colorSrm = data.colorSrm === undefined || data.colorSrm === null ? undefined : data.colorSrm;

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
  xml += `    </STYLE>\n`;

  xml += `    <FERMENTABLES>\n`;
  (data.fermentables || []).forEach(f => {
    xml += `      <FERMENTABLE>\n`;
    xml += `        <NAME>${sanitizeForXml(f.name)}</NAME>\n`;
    xml += `        <VERSION>1</VERSION>\n`;
    xml += `        <TYPE>${sanitizeForXml(f.type)}</TYPE>\n`;
    const amountInKg = f.amountUnit === 'g' ? f.amount / 1000 : f.amount;
    xml += `        <AMOUNT>${Number(amountInKg).toFixed(3)}</AMOUNT>\n`; 
    xml += `        <YIELD>${Number(f.yield).toFixed(1)}</YIELD>\n`;
    xml += `        <COLOR>${Number(f.color).toFixed(1)}</COLOR>\n`;
    xml += `      </FERMENTABLE>\n`;
  });
  xml += `    </FERMENTABLES>\n`;

  xml += `    <HOPS>\n`;
  (data.hops || []).forEach(h => {
    xml += `      <HOP>\n`;
    xml += `        <NAME>${sanitizeForXml(h.name)}</NAME>\n`;
    xml += `        <VERSION>1</VERSION>\n`;
    xml += `        <ALPHA>${Number(h.alpha).toFixed(1)}</ALPHA>\n`;
    const amountInKg = h.amountUnit === 'g' ? h.amount / 1000 : h.amount;
    xml += `        <AMOUNT>${Number(amountInKg).toFixed(4)}</AMOUNT>\n`; 
    xml += `        <USE>${sanitizeForXml(h.use)}</USE>\n`;
    xml += `        <TIME>${Number(h.time).toFixed(0)}</TIME>\n`;
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
    xml += `        <AMOUNT>${Number(y.amount).toFixed(4)}</AMOUNT>\n`;
    if (y.laboratory) xml += `        <LABORATORY>${sanitizeForXml(y.laboratory)}</LABORATORY>\n`;
    if (y.productId) xml += `        <PRODUCT_ID>${sanitizeForXml(y.productId)}</PRODUCT_ID>\n`;
    const attenuation = y.attenuation === undefined || y.attenuation === null ? undefined : y.attenuation;
    if (attenuation !== undefined) xml += `        <ATTENUATION>${Number(attenuation).toFixed(1)}</ATTENUATION>\n`;
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
    xml += `        <TIME>${Number(m.time).toFixed(0)}</TIME>\n`;
    xml += `        <AMOUNT>${Number(m.amount).toFixed(4)}</AMOUNT>\n`;
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
    xml += `          <STEP_TEMP>${Number(ms.stepTemp).toFixed(1)}</STEP_TEMP>\n`;
    xml += `          <STEP_TIME>${Number(ms.stepTime).toFixed(0)}</STEP_TIME>\n`;
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

function calculateAbv(ogInput?: number | string, fgInput?: number | string): number | undefined {
  const numOg = parseFloat(String(ogInput));
  const numFg = parseFloat(String(fgInput));
  if (!isNaN(numOg) && !isNaN(numFg) && numOg > 0 && numFg > 0 && numOg > numFg) {
    return (numOg - numFg) * 131.25;
  }
  return undefined;
}

function getBignessFactor(og?: number): number {
  const numOg = parseFloat(String(og));
  if (isNaN(numOg) || numOg < 1.0) {
    return NaN;
  }
  return 1.65 * Math.pow(0.000125, numOg - 1.0);
}

function getBoilTimeFactor(boilTimeMinutes?: number): number {
  const numBoilTime = parseFloat(String(boilTimeMinutes));
  if (isNaN(numBoilTime) || numBoilTime < 0) {
    return NaN;
  }
  if (numBoilTime === 0) return 0;
  return (1.0 - Math.exp(-0.04 * numBoilTime)) / 4.15;
}

function calculateIbuTinseth(
  hops: z.infer<typeof hopSchema>[] = [],
  boilSizeLiters?: number,
  originalGravity?: number
): number | undefined {
  const numBoilSize = parseFloat(String(boilSizeLiters));
  const numOriginalGravity = parseFloat(String(originalGravity));

  if (isNaN(numBoilSize) || numBoilSize <= 0 || isNaN(numOriginalGravity) || numOriginalGravity < 1.0) {
    console.warn("calculateIbuTinseth: Invalid boilSize or OG.", { numBoilSize, numOriginalGravity });
    return undefined;
  }

  let totalIbus = 0;
  const bignessFactor = getBignessFactor(numOriginalGravity);

  if (isNaN(bignessFactor)) {
    console.warn("calculateIbuTinseth: Invalid bignessFactor from OG.", { numOriginalGravity });
    return undefined;
  }

  (hops || []).forEach((hop, index) => {
    const currentAlpha = parseFloat(String(hop.alpha));
    // Amount in the form is already in the selected unit (kg or g)
    // We need to convert to grams for the formula if it's in kg, or use directly if in g.
    // The BeerXML standard expects amount in KG for hops.
    // The form data `hop.amount` will be treated as the selected unit (kg or g).
    // The XML generation converts it to KG. For IBU calculation, we need grams.
    
    let amountGrams: number;
    if (hop.amountUnit === 'kg') {
      amountGrams = parseFloat(String(hop.amount)) * 1000;
    } else { // hop.amountUnit === 'g'
      amountGrams = parseFloat(String(hop.amount));
    }
    const currentTime = parseFloat(String(hop.time));


    if (
      hop.use === 'Boil' &&
      !isNaN(currentAlpha) && currentAlpha > 0 &&
      !isNaN(amountGrams) && amountGrams > 0 &&
      !isNaN(currentTime) && currentTime >= 0
    ) {
      const alphaDecimal = currentAlpha / 100.0;
      const boilTimeFactor = getBoilTimeFactor(currentTime);

      if (isNaN(boilTimeFactor)) {
        console.warn(`calculateIbuTinseth: Hop ${index} - Invalid boilTimeFactor from time ${currentTime}.`);
        return; 
      }

      const utilization = bignessFactor * boilTimeFactor;
      if (isNaN(utilization)) {
         console.warn(`calculateIbuTinseth: Hop ${index} - Invalid utilization. BF: ${bignessFactor}, BTF: ${boilTimeFactor}`);
        return;
      }

      const ibusForHop = (alphaDecimal * amountGrams * utilization * 1000) / numBoilSize;

      if (!isNaN(ibusForHop)) {
        totalIbus += ibusForHop;
      } else {
         console.warn(`calculateIbuTinseth: Hop ${index} - IBU calculation resulted in NaN.`);
      }
    }
  });

  return isNaN(totalIbus) || totalIbus < 0 ? undefined : totalIbus;
}


interface RecipeFormProps {
  mode?: 'create' | 'edit';
  initialData?: RecipeFormValues;
  recipeSlug?: string; // Original slug, important for edit mode
  initialOpenSection?: string;
}

export function RecipeForm({ mode = 'create', initialData, recipeSlug, initialOpenSection }: RecipeFormProps) {
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: initialData || createDefaultValues(),
    mode: 'onChange',
  });
  const router = useRouter();
  const { toast } = useToast();
  const { setValue } = form;


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
    if (abv !== undefined && !isNaN(abv)) {
      setValue('abv', parseFloat(abv.toFixed(2)), { shouldValidate: false });
    } else {
      setValue('abv', 0, { shouldValidate: false });
    }
  }, [watchedOg, watchedFg, setValue]);

  useEffect(() => {
    const hopsArray = Array.isArray(watchedHops) ? watchedHops : [];
    const ibu = calculateIbuTinseth(hopsArray, watchedBoilSize, watchedOg);

    if (ibu !== undefined && !isNaN(ibu)) {
      setValue('ibu', parseFloat(ibu.toFixed(1)), { shouldValidate: false });
    } else {
      setValue('ibu', 0, { shouldValidate: false });
    }
  }, [watchedOg, watchedBoilSize, watchedHops, setValue]);


  async function onSubmit(data: RecipeFormValues) {
    const xmlData = generateBeerXml(data);
    const filesToUpload: RecipeFile[] = [{ fileName: 'recipe.xml', content: xmlData }];

    toast({ title: mode === 'edit' ? "Updating Recipe..." : "Saving Recipe...", description: "Please wait." });

    try {
      const result: ActionResult = await addRecipesAction(
        filesToUpload,
        mode === 'edit' ? recipeSlug : undefined
      );

      if (result.success && result.count && result.count > 0) {
        const recipeDisplayName = data.name || "Untitled Recipe";
        if (mode === 'edit') {
          toast({
            title: "Recipe Updated!",
            description: `Modifications saved for recipe "${recipeDisplayName}".`,
          });
        } else {
          toast({
            title: "Recipe Saved!",
            description: `Recipe "${recipeDisplayName}" has been saved successfully.`,
          });
        }
        const targetSlug = result.newSlug || (mode === 'edit' && recipeSlug) || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        router.push(mode === 'edit' ? `/recipes/${targetSlug}` : '/');
        router.refresh();
      } else if (result.success && result.count === 0) {
        toast({
          title: "No File Saved",
          description: "The recipe could not be saved (invalid XML or missing name).",
          variant: "default",
        });
      }
      else {
        throw new Error(result.error || "An unknown error occurred while saving to Vercel Blob.");
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast({
        title: mode === 'edit' ? "Update Failed" : "Save Failed",
        description: (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }

  const accordionDefaultValue = useMemo(() => {
    if (initialOpenSection) {
        return [initialOpenSection];
    }
    return ['item-general', 'item-target-stats'];
  }, [initialOpenSection]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Accordion type="multiple" defaultValue={accordionDefaultValue} className="w-full">

          <AccordionItem value="item-general">
            <AccordionTrigger>
              <CardTitle className="flex items-center text-lg">
                <InfoIcon className="mr-2 h-5 w-5 text-primary" />
                General Information
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipe Name</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., My Super IPA" {...field} />
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
                        <FormLabel>Recipe Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? 'All Grain'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a recipe type" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brewer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brewer (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., My Name" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <ActivityIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Recipe Status
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? 'in_progress'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select recipe status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="batchSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Size (L)</FormLabel>
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
                        <FormLabel>Boil Size (L)</FormLabel>
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
                        <FormLabel>Boil Time (min)</FormLabel>
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
                      <FormLabel>Efficiency (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-style">
            <AccordionTrigger>
              <CardTitle className="flex items-center text-lg">
                <ListChecksIcon className="mr-2 h-5 w-5 text-primary" />
                Beer Style
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="style.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
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
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
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
                        <FormLabel>Style Guide</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? 'Ale'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a style type" />
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-target-stats">
            <AccordionTrigger>
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                Target Stats
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="og"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OG (Original Gravity)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" placeholder="E.g., 1.050" {...field} value={field.value ?? ''} />
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
                        <FormLabel>FG (Final Gravity)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" placeholder="E.g., 1.010" {...field} value={field.value ?? ''} />
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
                        <FormLabel>ABV (%) - Calculated</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} readOnly value={field.value ?? 0} />
                        </FormControl>
                        <FormDescription>Calculated automatically.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ibu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBU - Calculated</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} readOnly value={field.value ?? 0} />
                        </FormControl>
                        <FormDescription>Calculated (Tinseth).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="colorSrm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color (SRM)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-fermentables">
            <AccordionTrigger>
              <CardTitle className="flex items-center text-lg">
                <Wheat className="mr-2 h-5 w-5 text-primary" />
                Fermentables
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => appendFermentable({ name: '', type: 'Grain', amount: 0, yield: 75, color: 0, amountUnit: 'kg' })}>
                  <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Fermentable
                </Button>
                {fermentableFields.map((item, index) => {
                  const currentUnit = form.watch(`fermentables.${index}.amountUnit`);
                  return (
                    <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                      <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeFermentable(index)}>
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                      <FormField control={form.control} name={`fermentables.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
                        <FormField control={form.control} name={`fermentables.${index}.type`} render={({ field }) => (
                          <FormItem><FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value ?? 'Grain'}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Fermentable Type" /></SelectTrigger></FormControl>
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
                        <FormField
                          control={form.control}
                          name={`fermentables.${index}.amount`}
                          render={({ field }) => {
                            // Display value based on currentUnit, but store in KG in form state
                            const formValueInKg = field.value || 0;
                            const displayValue = currentUnit === 'g' ? parseFloat((formValueInKg * 1000).toFixed(3)) : parseFloat(formValueInKg.toFixed(3));
                            return (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step={currentUnit === 'g' ? "1" : "0.001"}
                                    value={isNaN(displayValue) ? '' : displayValue}
                                    onChange={(e) => {
                                      const rawValue = parseFloat(e.target.value);
                                      if (!isNaN(rawValue)) {
                                        const valueInKgToStore = currentUnit === 'g' ? rawValue / 1000 : rawValue;
                                        field.onChange(valueInKgToStore);
                                      } else {
                                        field.onChange(undefined); // or 0, depending on desired behavior
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={form.control}
                          name={`fermentables.${index}.amountUnit`}
                          render={({ field: unitField }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <Select 
                                onValueChange={(newUnit) => {
                                    // When unit changes, we might need to convert the stored amount (which is always in KG)
                                    // This part is tricky because the `amount` field itself would need to re-render
                                    // For simplicity, the current `generateBeerXml` converts to KG before saving.
                                    // And the display logic above converts the KG value to the selected unit.
                                    unitField.onChange(newUnit);
                                    form.trigger(`fermentables.${index}.amount`); // re-validate to update display
                                }} 
                                defaultValue={unitField.value ?? 'kg'}
                              >
                                <FormControl><SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="g">g</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField control={form.control} name={`fermentables.${index}.yield`} render={({ field }) => (<FormItem><FormLabel>Yield (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`fermentables.${index}.color`} render={({ field }) => (<FormItem><FormLabel>Color (SRM)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    </div>
                  );
                })}
                {fermentableFields.length === 0 && <p className="text-sm text-muted-foreground">No fermentables added.</p>}
              </CardContent>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-hops">
            <AccordionTrigger>
              <CardTitle className="flex items-center text-lg">
                <HopIconLucide className="mr-2 h-5 w-5 text-primary" />
                Hops
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => appendHop({ name: '', alpha: 5.0, amount: 10, use: 'Boil', time: 60, form: 'Pellet', amountUnit: 'g' })}>
                  <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Hop
                </Button>
                {hopFields.map((item, index) => {
                  const currentUnit = form.watch(`hops.${index}.amountUnit`);
                  return (
                    <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                      <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeHop(index)}>
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                      <FormField control={form.control} name={`hops.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
                        <FormField control={form.control} name={`hops.${index}.alpha`} render={({ field }) => (<FormItem><FormLabel>Alpha (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField
                          control={form.control}
                          name={`hops.${index}.amount`}
                           render={({ field }) => {
                            // Display value based on currentUnit, but store in the selected unit in form state
                            // XML generation will convert to KG
                            const formValueInSelectedUnit = field.value || 0;
                            const displayValue = parseFloat(formValueInSelectedUnit.toString());
                            return (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step={currentUnit === 'g' ? "0.1" : "0.0001"} // Smaller step for kg
                                    value={isNaN(displayValue) ? '' : displayValue}
                                    onChange={(e) => {
                                      const rawValue = parseFloat(e.target.value);
                                      field.onChange(isNaN(rawValue) ? undefined : rawValue);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={form.control}
                          name={`hops.${index}.amountUnit`}
                          render={({ field: unitField }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <Select 
                                onValueChange={unitField.onChange} 
                                defaultValue={unitField.value ?? 'g'}
                              >
                                <FormControl><SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="g">g</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <FormField control={form.control} name={`hops.${index}.use`} render={({ field }) => (
                          <FormItem><FormLabel>Hop Usage</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value ?? 'Boil'}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Hop Usage" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Boil">Boil</SelectItem><SelectItem value="Dry Hop">Dry Hop</SelectItem><SelectItem value="Mash">Mash</SelectItem>
                                <SelectItem value="First Wort">First Wort</SelectItem><SelectItem value="Aroma">Aroma</SelectItem><SelectItem value="Whirlpool">Whirlpool</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`hops.${index}.time`} render={({ field }) => (<FormItem><FormLabel>Time (min)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`hops.${index}.form`} render={({ field }) => (
                          <FormItem><FormLabel>Hop Form</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value ?? 'Pellet'}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Hop Form" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Pellet">Pellet</SelectItem><SelectItem value="Plug">Plug</SelectItem>
                                <SelectItem value="Leaf">Leaf</SelectItem><SelectItem value="Extract">Extract</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage /></FormItem>)} />
                      </div>
                    </div>
                  );
                })}
                {hopFields.length === 0 && <p className="text-sm text-muted-foreground">No hops added.</p>}
              </CardContent>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-yeasts">
            <AccordionTrigger>
              <CardTitle className="flex items-center text-lg">
                <Microscope className="mr-2 h-5 w-5 text-primary" />
                Yeasts
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => appendYeast({ name: '', type: 'Ale', form: 'Dry', amount: 1, laboratory: '', productId: '', attenuation: 75 })}>
                  <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Yeast
                </Button>
                {yeastFields.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeYeast(index)}>
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                    <FormField control={form.control} name={`yeasts.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <FormField control={form.control} name={`yeasts.${index}.type`} render={({ field }) => (
                        <FormItem><FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ?? 'Ale'}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Yeast Type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Ale">Ale</SelectItem><SelectItem value="Lager">Lager</SelectItem><SelectItem value="Wheat">Wheat</SelectItem>
                              <SelectItem value="Wine">Wine</SelectItem><SelectItem value="Champagne">Champagne</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`yeasts.${index}.form`} render={({ field }) => (
                        <FormItem><FormLabel>Form</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ?? 'Dry'}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Yeast Form" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Liquid">Liquid</SelectItem><SelectItem value="Dry">Dry</SelectItem>
                              <SelectItem value="Slant">Slant</SelectItem><SelectItem value="Culture">Culture</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`yeasts.${index}.amount`} render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormDescription>e.g., 1 (pack), 11.5 (g), 0.035 (L)</FormDescription><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField control={form.control} name={`yeasts.${index}.laboratory`} render={({ field }) => (<FormItem><FormLabel>Laboratory</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`yeasts.${index}.productId`} render={({ field }) => (<FormItem><FormLabel>Product ID</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`yeasts.${index}.attenuation`} render={({ field }) => (<FormItem><FormLabel>Attenuation (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                  </div>
                ))}
                {yeastFields.length === 0 && <p className="text-sm text-muted-foreground">No yeasts added.</p>}
              </CardContent>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-miscs">
            <AccordionTrigger>
              <CardTitle className="flex items-center text-lg">
                <Package className="mr-2 h-5 w-5 text-primary" />
                Miscellaneous Ingredients
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => appendMisc({ name: '', type: 'Spice', use: 'Boil', time: 0, amount: 1 })}>
                  <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Miscellaneous Ingredient
                </Button>
                {miscFields.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeMisc(index)}>
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                    <FormField control={form.control} name={`miscs.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <FormField control={form.control} name={`miscs.${index}.type`} render={({ field }) => (
                        <FormItem><FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ?? 'Spice'}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Ingredient Type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Spice">Spice</SelectItem><SelectItem value="Fining">Fining</SelectItem><SelectItem value="Water Agent">Water Agent</SelectItem>
                              <SelectItem value="Herb">Herb</SelectItem><SelectItem value="Flavor">Flavor</SelectItem><SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`miscs.${index}.use`} render={({ field }) => (
                        <FormItem><FormLabel>Use</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ?? 'Boil'}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Use" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Boil">Boil</SelectItem><SelectItem value="Mash">Mash</SelectItem><SelectItem value="Primary">Primary</SelectItem>
                              <SelectItem value="Secondary">Secondary</SelectItem><SelectItem value="Bottling">Bottling</SelectItem><SelectItem value="Kegging">Kegging</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`miscs.${index}.time`} render={({ field }) => (<FormItem><FormLabel>Time (min)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`miscs.${index}.amount`} render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormDescription>Units depend on type</FormDescription><FormMessage /></FormItem>)} />
                    </div>
                  </div>
                ))}
                {miscFields.length === 0 && <p className="text-sm text-muted-foreground">No miscellaneous ingredients added.</p>}
              </CardContent>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-mash">
            <AccordionTrigger>
              <CardTitle className="flex items-center text-lg">
                <Thermometer className="mr-2 h-5 w-5 text-primary" />
                Mash Profile
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="mash.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mash Profile Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-row items-center justify-between pt-2">
                  <h4 className="font-medium">Mash Steps</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendMashStep({ name: '', type: 'Infusion', stepTemp: 65, stepTime: 60 })}>
                    <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Step
                  </Button>
                </div>
                {mashStepFields.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeMashStep(index)}>
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                    <FormField control={form.control} name={`mash.mashSteps.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Step Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField control={form.control} name={`mash.mashSteps.${index}.type`} render={({ field }) => (
                        <FormItem><FormLabel>Step Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ?? 'Infusion'}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Step Type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Infusion">Infusion</SelectItem>
                              <SelectItem value="Temperature">Temperature</SelectItem>
                              <SelectItem value="Decoction">Decoction</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`mash.mashSteps.${index}.stepTemp`} render={({ field }) => (<FormItem><FormLabel>Step Temp (°C)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`mash.mashSteps.${index}.stepTime`} render={({ field }) => (<FormItem><FormLabel>Step Duration (min)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                  </div>
                ))}
                {mashStepFields.length === 0 && <p className="text-sm text-muted-foreground">No mash steps added.</p>}
              </CardContent>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-notes">
            <AccordionTrigger>
              <CardTitle className="flex items-center text-lg">
                <StickyNote className="mr-2 h-5 w-5 text-primary" />
                Recipe Notes
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipe Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add your notes about the recipe, brewing process, etc."
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button type="submit" size="lg" className="w-full md:w-auto mt-8" disabled={form.formState.isSubmitting}>
          <SaveIcon className="mr-2 h-5 w-5" />
          {form.formState.isSubmitting
            ? (mode === 'edit' ? "Updating Recipe..." : "Saving Recipe...")
            : (mode === 'edit' ? "Update Recipe" : "Create and Save Recipe")}
        </Button>
      </form>
    </Form>
  );
}
