
'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

const recipesDir = path.join(process.cwd(), 'public', 'Recipes');

interface RecipeFile {
  fileName: string;
  content: string;
}

interface ActionResult {
  success: boolean;
  count?: number;
  error?: string;
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
        // Basic validation to prevent path traversal or invalid slugs
        return { success: false, error: 'Invalid recipe slug provided.' };
    }

    const fileName = `${recipeSlug}.xml`;
    // Sanitize filename again to be absolutely sure
    const safeFileName = path.basename(fileName); 
    
    if (!safeFileName.endsWith('.xml')) {
        return { success: false, error: 'Invalid file extension.' };
    }

    const filePath = path.join(recipesDir, safeFileName);

    // Optional: Check if file exists before attempting to delete, fs.unlink will error if not found anyway
    try {
        await fs.access(filePath);
    } catch (e) {
        console.warn(`File ${safeFileName} not found for deletion.`);
        return { success: false, error: `Recipe file ${safeFileName} not found.`};
    }

    await fs.unlink(filePath);
    console.log(`Recipe file ${safeFileName} deleted successfully.`);

    revalidatePath('/'); // Revalidate the homepage
    revalidatePath('/recipes'); // Revalidate generic recipe paths
    revalidatePath(`/recipes/${recipeSlug}`); // Revalidate the specific recipe path, though it's now deleted

    return { success: true };

  } catch (error) {
    console.error('Error deleting recipe file:', error);
    return { success: false, error: (error as Error).message || 'Failed to delete recipe.' };
  }
}
