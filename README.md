
# BrewCrafter - Your Cloud-Based Beer Recipe Book

BrewCrafter is a modern web application designed for homebrewers and craft beer enthusiasts to manage, create, and explore beer recipes. It leverages a cloud-based approach using Vercel Blob for recipe storage and features TOTP-based admin authentication for secure recipe management.

## Project Goal

The primary goal of BrewCrafter is to provide a user-friendly, secure, and feature-rich platform for:
*   Storing and organizing BeerXML recipes in the cloud (Vercel Blob).
*   Easily viewing detailed recipe information, including ingredients, mash steps, and target statistics.
*   Displaying detailed, formatted brewing steps from associated Markdown files.
*   Creating new recipes from scratch using a comprehensive form that generates BeerXML (and optionally Markdown steps) and saves it to Vercel Blob (Admin only).
*   Editing existing recipes, including their detailed brewing steps (via Markdown) (Admin only).
*   Importing BeerXML files from your local computer into Vercel Blob (Admin only).
*   Deleting recipes from Vercel Blob (Admin only).
*   Calculating essential brewing metrics (ABV, IBU, SG Correction) via client-side calculators.
*   Designing simple, printable labels for your homebrewed beers, with options to pre-fill data from your recipes.

## Features

BrewCrafter offers the following key functionalities:

*   **Recipe Listing (BrewCrafter Recipes Page - `/`)**:
    *   Displays all your BeerXML recipes stored in your Vercel Blob.
    *   Each recipe is presented on a card showing key details: Name, Style, Batch Volume, Original Gravity (OG), Final Gravity (FG), Alcohol By Volume (ABV), International Bitterness Units (IBU), and Color (SRM).
    *   Filter recipes by style using a dropdown menu.
    *   Button to refresh the recipe list.
    *   **Admin Controls (Visible when Admin is logged in)**:
        *   "New recipe" button: Navigates to the recipe creation form.
        *   "Import recipe" button: Allows selecting a single BeerXML (`.xml`) file from your local computer for upload to Vercel Blob.

*   **Recipe Detail View (`/recipes/[recipeSlug]`)**:
    *   Accessible by clicking "View Recipe" on a recipe card.
    *   Displays comprehensive recipe information parsed from the `recipe.xml` file stored in Vercel Blob:
        *   **Header**: Recipe Name, Style, Brewer, and a dynamic `GlassWater` icon.
        *   **Metadata Card**: Batch Size, Boil Size, Boil Time, Efficiency.
        *   **Target Stats Card**: OG, FG, ABV, IBU, Color (SRM) with visual progress bars.
        *   **Ingredients**: Detailed lists for Fermentables, Hops, Yeasts, and Miscs, showing amounts, types, usage, etc., presented in an accordion.
        *   **Notes**: Brewer's notes from the recipe, in an accordion section.
    *   **Recipe Steps Tab**:
        *   Displays formatted brewing steps if a corresponding Markdown file (e.g., `steps.md`) exists in the recipe's folder on Vercel Blob.
        *   **Important for `.md` formatting**: For the steps to be displayed correctly with associated icons, your `.md` file should ideally use the following H2 headers for sections:
            *   `## Brewer's Notes` (or similar like "Notes du Brasseur", "Procedure")
            *   `## Mashing`
            *   `## Boil`
            *   `## Whirlpool / Aroma Additions`
            *   `## Cooling`
            *   `## Fermentation`
            *   `## Bottling/Kegging` (or "Bottling", "Kegging")
        *   Content under these headers can include paragraphs and bulleted lists (using `*` or `-`). Text enclosed in `**double asterisks**` will be rendered as bold.
    *   **Admin Controls (Visible when Admin is logged in)**:
        *   A main "Edit" button whose text and behavior adapt:
            *   If on "Recipe Details" tab: Button says "Modifier Détails Recette" and links to the full recipe edit form (`/recipes/[recipeSlug]/edit`).
            *   If on "Recipe Steps" tab: Button says "Modifier Étapes Recette" and enables in-page editing of the Markdown content.
        *   In-page Markdown editor for "Recipe Steps" (when enabled) with "Sauvegarder Étapes" and "Annuler" buttons.
    *   A "Refresh" button to reload the recipe details.

*   **Recipe Creation & Editing (Admin Only)**:
    *   **New Recipe Creation (`/recipes/new`)**:
        *   A dedicated "New Recipe" page with a comprehensive, multi-section accordion form.
        *   Allows input for all standard BeerXML fields: General Information, Style Details, Target Statistics (OG, FG, Color SRM - ABV & IBU are automatically calculated based on inputs), dynamic lists for Fermentables, Hops (with kg/g unit selection), Yeasts, and Miscs, Mash Profile details, Notes, and **detailed brewing steps via an integrated Markdown editor/importer**.
        *   On saving, the recipe is converted to BeerXML format (`recipe.xml`) and the steps to Markdown (`steps.md`). Both files are uploaded to a new folder (named after the recipe slug) in your Vercel Blob store.
    *   **Recipe Editing (`/recipes/[recipeSlug]/edit`)**:
        *   Accessible via the "Modifier Détails Recette" button on the Recipe Detail View (visible to admins).
        *   Loads the existing recipe data (including `steps.md` content) into the same comprehensive form for modification.
        *   Allows editing all aspects of the recipe, including the Markdown steps (which can also be imported or edited directly).
        *   Saving updates the `recipe.xml` and `steps.md` files in Vercel Blob, overwriting the existing ones in that recipe's folder. The recipe slug (folder name on Blob) does not change even if the recipe name is modified.
    *   **Importing `.md` for Steps**: Both the "New Recipe" and "Edit Recipe" forms include a section for "Recipe Steps (Markdown)" with a textarea and an "Importer un fichier .md" button, allowing direct editing or uploading of Markdown content.

