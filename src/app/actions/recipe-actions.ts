
'use server';

import { revalidatePath } from 'next/cache';
import { put, del, list } from '@vercel/blob';
import type { BeerXMLRecipe } from '@/types/recipe';
import { getRecipeDetails } from '@/lib/recipe-utils'; // Assuming this is for a different action or not used here for file content

export interface ActionResult {
  success: boolean;
  count?: number;
  error?: string;
  recipe?: BeerXMLRecipe | null;
  newSlug?: string;
}

interface RecipeFile {
  fileName: string; // This is the name from the form/upload, e.g., "My Recipe.xml" or "steps.md"
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
    let recipeNameInXml = '';

    const xmlFileFromInput = recipeFiles.find(file => file.fileName.toLowerCase().endsWith('.xml'));
    const mdFileFromInput = recipeFiles.find(file => file.fileName.toLowerCase() === 'steps.md');

    if (xmlFileFromInput) {
      recipeNameInXml = extractRecipeNameFromXml(xmlFileFromInput.content) || 'untitled-recipe';
    }

    if (originalRecipeSlug) {
      // EDIT MODE
      finalSlug = originalRecipeSlug;
      console.log(`addRecipesAction: EDIT mode. Using original slug: ${finalSlug} for recipe name in XML: "${recipeNameInXml || '(XML not being updated)'}"`);
      
      const recipeDirPrefix = `Recipes/${finalSlug}/`;
      const { blobs: existingBlobs } = await list({ prefix: recipeDirPrefix, mode: 'folded' });
      console.log(`addRecipesAction: EDIT mode. Blobs in ${recipeDirPrefix}:`, existingBlobs.map(b => b.pathname));

      let existingXmlPathname: string | undefined = undefined;
      let existingMdPathname: string | undefined = undefined;

      for (const blob of existingBlobs) {
        if (!blob.pathname) continue; // Defensive check

        // Ensure the blob is directly in the folder, not a sub-folder
        const relativePath = blob.pathname.substring(recipeDirPrefix.length);
        if (relativePath.includes('/')) continue; 

        const lowerPathname = blob.pathname.toLowerCase();

        if (!existingXmlPathname && lowerPathname.endsWith('.xml')) {
          existingXmlPathname = blob.pathname;
          console.log(`addRecipesAction: EDIT mode. Found existing XML: ${existingXmlPathname}`);
        }
        if (!existingMdPathname && lowerPathname.endsWith('.md')) {
          existingMdPathname = blob.pathname;
          console.log(`addRecipesAction: EDIT mode. Found existing MD: ${existingMdPathname}`);
        }
        if (existingXmlPathname && existingMdPathname) break; // Found both
      }

      // Upload XML file if present in input
      if (xmlFileFromInput) {
        const xmlPathToUpload = existingXmlPathname || `Recipes/${finalSlug}/recipe.xml`;
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

  try {
    if (!recipeSlug || typeof recipeSlug !== 'string' || recipeSlug.includes('..')) {
      return { success: false, error: 'Invalid recipe slug provided.' };
    }

    const blobFolderPrefix = `Recipes/${recipeSlug}/`;
    console.log(`deleteRecipeAction: Attempting to delete folder from Vercel Blob: ${blobFolderPrefix}`);

    const { blobs } = await list({ prefix: blobFolderPrefix, mode: 'folded' }); 

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

  try {
    const recipeDirPrefix = `Recipes/${recipeSlug}/`;
    const { blobs: existingBlobs } = await list({ prefix: recipeDirPrefix, mode: 'folded' });
    console.log(`updateRecipeStepsAction: Blobs in ${recipeDirPrefix}:`, existingBlobs.map(b => b.pathname));
    
    let targetMdPathname: string | undefined = undefined;
    for (const blob of existingBlobs) {
      if (!blob.pathname) continue; // Defensive check

      const relativePath = blob.pathname.substring(recipeDirPrefix.length);
      if (relativePath.includes('/')) continue; 

      if (blob.pathname.toLowerCase().endsWith('.md')) {
        targetMdPathname = blob.pathname;
        console.log(`updateRecipeStepsAction: Found existing MD to overwrite: ${targetMdPathname}`);
        break; 
      }
    }

    const blobPathToUpload = targetMdPathname || `Recipes/${recipeSlug}/steps.md`;
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

    return { success: true, count: 1 };

  } catch (error) {
    console.error(`updateRecipeStepsAction: Error saving steps.md for recipe ${recipeSlug} to Vercel Blob:`, error);
    return { success: false, error: (error as Error).message || 'Failed to save steps.md to Vercel Blob.' };
  }
}
    

    
