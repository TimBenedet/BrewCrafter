
'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { getRecipeDetails } from '@/lib/recipe-utils'; // Keep if still used for getRecipeDetailsAction
import type { BeerXMLRecipe } from '@/types/recipe';

const recipesDir = path.join(process.cwd(), 'public', 'Recipes');

interface RecipeFile {
  fileName: string; // Original filename, might be used as fallback for slug if name not in XML
  content: string;
}

interface ActionResult {
  success: boolean;
  count?: number;
  error?: string;
  recipe?: BeerXMLRecipe | null;
}

const extractRecipeNameFromXml = (xmlContent: string): string | null => {
  const nameMatch = xmlContent.match(/<NAME>([\s\S]*?)<\/NAME>/i);
  return nameMatch ? nameMatch[1].trim() : null;
};

const sanitizeSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '') // Remove all non-word chars except hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Trim hyphen from start of text
    .replace(/-+$/, ''); // Trim hyphen from end of text
};


export async function addRecipesAction(recipeFiles: RecipeFile[]): Promise<ActionResult> {
  try {
    await fs.mkdir(recipesDir, { recursive: true });

    let filesWritten = 0;
    for (const file of recipeFiles) {
      if (!file.fileName.endsWith('.xml')) {
        console.warn(`Skipping non-XML file: ${file.fileName}`);
        continue;
      }
      
      const recipeNameInXml = extractRecipeNameFromXml(file.content);
      
      if (!recipeNameInXml) {
        console.warn(`Recipe name not found in XML content of ${file.fileName}. Skipping.`);
        continue;
      }

      const slug = sanitizeSlug(recipeNameInXml);
      if (!slug) {
        console.warn(`Could not generate a valid slug for recipe name "${recipeNameInXml}" from file ${file.fileName}. Skipping.`);
        continue;
      }

      const recipeDirPath = path.join(recipesDir, slug);
      await fs.mkdir(recipeDirPath, { recursive: true });
      
      const xmlFilePath = path.join(recipeDirPath, 'recipe.xml');
      await fs.writeFile(xmlFilePath, file.content, 'utf-8');
      filesWritten++;
      console.log(`Recipe "${recipeNameInXml}" saved to ${slug}/recipe.xml`);
    }

    if (filesWritten > 0) {
      revalidatePath('/'); 
      revalidatePath('/recipes'); // For any page that lists recipes
      revalidatePath('/label'); 
      // Consider revalidating specific recipe detail pages if many are added,
      // but for one or few, broad revalidation is simpler.
    }
    
    return { success: true, count: filesWritten };

  } catch (error) {
    console.error('Error saving recipe files:', error);
    return { success: false, error: (error as Error).message || 'Failed to save recipes.' };
  }
}

export async function deleteRecipeAction(recipeSlug: string): Promise<ActionResult> {
  try {
    if (!recipeSlug || typeof recipeSlug !== 'string' || recipeSlug.includes('..')) {
        return { success: false, error: 'Invalid recipe slug provided.' };
    }
    
    const recipeDirPath = path.join(recipesDir, recipeSlug);

    try {
        await fs.access(recipeDirPath); // Check if directory exists
    } catch (e) {
        console.warn(`Recipe directory ${recipeSlug} not found for deletion.`);
        return { success: false, error: `Recipe directory ${recipeSlug} not found.`};
    }

    await fs.rm(recipeDirPath, { recursive: true, force: true });
    console.log(`Recipe directory ${recipeSlug} deleted successfully.`);

    revalidatePath('/');
    revalidatePath('/recipes'); 
    revalidatePath(`/recipes/${recipeSlug}`); // This path will now be 404
    revalidatePath('/label');

    return { success: true };

  } catch (error) {
    console.error('Error deleting recipe directory:', error);
    return { success: false, error: (error as Error).message || 'Failed to delete recipe.' };
  }
}

// This action seems fine as is, assuming getRecipeDetails is updated to use the new slug (dir) structure
export async function getRecipeDetailsAction(slug: string): Promise<ActionResult> {
  try {
    const recipe = await getRecipeDetails(slug); // getRecipeDetails needs to handle new structure
    if (!recipe) {
      return { success: false, error: 'Recipe not found.' };
    }
    return { success: true, recipe };
  } catch (error) {
    console.error(`Error fetching details for recipe ${slug}:`, error);
    return { success: false, error: (error as Error).message || 'Failed to fetch recipe details.' };
  }
}