*   **Recipe Deletion (Admin Only)**:
    *   Allows deleting recipes directly from the "BrewCrafter Recipes" page (via a delete icon on the recipe card, visible to admins).
    *   A confirmation dialog prevents accidental deletions.
    *   Deletes the entire recipe folder (including `recipe.xml` and `steps.md`) from Vercel Blob.

*   **Clarification on Recipe Import Process & Steps**:
    1.  **Admin Login**: Ensure you are logged in as an admin.
    2.  **Import XML First**: On the "BrewCrafter Recipes" page, use the "Import recipe" button to upload your `.xml` file from your computer. This creates the basic recipe folder and `recipe.xml` on Vercel Blob, making the recipe details and ingredients visible in the app.
    3.  **Add/Edit Brewing Steps (Optional but Recommended)**: To see detailed brewing procedures in the "Recipe Steps" tab for an imported recipe (or to add them to a newly created recipe), you will need to:
        *   Click "View Recipe" on the recipe.
        *   If on the "Recipe Details" tab, click "Modifier Détails Recette". This will take you to the full edit form.
        *   If on the "Recipe Steps" tab, click "Modifier Étapes Recette" for in-page editing, or go to the full edit form.
        *   In the "Recipe Steps (Markdown)" section of the form (or the in-page editor), you can manually write your steps or import a `.md` file.
        *   Save the recipe (or steps). This will create or update the `steps.md` file in that recipe's folder on Vercel Blob.
    *   For recipes created from scratch via the "New Recipe" form, the Markdown steps are handled directly within the form.

*   **BrewCrafter Label (Label Designer - `/label`)**:
    *   A dedicated page to design simple front and back labels for your beers.
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

*   **BrewCrafter Calculator (`/calculator`)**:
    *   A page with handy client-side brewing calculators:
        *   **ABV Calculator**: Calculates Alcohol By Volume from Original and Final Gravity.
        *   **IBU Calculator (Tinseth)**: Estimates International Bitterness Units based on hop additions (amount, alpha acid, boil time), original gravity, and boil volume. Allows multiple hop additions.
        *   **SG Temperature Correction**: Corrects hydrometer Specific Gravity readings for temperature (in Celsius).

*   **Admin Mode**:
    *   TOTP (Time-based One-Time Password) protected admin mode.
    *   Login via an icon in the main header. Requires a 6-digit code from an authenticator app (Google Authenticator, Authy, etc.).
    *   Enables "New recipe", "Import recipe", "Edit Recipe", and "Delete recipe" functionalities.
    *   Logout via an icon in the main header.
    *   **TOTP Setup**:
        *   A secret (`TOTP_SECRET`) must be configured in environment variables.
        *   A dedicated page (`/admin/setup-totp`) allows the admin to scan a QR code (once, for setup) to link their authenticator app. This page is primarily for initial setup and should not be publicly linked.

## Technical Stack

