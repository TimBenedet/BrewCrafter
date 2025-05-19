import fs from 'fs/promises';
import path from 'path';
import type { BeerXMLRecipe, RecipeSummary, Fermentable, Hop, Yeast, Misc, MashStep } from '@/types/recipe';

const recipesDir = path.join(process.cwd(), 'public', 'Recipes');

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


export async function getRecipeSummaries(): Promise<RecipeSummary[]> {
  try {
    const dirents = await fs.readdir(recipesDir, { withFileTypes: true });
    const xmlFiles = dirents
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.xml'))
      .map(dirent => dirent.name);

    const summaries: RecipeSummary[] = [];
    for (const fileName of xmlFiles) {
      const filePath = path.join(recipesDir, fileName);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const recipeName = extractTagContent(fileContent, 'NAME');
      const recipeType = extractTagContent(fileContent, 'TYPE');
      
      if (recipeName) {
        summaries.push({
          slug: fileName.replace(/\.xml$/, ''),
          name: recipeName,
          type: recipeType || 'N/A',
        });
      }
    }
    return summaries;
  } catch (error) {
    console.error("Failed to read recipe summaries:", error);
    // In a real app, you might want to throw the error or handle it differently
    // For now, return an empty array or a specific error state
    return [];
  }
}

export async function getRecipeDetails(slug: string): Promise<BeerXMLRecipe | null> {
  const filePath = path.join(recipesDir, `${slug}.xml`);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const recipeBlock = extractTagContent(fileContent, 'RECIPE');
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

      // Placeholder for other sections like WATERS, EQUIPMENT if needed
    };
  } catch (error) {
    console.error(`Failed to read or parse recipe ${slug}.xml:`, error);
    return null;
  }
}
