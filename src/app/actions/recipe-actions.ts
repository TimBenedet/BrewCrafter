
'use server';

import { revalidatePath } from 'next/cache';
import { put, del, list } from '@vercel/blob';
import type { BeerXMLRecipe } from '@/types/recipe';

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
  const actionName = originalRecipeSlug ? 'addRecipesAction (EDIT)' : 'addRecipesAction (CREATE/IMPORT)';
  console.log(`${actionName}: Called with originalRecipeSlug: ${originalRecipeSlug}, recipeFiles count: ${recipeFiles.length}`);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(`${actionName}: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.`);
    return { success: false, error: "Server configuration missing for storage." };
  }

  try {
    let filesWritten = 0;
    let finalSlug = '';

    const xmlFileFromInput = recipeFiles.find(file => file.fileName.toLowerCase().endsWith('.xml'));
    const mdFileFromInput = recipeFiles.find(file => file.fileName.toLowerCase() === 'steps.md');

    if (originalRecipeSlug) {
      // EDIT MODE
      finalSlug = originalRecipeSlug;
      console.log(`${actionName}: EDIT mode. Using finalSlug: ${finalSlug}`);

      const recipeDirPrefix = `Recipes/${finalSlug}/`;
      console.log(`${actionName}: Listing blobs with prefix: '${recipeDirPrefix}', mode: 'expanded'`);
      const { blobs: existingBlobs } = await list({ prefix: recipeDirPrefix, mode: 'expanded' });
      console.log(`${actionName}: EDIT mode. Blobs in ${recipeDirPrefix}:`, existingBlobs.map(b => b.pathname));


      let existingXmlPathname: string | undefined = existingBlobs.find(b =>
        b.pathname?.toLowerCase().startsWith(recipeDirPrefix.toLowerCase()) &&
        b.pathname?.toLowerCase().endsWith('.xml') &&
        b.pathname.substring(recipeDirPrefix.length).indexOf('/') === -1 && // Ensure it's a direct child
        b.pathname.substring(recipeDirPrefix.length).length > 0 // Ensure not just the folder itself
      )?.pathname;

      let existingMdPathname: string | undefined = existingBlobs.find(b =>
        b.pathname?.toLowerCase().startsWith(recipeDirPrefix.toLowerCase()) &&
        b.pathname?.toLowerCase().endsWith('.md') &&
        b.pathname.substring(recipeDirPrefix.length).indexOf('/') === -1 && // Ensure it's a direct child
        b.pathname.substring(recipeDirPrefix.length).length > 0 // Ensure not just the folder itself
      )?.pathname;

      if (existingXmlPathname) console.log(`${actionName}: EDIT mode. Found existing XML: ${existingXmlPathname}`);
      if (existingMdPathname) console.log(`${actionName}: EDIT mode. Found existing MD: ${existingMdPathname}`);


      if (xmlFileFromInput) {
        const xmlPathToUpload = existingXmlPathname || `Recipes/${finalSlug}/recipe.xml`;
        console.log(`${actionName}: Attempting to upload XML to Vercel Blob: ${xmlPathToUpload}`);
        await put(xmlPathToUpload, xmlFileFromInput.content, {
          access: 'public',
          contentType: 'application/xml',
          addRandomSuffix: false,
        });
        filesWritten++;
        console.log(`${actionName}: XML file for recipe slug "${finalSlug}" saved/updated to Vercel Blob at ${xmlPathToUpload}`);
      }

      if (mdFileFromInput) {
        const mdPathToUpload = existingMdPathname || `Recipes/${finalSlug}/steps.md`;
        console.log(`${actionName}: Attempting to upload MD (length: ${mdFileFromInput.content.length}) to Vercel Blob: ${mdPathToUpload}`);
        await put(mdPathToUpload, mdFileFromInput.content, {
          access: 'public',
          contentType: 'text/markdown',
          addRandomSuffix: false,
        });
        filesWritten++;
        console.log(`${actionName}: MD file for recipe slug "${finalSlug}" saved/updated to Vercel Blob at ${mdPathToUpload}`);
      } else if (existingMdPathname && !mdFileFromInput) {
        // This case handles if the user clears the markdown content in the form,
        // we should update the MD file on blob with empty content or delete it.
        // For simplicity, let's update with empty content.
        console.log(`${actionName}: MD content cleared in form. Updating existing MD file ${existingMdPathname} with empty content.`);
        await put(existingMdPathname, '', {
            access: 'public',
            contentType: 'text/markdown',
            addRandomSuffix: false,
        });
        filesWritten++; // Count this as a write/update operation
      }


    } else {
      // CREATE/IMPORT MODE
      if (!xmlFileFromInput) {
        console.error(`${actionName}: CREATE/IMPORT mode. No XML file provided.`);
        return { success: false, error: "XML file required to create new recipe." };
      }
      const recipeNameInXml = extractRecipeNameFromXml(xmlFileFromInput.content);
      if (!recipeNameInXml) {
        console.error(`${actionName}: CREATE/IMPORT mode. Could not extract recipe name from XML.`);
        return { success: false, error: "Could not extract recipe name from XML file." };
      }
      finalSlug = sanitizeSlug(recipeNameInXml);
      if (!finalSlug) {
        console.warn(`${actionName}: Could not generate a valid slug for new recipe name "${recipeNameInXml}". Using fallback.`);
        finalSlug = 'untitled-recipe-' + Date.now();
      }
      console.log(`${actionName}: CREATE/IMPORT mode. Derived slug: ${finalSlug} from XML recipe name: "${recipeNameInXml}"`);

      const xmlPathname = `Recipes/${finalSlug}/recipe.xml`;
      console.log(`${actionName}: CREATE/IMPORT mode. Attempting to upload XML to Vercel Blob: ${xmlPathname}`);
      await put(xmlPathname, xmlFileFromInput.content, {
        access: 'public',
        contentType: 'application/xml',
        addRandomSuffix: false,
      });
      filesWritten++;
      console.log(`${actionName}: CREATE/IMPORT mode. XML file for recipe slug "${finalSlug}" saved to Vercel Blob at ${xmlPathname}`);

      if (mdFileFromInput) {
        const mdPathname = `Recipes/${finalSlug}/steps.md`;
        console.log(`${actionName}: CREATE/IMPORT mode. Attempting to upload MD (length: ${mdFileFromInput.content.length}) to Vercel Blob: ${mdPathname}`);
        await put(mdPathname, mdFileFromInput.content, {
          access: 'public',
          contentType: 'text/markdown',
          addRandomSuffix: false,
        });
        filesWritten++;
        console.log(`${actionName}: CREATE/IMPORT mode. MD file for recipe slug "${finalSlug}" saved to Vercel Blob at ${mdPathname}`);
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
      console.log(`${actionName}: Revalidated paths for slug: ${finalSlug}`);
    }

    return { success: true, count: filesWritten, newSlug: finalSlug };

  } catch (error) {
    console.error(`${actionName}: Error saving recipe files to Vercel Blob:`, error);
    return { success: false, error: (error as Error).message || 'Failed to save recipes to Vercel Blob.' };
  }
}

