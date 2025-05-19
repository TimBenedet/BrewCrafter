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
    // Ensure the Recipes directory exists
    await fs.mkdir(recipesDir, { recursive: true });

    let filesWritten = 0;
    for (const file of recipeFiles) {
      // Basic sanitization for filename, although files come from user's system
      // We only accept .xml files as per the input accept attribute.
      if (!file.fileName.endsWith('.xml')) {
        console.warn(`Skipping non-XML file: ${file.fileName}`);
        continue;
      }
      
      // Prevent writing outside of the recipesDir, though path.join should handle most of this.
      // A more robust sanitization might be needed if filenames were purely user-generated strings.
      const safeFileName = path.basename(file.fileName);
      const filePath = path.join(recipesDir, safeFileName);

      // Check if file already exists, optionally skip or overwrite
      // For now, we'll overwrite.
      // const exists = await fs.access(filePath).then(() => true).catch(() => false);
      // if (exists) {
      //   console.log(`File ${safeFileName} already exists. Skipping or add overwrite logic.`);
      //   continue;
      // }

      await fs.writeFile(filePath, file.content, 'utf-8');
      filesWritten++;
      console.log(`Recipe file ${safeFileName} saved successfully.`);
    }

    if (filesWritten > 0) {
      // Revalidate paths to ensure Next.js picks up the new files
      revalidatePath('/'); // For the homepage listing
      revalidatePath('/recipes'); // For the recipes/[recipeSlug] pages (generic)
      // To be more specific, you might revalidate individual recipe slugs if known,
      // but revalidating the parent path is generally sufficient for new files in a directory.
    }
    
    return { success: true, count: filesWritten };

  } catch (error) {
    console.error('Error saving recipe files:', error);
    return { success: false, error: (error as Error).message || 'Failed to save recipes.' };
  }
}
