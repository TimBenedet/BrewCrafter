
import { z } from 'zod';

export const LabelFormSchema = z.object({
  selectedRecipeSlug: z.string().optional(),
  volume: z.enum(['33CL', '75CL']).default('33CL'),
  
  // Front Label Fields
  beerName: z.string().min(1, "Beer name is required").default('Cosmic Haze IPA'),
  // IBU & SRM are for display, sourced from recipe, not directly part of this form schema for editing.
  // Alcohol (ABV) is also sourced from recipe for display.

  // Back Label Fields
  description: z.string().default('A juicy and hazy IPA, bursting with tropical fruit aromas and a smooth, pillowy mouthfeel. Perfect for exploring the cosmos or just chilling on your couch.'),
  ingredients: z.string().default('Water, Barley Malts (Pilsen, Vienna, CaraPils), Flaked Oats, Wheat Malt, Hops (Citra, Mosaic, Galaxy), Yeast.'),
  brewingDate: z.string().default('Brewed on: 15/07/2024'),
  brewingLocation: z.string().default('Starbase Brewery, Alpha Nebula'),

  // Common Design Fields
  breweryName: z.string().default('Galaxy Brews Co.'),
  tagline: z.string().default('Crafted with passion, enjoyed with friends.'),
  
  backgroundImage: z.string().optional(), // Will store Data URL
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").default('#333333'),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").default('#FFFFFF'),
});

export type LabelFormValues = z.infer<typeof LabelFormSchema>;

// For recipe data structure (simplified version of what might be needed from BeerXMLRecipe)
export interface LabelRecipeData {
  slug: string;
  name: string;
  styleName?: string;
  notes?: string; // For description
  fermentables: Array<{ name: string; amount: number }>;
  hops: Array<{ name: string; amount: number; use: string }>;
  yeasts: Array<{ name: string }>;
  abv?: number;
  ibu?: number;
  color?: number; // SRM
  // Assuming 'brewingDate' and 'brewingLocation' are not typically in BeerXML, 
  // so they'd be manual or from a different source.
  // For this example, we'll treat them as manual inputs in the form.
}
