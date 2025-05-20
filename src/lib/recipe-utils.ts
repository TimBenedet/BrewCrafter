
import type { BeerXMLRecipe, RecipeSummary, Fermentable, Hop, Yeast, Misc, MashStep } from '@/types/recipe';
import { list } from '@vercel/blob';
// Note: Ensure BLOB_READ_WRITE_TOKEN environment variable is set in your Vercel project for these operations.

// Helper to decode base64 - useful if Vercel Blob client or GitHub API returns base64
function b64DecodeUnicode(str: string) {
  try {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    console.error("Failed to decode base64 string:", e);
    return ""; // Return empty string or handle error as appropriate
  }
}

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
  const recipeBlock = extractTagContent(xmlContent, 'RECIPE');
  if (!recipeBlock) return null;

  const recipeName = extractTagContent(recipeBlock, 'NAME');
  if (!recipeName) return null;

  const recipeType = extractTagContent(recipeBlock, 'TYPE');
  const styleBlock = extractTagContent(recipeBlock, 'STYLE');
  const styleName = styleBlock ? extractTagContent(styleBlock, 'NAME') : undefined;

  const og = extractTagContent(recipeBlock, 'OG');
  const fg = extractTagContent(recipeBlock, 'FG');
  const ibu = extractTagContent(recipeBlock, 'IBU');
  const color = extractTagContent(recipeBlock, 'COLOR');
  const abv = extractTagContent(recipeBlock, 'ABV');
  const batchSize = extractTagContent(recipeBlock, 'BATCH_SIZE');

  return {
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
}

async function fetchBlobContent(blobUrl: string): Promise<string | null> {
  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      console.error(`Failed to fetch blob content from ${blobUrl}: ${response.status} ${response.statusText}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching blob content from ${blobUrl}:`, error);
    return null;
  }
}


export async function getRecipeSummaries(): Promise<RecipeSummary[]> {
  const summaries: RecipeSummary[] = [];
  try {
    // List all blobs under the 'Recipes/' prefix.
    // Vercel Blob does not have true "folders", so we list files and infer structure.
    const { blobs } = await list({ prefix: 'Recipes/' });

    for (const blob of blobs) {
      // Example pathname: "Recipes/my-recipe-slug/recipe.xml"
      const pathParts = blob.pathname.split('/');
      if (pathParts.length === 3 && pathParts[0] === 'Recipes' && pathParts[2].toLowerCase() === 'recipe.xml') {
        const slug = pathParts[1];
        const xmlContent = await fetchBlobContent(blob.url);
        if (xmlContent) {
          const summary = parseXmlToRecipeSummary(xmlContent, slug);
          if (summary) {
            summaries.push(summary);
          }
        }
      }
    }
    return summaries;
  } catch (error) {
    console.error("Failed to get recipe summaries from Vercel Blob:", error);
    if (error instanceof Error && error.message.includes('BLOB_READ_WRITE_TOKEN')) {
        console.warn("BLOB_READ_WRITE_TOKEN environment variable is likely missing or invalid. This is required to list blobs from Vercel Blob.");
    } else if (error instanceof Error && (error.message.includes('forbidden') || error.message.includes('Unauthorized'))) {
        console.warn("Access to Vercel Blob was forbidden or unauthorized. Check token permissions and blob security settings.");
    }
    return []; // Return empty array on error
  }
}

export async function getRecipeDetails(slug: string): Promise<BeerXMLRecipe | null> {
  try {
    const xmlPath = `Recipes/${slug}/recipe.xml`;
    const mdPath = `Recipes/${slug}/steps.md`;

    let xmlContent: string | null = null;
    let stepsMarkdown: string | undefined = undefined;

    // Fetch XML content
    const xmlBlobsResult = await list({ prefix: xmlPath, limit: 1 }); // Add limit 1 as we expect one file
    if (xmlBlobsResult.blobs.length > 0 && xmlBlobsResult.blobs[0].pathname === xmlPath) {
      xmlContent = await fetchBlobContent(xmlBlobsResult.blobs[0].url);
    } else {
      console.warn(`recipe.xml not found in Vercel Blob for slug ${slug} at ${xmlPath}`);
      // Do not return null immediately, allow checking for markdown, or maybe the user just uploaded markdown
    }

    if (!xmlContent) {
       // If XML is crucial and not found, then return null
       console.error(`Critical: recipe.xml content could not be fetched for slug ${slug}.`)
       return null;
    }

    // Fetch Markdown content (optional)
    const mdBlobsResult = await list({ prefix: mdPath, limit: 1 });
    if (mdBlobsResult.blobs.length > 0 && mdBlobsResult.blobs[0].pathname === mdPath) {
      stepsMarkdown = await fetchBlobContent(mdBlobsResult.blobs[0].url) ?? undefined;
    }

    const recipeBlock = extractTagContent(xmlContent, 'RECIPE');
    if (!recipeBlock) {
        console.error(`No <RECIPE> block found in XML for slug ${slug}.`);
        return null;
    }

    const styleBlock = extractTagContent(recipeBlock, 'STYLE');
    const fermentablesBlock = extractTagContent(recipeBlock, 'FERMENTABLES');
    const hopsBlock = extractTagContent(recipeBlock, 'HOPS');
    const yeastsBlock = extractTagContent(recipeBlock, 'YEASTS');
    const miscsBlock = extractTagContent(recipeBlock, 'MISCS');
    const mashBlock = extractTagContent(recipeBlock, 'MASH');
    const mashStepsBlock = mashBlock ? extractTagContent(mashBlock, 'MASH_STEPS') : undefined;

    return {
      name: extractTagContent(recipeBlock, 'NAME') || 'Untitled Recipe',
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
    console.error(`Failed to get recipe details for slug ${slug} from Vercel Blob:`, error);
     if (error instanceof Error && error.message.includes('BLOB_READ_WRITE_TOKEN')) {
        console.warn("BLOB_READ_WRITE_TOKEN environment variable is likely missing or invalid for getRecipeDetails.");
    }
    return null;
  }
}

