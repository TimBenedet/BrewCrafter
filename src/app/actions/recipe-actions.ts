
'use server';

import { revalidatePath } from 'next/cache';
import { put, del, list } from '@vercel/blob';
import type { BeerXMLRecipe } from '@/types/recipe';
import { getRecipeDetails } from '@/lib/recipe-utils'; // Assuming this can still be used for other purposes if needed

export interface ActionResult {
  success: boolean;
  count?: number;
  error?: string;
  recipe?: BeerXMLRecipe | null; // Kept for potential future use in other actions
}

interface RecipeFile {
  fileName: string; 
  content: string;
}

const extractRecipeNameFromXml = (xmlContent: string): string | null => {
  const nameMatch = xmlContent.match(/<NAME>([\s\S]*?)<\/NAME>/i);
  return nameMatch ? nameMatch[1].trim() : null;
};

const sanitizeSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export async function addRecipesAction(recipeFiles: RecipeFile[]): Promise<ActionResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("addRecipesAction: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.");
    return { success: false, error: "Configuration serveur manquante pour le stockage." };
  }

  try {
    let filesWritten = 0;
    let slug = '';
    let recipeNameInXml = '';

    // First pass to find an XML file to determine the slug
    const xmlFile = recipeFiles.find(file => file.fileName.toLowerCase().endsWith('.xml'));
    if (xmlFile) {
      recipeNameInXml = extractRecipeNameFromXml(xmlFile.content) || 'untitled-recipe';
      slug = sanitizeSlug(recipeNameInXml);
      if (!slug) {
        console.warn(`addRecipesAction: Could not generate a valid slug for recipe name "${recipeNameInXml}". Using fallback.`);
        slug = 'untitled-recipe-' + Date.now(); // Fallback slug
      }
    } else {
      // This action now also handles updating just steps.md, which might not include an XML file.
      // If no XML is present, and we don't have a slug some other way, we can't proceed with old logic.
      // For now, if only steps.md is passed, this action won't work as intended without a slug context.
      // The new updateRecipeStepsAction is preferred for just steps.
      if (!recipeFiles.some(f => f.fileName.toLowerCase() === 'steps.md')) {
        console.warn("addRecipesAction: No XML file found and not a steps.md only operation. Cannot determine recipe slug.");
        return { success: false, error: "Aucun fichier XML trouvé pour déterminer le nom de la recette." };
      }
    }

    for (const file of recipeFiles) {
      let blobPathname = '';
      let contentType = '';

      if (file.fileName.toLowerCase().endsWith('.xml')) {
        // This logic assumes 'slug' has been derived from this XML file.
        blobPathname = `Recipes/${slug}/recipe.xml`;
        contentType = 'application/xml';
      } else if (file.fileName.toLowerCase() === 'steps.md') { 
        if (!slug) {
          // This case should be handled by updateRecipeStepsAction unless addRecipesAction is enhanced
          console.warn(`addRecipesAction: Attempting to save steps.md without a determined slug. This might fail or use a default/wrong slug.`);
          // Potentially, if a single steps.md is passed, a slug must be passed to this action,
          // or this action should not be used for steps.md alone.
          // For now, we'll assume 'slug' should have been determined if we reach here with steps.md
          // from a multi-file upload (XML + MD).
           return { success: false, error: "Impossible de sauvegarder steps.md sans slug de recette associé." };
        }
        blobPathname = `Recipes/${slug}/steps.md`;
        contentType = 'text/markdown';
      } else {
        console.warn(`addRecipesAction: Skipping unsupported file type or unexpected filename: ${file.fileName}`);
        continue;
      }

      if (blobPathname) {
        console.log(`addRecipesAction: Attempting to upload to Vercel Blob: ${blobPathname}`);
        await put(blobPathname, file.content, {
          access: 'public',
          contentType: contentType,
        });
        filesWritten++;
        console.log(`addRecipesAction: File "${file.fileName}" for recipe "${recipeNameInXml || slug}" saved to Vercel Blob at ${blobPathname}`);
      }
    }

    if (filesWritten > 0) {
      revalidatePath('/');
      revalidatePath('/recipes');
      revalidatePath('/label');
      if (slug) {
        revalidatePath(`/recipes/${slug}`);
        revalidatePath(`/recipes/${slug}/edit`);
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
      revalidatePath('/'); // Revalidate even if no blobs to clear potential cached "not found"
      revalidatePath('/recipes');
      revalidatePath(`/recipes/${recipeSlug}`);
      revalidatePath('/label');
      return { success: true, count: 0 };
    }

    const urlsToDelete = blobs.map(blob => blob.url);
    console.log(`deleteRecipeAction: Deleting ${urlsToDelete.length} blobs from Vercel Blob:`, urlsToDelete);
    await del(urlsToDelete);

    console.log(`deleteRecipeAction: Recipe folder ${blobFolderPrefix} and its contents deleted successfully from Vercel Blob.`);

    revalidatePath('/');
    revalidatePath('/recipes');
    revalidatePath(`/recipes/${recipeSlug}`);
    revalidatePath('/label');

    return { success: true, count: urlsToDelete.length };

  } catch (error) {
    console.error('deleteRecipeAction: Error deleting recipe folder from Vercel Blob:', error);
    return { success: false, error: (error as Error).message || 'Failed to delete recipe from Vercel Blob.' };
  }
}

// Kept for potential use if a full recipe object needs to be fetched by an action
// export async function getRecipeDetailsAction(slug: string): Promise<ActionResult> {
//   try {
//     const recipe = await getRecipeDetails(slug); // This now reads from Vercel Blob
//     if (!recipe) {
//       return { success: false, error: 'Recipe not found.' };
//     }
//     return { success: true, recipe };
//   } catch (error) {
//     console.error(`Error fetching details for recipe ${slug}:`, error);
//     return { success: false, error: (error as Error).message || 'Failed to fetch recipe details.' };
//   }
// }

export async function updateRecipeStepsAction(recipeSlug: string, markdownContent: string): Promise<ActionResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("updateRecipeStepsAction: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.");
    return { success: false, error: "Configuration serveur manquante pour le stockage." };
  }

  if (!recipeSlug || typeof recipeSlug !== 'string' || recipeSlug.trim() === '') {
    return { success: false, error: 'Slug de recette invalide fourni.' };
  }
  if (typeof markdownContent !== 'string') { // Allow empty string for deleting content
    return { success: false, error: 'Contenu Markdown invalide fourni.' };
  }

  const blobPathname = `Recipes/${recipeSlug}/steps.md`;

  try {
    console.log(`updateRecipeStepsAction: Attempting to upload/update steps.md to Vercel Blob: ${blobPathname}`);
    await put(blobPathname, markdownContent, {
      access: 'public',
      contentType: 'text/markdown',
    });
    console.log(`updateRecipeStepsAction: File steps.md for recipe "${recipeSlug}" saved to Vercel Blob at ${blobPathname}`);

    revalidatePath(`/recipes/${recipeSlug}`);
    // Revalidate recipes list in case steps availability affects summary display (though unlikely now)
    revalidatePath('/recipes'); 

    return { success: true, count: 1 };

  } catch (error) {
    console.error(`updateRecipeStepsAction: Error saving steps.md for recipe ${recipeSlug} to Vercel Blob:`, error);
    return { success: false, error: (error as Error).message || 'Failed to save steps.md to Vercel Blob.' };
  }
}
