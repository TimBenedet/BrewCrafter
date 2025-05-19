
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simplified SRM to Hex color conversion
// This is a very basic mapping and not a precise colorimetric conversion.
// For a real application, a more accurate algorithm or a lookup table would be better.
export function srmToHex(srm?: number): string {
  if (srm === undefined || srm === null || isNaN(srm)) return '#CCCCCC'; // Default gray for N/A

  if (srm <= 2) return '#F3F993';    // Pale Straw
  if (srm <= 3) return '#F5F75C';    // Straw
  if (srm <= 4) return '#F6F513';    // Pale Gold
  if (srm <= 6) return '#EAE600';    // Deep Gold
  if (srm <= 8) return '#E0C000';    // Pale Amber
  if (srm <= 10) return '#D69A00';   // Medium Amber
  if (srm <= 13) return '#C07500';   // Deep Amber
  if (srm <= 17) return '#A65100';   // Amber-Brown
  if (srm <= 22) return '#8C3300';   // Brown
  if (srm <= 30) return '#731F00';   // Dark Brown
  if (srm <= 35) return '#591800';   // Very Dark Brown
  if (srm <= 40) return '#401000';   // Black
  return '#030202';                  // Opaque Black (for >40)
}

// Generates a concise summary of ingredients
export function summarizeIngredients(
  fermentables: Array<{ name: string }>,
  hops: Array<{ name: string }>,
  yeasts: Array<{ name: string }>
): string {
  const allIngredients: string[] = [];
  
  fermentables.slice(0, 2).forEach(f => allIngredients.push(f.name.split(' (')[0])); // Take first 2, simplify name
  hops.slice(0, 2).forEach(h => allIngredients.push(h.name)); // Take first 2
  if (yeasts.length > 0) {
    allIngredients.push(yeasts[0].name.split(' (')[0]); // Take first one, simplify name
  }

  if (allIngredients.length === 0) return 'N/A';
  
  let summary = allIngredients.slice(0, 3).join(', ');
  if (allIngredients.length > 3) {
    summary += '...';
  }
  return summary;
}
