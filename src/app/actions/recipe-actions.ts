
'use server';

import { revalidatePath } from 'next/cache';
import { put, del, list } from '@vercel/blob';
import type { BeerXMLRecipe } from '@/types/recipe';
import { getRecipeDetails } from '@/lib/recipe-utils'; // Keep for future use if needed, not directly used in add/delete now

interface RecipeFile {
  fileName: string; // Original filename, might be used as fallback for slug if name not in XML
  content: string;
}

interface ActionResult {
  success: boolean;
  count?: number;
  error?: string;
  recipe?: BeerXMLRecipe | null; // Keep for getRecipeDetailsAction
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
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("addRecipesAction: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.");
    return { success: false, error: "Configuration serveur manquante pour le stockage." };
  }

  try {
    let filesWritten = 0;
    for (const file of recipeFiles) {
      if (!file.fileName.toLowerCase().endsWith('.xml')) {
        console.warn(`addRecipesAction: Skipping non-XML file: ${file.fileName}`);
        continue;
      }
      
      const recipeNameInXml = extractRecipeNameFromXml(file.content);
      
      if (!recipeNameInXml) {
        console.warn(`addRecipesAction: Recipe name not found in XML content of ${file.fileName}. Skipping.`);
        continue;
      }

      const slug = sanitizeSlug(recipeNameInXml);
      if (!slug) {
        console.warn(`addRecipesAction: Could not generate a valid slug for recipe name "${recipeNameInXml}" from file ${file.fileName}. Skipping.`);
        continue;
      }

      const blobPathname = `Recipes/${slug}/recipe.xml`;
      
      console.log(`addRecipesAction: Attempting to upload to Vercel Blob: ${blobPathname}`);
      await put(blobPathname, file.content, { 
        access: 'public',
        contentType: 'application/xml', // Explicitly set content type
      });
      
      filesWritten++;
      console.log(`addRecipesAction: Recipe "${recipeNameInXml}" saved to Vercel Blob at ${blobPathname}`);
    }

    if (filesWritten > 0) {
      revalidatePath('/'); 
      revalidatePath('/recipes');
      revalidatePath('/label'); 
      // Revalidate specific recipe pages if slug is known and consistent
      // For now, broader revalidation is simpler.
      // If recipeFiles contains only one file, we could revalidate `/recipes/${slug}`
      if (recipeFiles.length === 1) {
        const recipeNameInXml = extractRecipeNameFromXml(recipeFiles[0].content);
        if (recipeNameInXml) {
            const slug = sanitizeSlug(recipeNameInXml);
            if (slug) revalidatePath(`/recipes/${slug}`);
        }
      }
    }
    
    return { success: true, count: filesWritten };

  } catch (error) {
    console.error('addRecipesAction: Error saving recipe files to Vercel Blob:', error);
    return { success: false, error: (error as Error).message || 'Failed to save recipes to Vercel Blob.' };
  }
}

export async function deleteRecipeAction(recipeSlug: string): Promise<ActionResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("deleteRecipeAction: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.");
    return { success: false, error: "Configuration serveur manquante pour le stockage." };
  }

  try {
    if (!recipeSlug || typeof recipeSlug !== 'string' || recipeSlug.includes('..')) {
        return { success: false, error: 'Invalid recipe slug provided.' };
    }
    
    const blobFolderPrefix = `Recipes/${recipeSlug}/`;
    console.log(`deleteRecipeAction: Attempting to delete folder from Vercel Blob: ${blobFolderPrefix}`);

    const { blobs } = await list({ prefix: blobFolderPrefix });
    
    if (blobs.length === 0) {
      console.warn(`deleteRecipeAction: No blobs found with prefix ${blobFolderPrefix} to delete.`);
      // Optionally, still revalidate paths in case there was a mismatch but the UI needs refresh
      revalidatePath('/');
      revalidatePath('/recipes'); 
      revalidatePath(`/recipes/${recipeSlug}`);
      revalidatePath('/label');
      return { success: true, count: 0 }; // Success, as there's nothing to delete
    }

    const urlsToDelete = blobs.map(blob => blob.url);
    console.log(`deleteRecipeAction: Deleting ${urlsToDelete.length} blobs from Vercel Blob:`, urlsToDelete);
    await del(urlsToDelete);
    
    console.log(`deleteRecipeAction: Recipe folder ${blobFolderPrefix} and its contents deleted successfully from Vercel Blob.`);

    revalidatePath('/');
    revalidatePath('/recipes'); 
    revalidatePath(`/recipes/${recipeSlug}`); // This path will now be 404
    revalidatePath('/label');

    return { success: true, count: urlsToDelete.length };

  } catch (error) {
    console.error('deleteRecipeAction: Error deleting recipe folder from Vercel Blob:', error);
    return { success: false, error: (error as Error).message || 'Failed to delete recipe from Vercel Blob.' };
  }
}

// This action fetches details, primarily from Vercel Blob now via getRecipeDetails
export async function getRecipeDetailsAction(slug: string): Promise<ActionResult> {
  try {
    const recipe = await getRecipeDetails(slug); // getRecipeDetails reads from Vercel Blob
    if (!recipe) {
      return { success: false, error: 'Recipe not found.' };
    }
    return { success: true, recipe };
  } catch (error) {
    console.error(`Error fetching details for recipe ${slug}:`, error);
    return { success: false, error: (error as Error).message || 'Failed to fetch recipe details.' };
  }
}
