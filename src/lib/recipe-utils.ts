
import type { BeerXMLRecipe, RecipeSummary, Fermentable, Hop, Yeast, Misc, MashStep } from '@/types/recipe';
import { list } from '@vercel/blob';

// Ensure BLOB_READ_WRITE_TOKEN environment variable is set in your Vercel project.

// Helper function to safely extract single tag content
const extractTagContent = (xml: string, tagName: string): string | undefined => {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match?.[1]?.trim();
};

// Helper function to extract multiple similar tag blocks
const extractTagBlocks = (xml: string, tagName: string): string[] => {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\/${tagName}>`, 'ig');
  const matches = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1]);
  }
  return matches;
};

const parseFermentables = (xmlBlock: string): Fermentable[] => {
  return extractTagBlocks(xmlBlock, 'FERMENTABLE').map(block => ({
    name: extractTagContent(block, 'NAME') || 'N/A',
    amount: parseFloat(extractTagContent(block, 'AMOUNT') || '0'),
    type: extractTagContent(block, 'TYPE') || 'N/A',
    yieldPercentage: parseFloat(extractTagContent(block, 'YIELD') || '0'),
    color: parseFloat(extractTagContent(block, 'COLOR') || '0'),
  }));
};

const parseHops = (xmlBlock: string): Hop[] => {
  return extractTagBlocks(xmlBlock, 'HOP').map(block => ({
    name: extractTagContent(block, 'NAME') || 'N/A',
    amount: parseFloat(extractTagContent(block, 'AMOUNT') || '0'),
    use: extractTagContent(block, 'USE') || 'N/A',
    time: parseFloat(extractTagContent(block, 'TIME') || '0'),
    alpha: parseFloat(extractTagContent(block, 'ALPHA') || '0'),
    form: extractTagContent(block, 'FORM'),
  }));
};

const parseYeasts = (xmlBlock: string): Yeast[] => {
  return extractTagBlocks(xmlBlock, 'YEAST').map(block => ({
    name: extractTagContent(block, 'NAME') || 'N/A',
    amount: parseFloat(extractTagContent(block, 'AMOUNT') || '0'),
    type: extractTagContent(block, 'TYPE') || 'N/A',
    form: extractTagContent(block, 'FORM') || 'N/A',
    laboratory: extractTagContent(block, 'LABORATORY'),
    productId: extractTagContent(block, 'PRODUCT_ID'),
  }));
};

const parseMiscs = (xmlBlock: string): Misc[] => {
    return extractTagBlocks(xmlBlock, 'MISC').map(block => ({
        name: extractTagContent(block, 'NAME') || 'N/A',
        amount: parseFloat(extractTagContent(block, 'AMOUNT') || '0'),
        use: extractTagContent(block, 'USE') || 'N/A',
        time: parseFloat(extractTagContent(block, 'TIME') || '0'),
        type: extractTagContent(block, 'TYPE') || 'N/A',
    }));
};

const parseMashSteps = (xmlBlock: string): MashStep[] => {
    return extractTagBlocks(xmlBlock, 'MASH_STEP').map(block => ({
        name: extractTagContent(block, 'NAME') || 'N/A',
        type: extractTagContent(block, 'TYPE') || 'N/A',
        stepTemp: parseFloat(extractTagContent(block, 'STEP_TEMP') || '0'),
        stepTime: parseFloat(extractTagContent(block, 'STEP_TIME') || '0'),
        infuseAmount: extractTagContent(block, 'INFUSE_AMOUNT') ? parseFloat(extractTagContent(block, 'INFUSE_AMOUNT')!) : undefined,
    }));
};

export function parseXmlToRecipeSummary(xmlContent: string, slug: string): RecipeSummary | null {
  console.log(`parseXmlToRecipeSummary: Attempting to parse XML for slug: ${slug}`);
  
  const recipeBlock = extractTagContent(xmlContent, 'RECIPE');
  if (!recipeBlock) {
    console.warn(`parseXmlToRecipeSummary: No <RECIPE> block found in XML for slug: ${slug}. XML content (first 500 chars): ${xmlContent.substring(0,500)}`);
    return null;
  }
  console.log(`parseXmlToRecipeSummary: <RECIPE> block found for slug: ${slug}`);

  const recipeName = extractTagContent(recipeBlock, 'NAME');
  if (!recipeName) {
    console.warn(`parseXmlToRecipeSummary: No <NAME> tag found in recipe block for slug: ${slug}. Recipe block (first 500 chars): ${recipeBlock.substring(0,500)}`);
    return null; 
  }
  console.log(`parseXmlToRecipeSummary: <NAME> is "${recipeName}" for slug: ${slug}`);

  const recipeType = extractTagContent(recipeBlock, 'TYPE');
  const styleBlock = extractTagContent(recipeBlock, 'STYLE');
  const styleName = styleBlock ? extractTagContent(styleBlock, 'NAME') : undefined;

  const og = extractTagContent(recipeBlock, 'OG');
  const fg = extractTagContent(recipeBlock, 'FG');
  const ibu = extractTagContent(recipeBlock, 'IBU');
  const color = extractTagContent(recipeBlock, 'COLOR');
  const abv = extractTagContent(recipeBlock, 'ABV');
  const batchSize = extractTagContent(recipeBlock, 'BATCH_SIZE');
  
  console.log(`parseXmlToRecipeSummary: Raw values for slug ${slug} - Type: ${recipeType}, StyleName: ${styleName}, OG: ${og}, FG: ${fg}, IBU: ${ibu}, Color: ${color}, ABV: ${abv}, BatchSize: ${batchSize}`);

  const summary: RecipeSummary = {
    slug: slug,
    name: recipeName,
    type: recipeType || 'N/A',
    styleName: styleName,
    og: og ? parseFloat(og) : undefined,
    fg: fg ? parseFloat(fg) : undefined,
    ibu: ibu ? parseFloat(ibu) : undefined,
    color: color ? parseFloat(color) : undefined,
    abv: abv ? parseFloat(abv) : undefined,
    batchSize: batchSize ? parseFloat(batchSize) : undefined,
  };
  console.log(`parseXmlToRecipeSummary: Successfully parsed summary for slug ${slug}:`, summary.name);
  return summary;
}

async function fetchBlobContent(blobUrl: string): Promise<string | null> {
  console.log(`fetchBlobContent: Attempting to fetch content from URL: ${blobUrl}`);
  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      console.error(`fetchBlobContent: Failed to fetch blob content from ${blobUrl}: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`fetchBlobContent: Error body: ${errorText}`);
      return null;
    }
    const textContent = await response.text();
    console.log(`fetchBlobContent: Successfully fetched content from ${blobUrl} (length: ${textContent.length})`);
    return textContent;
  } catch (error) {
    console.error(`fetchBlobContent: Error fetching blob content from ${blobUrl}:`, error);
    return null;
  }
}

