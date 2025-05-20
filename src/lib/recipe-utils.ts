
import type { BeerXMLRecipe, RecipeSummary, Fermentable, Hop, Yeast, Misc, MashStep } from '@/types/recipe';

// Configuration for the GitHub repository
const GITHUB_OWNER = 'TimBenedet';
const GITHUB_REPO = 'BrewRecipes';
const RECIPES_BASE_PATH = 'Recipes'; // The folder in your repo where recipes are stored

// Helper to decode base64
function b64DecodeUnicode(str: string) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

async function fetchFromGitHub(path: string): Promise<any> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/${path}`;
  try {
    const response = await fetch(url, {
      // Add headers if you have a token for higher rate limits, otherwise public API is used
      // headers: {
      //   'Authorization': `token YOUR_GITHUB_TOKEN_HERE` 
      // }
      next: { revalidate: 3600 } // Revalidate data from GitHub API every hour
    });
    if (!response.ok) {
      if (response.status === 404) return null; // File or directory not found
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText} for ${url}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from GitHub API (${url}):`, error);
    throw error;
  }
}

async function getFileContentFromGitHub(filePath: string): Promise<string | null> {
  const fileData = await fetchFromGitHub(`contents/${filePath}`);
  if (!fileData) return null;

  if (fileData.download_url) {
    const downloadResponse = await fetch(fileData.download_url);
    if (!downloadResponse.ok) {
      console.warn(`Failed to download ${fileData.download_url}: Status ${downloadResponse.status}`);
      return null;
    }
    return await downloadResponse.text();
  } else if (fileData.content && fileData.encoding === 'base64') {
    return b64DecodeUnicode(fileData.content);
  }
  console.warn(`Content not found or unsupported format for ${filePath}`);
  return null;
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


export async function getRecipeSummaries(): Promise<RecipeSummary[]> {
  try {
    const repoInfo = await fetchFromGitHub('');
    if (!repoInfo || !repoInfo.default_branch) {
      console.error('Failed to fetch repo info or default branch.');
      return [];
    }
    const defaultBranch = repoInfo.default_branch;

    const treeData = await fetchFromGitHub(`git/trees/${defaultBranch}?recursive=1`);
    if (!treeData || !treeData.tree || !Array.isArray(treeData.tree)) {
      console.error('Failed to fetch repository tree or tree data is invalid.');
      return [];
    }

    const recipeFilesPaths: {path: string, slug: string}[] = treeData.tree
      .filter((item: any) =>
        item.type === 'blob' &&
        item.path.toLowerCase().startsWith(RECIPES_BASE_PATH.toLowerCase() + '/') &&
        item.path.toLowerCase().endsWith('/recipe.xml') // Ensure it's recipe.xml within a subfolder
      )
      .map((item: any) => {
        // Path is like "Recipes/Amber-Ale/recipe.xml"
        // Slug should be "Amber-Ale"
        const pathParts = item.path.split('/');
        // Expected: pathParts[0] = "Recipes", pathParts[1] = "slug", pathParts[2] = "recipe.xml"
        const slug = pathParts.length > 2 ? pathParts[pathParts.length - 2] : 'unknown-slug';
        return { path: item.path, slug: slug };
      });

    const summaries: RecipeSummary[] = [];
    for (const file of recipeFilesPaths) {
      const xmlContent = await getFileContentFromGitHub(file.path);
      if (xmlContent) {
        const summary = parseXmlToRecipeSummary(xmlContent, file.slug);
        if (summary) {
          summaries.push(summary);
        }
      }
    }
    return summaries;

  } catch (error) {
    console.error("Failed to get recipe summaries from GitHub:", error);
    return [];
  }
}

export async function getRecipeDetails(slug: string): Promise<BeerXMLRecipe | null> {
  try {
    const xmlFilePath = `${RECIPES_BASE_PATH}/${slug}/recipe.xml`;
    const mdFilePath = `${RECIPES_BASE_PATH}/${slug}/steps.md`;

    const xmlFileContent = await getFileContentFromGitHub(xmlFilePath);
    if (!xmlFileContent) {
      console.error(`recipe.xml not found for slug ${slug} at ${xmlFilePath}`);
      return null;
    }
    
    let stepsMarkdown: string | undefined = undefined;
    const mdContent = await getFileContentFromGitHub(mdFilePath);
    if (mdContent) {
      stepsMarkdown = mdContent;
    }

    const recipeBlock = extractTagContent(xmlFileContent, 'RECIPE');
    if (!recipeBlock) return null;

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
    console.error(`Failed to get recipe details for slug ${slug} from GitHub:`, error);
    return null;
  }
}
