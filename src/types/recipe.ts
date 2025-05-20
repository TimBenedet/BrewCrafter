
export interface RecipeSummary {
  slug: string;
  name: string;
  type: string; // Original type field, e.g., "All Grain"
  styleName?: string; // Specific style name, e.g., "American Amber Ale"
  og?: number;
  fg?: number;
  ibu?: number;
  color?: number; // SRM
  abv?: number;
  batchSize?: number; // Liters
}

export interface Style {
  name: string;
  category?: string;
  ogMin?: number;
  ogMax?: number;
  fgMin?: number;
  fgMax?: number;
  ibuMin?: number;
  ibuMax?: number;
  colorMin?: number;
  colorMax?: number;
  abvMin?: number;
  abvMax?: number;
}

export interface Fermentable {
  name: string;
  amount: number; // in kg
  type: string; // e.g., "Grain", "Extract", "Sugar"
  yieldPercentage: number;
  color: number; // SRM
}

export interface Hop {
  name: string;
  amount: number; // in kg (usually g, but BeerXML standard is kg)
  use: string; // e.g., "Boil", "Dry Hop", "Whirlpool"
  time: number; // in minutes
  alpha: number; // Alpha acid percentage
  form?: string; // e.g., "Pellet", "Plug", "Leaf"
}

export interface Yeast {
  name: string;
  amount: number; // Liters for liquid, grams for dry. BeerXML has <AMOUNT_IS_WEIGHT>
  type: string; // e.g., "Ale", "Lager"
  form: string; // e.g., "Liquid", "Dry"
  laboratory?: string;
  productId?: string;
}

export interface Misc {
  name: string;
  amount: number; // Unit depends on type, could be kg, L, items
  use: string; // e.g., "Boil", "Primary", "Bottling"
  time: number; // in minutes (relative to end of boil, or for duration)
  type: string; // e.g., "Spice", "Fining", "Herb", "Flavor"
}

export interface MashStep {
  name: string;
  type: string; // e.g., "Infusion", "Temperature", "Decoction"
  stepTemp: number; // Celsius
  stepTime: number; // minutes
  infuseAmount?: number; // Liters, if infusion
}

export interface MashProfile {
  name: string;
  grainTemp?: number; // Celsius
  mashSteps: MashStep[];
}

export interface BeerXMLRecipe {
  name: string;
  version: number;
  type: string; // "All Grain", "Extract", "Partial Mash"
  brewer?: string;
  batchSize: number; // Liters
  boilSize: number; // Liters
  boilTime: number; // Minutes
  efficiency?: number; // Percentage
  notes?: string;
  style?: Style;
  fermentables: Fermentable[];
  hops: Hop[];
  yeasts: Yeast[];
  miscs: Misc[];
  mash?: MashProfile;
  // Calculated values that might also be in XML
  og?: number;
  fg?: number;
  abv?: number;
  ibu?: number;
  color?: number; // SRM
  stepsMarkdown?: string; // Added for recipe steps
}

