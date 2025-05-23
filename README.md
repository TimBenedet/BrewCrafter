
# BrewCrafter - Your Cloud-Based Beer Recipe Book

BrewCrafter is a modern web application designed for homebrewers and craft beer enthusiasts to manage, create, and explore beer recipes. It leverages a cloud-based approach using Vercel Blob for recipe storage, making your recipes accessible anywhere.

## Project Goal

The primary goal of BrewCrafter is to provide a user-friendly and feature-rich platform for:
*   Storing and organizing BeerXML recipes in the cloud (Vercel Blob).
*   Easily viewing detailed recipe information, including ingredients, mash steps, and target statistics.
*   Creating new recipes from scratch using a comprehensive form that generates BeerXML (and optionally Markdown steps) and saves it to Vercel Blob.
*   Editing existing recipes, including their detailed brewing steps (via Markdown).
*   Deleting recipes from Vercel Blob.
*   Calculating essential brewing metrics (ABV, IBU, SG Correction) via client-side calculators.
*   Designing simple, printable labels for your homebrewed beers, with options to pre-fill data from your recipes.

## Features

BrewCrafter offers the following key functionalities:

*   **Recipe Listing (BrewCrafter Recipes Page)**:
    *   Displays all your BeerXML recipes stored in your Vercel Blob.
    *   Each recipe is presented on a card showing key details: Name, Style, Batch Volume, Original Gravity (OG), Final Gravity (FG), Alcohol By Volume (ABV), International Bitterness Units (IBU), and Color (SRM).
    *   Filter recipes by style.
    *   Button to refresh the recipe list.

*   **Recipe Detail View**:
    *   Accessible by clicking "View Recipe" on a recipe card.
    *   Displays comprehensive recipe information parsed from the BeerXML file:
        *   **Header**: Recipe Name, Style, Brewer, and a dynamic `GlassWater` icon.
        *   **Metadata**: Batch Size, Boil Size, Boil Time, Efficiency.
        *   **Target Stats**: OG, FG, ABV, IBU, Color (SRM) with visual progress bars.
        *   **Ingredients**: Detailed lists for Fermentables, Hops, Yeasts, and Miscs, showing amounts, types, usage, etc., presented in an accordion.
        *   **Notes**: Brewer's notes from the recipe, in an accordion section.
    *   **Recipe Steps Tab**: If a corresponding `steps.md` file exists in the recipe's folder on Vercel Blob, it displays formatted brewing steps.
        *   **Important for `steps.md` formatting**: For the steps to be displayed correctly with associated icons, your `.md` file should ideally use the following H2 headers for sections:
            *   `## Brewer's Notes`
            *   `## Mashing`
            *   `## Boil`
            *   `## Whirlpool / Aroma Additions`
            *   `## Cooling`
            *   `## Fermentation`
            *   `## Bottling/Kegging`

*   **Recipe Creation & Editing (Admin Only)**:
    *   **New Recipe Creation**:
        *   A dedicated "New Recipe" page (`/recipes/new`) with a comprehensive, multi-section accordion form.
        *   Allows input for all standard BeerXML fields: General Information, Style Details, Target Statistics (OG, FG, Color SRM - ABV & IBU are automatically calculated), dynamic lists for Fermentables, Hops, Yeasts, and Miscs (with unit selection kg/g), Mash Profile details, Notes, and **detailed brewing steps via an integrated Markdown editor/importer**.
        *   On saving, the recipe is converted to BeerXML format (`recipe.xml`) and the steps to Markdown (`steps.md`). Both files are uploaded to your Vercel Blob store, organized in a folder named after the recipe slug.
    *   **Recipe Editing**:
        *   Accessible via an "Edit Recipe" button on the Recipe Detail View (visible to admins).
        *   Loads the existing recipe data (including `steps.md` content) into the same comprehensive form for modification.
        *   Allows editing all aspects of the recipe, including the Markdown steps.
        *   Saving updates the `recipe.xml` and `steps.md` files in Vercel Blob.

*   **Recipe Import (Admin Only)**:
    *   "Import recipe" button on the "BrewCrafter Recipes" page (visible to admins).
    *   Allows selecting a single BeerXML (`.xml`) file from your local computer.
    *   The imported recipe is then saved to Vercel Blob (`recipe.xml` in its own slug-based folder).
    *   **Clarification on Import Process & Steps**:
        1.  **Import XML First**: Use the "Import recipe" button to upload your `.xml` file. This makes the basic recipe details and ingredients visible in the app.
        2.  **Add/Edit Brewing Steps (Optional but Recommended)**: To see detailed brewing procedures in the "Recipe Steps" tab for an imported recipe, you will need to:
            *   Click "View Recipe" on the imported recipe.
            *   Click "Edit Recipe".
            *   In the "Recipe Steps (Markdown)" section of the form, you can either manually write your steps or import a `.md` file.
            *   Save the recipe. This will create or update the `steps.md` file in that recipe's folder on Vercel Blob.
        *   For newly created recipes via the form, the Markdown steps are handled directly within the form.

*   **Recipe Deletion (Admin Only)**:
    *   Allows deleting recipes directly from the "BrewCrafter Recipes" page (via a delete icon on the recipe card, visible to admins).
    *   A confirmation dialog prevents accidental deletions.
    *   Deletes the entire recipe folder (including `recipe.xml` and any `steps.md`) from Vercel Blob.

