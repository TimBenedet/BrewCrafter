
# BrewCrafter - Your Cloud-Based Beer Recipe Book

## Project Overview

BrewCrafter is a modern web application designed for homebrewers and craft beer enthusiasts to manage, create, and explore beer recipes. It leverages a cloud-based approach using Vercel Blob for recipe storage and features TOTP-based admin authentication for secure recipe management.

BrewCrafter aims to provide a user-friendly, secure, and feature-rich platform for:
* Storing and organizing BeerXML recipes in the cloud (Vercel Blob).
* Easily viewing detailed recipe information, including ingredients, mash steps, and target statistics.
* Displaying detailed brewing steps from associated Markdown files.
* Creating new recipes from scratch and editing existing ones (Admin only).
* Importing BeerXML files (Admin only).
* Deleting recipes (Admin only).
* Calculating essential brewing metrics (ABV, IBU, SG Correction).
* Designing simple, printable labels for homemade beers.

## Detailed Documentation

For more detailed information, including local development setup and instructions for forking and deploying your own instance, please refer to the language-specific READMEs:

*   **Français (French)**: [README-FR.md](./README-FR.md)
*   **English (UK)**: [README-UK.md](./README-UK.md) (This file currently contains the French content and needs translation)

## Features

*   **Recipe Listing & Management**: View all recipes from Vercel Blob, filter by style, refresh list. Admin controls for creating new recipes, importing local BeerXML files to Vercel Blob, and deleting recipes.
*   **Detailed Recipe View**: Comprehensive display of recipe metadata, target stats, ingredients (accordion), brewer's notes (accordion), and detailed brewing steps (from associated Markdown files, rendered in a separate tab). Admins can edit recipe details (full form) or recipe steps (in-place Markdown editor).
*   **Recipe Creation & Editing (Admin Only)**: Full-featured form for creating new recipes or editing existing ones. Includes all standard BeerXML fields, dynamic ingredient lists, and an integrated Markdown editor/importer for brewing steps. Saves/updates `recipe.xml` and `steps.md` to Vercel Blob.
*   **Label Designer**: Create custom front and back labels for your beers, with options to pre-fill data from existing recipes. Customize text, colors, background image, and download as PNG.
*   **Brewing Calculators**: Client-side calculators for ABV, IBU (Tinseth), and SG Temperature Correction.
*   **Admin Mode**: Secure admin access via TOTP (Time-based One-Time Password) for recipe management features. Includes a one-time setup page for QR code scanning.

## Technical Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **UI Library**: React
*   **Component Library**: ShadCN UI
*   **Styling**: Tailwind CSS
*   **State Management**: React Context (`AuthContext` with `localStorage` persistence), `useState`, `useEffect`
*   **Form Management**: React Hook Form with Zod for validation
*   **Icons**: Lucide React
*   **TOTP**: Speakeasy (server-side), qrcode (for QR code generation)
*   **Image Generation (Labels)**: html2canvas
*   **Cloud Storage**: Vercel Blob
*   **AI Integration (Future Potential)**: Genkit (dependency included)

## Vercel Integration & Recipe Storage

The application is designed for deployment on Vercel and uses **Vercel Blob** for persistent recipe storage.
*   Recipes (both `recipe.xml` and `steps.md`) are stored under the `Recipes/` prefix in Vercel Blob, with each recipe in its own subfolder (e.g., `Recipes/my-great-ipa/recipe.xml`).
*   The app reads and writes to Vercel Blob using Server Actions and the `@vercel/blob` SDK.
*   Requires `BLOB_READ_WRITE_TOKEN`, `TOTP_SECRET`, `NEXT_PUBLIC_TOTP_ISSUER_NAME`, and `NEXT_PUBLIC_TOTP_ACCOUNT_NAME` environment variables to be set on Vercel.

## Getting Started

To set up and run this project for development or personal use, please consult the detailed instructions in the language-specific READMEs linked above. Key steps will involve:
1. Forking the repository.
2. Setting up a Vercel project and Vercel Blob store.
3. Generating and configuring environment variables (e.g., `BLOB_READ_WRITE_TOKEN`, `TOTP_SECRET`).
4. Initial TOTP setup for admin access via the `/admin/setup-totp` page.
5. Adding your recipes to your Vercel Blob store.

