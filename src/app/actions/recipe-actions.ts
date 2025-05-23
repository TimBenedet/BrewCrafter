
'use server';

import { revalidatePath } from 'next/cache';
import { put, del, list } from '@vercel/blob';
import type { BeerXMLRecipe } from '@/types/recipe';
// getRecipeDetails is not used in this file for file content actions.
// import { getRecipeDetails } from '@/lib/recipe-utils';

export interface ActionResult {
  success: boolean;
  count?: number;
  error?: string;
  recipe?: BeerXMLRecipe | null;
  newSlug?: string;
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
  console.log(`addRecipesAction: Called with originalRecipeSlug: ${originalRecipeSlug}, recipeFiles count: ${recipeFiles.length}`);

  try {
    let filesWritten = 0;
    let finalSlug = '';

    const xmlFileFromInput = recipeFiles.find(file => file.fileName.toLowerCase().endsWith('.xml'));
    const mdFileFromInput = recipeFiles.find(file => file.fileName.toLowerCase() === 'steps.md');

    if (originalRecipeSlug) {
      // EDIT MODE
      finalSlug = originalRecipeSlug;
      console.log(`addRecipesAction: EDIT mode. Using finalSlug: ${finalSlug} (derived from originalRecipeSlug)`);

      const recipeDirPrefix = `Recipes/${finalSlug}/`;
      console.log(`addRecipesAction: EDIT mode. Listing blobs with prefix: '${recipeDirPrefix}', mode: 'expanded'`);
      const { blobs: existingBlobs } = await list({ prefix: recipeDirPrefix, mode: 'expanded' }); // Use expanded mode
      console.log(`addRecipesAction: EDIT mode. Blobs in ${recipeDirPrefix} (first 10):`, existingBlobs.slice(0,10).map(b => b.pathname));

      let existingXmlPathname: string | undefined = undefined;
      let existingMdPathname: string | undefined = undefined;

      // Find the first .xml file directly in the recipe directory
      const xmlBlob = existingBlobs.find(b => {
        if (!b.pathname) return false;
        const lowerPath = b.pathname.toLowerCase();
        if (lowerPath.startsWith(recipeDirPrefix.toLowerCase()) && lowerPath.endsWith('.xml')) {
          const relativePath = b.pathname.substring(recipeDirPrefix.length);
          return !relativePath.includes('/'); // Ensure it's a direct child
        }
        return false;
      });
      if (xmlBlob) {
        existingXmlPathname = xmlBlob.pathname;
        console.log(`addRecipesAction: EDIT mode. Found existing XML: ${existingXmlPathname}`);
      } else {
        console.warn(`addRecipesAction: EDIT mode. No existing XML found in ${recipeDirPrefix}. Defaulting to 'recipe.xml' if XML input is provided.`);
      }

      // Find the first .md file directly in the recipe directory
      const mdBlob = existingBlobs.find(b => {
        if (!b.pathname) return false;
        const lowerPath = b.pathname.toLowerCase();
        if (lowerPath.startsWith(recipeDirPrefix.toLowerCase()) && lowerPath.endsWith('.md')) {
          const relativePath = b.pathname.substring(recipeDirPrefix.length);
          return !relativePath.includes('/'); // Ensure it's a direct child
        }
        return false;
      });
      if (mdBlob) {
        existingMdPathname = mdBlob.pathname;
        console.log(`addRecipesAction: EDIT mode. Found existing MD: ${existingMdPathname}`);
      } else {
        console.warn(`addRecipesAction: EDIT mode. No existing MD found in ${recipeDirPrefix}. Defaulting to 'steps.md' if MD input is provided.`);
      }


      // Upload XML file if present in input
      if (xmlFileFromInput) {
        const xmlPathToUpload = existingXmlPathname || `Recipes/${finalSlug}/recipe.xml`;
        console.log(`addRecipesAction: EDIT mode. For XML upload: existingXmlPathname = "${existingXmlPathname}", finalSlug = "${finalSlug}"`);
        console.log(`addRecipesAction: EDIT mode. Attempting to upload XML to Vercel Blob: ${xmlPathToUpload}`);
        await put(xmlPathToUpload, xmlFileFromInput.content, {
          access: 'public',
          contentType: 'application/xml',
          addRandomSuffix: false,
        });
        filesWritten++;
        console.log(`addRecipesAction: EDIT mode. XML file for recipe slug "${finalSlug}" saved to Vercel Blob at ${xmlPathToUpload}`);
      }

      // Upload MD file if present in input
      if (mdFileFromInput) {
        const mdPathToUpload = existingMdPathname || `Recipes/${finalSlug}/steps.md`;
        console.log(`addRecipesAction: EDIT mode. For MD upload: existingMdPathname = "${existingMdPathname}", finalSlug = "${finalSlug}"`);
        console.log(`addRecipesAction: EDIT mode. Attempting to upload MD to Vercel Blob: ${mdPathToUpload}`);
        await put(mdPathToUpload, mdFileFromInput.content, {
          access: 'public',
          contentType: 'text/markdown',
          addRandomSuffix: false,
        });
        filesWritten++;
        console.log(`addRecipesAction: EDIT mode. MD file for recipe slug "${finalSlug}" saved to Vercel Blob at ${mdPathToUpload}`);
      }

    } else {
      // CREATE/IMPORT MODE
      if (!xmlFileFromInput) {
        console.error("addRecipesAction: CREATE/IMPORT mode. No XML file provided.");
        return { success: false, error: "Fichier XML requis pour créer une nouvelle recette." };
      }
      const recipeNameInXml = extractRecipeNameFromXml(xmlFileFromInput.content) || 'untitled-recipe';
      finalSlug = sanitizeSlug(recipeNameInXml);
      if (!finalSlug) {
        console.warn(`addRecipesAction: Could not generate a valid slug for new recipe name "${recipeNameInXml}". Using fallback.`);
        finalSlug = 'untitled-recipe-' + Date.now();
      }
      console.log(`addRecipesAction: CREATE/IMPORT mode. Derived slug: ${finalSlug} from XML recipe name: "${recipeNameInXml}"`);

      const xmlPathname = `Recipes/${finalSlug}/recipe.xml`;
      console.log(`addRecipesAction: CREATE/IMPORT mode. Attempting to upload XML to Vercel Blob: ${xmlPathname}`);
      await put(xmlPathname, xmlFileFromInput.content, {
        access: 'public',
        contentType: 'application/xml',
        addRandomSuffix: false,
      });
      filesWritten++;
      console.log(`addRecipesAction: CREATE/IMPORT mode. XML file for recipe slug "${finalSlug}" saved to Vercel Blob at ${xmlPathname}`);

      if (mdFileFromInput) {
        const mdPathname = `Recipes/${finalSlug}/steps.md`;
        console.log(`addRecipesAction: CREATE/IMPORT mode. Attempting to upload MD to Vercel Blob: ${mdPathname}`);
        await put(mdPathname, mdFileFromInput.content, {
          access: 'public',
          contentType: 'text/markdown',
          addRandomSuffix: false,
        });
        filesWritten++;
        console.log(`addRecipesAction: CREATE/IMPORT mode. MD file for recipe slug "${finalSlug}" saved to Vercel Blob at ${mdPathname}`);
      }
    }

    if (filesWritten > 0) {
      revalidatePath('/');
      revalidatePath('/recipes');
      revalidatePath('/label');
      if (finalSlug) {
        revalidatePath(`/recipes/${finalSlug}`);
        revalidatePath(`/recipes/${finalSlug}/edit`);
      }
      console.log(`addRecipesAction: Revalidated paths for slug: ${finalSlug}`);
    }

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
  console.log(`deleteRecipeAction: Called for slug: ${recipeSlug}`);

  try {
    if (!recipeSlug || typeof recipeSlug !== 'string' || recipeSlug.includes('..')) {
      console.error(`deleteRecipeAction: Invalid recipe slug provided: ${recipeSlug}`);
      return { success: false, error: 'Invalid recipe slug provided.' };
    }

    const blobFolderPrefix = `Recipes/${recipeSlug}/`;
    console.log(`deleteRecipeAction: Attempting to list blobs in Vercel Blob folder: ${blobFolderPrefix}`);

    // List all files in the "folder"
    const { blobs } = await list({ prefix: blobFolderPrefix, mode: 'folded' }); // folded is fine here as we want to delete all under prefix

    if (blobs.length === 0) {
      console.warn(`deleteRecipeAction: No blobs found with prefix ${blobFolderPrefix} to delete.`);
      // Still revalidate paths in case the folder was already empty or slug was wrong but we want UI to refresh
      revalidatePath('/');
      revalidatePath('/recipes');
      revalidatePath(`/recipes/${recipeSlug}`);
      revalidatePath('/label');
      return { success: true, count: 0 };
    }

    const urlsToDelete = blobs.map(blob => blob.url).filter(url => !!url); // Filter out any undefined URLs
    if (urlsToDelete.length === 0 && blobs.length > 0) {
        console.warn(`deleteRecipeAction: Found ${blobs.length} blobs but could not extract any valid URLs to delete for prefix ${blobFolderPrefix}. Blobs:`, blobs.map(b => b.pathname));
        // This case might happen if blobs don't have URLs for some reason, though unlikely for standard Vercel Blob.
    }
    
    console.log(`deleteRecipeAction: Deleting ${urlsToDelete.length} blobs from Vercel Blob:`, urlsToDelete);
    if (urlsToDelete.length > 0) {
        await del(urlsToDelete);
        console.log(`deleteRecipeAction: Blobs for recipe folder ${blobFolderPrefix} deleted successfully from Vercel Blob.`);
    }


    revalidatePath('/');
    revalidatePath('/recipes');
    revalidatePath(`/recipes/${recipeSlug}`);
    revalidatePath('/label');
    console.log(`deleteRecipeAction: Revalidated paths for slug: ${recipeSlug}`);

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
    // Assuming getRecipeDetails is correctly implemented in lib/recipe-utils.ts
    // to fetch from Vercel Blob
    const { getRecipeDetails } = await import('@/lib/recipe-utils');
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
  console.log(`updateRecipeStepsAction: Called for slug: ${recipeSlug}`);

  if (!recipeSlug || typeof recipeSlug !== 'string' || recipeSlug.trim() === '') {
    console.error(`updateRecipeStepsAction: Invalid recipe slug provided: ${recipeSlug}`);
    return { success: false, error: 'Slug de recette invalide fourni.' };
  }
  if (typeof markdownContent !== 'string') {
    console.error(`updateRecipeStepsAction: Invalid markdown content provided for slug: ${recipeSlug}`);
    return { success: false, error: 'Contenu Markdown invalide fourni.' };
  }

  try {
    const recipeDirPrefix = `Recipes/${recipeSlug}/`;
    console.log(`updateRecipeStepsAction: Listing blobs with prefix: '${recipeDirPrefix}', mode: 'expanded'`);
    // Use mode: 'expanded' for listing direct contents
    const { blobs: existingBlobs } = await list({ prefix: recipeDirPrefix, mode: 'expanded' });
    console.log(`updateRecipeStepsAction: Blobs in ${recipeDirPrefix} (first 10):`, existingBlobs.slice(0,10).map(b => b.pathname));

    let targetMdPathname: string | undefined = undefined;
    const mdBlob = existingBlobs.find(b => {
        if (!b.pathname) return false;
        const lowerPath = b.pathname.toLowerCase();
        if (lowerPath.startsWith(recipeDirPrefix.toLowerCase()) && lowerPath.endsWith('.md')) {
          const relativePath = b.pathname.substring(recipeDirPrefix.length);
          return !relativePath.includes('/'); // Ensure it's a direct child
        }
        return false;
      });

    if (mdBlob) {
        targetMdPathname = mdBlob.pathname;
        console.log(`updateRecipeStepsAction: Found existing MD to overwrite: ${targetMdPathname}`);
    } else {
        console.log(`updateRecipeStepsAction: No existing MD found in ${recipeDirPrefix}. Will create a new file named 'steps.md'.`);
    }

    const blobPathToUpload = targetMdPathname || `Recipes/${recipeSlug}/steps.md`; // Fallback to default name if not found
     if (!targetMdPathname) {
        console.log(`updateRecipeStepsAction: No existing MD found. Creating new at: ${blobPathToUpload}`);
    }

    console.log(`updateRecipeStepsAction: Attempting to upload/update steps.md to Vercel Blob: ${blobPathToUpload}`);
    await put(blobPathToUpload, markdownContent, {
      access: 'public',
      contentType: 'text/markdown',
      addRandomSuffix: false,
    });
    console.log(`updateRecipeStepsAction: File steps.md for recipe "${recipeSlug}" saved to Vercel Blob at ${blobPathToUpload}`);

    revalidatePath(`/recipes/${recipeSlug}`);
    revalidatePath('/recipes');
    revalidatePath('/label');
    console.log(`updateRecipeStepsAction: Revalidated paths for slug: ${recipeSlug}`);

    return { success: true, count: 1 };

  } catch (error) {
    console.error(`updateRecipeStepsAction: Error saving steps.md for recipe ${recipeSlug} to Vercel Blob:`, error);
    return { success: false, error: (error as Error).message || 'Failed to save steps.md to Vercel Blob.' };
  }
}