BrewCrafter is built with a modern, JavaScript-focused tech stack:

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **UI Library**: [React](https://reactjs.org/)
*   **Component Library**: [ShadCN UI](https://ui.shadcn.com/) - A collection of beautifully designed, accessible, and customizable components.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
*   **State Management**:
    *   React Context (`AuthContext`) for client-side admin authentication state (persisted in `localStorage`).
    *   React `useState` and `useEffect` for local component state and side effects.
*   **Form Management**: [React Hook Form](https://react-hook-form.com/) for creating and validating forms.
*   **Schema Validation**: [Zod](https://zod.dev/) for defining and validating data schemas (used with React Hook Form).
*   **Icons**: [Lucide React](https://lucide.dev/) for a consistent and clean icon set.
*   **TOTP**:
    *   [Speakeasy](https://github.com/speakeasyjs/speakeasy) for TOTP generation and verification (server-side).
    *   [qrcode](https://github.com/soldair/node-qrcode) for generating QR codes for TOTP setup (server-side).
*   **Image Generation (Labels)**: [html2canvas](https://html2canvas.hertzen.com/) for capturing HTML elements as images.
*   **Cloud Storage**: [Vercel Blob](https://vercel.com/storage/blob) for recipe file storage (`.xml` and `.md`).
*   **AI Integration (Future Potential)**: [Genkit](https://firebase.google.com/docs/genkit) is included in the dependencies, suggesting potential for future AI-powered features (though not actively used in current features).

## Vercel Integration & Recipe Storage

This application is designed to be deployed on [Vercel](https://vercel.com/) and leverages **Vercel Blob** for persistent recipe storage.

*   **Recipe Storage**:
    *   All BeerXML recipe files (`recipe.xml`) and their corresponding Markdown `steps.md` files are stored in your Vercel Blob.
    *   Recipes are organized under a main `Recipes/` prefix (folder).
    *   Each recipe resides in its own sub-folder, named after a sanitized version of the recipe name (slug). For example: `Recipes/my-awesome-ipa/recipe.xml` and `Recipes/my-awesome-ipa/steps.md`.
    *   If a recipe's XML file has a different name on Vercel Blob (e.g., `Recipes/my-awesome-ipa/my-ipa-v2.xml`), the application will attempt to read the first `.xml` file it finds in that recipe's slug folder. Similarly for `.md` files if `steps.md` is not found but another `.md` exists.

*   **Reading Recipes**:
    *   The application fetches the list of recipes and their details by querying your Vercel Blob store using the `@vercel/blob` SDK (specifically the `list` function) via server-side utility functions in `src/lib/recipe-utils.ts`.
    *   Recipe summaries are fetched for the homepage via an API route (`/api/recipes/summaries`).
    *   Recipe details (including Markdown steps) are fetched similarly when a user navigates to a specific recipe page, by directly reading from Vercel Blob via `src/lib/recipe-utils.ts`.
    *   A cache-busting mechanism (`?timestamp=${Date.now()}`) is used when fetching blob content to ensure fresh data is retrieved, especially after updates.

*   **Writing & Deleting Recipes (Admin Only via Server Actions)**:
    *   When a new recipe is created via the "New Recipe" form or imported, the generated/provided BeerXML (`recipe.xml`) and Markdown steps (`steps.md`) are uploaded to Vercel Blob using a Server Action (`addRecipesAction` in `src/app/actions/recipe-actions.ts`). This action utilizes the `put` function from `@vercel/blob` and ensures `addRandomSuffix: false` to maintain consistent file naming.
    *   When a recipe is edited, the updated `recipe.xml` and `steps.md` overwrite the existing files in Vercel Blob in the recipe's specific folder. The system attempts to identify existing `.xml` and `.md` files in the folder to overwrite them, even if their exact names aren't `recipe.xml` or `steps.md` (though these are the default names on creation).
    *   When a recipe is deleted, a Server Action (`deleteRecipeAction`) uses the `del` function from `@vercel/blob` to remove the corresponding recipe folder and all its contents from the Blob store.
    *   Server Actions also call `revalidatePath` to signal Next.js to update cached data for relevant pages.

*   **Environment Variables for Vercel Deployment**:
    *   `BLOB_READ_WRITE_TOKEN`: **Crucial**. This token allows the application to authenticate and interact with your Vercel Blob store. It must be configured in your Vercel project settings.
    *   `TOTP_SECRET`: **Crucial for Admin Login**. A Base32 encoded secret string used for TOTP generation and verification. Generate this once and store it securely.
    *   `NEXT_PUBLIC_TOTP_ISSUER_NAME`: The name displayed in authenticator apps (e.g., "BrewCrafter App").
    *   `NEXT_PUBLIC_TOTP_ACCOUNT_NAME`: The account name displayed in authenticator apps (e.g., "admin").

This cloud-based storage ensures that your recipes are persisted across deployments and accessible from anywhere.

## Local Development

To run BrewCrafter locally:

1.  Clone the repository.
2.  Install dependencies: `npm install` (or `yarn install`).
3.  **Set up Environment Variables**:
    *   Create a file named `.env.local` in the root of your project.
    *   Add the following variables, replacing the placeholder values:
        ```
        BLOB_READ_WRITE_TOKEN=your_vercel_blob_read_write_token_here
        TOTP_SECRET=YOUR_UNIQUE_BASE32_TOTP_SECRET_HERE
        NEXT_PUBLIC_TOTP_ISSUER_NAME="BrewCrafter Local"
        NEXT_PUBLIC_TOTP_ACCOUNT_NAME="localadmin"
        ```
    *   You can obtain `BLOB_READ_WRITE_TOKEN` from your Vercel project's "Storage" tab after linking a Blob store.
    *   For `TOTP_SECRET`, generate a strong Base32 string (e.g., using a local script with `speakeasy` or a trusted online generator). **This secret should be unique and kept secure.**
4.  Run the development server: `npm run dev`.
5.  Open [http://localhost:9002](http://localhost:9002) (or the port specified in `package.json`) in your browser.
6.  **First-time Admin Setup**:
    *   Navigate to `http://localhost:9002/admin/setup-totp`.
    *   Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy).
    *   You can now use the generated codes to log in as admin via the header button.
    *   The TOTP setup page is not linked in the main navigation and is intended for initial admin setup.

In local development, "Import recipe" and "New recipe" will save files to your Vercel Blob store if `BLOB_READ_WRITE_TOKEN` is correctly configured and valid.

---

This README aims to provide a comprehensive overview of the BrewCrafter application.
