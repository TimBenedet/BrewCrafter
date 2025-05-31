
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

const parseAndCleanFloat = (val: string | undefined): number | undefined => {
  if (typeof val !== 'string' || val.trim() === '') {
    return undefined;
  }
  // Attempt to extract the first valid floating point or integer number from the string
  // This regex looks for an optional sign, then digits, optionally a decimal point followed by more digits.
  const match = val.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (match && match[0]) {
    const num = parseFloat(match[0]);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
};

export function parseXmlToRecipeSummary(xmlContent: string, slug: string): RecipeSummary | null {
  console.log(`parseXmlToRecipeSummary: Attempting to parse XML for slug: '${slug}'. XML (first 300 chars): ${xmlContent.substring(0,300)}`);
  
  const recipeBlock = extractTagContent(xmlContent, 'RECIPE');
  if (!recipeBlock) {
    console.warn(`parseXmlToRecipeSummary: No <RECIPE> block found in XML for slug: '${slug}'.`);
    return null;
  }
  console.log(`parseXmlToRecipeSummary: <RECIPE> block found for slug: '${slug}'`);

  const recipeName = extractTagContent(recipeBlock, 'NAME');
  console.log(`parseXmlToRecipeSummary: Extracted recipeName: "${recipeName}" for slug: '${slug}'`);
  if (!recipeName) {
    console.warn(`parseXmlToRecipeSummary: No <NAME> tag found in recipe block for slug: '${slug}'. Cannot create summary.`);
    return null; 
  }

  const recipeType = extractTagContent(recipeBlock, 'TYPE');
  const styleBlock = extractTagContent(recipeBlock, 'STYLE');
  const styleName = styleBlock ? extractTagContent(styleBlock, 'NAME') : undefined;

  const ogRaw = extractTagContent(recipeBlock, 'OG');
  const fgRaw = extractTagContent(recipeBlock, 'FG');
  const ibuRaw = extractTagContent(recipeBlock, 'IBU');
  const colorRaw = extractTagContent(recipeBlock, 'COLOR');
  const abvRaw = extractTagContent(recipeBlock, 'ABV');
  const batchSizeRaw = extractTagContent(recipeBlock, 'BATCH_SIZE');
  
  console.log(`parseXmlToRecipeSummary for slug '${slug}': Raw extracted strings - ABV: '${abvRaw}', IBU: '${ibuRaw}'`);

  const summary: RecipeSummary = {
    slug: slug, // slug here is the folder name
    name: recipeName,
    type: recipeType || 'N/A',
    styleName: styleName,
    og: parseAndCleanFloat(ogRaw),
    fg: parseAndCleanFloat(fgRaw),
    ibu: parseAndCleanFloat(ibuRaw),
    color: parseAndCleanFloat(colorRaw),
    abv: parseAndCleanFloat(abvRaw),
    batchSize: parseAndCleanFloat(batchSizeRaw),
  };
  console.log(`parseXmlToRecipeSummary: Successfully parsed summary for slug '${slug}': Name: "${summary.name}", Type: ${summary.type}, Style: ${summary.styleName}, ABV: ${summary.abv}, IBU: ${summary.ibu}`);
  return summary;
}

async function fetchBlobContent(blobUrl: string): Promise<string | null> {
  const cacheBustingUrl = `${blobUrl}?timestamp=${Date.now()}`;
  console.log(`fetchBlobContent: Attempting to fetch content from URL: ${cacheBustingUrl}`);
  try {
    const response = await fetch(cacheBustingUrl, { cache: 'no-store' }); 
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
  const processedSlugs = new Set<string>(); // To avoid processing the same recipe folder multiple times

  try {
    const { blobs, folders } = await list({ prefix: 'Recipes/', mode: 'expanded' }); 
    console.log("getRecipeSummaries: Vercel Blob list response for prefix 'Recipes/':", { blobsCount: blobs.length, foldersCount: folders?.length });
    
    if (blobs.length > 0) {
        console.log("getRecipeSummaries: Raw blobs list from Vercel (first 10 of " + blobs.length + "):", blobs.slice(0,10).map(b => ({pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt })) );
    }
    if (folders && folders.length > 0) {
        console.log("getRecipeSummaries: Folders list from Vercel (first 10 of " + folders.length + "):", folders.slice(0,10));
    }

    if (!blobs || blobs.length === 0) {
        console.warn("getRecipeSummaries: No blobs found matching prefix 'Recipes/' in Vercel Blob. This might mean the prefix is wrong, the Blob store is empty under this prefix, or there's an issue with the token/permissions.");
        return [];
    }
    
    for (const blob of blobs) {
      if (!blob.pathname) {
        console.warn("getRecipeSummaries: Skipping blob with no pathname.", blob);
        continue;
      }
      console.log(`getRecipeSummaries: Processing blob path: ${blob.pathname}`);
      const lowerPathname = blob.pathname.toLowerCase();
      
      if (lowerPathname.startsWith('recipes/') && lowerPathname.endsWith('.xml')) {
        const pathSegments = blob.pathname.substring('Recipes/'.length).split('/'); 
        console.log(`getRecipeSummaries: Path segments for ${blob.pathname}:`, pathSegments);
        
        if (pathSegments.length === 2) { 
          const slugFolderName = pathSegments[0]; 
          const fileName = pathSegments[1];
          console.log(`getRecipeSummaries: Potential recipe found. Folder (slug): '${slugFolderName}', File: '${fileName}'`);

          if (!slugFolderName) { 
            console.warn(`getRecipeSummaries: Skipping blob, derived slugFolderName is empty for: ${blob.pathname}`);
            continue;
          }

          if (!processedSlugs.has(slugFolderName)) {
            console.log(`getRecipeSummaries: First time seeing slugFolderName: '${slugFolderName}'. Attempting to parse XML file: ${blob.pathname}`);
            
            const xmlContent = await fetchBlobContent(blob.url);
            if (xmlContent) {
              const summary = parseXmlToRecipeSummary(xmlContent, slugFolderName); 
              if (summary) {
                summaries.push(summary);
                processedSlugs.add(slugFolderName); 
                console.log(`getRecipeSummaries: Successfully parsed and added summary for slug (folder) '${slugFolderName}' from ${blob.pathname}`);
              } else {
                console.warn(`getRecipeSummaries: Failed to parse summary for slug (folder) '${slugFolderName}' from file ${blob.pathname}. parseXmlToRecipeSummary returned null.`);
              }
            } else {
              console.warn(`getRecipeSummaries: Failed to fetch content for XML file ${blob.pathname}`);
            }
          } else {
            console.log(`getRecipeSummaries: SlugFolderName '${slugFolderName}' already processed. Skipping additional XML file: ${blob.pathname}`);
          }
        } else {
          console.log(`getRecipeSummaries: Skipping blob, path structure not 'Recipes/Slug/file.xml': ${blob.pathname}. Segments count: ${pathSegments.length}`);
        }
      } else {
        console.log(`getRecipeSummaries: Skipping non-XML file or file not in 'Recipes/' prefix: ${blob.pathname}`);
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
      batchSize: parseAndCleanFloat(extractTagContent(recipeBlock, 'BATCH_SIZE')) || 0,
      boilSize: parseAndCleanFloat(extractTagContent(recipeBlock, 'BOIL_SIZE')) || 0,
      boilTime: parseAndCleanFloat(extractTagContent(recipeBlock, 'BOIL_TIME')) || 0,
      efficiency: parseAndCleanFloat(extractTagContent(recipeBlock, 'EFFICIENCY')),
      notes: extractTagContent(recipeBlock, 'NOTES'),
      
      og: parseAndCleanFloat(extractTagContent(recipeBlock, 'OG')),
      fg: parseAndCleanFloat(extractTagContent(recipeBlock, 'FG')),
      abv: parseAndCleanFloat(extractTagContent(recipeBlock, 'ABV')),
      ibu: parseAndCleanFloat(extractTagContent(recipeBlock, 'IBU')),
      color: parseAndCleanFloat(extractTagContent(recipeBlock, 'COLOR')),
      
      style: styleBlock ? {
        name: extractTagContent(styleBlock, 'NAME') || 'N/A',
        category: extractTagContent(styleBlock, 'CATEGORY'),
        styleGuide: extractTagContent(styleBlock, 'STYLE_GUIDE'),
        type: extractTagContent(styleBlock, 'TYPE') as any || 'Ale',
        ogMin: parseAndCleanFloat(extractTagContent(styleBlock, 'OG_MIN')),
        ogMax: parseAndCleanFloat(extractTagContent(styleBlock, 'OG_MAX')),
        fgMin: parseAndCleanFloat(extractTagContent(styleBlock, 'FG_MIN')),
        fgMax: parseAndCleanFloat(extractTagContent(styleBlock, 'FG_MAX')),
        ibuMin: parseAndCleanFloat(extractTagContent(styleBlock, 'IBU_MIN')),
        ibuMax: parseAndCleanFloat(extractTagContent(styleBlock, 'IBU_MAX')),
        colorMin: parseAndCleanFloat(extractTagContent(styleBlock, 'COLOR_MIN')),
        colorMax: parseAndCleanFloat(extractTagContent(styleBlock, 'COLOR_MAX')),
        abvMin: parseAndCleanFloat(extractTagContent(styleBlock, 'ABV_MIN')),
        abvMax: parseAndCleanFloat(extractTagContent(styleBlock, 'ABV_MAX')),
      } : undefined,

      fermentables: fermentablesBlock ? parseFermentables(fermentablesBlock) : [],
      hops: hopsBlock ? parseHops(hopsBlock) : [],
      yeasts: yeastsBlock ? parseYeasts(yeastsBlock) : [],
      miscs: miscsBlock ? parseMiscs(miscsBlock) : [],
      mash: mashBlock ? {
          name: extractTagContent(mashBlock, 'NAME') || 'N/A',
          grainTemp: parseAndCleanFloat(extractTagContent(mashBlock, 'GRAIN_TEMP')),
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
    

    