export async function deleteRecipeAction(recipeSlug: string): Promise<ActionResult> {
  console.log(`deleteRecipeAction: Called for slug: ${recipeSlug}`);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("deleteRecipeAction: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.");
    return { success: false, error: "Server configuration missing for storage." };
  }

  try {
    if (!recipeSlug || typeof recipeSlug !== 'string' || recipeSlug.includes('..')) {
      console.error(`deleteRecipeAction: Invalid recipe slug provided: ${recipeSlug}`);
      return { success: false, error: 'Invalid recipe slug provided.' };
    }

    const blobFolderPrefix = `Recipes/${recipeSlug}/`;
    console.log(`deleteRecipeAction: Attempting to list blobs in Vercel Blob folder: ${blobFolderPrefix}`);

    const { blobs } = await list({ prefix: blobFolderPrefix, mode: 'expanded' }); // Use expanded to get full info for deletion

    if (blobs.length === 0) {
      console.warn(`deleteRecipeAction: No blobs found with prefix ${blobFolderPrefix} to delete.`);
    } else {
        const urlsToDelete = blobs.map(blob => blob.url).filter(url => !!url);
        if (urlsToDelete.length === 0 && blobs.length > 0) {
            console.warn(`deleteRecipeAction: Found ${blobs.length} blobs but could not extract any valid URLs for prefix ${blobFolderPrefix}. Blobs pathnames:`, blobs.map(b => b.pathname));
        }
        if (urlsToDelete.length > 0) {
            console.log(`deleteRecipeAction: Deleting ${urlsToDelete.length} blobs from Vercel Blob:`, urlsToDelete);
            await del(urlsToDelete);
            console.log(`deleteRecipeAction: Blobs for recipe folder ${blobFolderPrefix} deleted successfully from Vercel Blob.`);
        }
    }

    revalidatePath('/');
    revalidatePath('/recipes');
    revalidatePath(`/recipes/${recipeSlug}`);
    revalidatePath('/label');
    console.log(`deleteRecipeAction: Revalidated paths for slug: ${recipeSlug}`);

    return { success: true, count: blobs.length };

  } catch (error) {
    console.error('deleteRecipeAction: Error deleting recipe folder from Vercel Blob:', error);
    return { success: false, error: (error as Error).message || 'Failed to delete recipe from Vercel Blob.' };
  }
}

