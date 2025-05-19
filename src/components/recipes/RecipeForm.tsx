
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { SaveIcon } from 'lucide-react';

const recipeFormSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  type: z.enum(['All Grain', 'Extract', 'Partial Mash'], { required_error: 'Le type de recette est requis.' }),
  brewer: z.string().optional(),
  batchSize: z.coerce.number().positive({ message: 'La taille du lot (BATCH_SIZE) doit être un nombre positif.' }),
  boilSize: z.coerce.number().positive({ message: 'La taille d\'ébullition (BOIL_SIZE) doit être un nombre positif.' }),
  boilTime: z.coerce.number().int().positive({ message: 'Le temps d\'ébullition (BOIL_TIME) doit être un entier positif.'}),
  notes: z.string().optional(),
  // More fields will be added later for fermentables, hops, yeasts, etc.
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

const defaultValues: Partial<RecipeFormValues> = {
  name: '',
  type: 'All Grain',
  brewer: '',
  batchSize: 20,
  boilSize: 25,
  boilTime: 60,
  notes: '',
};

function sanitizeForXml(text: string | undefined | null): string {
  if (text === undefined || text === null) return '';
  return text.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return char;
    }
  });
}

function generateBasicBeerXml(data: RecipeFormValues): string {
  // This is a very basic XML generation. 
  // A full BeerXML generator would be much more complex and handle all sections.
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<RECIPES>\n`;
  xml += `  <RECIPE>\n`;
  xml += `    <NAME>${sanitizeForXml(data.name)}</NAME>\n`;
  xml += `    <VERSION>1</VERSION>\n`;
  xml += `    <TYPE>${sanitizeForXml(data.type)}</TYPE>\n`;
  if (data.brewer) {
    xml += `    <BREWER>${sanitizeForXml(data.brewer)}</BREWER>\n`;
  }
  xml += `    <BATCH_SIZE>${data.batchSize}</BATCH_SIZE>\n`;
  xml += `    <BOIL_SIZE>${data.boilSize}</BOIL_SIZE>\n`;
  xml += `    <BOIL_TIME>${data.boilTime}</BOIL_TIME>\n`;
  if (data.notes) {
    xml += `    <NOTES>${sanitizeForXml(data.notes)}</NOTES>\n`;
  }
  // Placeholder for other main elements like STYLE, EQUIPMENT, etc.
  xml += `    <FERMENTABLES/>\n`;
  xml += `    <HOPS/>\n`;
  xml += `    <YEASTS/>\n`;
  xml += `    <MISCS/>\n`;
  xml += `    <WATERS/>\n`;
  xml += `    <MASH>\n`;
  xml += `      <NAME>Generic Mash</NAME>\n`;
  xml += `      <VERSION>1</VERSION>\n`;
  xml += `      <GRAIN_TEMP>20.0</GRAIN_TEMP>\n`;
  xml += `      <MASH_STEPS/>\n`;
  xml += `    </MASH>\n`;
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

  function onSubmit(data: RecipeFormValues) {
    const xmlData = generateBasicBeerXml(data);
    const blob = new Blob([xmlData], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Sanitize filename from recipe name
    const fileName = (data.name || 'nouvelle-recette').replace(/[^a-z0-9À-ÿ_.-]/gi, '_').replace(/\.$/, '') + '.xml';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Recette prête au téléchargement',
      description: `Le fichier ${fileName} devrait commencer à se télécharger. Vous pourrez l'enregistrer où vous le souhaitez.`,
      duration: 7000,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la recette</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Ma Super Pale Ale" {...field} />
              </FormControl>
              <FormDescription>Le nom qui apparaîtra pour cette recette.</FormDescription>
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
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="All Grain">All Grain</SelectItem>
                  <SelectItem value="Extract">Extract</SelectItem>
                  <SelectItem value="Partial Mash">Partial Mash</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Le type de brassage pour cette recette.</FormDescription>
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
              <FormControl>
                <Input placeholder="Ex: Jean Dupont" {...field} />
              </FormControl>
              <FormDescription>Le nom du brasseur ou de la brasserie.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
            control={form.control}
            name="batchSize"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Taille du lot (BATCH_SIZE)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.1" placeholder="20" {...field} />
                </FormControl>
                <FormDescription>Volume final en litres.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="boilSize"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Taille d'ébullition (BOIL_SIZE)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.1" placeholder="25" {...field} />
                </FormControl>
                <FormDescription>Volume avant ébullition en litres.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="boilTime"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Temps d'ébullition (BOIL_TIME)</FormLabel>
                <FormControl>
                    <Input type="number" step="1" placeholder="60" {...field} />
                </FormControl>
                <FormDescription>Durée d'ébullition en minutes.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ajoutez ici des notes sur la recette, le processus de brassage, des conseils de dégustation, etc."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Toutes informations supplémentaires utiles.</FormDescription>
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
