
# BrewCrafter - Your Cloud-Based Beer Recipe Book

BrewCrafter is a modern web application designed for homebrewers and craft beer enthusiasts to manage, create, and explore beer recipes. It leverages a cloud-based approach using Vercel Blob for recipe storage and features TOTP-based admin authentication for secure recipe management.

## Project Overview

BrewCrafter aims to provide a user-friendly, secure, and feature-rich platform for:
* Storing and organizing BeerXML recipes in the cloud.
* Easily viewing detailed recipe information, including ingredients, mash steps, and target statistics.
* Creating new recipes and editing existing ones (Admin only).
* Importing BeerXML files.
* Designing simple, printable labels for homemade beers.
* Calculating essential brewing metrics.

## Features

*   **Recipe Listing & Management**: View all recipes, filter by style, create new recipes, import BeerXML files, and delete recipes (admin-only for modifications).
*   **Detailed Recipe View**: Comprehensive display of recipe metadata, target stats, ingredients, mash schedule, and detailed brewing steps (from associated Markdown files).
*   **In-Place Editing**: Admins can edit recipe details and recipe steps (Markdown) directly.
*   **Label Designer**: Create custom front and back labels for your beers, with options to pre-fill data from existing recipes.
*   **Brewing Calculators**: Client-side calculators for ABV, IBU (Tinseth), and SG Temperature Correction.
*   **Admin Mode**: Secure admin access via TOTP for recipe management features.

## Technical Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **UI Library**: React
*   **Component Library**: ShadCN UI
*   **Styling**: Tailwind CSS
*   **State Management**: React Context, `useState`, `useEffect`
*   **Form Management**: React Hook Form with Zod for validation
*   **Cloud Storage**: Vercel Blob
*   **Authentication**: TOTP (Time-based One-Time Password) with Speakeasy

## Detailed Documentation

For more detailed information, please refer to the language-specific READMEs:

*   **Français (French)**: [README-FR.md](./README-FR.md)
*   **English (UK)**: [README-UK.md](./README-UK.md) (This file currently contains the French content and needs translation)

## Getting Started

To set up and run this project, please consult the detailed instructions in the language-specific READMEs linked above. Key steps will involve:
1. Forking the repository.
2. Setting up a Vercel project and Vercel Blob store.
3. Configuring environment variables (e.g., `BLOB_READ_WRITE_TOKEN`, `TOTP_SECRET`).
4. Initial TOTP setup for admin access.