export async function getRecipeDetailsAction(slug: string): Promise<ActionResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.NODE_ENV !== 'development') {
    console.error("getRecipeDetailsAction: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.");
    if (process.env.NODE_ENV === 'production') {
        return { success: false, error: "Server configuration missing for data access." };
    }
  }
  try {
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
  const actionName = 'updateRecipeStepsAction';
  console.log(`${actionName}: Called for slug: ${recipeSlug}, markdownContent length: ${markdownContent.length}`);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(`${actionName}: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.`);
    return { success: false, error: "Server configuration missing for storage." };
  }

  if (!recipeSlug || typeof recipeSlug !== 'string' || recipeSlug.trim() === '') {
    console.error(`${actionName}: Invalid recipe slug provided: ${recipeSlug}`);
    return { success: false, error: 'Invalid recipe slug provided.' };
  }
  if (typeof markdownContent !== 'string') {
    console.error(`${actionName}: Invalid markdown content provided for slug: ${recipeSlug}`);
    return { success: false, error: 'Invalid Markdown content provided.' };
  }

  try {
    const recipeDirPrefix = `Recipes/${recipeSlug}/`;
    console.log(`${actionName}: Listing blobs with prefix: '${recipeDirPrefix}', mode: 'expanded'`);
    const { blobs: existingBlobsInDir } = await list({ prefix: recipeDirPrefix, mode: 'expanded' });
    console.log(`${actionName}: Blobs in '${recipeDirPrefix}':`, existingBlobsInDir.map(b => b.pathname));

    let targetMdPathname: string | undefined = existingBlobsInDir.find(b =>
        b.pathname?.toLowerCase().startsWith(recipeDirPrefix.toLowerCase()) &&
        b.pathname?.toLowerCase().endsWith('.md') &&
        b.pathname.substring(recipeDirPrefix.length).indexOf('/') === -1 && // Ensure it's a direct child
        b.pathname.substring(recipeDirPrefix.length).length > 0 // Ensure not just the folder itself
    )?.pathname;


    if (targetMdPathname) {
        console.log(`${actionName}: Found existing MD to overwrite: ${targetMdPathname}`);
    } else {
        console.log(`${actionName}: No existing MD found directly in ${recipeDirPrefix}. Will create a new file named 'steps.md'.`);
        targetMdPathname = `Recipes/${recipeSlug}/steps.md`; // Default to steps.md if none found
    }

    console.log(`${actionName}: Attempting to upload/update MD (length: ${markdownContent.length}) to Vercel Blob: ${targetMdPathname}`);
    await put(targetMdPathname, markdownContent, {
      access: 'public',
      contentType: 'text/markdown',
      addRandomSuffix: false,
    });
    console.log(`${actionName}: File MD for recipe "${recipeSlug}" saved to Vercel Blob at ${targetMdPathname}`);

    revalidatePath(`/recipes/${recipeSlug}`);
    revalidatePath('/recipes');
    revalidatePath('/label');
    console.log(`${actionName}: Revalidated paths for slug: ${recipeSlug}`);

    return { success: true, count: 1 };

  } catch (error) {
    console.error(`${actionName}: Error saving MD for recipe ${recipeSlug} to Vercel Blob:`, error);
    return { success: false, error: (error as Error).message || 'Failed to save MD to Vercel Blob.' };
  }
}
