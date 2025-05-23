
'use server';

import { revalidatePath } from 'next/cache';
import { put, del, list } from '@vercel/blob';
import type { BeerXMLRecipe } from '@/types/recipe';
import { getRecipeDetails } from '@/lib/recipe-utils';

interface RecipeFile {
  fileName: string; // Original filename, might be used for slug if name not in XML, or to distinguish .xml from .md
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
      // If no XML file, we can't determine a slug based on recipe name.
      // This case might need specific handling depending on if markdown-only uploads are allowed.
      // For now, we'll assume an XML file is primary.
      console.warn("addRecipesAction: No XML file found in the provided files. Cannot determine recipe slug.");
      return { success: false, error: "Aucun fichier XML trouvé pour déterminer le nom de la recette." };
    }

    for (const file of recipeFiles) {
      let blobPathname = '';
      let contentType = '';
      let isPrimaryRecipeFile = false; // To track if this is the main XML

      if (file.fileName.toLowerCase().endsWith('.xml')) {
        // If multiple XMLs are passed, this will overwrite based on the derived slug from the *first* XML.
        // The form should ideally only send one XML.
        blobPathname = `Recipes/${slug}/recipe.xml`;
        contentType = 'application/xml';
        isPrimaryRecipeFile = true;
      } else if (file.fileName.toLowerCase() === 'steps.md') { // Check for specific "steps.md"
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
        console.log(`addRecipesAction: File "${file.fileName}" for recipe "${recipeNameInXml}" saved to Vercel Blob at ${blobPathname}`);
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
    revalidatePath(`/recipes/${recipeSlug}`);
    revalidatePath('/label');

    return { success: true, count: urlsToDelete.length };

  } catch (error) {
    console.error('deleteRecipeAction: Error deleting recipe folder from Vercel Blob:', error);
    return { success: false, error: (error as Error).message || 'Failed to delete recipe from Vercel Blob.' };
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
