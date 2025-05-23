
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

    const xmlFile = recipeFiles.find(file => file.fileName.toLowerCase().endsWith('.xml'));
    if (xmlFile) {
      recipeNameInXml = extractRecipeNameFromXml(xmlFile.content) || 'untitled-recipe';
      slug = sanitizeSlug(recipeNameInXml);
      if (!slug) {
        console.warn(`addRecipesAction: Could not generate a valid slug for recipe name "${recipeNameInXml}". Using fallback.`);
        slug = 'untitled-recipe-' + Date.now();
      }
    } else if (recipeFiles.some(f => f.fileName.toLowerCase() === 'steps.md')) {
      // This case is tricky if only steps.md is passed without context for the slug.
      // Assuming slug should be derived if steps.md is part of a multi-file (XML+MD) upload.
      // If steps.md is uploaded alone, updateRecipeStepsAction is preferred or this action needs a slug param.
      const stepsFile = recipeFiles.find(f => f.fileName.toLowerCase() === 'steps.md');
      // Attempt to infer slug from a potential path or rely on external context if only steps.md
      // This part might need refinement depending on how steps.md alone would get a slug.
      // For now, if only steps.md, it implies an update to an existing recipe, so slug MUST be known.
      // This action is primarily for creating new recipes or adding/updating XML + MD.
      if (!xmlFile && stepsFile) { // If there's no XML, we must have a way to get the slug.
        // This case is now better handled by updateRecipeStepsAction.
        // If addRecipesAction is used for steps.md only, it assumes slug must be present or determinable.
        // Let's assume for now if only steps.md is passed, this specific part of addRecipesAction won't be hit,
        // or slug is derived/passed in a way not shown here if it's about creating a NEW recipe with only steps.
        // This primarily focuses on new recipe creation or full recipe update (XML+MD).
        console.warn("addRecipesAction: Handling steps.md without an XML file. Slug determination is critical and might rely on prior state or context.");
        // If slug can't be found here, it should fail.
        // For now, we proceed assuming slug IS determined if we are to save steps.md
      }
    } else {
      console.warn("addRecipesAction: No XML file found. Cannot determine recipe slug for new recipe creation.");
      return { success: false, error: "Aucun fichier XML trouvé pour déterminer le nom de la recette." };
    }

    if (!slug && recipeFiles.some(f => f.fileName.toLowerCase() === 'steps.md') && !xmlFile) {
        console.error("addRecipesAction: Trying to save steps.md but no slug could be determined (no XML file provided).");
        return { success: false, error: "Impossible de sauvegarder steps.md sans fichier XML pour déterminer la recette." };
    }


    for (const file of recipeFiles) {
      let blobPathname = '';
      let contentType = '';

      if (file.fileName.toLowerCase().endsWith('.xml')) {
        blobPathname = `Recipes/${slug}/recipe.xml`;
        contentType = 'application/xml';
      } else if (file.fileName.toLowerCase() === 'steps.md') {
        if (!slug) {
          // This should ideally not happen if the slug derivation logic above is sound for all cases
          console.error(`addRecipesAction: Critical - Attempting to save steps.md but slug is empty. Original recipe name: "${recipeNameInXml}"`);
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
      revalidatePath('/recipes'); // Assuming this is the main recipe listing page alias
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

    // List all blobs in the "folder"
    const { blobs } = await list({ prefix: blobFolderPrefix });

    if (blobs.length === 0) {
      console.warn(`deleteRecipeAction: No blobs found with prefix ${blobFolderPrefix} to delete.`);
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
    revalidatePath(`/recipes/${recipeSlug}`);
    revalidatePath('/label');

    return { success: true, count: urlsToDelete.length };

  } catch (error) {
    console.error('deleteRecipeAction: Error deleting recipe folder from Vercel Blob:', error);
    return { success: false, error: (error as Error).message || 'Failed to delete recipe from Vercel Blob.' };
  }
}

export async function getRecipeDetailsAction(slug: string): Promise<ActionResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.NODE_ENV !== 'development') {
    // In development, recipe-utils might read from public folder if token isn't set for Blob
    console.error("getRecipeDetailsAction: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.");
    // Allow to proceed in dev for local file reading, but error in prod.
    if (process.env.NODE_ENV === 'production') {
        return { success: false, error: "Configuration serveur manquante pour l'accès aux données." };
    }
  }
  try {
    const recipe = await getRecipeDetails(slug); // This now reads from Vercel Blob primarily
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
    revalidatePath('/recipes');

    return { success: true, count: 1 };

  } catch (error) {
    console.error(`updateRecipeStepsAction: Error saving steps.md for recipe ${recipeSlug} to Vercel Blob:`, error);
    return { success: false, error: (error as Error).message || 'Failed to save steps.md to Vercel Blob.' };
  }
}