export async function getRecipeSummaries(): Promise<RecipeSummary[]> {
  console.log("getRecipeSummaries: Attempting to get recipe summaries from Vercel Blob...");
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("getRecipeSummaries: CRITICAL - BLOB_READ_WRITE_TOKEN is not set. Vercel Blob operations will fail. Ensure this is set in your Vercel project environment variables.");
    return [];
  }

  const summaries: RecipeSummary[] = [];
  const processedSlugs = new Set<string>();

  try {
    // Use 'Recipes/' with a trailing slash to indicate listing within this "folder".
    // Let Vercel Blob use its default mode for listing.
    const { blobs } = await list({ prefix: 'Recipes/' }); 
    console.log("getRecipeSummaries: Vercel Blob list response for prefix 'Recipes/':", { blobsCount: blobs.length });

    if (!blobs || blobs.length === 0) {
        console.warn("getRecipeSummaries: No blobs found matching prefix 'Recipes/' in Vercel Blob. This might mean the prefix is wrong, the Blob store is empty under this prefix, or there's an issue with the token/permissions.");
        return [];
    }
    
    console.log("getRecipeSummaries: Raw blobs list from Vercel (first 10):", blobs.slice(0,10).map(b => ({ pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt, url: b.url }) ));

    for (const blob of blobs) {
      console.log(`getRecipeSummaries: Processing blob path: ${blob.pathname}`); // e.g., Recipes/Amber-ale/recipe.xml
      
      const lowerPathname = blob.pathname.toLowerCase();
      
      // Ensure it's an XML file and it's within a subfolder of 'recipes/'
      if (lowerPathname.startsWith('recipes/') && lowerPathname.endsWith('.xml')) {
        // Remove 'recipes/' prefix and '/filename.xml' suffix to get potential slug path parts
        const pathWithoutPrefix = blob.pathname.substring('Recipes/'.length); // e.g., Amber-ale/recipe.xml
        const pathParts = pathWithoutPrefix.split('/'); // e.g., ['Amber-ale', 'recipe.xml']
        
        // We expect at least 2 parts here: slugFolderName and filename.xml
        if (pathParts.length >= 2) {
          const slug = pathParts[0]; // The first part is the slug

          if (!slug) { 
            console.warn(`getRecipeSummaries: Skipping blob, cannot derive slug from pathParts[0] for: ${blob.pathname}`);
            continue;
          }

          if (processedSlugs.has(slug)) {
            console.log(`getRecipeSummaries: Slug ${slug} already processed, skipping additional XML file ${blob.pathname} in the same folder.`);
            continue; 
          }

          console.log(`getRecipeSummaries: Identified XML file: ${blob.pathname} for derived slug: ${slug}`);
          
          const xmlContent = await fetchBlobContent(blob.url);
          if (xmlContent) {
            const summary = parseXmlToRecipeSummary(xmlContent, slug); 
            if (summary) {
              summaries.push(summary);
              processedSlugs.add(slug); 
              console.log(`getRecipeSummaries: Successfully parsed and added summary for slug ${slug} from ${blob.pathname}`);
            } else {
              console.warn(`getRecipeSummaries: Failed to parse summary for slug ${slug} from file ${blob.pathname}`);
            }
          } else {
            console.warn(`getRecipeSummaries: Failed to fetch content for XML file ${blob.pathname}`);
          }
        } else {
          console.log(`getRecipeSummaries: Skipping blob, path structure not as expected (e.g., not Recipes/Slug/file.xml): ${blob.pathname}`);
        }
      } else {
        console.log(`getRecipeSummaries: Skipping blob not starting with 'recipes/' or not ending with '.xml': ${blob.pathname}`);
      }
    }
    console.log(`getRecipeSummaries: Finished processing. Found ${summaries.length} recipe summaries.`);
    return summaries;
  } catch (error) {
    console.error("getRecipeSummaries: Error fetching or processing recipe summaries from Vercel Blob:", error);
    if (error instanceof Error && (error.message.includes('authorization') || error.message.includes('token'))) {
        console.error("getRecipeSummaries: This might be related to an issue with the BLOB_READ_WRITE_TOKEN.");
    }
    return []; 
  }
}


