
'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { getRecipeDetails } from '@/lib/recipe-utils';
import type { BeerXMLRecipe } from '@/types/recipe';

const recipesDir = path.join(process.cwd(), 'public', 'Recipes');

interface RecipeFile {
  fileName: string;
  content: string;
}

interface ActionResult {
  success: boolean;
  count?: number;
  error?: string;
  recipe?: BeerXMLRecipe | null;
}

export async function addRecipesAction(recipeFiles: RecipeFile[]): Promise<ActionResult> {
  try {
    await fs.mkdir(recipesDir, { recursive: true });

    let filesWritten = 0;
    for (const file of recipeFiles) {
      if (!file.fileName.endsWith('.xml')) {
        console.warn(`Skipping non-XML file: ${file.fileName}`);
        continue;
      }
      
      const safeFileName = path.basename(file.fileName);
      const filePath = path.join(recipesDir, safeFileName);

      await fs.writeFile(filePath, file.content, 'utf-8');
      filesWritten++;
      console.log(`Recipe file ${safeFileName} saved successfully.`);
    }

    if (filesWritten > 0) {
      revalidatePath('/'); 
      revalidatePath('/recipes');
      revalidatePath('/label'); 
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

    const fileName = `${recipeSlug}.xml`;
    const safeFileName = path.basename(fileName); 
    
    if (!safeFileName.endsWith('.xml')) {
        return { success: false, error: 'Invalid file extension.' };
    }

    const filePath = path.join(recipesDir, safeFileName);

    try {
        await fs.access(filePath);
    } catch (e) {
        console.warn(`File ${safeFileName} not found for deletion.`);
        return { success: false, error: `Recipe file ${safeFileName} not found.`};
    }

    await fs.unlink(filePath);
    console.log(`Recipe file ${safeFileName} deleted successfully.`);

    revalidatePath('/');
    revalidatePath('/recipes'); 
    revalidatePath(`/recipes/${recipeSlug}`);
    revalidatePath('/label');

    return { success: true };

  } catch (error) {
    console.error('Error deleting recipe file:', error);
    return { success: false, error: (error as Error).message || 'Failed to delete recipe.' };
  }
}

export async function getRecipeDetailsAction(slug: string): Promise<ActionResult> {
  try {
    const recipe = await getRecipeDetails(slug);
    if (!recipe) {
      return { success: false, error: 'Recipe not found.' };
    }
    return { success: true, recipe };
  } catch (error) {
    console.error(`Error fetching details for recipe ${slug}:`, error);
    return { success: false, error: (error as Error).message || 'Failed to fetch recipe details.' };
  }
}
