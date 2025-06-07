
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

  const recipeName = extractTagContent(recipeBlock, 'NAME');
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
  const statusRaw = extractTagContent(recipeBlock, 'BREWCRAFTER_STATUS') as 'completed' | 'in_progress' | undefined;
  
  const status = (statusRaw === 'completed' || statusRaw === 'in_progress') ? statusRaw : 'in_progress';

  const summary: RecipeSummary = {
    slug: slug,
    name: recipeName,
    type: recipeType || 'N/A',
    styleName: styleName,
    og: parseAndCleanFloat(ogRaw),
    fg: parseAndCleanFloat(fgRaw),
    ibu: parseAndCleanFloat(ibuRaw),
    color: parseAndCleanFloat(colorRaw),
    abv: parseAndCleanFloat(abvRaw),
    batchSize: parseAndCleanFloat(batchSizeRaw),
    status: status,
  };
  console.log(`parseXmlToRecipeSummary: Successfully parsed summary for slug '${slug}': Name: "${summary.name}", Status: ${summary.status}`);
  return summary;
}

async function fetchBlobContent(blobUrl: string): Promise<string | null> {
  const cacheBustingUrl = `${blobUrl}?timestamp=${Date.now()}`;
  try {
    const response = await fetch(cacheBustingUrl, { cache: 'no-store' }); 
    if (!response.ok) {
      console.error(`fetchBlobContent: Failed to fetch blob content from ${cacheBustingUrl}: ${response.status} ${response.statusText}`);
      return null;
    }
    const textContent = await response.text();
    return textContent;
  } catch (error) {
    console.error(`fetchBlobContent: Error fetching blob content from ${cacheBustingUrl}:`, error);
    return null;
  }
}

export async function getRecipeSummaries(): Promise<RecipeSummary[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("getRecipeSummaries: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.");
    return [];
  }

  const summaries: RecipeSummary[] = [];
  const processedSlugs = new Set<string>(); 

  try {
    const { blobs } = await list({ prefix: 'Recipes/', mode: 'expanded' }); 
    
    for (const blob of blobs) {
      if (!blob.pathname) continue;
      
      const lowerPathname = blob.pathname.toLowerCase();
      
      if (lowerPathname.startsWith('recipes/') && lowerPathname.endsWith('.xml')) {
        const pathSegments = blob.pathname.substring('Recipes/'.length).split('/'); 
        
        if (pathSegments.length === 2) { 
          const slugFolderName = pathSegments[0]; 
          
          if (!slugFolderName) continue;

          if (!processedSlugs.has(slugFolderName)) {
            const xmlContent = await fetchBlobContent(blob.url);
            if (xmlContent) {
              const summary = parseXmlToRecipeSummary(xmlContent, slugFolderName); 
              if (summary) {
                summaries.push(summary);
                processedSlugs.add(slugFolderName); 
              }
            }
          }
        }
      }
    }
    return summaries;
  } catch (error) {
    console.error("getRecipeSummaries: Error fetching or processing recipe summaries from Vercel Blob:", error);
    return []; 
  }
}

export async function getRecipeDetails(slug: string): Promise<BeerXMLRecipe | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("getRecipeDetails: CRITICAL - BLOB_READ_WRITE_TOKEN is not set.");
    return null;
  }

  try {
    const recipeDirectoryPrefix = `Recipes/${slug}/`;
    const { blobs: dirBlobs } = await list({ prefix: recipeDirectoryPrefix, mode: 'expanded' });

    let xmlContent: string | null = null;
    let stepsMarkdown: string | undefined = undefined;
    
    const xmlBlob = dirBlobs.find(b => b.pathname?.toLowerCase().startsWith(recipeDirectoryPrefix.toLowerCase()) && b.pathname.toLowerCase().endsWith('.xml') && !b.pathname.substring(recipeDirectoryPrefix.length).includes('/'));

    if (xmlBlob) {
      xmlContent = await fetchBlobContent(xmlBlob.url);
    } else {
      return null; 
    }

    if (!xmlContent) return null;
    
    const mdBlob = dirBlobs.find(b => b.pathname?.toLowerCase().startsWith(recipeDirectoryPrefix.toLowerCase()) && b.pathname.toLowerCase().endsWith('.md') && !b.pathname.substring(recipeDirectoryPrefix.length).includes('/'));
    
    if (mdBlob) {
      stepsMarkdown = await fetchBlobContent(mdBlob.url) || undefined;
    }
    
    const recipeBlock = extractTagContent(xmlContent, 'RECIPE');
    if (!recipeBlock) return null;

    const styleBlock = extractTagContent(recipeBlock, 'STYLE');
    const fermentablesBlock = extractTagContent(recipeBlock, 'FERMENTABLES');
    const hopsBlock = extractTagContent(recipeBlock, 'HOPS');
    const yeastsBlock = extractTagContent(recipeBlock, 'YEASTS');
    const miscsBlock = extractTagContent(recipeBlock, 'MISCS');
    const mashBlock = extractTagContent(recipeBlock, 'MASH');
    const mashStepsBlock = mashBlock ? extractTagContent(mashBlock, 'MASH_STEPS') : undefined;
    const statusRaw = extractTagContent(recipeBlock, 'BREWCRAFTER_STATUS') as 'completed' | 'in_progress' | undefined;
    const status = (statusRaw === 'completed' || statusRaw === 'in_progress') ? statusRaw : 'in_progress';

    return {
      name: extractTagContent(recipeBlock, 'NAME') || 'Untitled Recipe',
      version: parseInt(extractTagContent(recipeBlock, 'VERSION') || '1'),
      type: extractTagContent(recipeBlock, 'TYPE') || 'N/A',
      brewer: extractTagContent(recipeBlock, 'BREWER'),
      status: status,
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
    return null;
  }
}