export async function getRecipeDetails(slug: string): Promise<BeerXMLRecipe | null> {
  console.log(`getRecipeDetails: Attempting to get details for slug: ${slug}`);
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("getRecipeDetails: CRITICAL - BLOB_READ_WRITE_TOKEN is not set. Vercel Blob operations will fail. Ensure this is set in your Vercel project environment variables.");
    return null;
  }

  try {
    const recipeDirectoryPrefixWithSlash = `Recipes/${slug}/`; // e.g. Recipes/Amber-ale/
    console.log(`getRecipeDetails: Listing blobs with prefix: '${recipeDirectoryPrefixWithSlash}'`);

    let xmlContent: string | null = null;
    let stepsMarkdown: string | undefined = undefined;
    let actualXmlPath: string | null = null;

    // List blobs within the specific recipe slug directory
    const { blobs: dirBlobs } = await list({ prefix: recipeDirectoryPrefixWithSlash }); // Default mode (folded)
    console.log(`getRecipeDetails: Blob list for recipe directory prefix '${recipeDirectoryPrefixWithSlash}':`, { count: dirBlobs.length });
    if (dirBlobs.length > 0) {
        console.log("getRecipeDetails: Raw blobs in recipe dir (first 5):", dirBlobs.slice(0,5).map(b => ({ pathname: b.pathname, size: b.size, url: b.url }) ));
    }

    // Find the first XML file directly within this folder
    const xmlBlob = dirBlobs.find(b => {
        const lowerPathname = b.pathname.toLowerCase();
        if (lowerPathname.startsWith(recipeDirectoryPrefixWithSlash.toLowerCase()) && lowerPathname.endsWith('.xml')) {
            const relativePath = b.pathname.substring(recipeDirectoryPrefixWithSlash.length);
            return relativePath.split('/').length === 1; // Must be directly in the folder, not a sub-sub-folder
        }
        return false;
    });

    if (xmlBlob) {
      actualXmlPath = xmlBlob.pathname;
      console.log(`getRecipeDetails: Found XML file for slug ${slug}: ${actualXmlPath} with URL ${xmlBlob.url}`);
      xmlContent = await fetchBlobContent(xmlBlob.url);
    } else {
      console.warn(`getRecipeDetails: No XML file found directly in Vercel Blob for slug folder: ${recipeDirectoryPrefixWithSlash}`);
      return null; 
    }

    if (!xmlContent) {
       console.error(`getRecipeDetails: Critical - XML content could not be fetched for slug ${slug} from path ${actualXmlPath}.`);
       return null;
    }
    console.log(`getRecipeDetails: XML content fetched successfully for ${actualXmlPath} (length: ${xmlContent.length})`);

    // Find steps.md specifically named 'steps.md'
    const mdPathSpecific = `Recipes/${slug}/steps.md`;
    const mdBlob = dirBlobs.find(b => b.pathname.toLowerCase() === mdPathSpecific.toLowerCase());
    
    if (mdBlob) {
      console.log(`getRecipeDetails: Found steps.md for slug ${slug}: ${mdBlob.pathname} with URL ${mdBlob.url}`);
      stepsMarkdown = await fetchBlobContent(mdBlob.url) ?? undefined;
      if (stepsMarkdown) {
        console.log(`getRecipeDetails: steps.md content fetched (length: ${stepsMarkdown.length})`);
      } else {
        console.warn(`getRecipeDetails: steps.md found at ${mdBlob.pathname} but content could not be fetched.`);
      }
    } else {
      console.log(`getRecipeDetails: No steps.md file found for slug ${slug} at path ${mdPathSpecific}`);
    }
    
    const recipeBlock = extractTagContent(xmlContent, 'RECIPE');
    if (!recipeBlock) {
        console.error(`getRecipeDetails: No <RECIPE> block found in XML for slug ${slug} from file ${actualXmlPath}. XML (first 500): ${xmlContent.substring(0,500)}`);
        return null;
    }

    const styleBlock = extractTagContent(recipeBlock, 'STYLE');
    const fermentablesBlock = extractTagContent(recipeBlock, 'FERMENTABLES');
    const hopsBlock = extractTagContent(recipeBlock, 'HOPS');
    const yeastsBlock = extractTagContent(recipeBlock, 'YEASTS');
    const miscsBlock = extractTagContent(recipeBlock, 'MISCS');
    const mashBlock = extractTagContent(recipeBlock, 'MASH');
    const mashStepsBlock = mashBlock ? extractTagContent(mashBlock, 'MASH_STEPS') : undefined;

    const recipeName = extractTagContent(recipeBlock, 'NAME') || 'Untitled Recipe';
    console.log(`getRecipeDetails: Successfully parsed recipe name "${recipeName}" for slug ${slug}`);

    return {
      name: recipeName,
      version: parseInt(extractTagContent(recipeBlock, 'VERSION') || '1'),
      type: extractTagContent(recipeBlock, 'TYPE') || 'N/A',
      brewer: extractTagContent(recipeBlock, 'BREWER'),
      batchSize: parseFloat(extractTagContent(recipeBlock, 'BATCH_SIZE') || '0'),
      boilSize: parseFloat(extractTagContent(recipeBlock, 'BOIL_SIZE') || '0'),
      boilTime: parseFloat(extractTagContent(recipeBlock, 'BOIL_TIME') || '0'),
      efficiency: extractTagContent(recipeBlock, 'EFFICIENCY') ? parseFloat(extractTagContent(recipeBlock, 'EFFICIENCY')!) : undefined,
      notes: extractTagContent(recipeBlock, 'NOTES'),
      
      og: extractTagContent(recipeBlock, 'OG') ? parseFloat(extractTagContent(recipeBlock, 'OG')!) : undefined,
      fg: extractTagContent(recipeBlock, 'FG') ? parseFloat(extractTagContent(recipeBlock, 'FG')!) : undefined,
      abv: extractTagContent(recipeBlock, 'ABV') ? parseFloat(extractTagContent(recipeBlock, 'ABV')!) : undefined,
      ibu: extractTagContent(recipeBlock, 'IBU') ? parseFloat(extractTagContent(recipeBlock, 'IBU')!) : undefined,
      color: extractTagContent(recipeBlock, 'COLOR') ? parseFloat(extractTagContent(recipeBlock, 'COLOR')!) : undefined,
      
      style: styleBlock ? {
        name: extractTagContent(styleBlock, 'NAME') || 'N/A',
        category: extractTagContent(styleBlock, 'CATEGORY'),
        ogMin: extractTagContent(styleBlock, 'OG_MIN') ? parseFloat(extractTagContent(styleBlock, 'OG_MIN')!) : undefined,
        ogMax: extractTagContent(styleBlock, 'OG_MAX') ? parseFloat(extractTagContent(styleBlock, 'OG_MAX')!) : undefined,
        fgMin: extractTagContent(styleBlock, 'FG_MIN') ? parseFloat(extractTagContent(styleBlock, 'FG_MIN')!) : undefined,
        fgMax: extractTagContent(styleBlock, 'FG_MAX') ? parseFloat(extractTagContent(styleBlock, 'FG_MAX')!) : undefined,
        ibuMin: extractTagContent(styleBlock, 'IBU_MIN') ? parseFloat(extractTagContent(styleBlock, 'IBU_MIN')!) : undefined,
        ibuMax: extractTagContent(styleBlock, 'IBU_MAX') ? parseFloat(extractTagContent(styleBlock, 'IBU_MAX')!) : undefined,
        colorMin: extractTagContent(styleBlock, 'COLOR_MIN') ? parseFloat(extractTagContent(styleBlock, 'COLOR_MIN')!) : undefined,
        colorMax: extractTagContent(styleBlock, 'COLOR_MAX') ? parseFloat(extractTagContent(styleBlock, 'COLOR_MAX')!) : undefined,
        abvMin: extractTagContent(styleBlock, 'ABV_MIN') ? parseFloat(extractTagContent(styleBlock, 'ABV_MIN')!) : undefined,
        abvMax: extractTagContent(styleBlock, 'ABV_MAX') ? parseFloat(extractTagContent(styleBlock, 'ABV_MAX')!) : undefined,
      } : undefined,

      fermentables: fermentablesBlock ? parseFermentables(fermentablesBlock) : [],
      hops: hopsBlock ? parseHops(hopsBlock) : [],
      yeasts: yeastsBlock ? parseYeasts(yeastsBlock) : [],
      miscs: miscsBlock ? parseMiscs(miscsBlock) : [],
      mash: mashBlock ? {
          name: extractTagContent(mashBlock, 'NAME') || 'N/A',
          grainTemp: extractTagContent(mashBlock, 'GRAIN_TEMP') ? parseFloat(extractTagContent(mashBlock, 'GRAIN_TEMP')!) : undefined,
          mashSteps: mashStepsBlock ? parseMashSteps(mashStepsBlock) : []
      } : undefined,
      stepsMarkdown,
    };
  } catch (error) {
    console.error(`getRecipeDetails: Error fetching or processing details for slug ${slug} from Vercel Blob:`, error);
     if (error instanceof Error && (error.message.includes('authorization') || error.message.includes('token'))) {
        console.error("getRecipeDetails: This might be related to an issue with the BLOB_READ_WRITE_TOKEN.");
    }
    return null;
  }
}
