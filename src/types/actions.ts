
import type { BeerXMLRecipe } from '@/types/recipe';

export interface ActionResult {
  success: boolean;
  count?: number;
  error?: string;
  recipe?: BeerXMLRecipe | null;
  newSlug?: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  qrDataURL?: string;
}
