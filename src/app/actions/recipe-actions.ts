
'use server';

import { revalidatePath } from 'next/cache';
import { put, del, list } from '@vercel/blob';
import type { BeerXMLRecipe } from '@/types/recipe';
import { getRecipeDetails } from '@/lib/recipe-utils';

export interface ActionResult {
  success: boolean;
  count?: number;
  error?: string;
  recipe?: BeerXMLRecipe | null;
  newSlug?: string; // To redirect correctly after an edit if name/slug changes
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

export async function addRecipesAction(recipeFiles: RecipeFile[], originalRecipeSlug?: string): Promise<ActionResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("addRecipesAction: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.");
    return { success: false, error: "Configuration serveur manquante pour le stockage." };
  }

  try {
    let filesWritten = 0;
    let finalSlug = ''; // This will be the slug used for paths and revalidation

    const xmlFile = recipeFiles.find(file => file.fileName.toLowerCase().endsWith('.xml'));
    let recipeNameInXml = '';

    if (xmlFile) {
      recipeNameInXml = extractRecipeNameFromXml(xmlFile.content) || 'untitled-recipe';
    } else if (!originalRecipeSlug && recipeFiles.some(f => f.fileName.toLowerCase() === 'steps.md')) {
      console.warn("addRecipesAction: Handling steps.md without an XML file and no original slug. This scenario is problematic.");
      return { success: false, error: "Impossible de déterminer la recette pour steps.md sans fichier XML ou slug existant." };
    }

    if (originalRecipeSlug) {
      // This is an EDIT operation, use the original slug for the path
      finalSlug = originalRecipeSlug;
      console.log(`addRecipesAction: EDIT mode. Using original slug: ${finalSlug} for recipe name: "${recipeNameInXml || 'N/A'}"`);
    } else if (xmlFile) {
      // This is a CREATE or IMPORT operation, derive slug from XML content
      finalSlug = sanitizeSlug(recipeNameInXml);
      if (!finalSlug) {
        console.warn(`addRecipesAction: Could not generate a valid slug for new recipe name "${recipeNameInXml}". Using fallback.`);
        finalSlug = 'untitled-recipe-' + Date.now();
      }
      console.log(`addRecipesAction: CREATE/IMPORT mode. Derived slug: ${finalSlug} for recipe name: "${recipeNameInXml}"`);
    } else {
      // Should not happen if initial checks are correct
      console.error("addRecipesAction: Critical logic error - no XML file and no original slug to determine finalSlug.");
      return { success: false, error: "Erreur interne: impossible de déterminer le chemin de la recette." };
    }

    if (!finalSlug) {
        console.error("addRecipesAction: Critical - finalSlug is empty. This should not happen.");
        return { success: false, error: "Erreur interne critique lors de la détermination du slug." };
    }

    for (const file of recipeFiles) {
      let blobPathname = '';
      let contentType = '';

      if (file.fileName.toLowerCase().endsWith('.xml')) {
        blobPathname = `Recipes/${finalSlug}/recipe.xml`;
        contentType = 'application/xml';
      } else if (file.fileName.toLowerCase() === 'steps.md') {
        blobPathname = `Recipes/${finalSlug}/steps.md`;
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
        console.log(`addRecipesAction: File "${file.fileName}" for recipe slug "${finalSlug}" saved to Vercel Blob at ${blobPathname}`);
      }
    }

    if (filesWritten > 0) {
      revalidatePath('/');
      revalidatePath('/recipes'); // Assuming this is the main recipe listing page alias
      revalidatePath('/label');
      if (finalSlug) {
        revalidatePath(`/recipes/${finalSlug}`);
        revalidatePath(`/recipes/${finalSlug}/edit`);
      }
    }
    
    // If it was an edit, the newSlug for redirection is the originalRecipeSlug.
    // If it was a create, newSlug is the derived finalSlug.
    // The name inside the XML might be different, but the URL slug remains consistent for edits.
    return { success: true, count: filesWritten, newSlug: finalSlug };

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
      revalidatePath('/');
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
    revalidatePath(`/recipes/${recipeSlug}`); // This path might no longer exist, but revalidating is fine
    revalidatePath('/label');

    return { success: true, count: urlsToDelete.length };

  } catch (error) {
    console.error('deleteRecipeAction: Error deleting recipe folder from Vercel Blob:', error);
    return { success: false, error: (error as Error).message || 'Failed to delete recipe from Vercel Blob.' };
  }
}

export async function getRecipeDetailsAction(slug: string): Promise<ActionResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.NODE_ENV !== 'development') {
    console.error("getRecipeDetailsAction: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.");
    if (process.env.NODE_ENV === 'production') {
        return { success: false, error: "Configuration serveur manquante pour l'accès aux données." };
    }
  }
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


export async function updateRecipeStepsAction(recipeSlug: string, markdownContent: string): Promise<ActionResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("updateRecipeStepsAction: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.");
    return { success: false, error: "Configuration serveur manquante pour le stockage." };
  }

  if (!recipeSlug || typeof recipeSlug !== 'string' || recipeSlug.trim() === '') {
    return { success: false, error: 'Slug de recette invalide fourni.' };
  }
  if (typeof markdownContent !== 'string') { 
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
    revalidatePath('/recipes');

    return { success: true, count: 1 };

  } catch (error) {
    console.error(`updateRecipeStepsAction: Error saving steps.md for recipe ${recipeSlug} to Vercel Blob:`, error);
    return { success: false, error: (error as Error).message || 'Failed to save steps.md to Vercel Blob.' };
  }
}