*   **BrewCrafter Label (Label Designer)**:
    *   A dedicated page (`/label`) to design simple front and back labels for your beers.
    *   **Controls**:
        *   Load recipe information (Beer Name, IBU, ABV, Description, Ingredients) from existing recipes stored in Vercel Blob.
        *   Manual input for all label fields if not loading from a recipe.
        *   Select bottle volume (33CL or 75CL).
        *   Customize Brewery Name, Tagline.
        *   Upload a background image (with preview and clear option).
        *   Select background and text colors using color pickers.
    *   **Live Previews**:
        *   Separate previews for the front and back labels, designed on a vertical 300x400px canvas.
        *   Front Label: Displays IBU, Alcohol %, Beer Name (Bebas Neue font), and Volume.
        *   Back Label: Displays Description, Ingredients, Brewing Date, and Brewing Location with scrollable content.
        *   Previews reflect background image/color and text color choices.
    *   **Download**: Download the designed front and back labels as PNG images, scaled for ~300 DPI printing based on typical physical label dimensions.

*   **BrewCrafter Calculator**:
    *   A page (`/calculator`) with handy client-side brewing calculators:
        *   **ABV Calculator**: Calculates Alcohol By Volume from Original and Final Gravity.
        *   **IBU Calculator (Tinseth)**: Estimates International Bitterness Units based on hop additions (amount, alpha acid, boil time), original gravity, and boil volume. Allows multiple hop additions.
        *   **SG Temperature Correction**: Corrects hydrometer Specific Gravity readings for temperature (in Celsius).

*   **Admin Mode**:
    *   A simple password-protected admin mode (password set via `NEXT_PUBLIC_ADMIN_PASSWORD` environment variable).
    *   Enables "New recipe", "Import recipe", "Edit Recipe", and "Delete recipe" functionalities.
    *   Login/logout via an icon in the main header.

## Technical Stack

BrewCrafter is built with a modern, JavaScript-focused tech stack:

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **UI Library**: [React](https://reactjs.org/)
*   **Component Library**: [ShadCN UI](https://ui.shadcn.com/) - A collection of beautifully designed, accessible, and customizable components.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
*   **State Management**: React Context (`AuthContext`) for admin authentication.
*   **Form Management**: [React Hook Form](https://react-hook-form.com/) for creating and validating forms.
*   **Schema Validation**: [Zod](https://zod.dev/) for defining and validating data schemas (used with React Hook Form).
*   **Icons**: [Lucide React](https://lucide.dev/) for a consistent and clean icon set.
*   **Image Generation (Labels)**: [html2canvas](https://html2canvas.hertzen.com/) for capturing HTML elements as images.
*   **Cloud Storage**: [Vercel Blob](https://vercel.com/storage/blob) for recipe file storage.
*   **AI Integration (Future Potential)**: [Genkit](https://firebase.google.com/docs/genkit) is included in the dependencies, suggesting potential for future AI-powered features (though not explicitly implemented in the current feature set described).

## Vercel Integration & Recipe Storage

This application is designed to be deployed on [Vercel](https://vercel.com/) and leverages **Vercel Blob** for persistent recipe storage.

*   **Recipe Storage**:
    *   All BeerXML recipe files (`recipe.xml`) and their corresponding Markdown `steps.md` files are stored in your Vercel Blob.
    *   Recipes are organized under a main `Recipes/` prefix.
    *   Each recipe resides in its own sub-folder, named after a sanitized version of the recipe name (slug). For example: `Recipes/my-awesome-ipa/recipe.xml` and `Recipes/my-awesome-ipa/steps.md`.

*   **Reading Recipes**:
    *   The application fetches the list of recipes and their details by querying your Vercel Blob store using the `@vercel/blob` SDK (specifically the `list` function).
    *   Recipe summaries are fetched via an API route (`/api/recipes/summaries`) which calls server-side utility functions in `src/lib/recipe-utils.ts` to list and parse blobs.
    *   Recipe details (including Markdown steps) are fetched similarly when a user navigates to a specific recipe page, by directly reading from Vercel Blob via `src/lib/recipe-utils.ts`.

*   **Writing & Deleting Recipes (Admin Only)**:
    *   When a new recipe is created via the "New Recipe" form or imported, the generated/provided BeerXML (and Markdown steps, if any) are uploaded to Vercel Blob using a Server Action (`addRecipesAction` in `src/app/actions/recipe-actions.ts`) that utilizes the `put` function from `@vercel/blob`.
    *   When a recipe is edited, the updated `recipe.xml` and `steps.md` overwrite the existing files in Vercel Blob.
    *   When a recipe is deleted, a Server Action (`deleteRecipeAction`) uses the `del` function from `@vercel/blob` to remove the corresponding recipe folder and its contents from the Blob store.

*   **Environment Variables**:
    *   A crucial environment variable, `BLOB_READ_WRITE_TOKEN`, must be configured in your Vercel project settings. This token allows the application to authenticate and interact with your Vercel Blob store.
    *   Another variable, `NEXT_PUBLIC_ADMIN_PASSWORD`, must be set to enable admin functionalities.
    *   For local development, these tokens should be made available via a `.env.local` file (pulled using `vercel env pull` or set manually).

This cloud-based storage ensures that your recipes are persisted across deployments and accessible from anywhere.
