
import type { BeerXMLRecipe, RecipeSummary, Fermentable, Hop, Yeast, Misc, MashStep } from '@/types/recipe';
import { list } from '@vercel/blob';

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
  const cacheBustingUrl = `${blobUrl}?timestamp=${Date.now()}`;
  console.log(`fetchBlobContent: Attempting to fetch content from URL: ${cacheBustingUrl}`);
  try {
    const response = await fetch(cacheBustingUrl, { cache: 'no-store' }); // Added { cache: 'no-store' }
    if (!response.ok) {
      console.error(`fetchBlobContent: Failed to fetch blob content from ${cacheBustingUrl}: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`fetchBlobContent: Error body: ${errorText}`);
      return null;
    }
    const textContent = await response.text();
    console.log(`fetchBlobContent: Successfully fetched content from ${cacheBustingUrl} (length: ${textContent.length})`);
    return textContent;
  } catch (error) {
    console.error(`fetchBlobContent: Error fetching blob content from ${cacheBustingUrl}:`, error);
    return null;
  }
}

export async function getRecipeSummaries(): Promise<RecipeSummary[]> {
  console.log("getRecipeSummaries: Attempting to get recipe summaries from Vercel Blob...");
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("getRecipeSummaries: CRITICAL - BLOB_READ_WRITE_TOKEN is not set. Vercel Blob operations will fail. Ensure this is set in your Vercel project environment variables.");
    return [];
  }
  console.log("getRecipeSummaries: BLOB_READ_WRITE_TOKEN is set.");

  const summaries: RecipeSummary[] = [];
  const processedSlugs = new Set<string>();

  try {
    const { blobs } = await list({ prefix: 'Recipes/', mode: 'expanded' }); 
    console.log("getRecipeSummaries: Vercel Blob list response for prefix 'Recipes/':", { blobsCount: blobs.length });
    if (blobs.length > 0) {
        console.log("getRecipeSummaries: Raw blobs list from Vercel (first 10):", blobs.slice(0,10).map(b => b.pathname ));
    }

    if (!blobs || blobs.length === 0) {
        console.warn("getRecipeSummaries: No blobs found matching prefix 'Recipes/' in Vercel Blob. This might mean the prefix is wrong, the Blob store is empty under this prefix, or there's an issue with the token/permissions.");
        return [];
    }
    
    for (const blob of blobs) {
      if (!blob.pathname) {
        console.warn("getRecipeSummaries: Skipping blob with no pathname.");
        continue;
      }
      console.log(`getRecipeSummaries: Processing blob path: ${blob.pathname}`);
      const lowerPathname = blob.pathname.toLowerCase();
      
      if (lowerPathname.startsWith('recipes/') && lowerPathname.endsWith('.xml')) {
        const pathParts = blob.pathname.substring('Recipes/'.length).split('/'); 
        
        if (pathParts.length >= 2) { // e.g., ["slug-name", "recipe-file.xml"] or ["slug-folder", "sub-folder", "file.xml"]
          const slug = pathParts[0]; // The first folder name under Recipes/ is the slug

          if (!slug) { 
            console.warn(`getRecipeSummaries: Skipping blob, cannot derive slug from pathParts[0] for: ${blob.pathname}`);
            continue;
          }

          // Check if we are directly in the slug folder by ensuring only one part after the slug
          // e.g. pathParts = ["my-recipe", "recipe.xml"] -> true
          // e.g. pathParts = ["my-recipe", "another-folder", "recipe.xml"] -> false
          const isDirectXmlInSlugFolder = pathParts.length === 2;

          if (isDirectXmlInSlugFolder && !processedSlugs.has(slug)) {
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
          } else if (!isDirectXmlInSlugFolder) {
            console.log(`getRecipeSummaries: Skipping XML file not directly under a recipe slug folder: ${blob.pathname}`);
          }

        } else {
          console.log(`getRecipeSummaries: Skipping blob, path structure not as expected (e.g., not Recipes/Slug/file.xml): ${blob.pathname}. Path parts length: ${pathParts.length}`);
        }
      }
    }
    console.log(`getRecipeSummaries: Finished processing. Found ${summaries.length} recipe summaries.`);
    return summaries;
  } catch (error) {
    console.error("getRecipeSummaries: Error fetching or processing recipe summaries from Vercel Blob:", error);
    if (error instanceof Error && (error.message.includes('authorization') || error.message.includes('token') || error.message.includes('BLOB_READ_WRITE_TOKEN'))) {
        console.error("getRecipeSummaries: This might be related to an issue with the BLOB_READ_WRITE_TOKEN or permissions.");
    }
    return []; 
  }
}


export async function getRecipeDetails(slug: string): Promise<BeerXMLRecipe | null> {
  console.log(`getRecipeDetails: Attempting to get details for slug: ${slug}`);
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("getRecipeDetails: CRITICAL - BLOB_READ_WRITE_TOKEN is not set. Vercel Blob operations will fail.");
    return null;
  }
  console.log("getRecipeDetails: BLOB_READ_WRITE_TOKEN is set for slug:", slug);

  try {
    const recipeDirectoryPrefix = `Recipes/${slug}/`;
    console.log(`getRecipeDetails: Listing blobs with prefix: '${recipeDirectoryPrefix}' using mode: 'expanded'`);

    const { blobs: dirBlobs } = await list({ prefix: recipeDirectoryPrefix, mode: 'expanded' });
    console.log(`getRecipeDetails: Blob list for recipe directory prefix '${recipeDirectoryPrefix}':`, { count: dirBlobs.length });

    if (dirBlobs.length > 0) {
        console.log("getRecipeDetails: Raw blobs in recipe dir for slug '"+slug+"' (first 10):", dirBlobs.slice(0,10).map(b => ({ pathname: b.pathname, size: b.size, url: b.url }) ));
    } else {
        console.warn(`getRecipeDetails: No blobs found in directory prefix '${recipeDirectoryPrefix}' for slug '${slug}'.`);
    }

    let xmlContent: string | null = null;
    let stepsMarkdown: string | undefined = undefined;
    let actualXmlPath: string | null = null;

    const xmlBlob = dirBlobs.find(b => {
      if (!b.pathname) return false;
      const lowerPathname = b.pathname.toLowerCase();
      if (lowerPathname.startsWith(recipeDirectoryPrefix.toLowerCase()) && lowerPathname.endsWith('.xml')) {
        const relativePath = b.pathname.substring(recipeDirectoryPrefix.length);
        return !relativePath.includes('/'); 
      }
      return false;
    });

    if (xmlBlob) {
      actualXmlPath = xmlBlob.pathname;
      console.log(`getRecipeDetails: Found XML file for slug ${slug}: ${actualXmlPath} with URL ${xmlBlob.url}`);
      xmlContent = await fetchBlobContent(xmlBlob.url);
    } else {
      console.warn(`getRecipeDetails: No XML file found directly in Vercel Blob for slug folder: ${recipeDirectoryPrefix}`);
      const allFilesInDir = dirBlobs.map(b => b.pathname).join(', ');
      console.log(`getRecipeDetails: Files found in ${recipeDirectoryPrefix}: ${allFilesInDir || 'None'}`);
      return null; 
    }

    if (!xmlContent) {
       console.error(`getRecipeDetails: Critical - XML content could not be fetched for slug ${slug} from path ${actualXmlPath}.`);
       return null;
    }
    console.log(`getRecipeDetails: XML content fetched successfully for ${actualXmlPath} (length: ${xmlContent.length})`);
    
    const mdBlob = dirBlobs.find(b => {
        if (!b.pathname) return false;
        const lowerPathname = b.pathname.toLowerCase();
        if (lowerPathname.startsWith(recipeDirectoryPrefix.toLowerCase()) && lowerPathname.endsWith('.md')) {
          const relativePath = b.pathname.substring(recipeDirectoryPrefix.length);
          return !relativePath.includes('/'); 
        }
        return false;
    });
    
    if (mdBlob) {
      console.log(`getRecipeDetails: Found steps.md for slug ${slug}: ${mdBlob.pathname} at URL ${mdBlob.url}`);
      const content = await fetchBlobContent(mdBlob.url);
      if (content) {
        stepsMarkdown = content;
        console.log(`getRecipeDetails: Successfully fetched steps.md content for slug ${slug} (length: ${stepsMarkdown.length})`);
      } else {
        console.warn(`getRecipeDetails: Failed to fetch content for steps.md from ${mdBlob.url} for slug ${slug}, or content was empty.`);
      }
    } else {
      console.log(`getRecipeDetails: No steps.md file found in ${recipeDirectoryPrefix} for slug ${slug}. Searched ${dirBlobs.length} blobs.`);
      const allMdFilesInDir = dirBlobs.filter(b => b.pathname && b.pathname.toLowerCase().endsWith('.md')).map(b => b.pathname).join(', ');
      console.log(`getRecipeDetails: All .md files found in ${recipeDirectoryPrefix}: ${allMdFilesInDir || 'None'}`);
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
        styleGuide: extractTagContent(styleBlock, 'STYLE_GUIDE'),
        type: extractTagContent(styleBlock, 'TYPE') as any || 'Ale',
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
     if (error instanceof Error && (error.message.includes('authorization') || error.message.includes('token') || error.message.includes('BLOB_READ_WRITE_TOKEN'))) {
        console.error("getRecipeDetails: This might be related to an issue with the BLOB_READ_WRITE_TOKEN or permissions.");
    }
    return null;
  }
}

    