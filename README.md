
# BrewCrafter - Your Cloud-Based Beer Recipe Book

BrewCrafter est une application web moderne conçue pour les brasseurs amateurs et les passionnés de bière artisanale afin de gérer, créer et explorer des recettes de bière. Elle s'appuie sur une approche basée sur le cloud utilisant Vercel Blob pour le stockage des recettes et propose une authentification administrateur basée sur TOTP pour une gestion sécurisée des recettes.

## Objectif du Projet

L'objectif principal de BrewCrafter est de fournir une plateforme conviviale, sécurisée et riche en fonctionnalités pour :
*   Stocker et organiser les recettes BeerXML dans le cloud (Vercel Blob).
*   Consulter facilement les informations détaillées des recettes, y compris les ingrédients, les étapes d'empâtage et les statistiques cibles.
*   Afficher les étapes de brassage détaillées et formatées à partir de fichiers Markdown associés.
*   Créer de nouvelles recettes à partir de zéro à l'aide d'un formulaire complet qui génère du BeerXML (et optionnellement les étapes Markdown) et le sauvegarde sur Vercel Blob (Admin uniquement).
*   Modifier les recettes existantes, y compris leurs étapes de brassage détaillées (via Markdown) (Admin uniquement).
*   Importer des fichiers BeerXML depuis votre ordinateur local vers Vercel Blob (Admin uniquement).
*   Supprimer des recettes de Vercel Blob (Admin uniquement).
*   Calculer des métriques de brassage essentielles (ABV, IBU, Correction SG) via des calculateurs côté client.
*   Concevoir des étiquettes simples et imprimables pour vos bières maison, avec des options pour pré-remplir les données à partir de vos recettes.

## Fonctionnalités

BrewCrafter offre les fonctionnalités clés suivantes :

*   **Liste des Recettes (Page BrewCrafter Recipes - `/`)**:
    *   Affiche toutes vos recettes BeerXML stockées dans votre Vercel Blob.
    *   Chaque recette est présentée sur une carte affichant les détails clés : Nom, Style, Volume du lot, Densité Initiale (OG), Densité Finale (FG), Alcool Par Volume (ABV), Unités Internationales d'Amertume (IBU), et Couleur (SRM).
    *   Filtrez les recettes par style à l'aide d'un menu déroulant.
    *   Bouton pour rafraîchir la liste des recettes.
    *   **Contrôles Admin (Visibles lorsque l'Admin est connecté)** :
        *   Bouton "New recipe" : Mène au formulaire de création de recette.
        *   Bouton "Import recipe" : Permet de sélectionner un seul fichier BeerXML (`.xml`) depuis votre ordinateur local pour le téléverser sur Vercel Blob.

*   **Vue Détaillée de la Recette (`/recipes/[recipeSlug]`)**:
    *   Accessible en cliquant sur "View Recipe" sur une carte de recette.
    *   Affiche des informations complètes sur la recette analysées à partir du fichier `.xml` stocké dans Vercel Blob :
        *   **En-tête** : Nom de la Recette, Style, Brasseur, et une icône dynamique `GlassWater`.
        *   **Carte Métadonnées** : Taille du Lot, Volume d'Ébullition, Temps d'Ébullition, Efficacité.
        *   **Carte Statistiques Cibles** : OG, FG, ABV, IBU, Couleur (SRM) avec des barres de progression visuelles.
        *   **Ingrédients** : Listes détaillées pour Fermentescibles, Houblons, Levures, et Divers, indiquant les quantités, types, utilisations, etc., présentées dans un accordéon.
        *   **Notes** : Notes du brasseur issues de la recette, dans une section accordéon.
    *   **Onglet Étapes de la Recette** :
        *   Affiche les étapes de brassage formatées si un fichier Markdown correspondant (par exemple, `steps.md`) existe dans le dossier de la recette sur Vercel Blob.
        *   **Important pour le formatage `.md`** : Pour que les étapes s'affichent correctement avec les icônes associées, votre fichier `.md` devrait idéalement utiliser les en-têtes H2 suivants pour les sections :
            *   `## Brewer's Notes` (ou similaire comme "Notes du Brasseur", "Procedure")
            *   `## Mashing`
            *   `## Boil`
            *   `## Whirlpool / Aroma Additions`
            *   `## Cooling`
            *   `## Fermentation`
            *   `## Bottling/Kegging` (ou "Bottling", "Kegging")
        *   Le contenu sous ces en-têtes peut inclure des paragraphes et des listes à puces (utilisant `*` ou `-`). Le texte entouré de `**doubles astérisques**` sera rendu en gras.
    *   **Contrôles Admin (Visibles lorsque l'Admin est connecté)** :
        *   Un bouton "Edit" principal dont le texte et le comportement s'adaptent :
            *   Si sur l'onglet "Recipe Details" : Le bouton indique "Modifier Détails Recette" et mène au formulaire d'édition complet de la recette (`/recipes/[recipeSlug]/edit`).
            *   Si sur l'onglet "Recipe Steps" : Le bouton indique "Modifier Étapes Recette" et active l'édition en place du contenu Markdown.
        *   Éditeur Markdown en place pour "Recipe Steps" (lorsqu'activé) avec les boutons "Sauvegarder Étapes" et "Annuler".
    *   Un bouton "Refresh" pour recharger les détails de la recette.

*   **Création & Édition de Recette (Admin Uniquement)** :
    *   **Création de Nouvelle Recette (`/recipes/new`)**:
        *   Une page "New Recipe" dédiée avec un formulaire complet en accordéon multi-sections.
        *   Permet la saisie pour tous les champs BeerXML standards : Informations Générales, Détails du Style, Statistiques Cibles (OG, FG, Couleur SRM - ABV & IBU sont calculés automatiquement à partir des entrées), listes dynamiques pour Fermentescibles, Houblons (avec sélection d'unité kg/g), Levures, et Divers, détails du Profil d'Empâtage, Notes, et **étapes de brassage détaillées via un éditeur/importateur Markdown intégré**.
        *   Lors de la sauvegarde, la recette est convertie au format BeerXML (`recipe.xml`) et les étapes en Markdown (`steps.md`). Les deux fichiers sont téléversés dans un nouveau dossier (nommé d'après le slug de la recette) dans votre magasin Vercel Blob.
    *   **Édition de Recette (`/recipes/[recipeSlug]/edit`)**:
        *   Accessible via le bouton "Modifier Détails Recette" sur la Vue Détaillée de la Recette (visible pour les admins).
        *   Charge les données de la recette existante (y compris le contenu de `steps.md`) dans le même formulaire complet pour modification.
        *   Permet d'éditer tous les aspects de la recette, y compris les étapes Markdown (qui peuvent aussi être importées ou éditées directement).
        *   La sauvegarde met à jour les fichiers `recipe.xml` et `steps.md` dans Vercel Blob, écrasant les fichiers existants dans le dossier de cette recette. Le slug de la recette (nom du dossier sur Blob) ne change pas même si le nom de la recette est modifié.
    *   **Importation de `.md` pour les Étapes** : Les formulaires "New Recipe" et "Edit Recipe" incluent une section "Recipe Steps (Markdown)" avec un `textarea` et un bouton "Importer un fichier .md", permettant l'édition directe ou le téléversement de contenu Markdown.

*   **Suppression de Recette (Admin Uniquement)** :
    *   Permet de supprimer les recettes directement depuis la page "BrewCrafter Recipes" (via une icône de suppression sur la carte de recette, visible pour les admins).
    *   Un dialogue de confirmation empêche les suppressions accidentelles.
    *   Supprime le dossier entier de la recette (y compris `recipe.xml` et `steps.md`) du magasin Vercel Blob.

*   **Clarification sur le Processus d'Importation de Recettes & Étapes** :
    1.  **Connexion Admin** : Assurez-vous d'être connecté en tant qu'administrateur.
    2.  **Importer le XML d'abord** : Sur la page "BrewCrafter Recipes", utilisez le bouton "Import recipe" pour téléverser votre fichier `.xml` depuis votre ordinateur. Cela crée le dossier de base de la recette et le fichier `recipe.xml` sur Vercel Blob, rendant les détails et ingrédients de la recette visibles dans l'application.
    3.  **Ajouter/Modifier les Étapes de Brassage (Optionnel mais Recommandé)** : Pour voir les procédures de brassage détaillées dans l'onglet "Recipe Steps" pour une recette importée (ou pour les ajouter à une recette nouvellement créée), vous devrez :
        *   Cliquer sur "View Recipe" sur la recette.
        *   Si sur l'onglet "Recipe Details", cliquer sur "Modifier Détails Recette". Cela vous mènera au formulaire d'édition complet.
        *   Si sur l'onglet "Recipe Steps", cliquer sur "Modifier Étapes Recette" pour une édition en place, ou aller au formulaire d'édition complet.
        *   Dans la section "Recipe Steps (Markdown)" du formulaire (ou l'éditeur en place), vous pouvez écrire manuellement vos étapes ou importer un fichier `.md`.
        *   Sauvegarder la recette (ou les étapes). Cela créera ou mettra à jour le fichier `steps.md` dans le dossier de cette recette sur Vercel Blob.
    *   Pour les recettes créées à partir de zéro via le formulaire "New Recipe", les étapes Markdown sont gérées directement dans le formulaire.

*   **BrewCrafter Label (Concepteur d'Étiquettes - `/label`)**:
    *   Une page dédiée pour concevoir des étiquettes avant et arrière simples pour vos bières.
    *   **Contrôles** :
        *   Charger les informations de la recette (Nom de la Bière, IBU, ABV, Description, Ingrédients) à partir des recettes existantes stockées dans Vercel Blob.
        *   Saisie manuelle pour tous les champs de l'étiquette si aucune recette n'est chargée.
        *   Sélectionner le volume de la bouteille (33CL ou 75CL).
        *   Personnaliser le Nom de la Brasserie, le Slogan.
        *   Téléverser une image de fond (avec aperçu et option pour effacer).
        *   Sélectionner les couleurs de fond et de texte à l'aide de sélecteurs de couleur.
    *   **Aperçus en Direct** :
        *   Aperçus séparés pour les étiquettes avant et arrière, conçus sur un canevas vertical de 300x400px.
        *   Étiquette Avant : Affiche IBU, Alcool %, Nom de la Bière (police Bebas Neue), et Volume.
        *   Étiquette Arrière : Affiche Description, Ingrédients, Date de Brassage, et Lieu de Brassage avec contenu défilable.
        *   Les aperçus reflètent les choix d'image/couleur de fond et de couleur de texte.
    *   **Téléchargement** : Télécharger les étiquettes avant et arrière conçues en tant qu'images PNG, mises à l'échelle pour une impression à ~300 DPI basée sur les dimensions physiques typiques des étiquettes.

*   **BrewCrafter Calculator (`/calculator`)**:
    *   Une page avec des calculateurs de brassage pratiques côté client :
        *   **Calculateur d'ABV** : Calcule l'Alcool Par Volume à partir de la Densité Initiale et Finale.
        *   **Calculateur d'IBU (Tinseth)** : Estime les Unités Internationales d'Amertume en fonction des ajouts de houblon (quantité, acide alpha, temps d'ébullition), de la densité initiale et du volume d'ébullition. Permet plusieurs ajouts de houblon.
        *   **Correction de SG par Température** : Corrige les lectures de Densité Spécifique de l'hydromètre en fonction de la température (en Celsius).

*   **Mode Admin** :
    *   Mode admin protégé par TOTP (Time-based One-Time Password).
    *   Connexion via une icône dans l'en-tête principal. Nécessite un code à 6 chiffres d'une application d'authentification (Google Authenticator, Authy, etc.).
    *   Active les fonctionnalités "New recipe", "Import recipe", "Modifier Recette", et "Supprimer recette".
    *   Déconnexion via une icône dans l'en-tête principal.
    *   **Configuration TOTP** :
        *   Un secret (`TOTP_SECRET`) doit être configuré dans les variables d'environnement.
        *   Une page dédiée (`/admin/setup-totp`) permet à l'administrateur de scanner un QR code (une fois, pour la configuration) pour lier son application d'authentification.
        *   **AVERTISSEMENT DE SÉCURITÉ** : La page `/admin/setup-totp` est destinée à la configuration initiale unique. **Elle ne doit pas être liée publiquement et il est fortement recommandé de la rendre inaccessible (par exemple, en supprimant le fichier ou en la protégeant par d'autres moyens) dans un environnement de production après que l'administrateur ait configuré son application TOTP.** L'accès non contrôlé à cette page permettrait à n'importe qui de lier son authentificateur au compte admin.

## Pile Technique

BrewCrafter est construit avec une pile technique moderne, axée sur JavaScript :

*   **Framework** : [Next.js](https://nextjs.org/) (App Router)
*   **Langage** : [TypeScript](https://www.typescriptlang.org/)
*   **Bibliothèque UI** : [React](https://reactjs.org/)
*   **Bibliothèque de Composants** : [ShadCN UI](https://ui.shadcn.com/) - Une collection de composants magnifiquement conçus, accessibles et personnalisables.
*   **Styling** : [Tailwind CSS](https://tailwindcss.com/) - Un framework CSS utilitaire pour un développement UI rapide.
*   **Gestion d'État** :
    *   React Context (`AuthContext`) pour l'état d'authentification admin côté client (persisté dans `localStorage`).
    *   React `useState` et `useEffect` pour l'état local des composants et les effets secondaires.
*   **Gestion de Formulaires** : [React Hook Form](https://react-hook-form.com/) pour créer et valider les formulaires.
*   **Validation de Schéma** : [Zod](https://zod.dev/) pour définir et valider les schémas de données (utilisé avec React Hook Form).
*   **Icônes** : [Lucide React](https://lucide.dev/) pour un ensemble d'icônes cohérent et épuré.
*   **TOTP** :
    *   [Speakeasy](https://github.com/speakeasyjs/speakeasy) pour la génération et la vérification TOTP (côté serveur).
    *   [qrcode](https://github.com/soldair/node-qrcode) pour générer des QR codes pour la configuration TOTP (côté serveur).
*   **Génération d'Images (Étiquettes)** : [html2canvas](https://html2canvas.hertzen.com/) pour capturer des éléments HTML en tant qu'images.
*   **Stockage Cloud** : [Vercel Blob](https://vercel.com/storage/blob) pour le stockage des fichiers de recettes (`.xml` et `.md`).
*   **Intégration IA (Potentiel Futur)** : [Genkit](https://firebase.google.com/docs/genkit) est inclus dans les dépendances, suggérant un potentiel pour de futures fonctionnalités alimentées par l'IA (bien que non activement utilisé dans les fonctionnalités actuelles).

## Intégration Vercel & Stockage des Recettes

Cette application est conçue pour être déployée sur [Vercel](https://vercel.com/) et exploite **Vercel Blob** pour le stockage persistant des recettes.

*   **Stockage des Recettes** :
    *   Tous les fichiers de recettes BeerXML (`recipe.xml`) et leurs fichiers Markdown `steps.md` correspondants sont stockés dans votre Vercel Blob.
    *   Les recettes sont organisées sous un préfixe (dossier) principal `Recipes/`.
    *   Chaque recette réside dans son propre sous-dossier, nommé d'après une version épurée du nom de la recette (slug). Par exemple : `Recipes/ma-super-ipa/recipe.xml` et `Recipes/ma-super-ipa/steps.md`.
    *   Si le fichier XML d'une recette a un nom différent sur Vercel Blob (par exemple, `Recipes/ma-super-ipa/mon-ipa-v2.xml`), l'application tentera de lire le premier fichier `.xml` qu'elle trouve dans le dossier du slug de cette recette. De même pour les fichiers `.md` si `steps.md` n'est pas trouvé mais qu'un autre `.md` existe.

*   **Lecture des Recettes** :
    *   L'application récupère la liste des recettes et leurs détails en interrogeant votre magasin Vercel Blob à l'aide du SDK `@vercel/blob` (spécifiquement la fonction `list`) via des fonctions utilitaires côté serveur dans `src/lib/recipe-utils.ts`.
    *   Les résumés des recettes sont récupérés pour la page d'accueil via une route API (`/api/recipes/summaries`).
    *   Les détails des recettes (y compris les étapes Markdown) sont récupérés de manière similaire lorsqu'un utilisateur navigue vers une page de recette spécifique, en lisant directement depuis Vercel Blob via `src/lib/recipe-utils.ts`.
    *   Un mécanisme de "cache-busting" (`?timestamp=${Date.now()}`) est utilisé lors de la récupération du contenu des blobs pour s'assurer que des données fraîches sont récupérées, surtout après des mises à jour.

*   **Écriture & Suppression de Recettes (Admin Uniquement via Server Actions)** :
    *   Lorsqu'une nouvelle recette est créée via le formulaire "New Recipe" ou importée, le BeerXML généré/fourni (`recipe.xml`) et les étapes Markdown (`steps.md`) sont téléversés sur Vercel Blob à l'aide d'une Server Action (`addRecipesAction` dans `src/app/actions/recipe-actions.ts`). Cette action utilise la fonction `put` de `@vercel/blob` et assure `addRandomSuffix: false` pour maintenir un nommage de fichier cohérent.
    *   Lorsqu'une recette est éditée, les fichiers `recipe.xml` et `steps.md` mis à jour écrasent les fichiers existants dans Vercel Blob dans le dossier spécifique de la recette. Le système tente d'identifier les fichiers `.xml` et `.md` existants dans le dossier pour les écraser, même si leurs noms exacts ne sont pas `recipe.xml` ou `steps.md` (bien que ce soient les noms par défaut lors de la création).
    *   Lorsqu'une recette est supprimée, une Server Action (`deleteRecipeAction`) utilise la fonction `del` de `@vercel/blob` pour retirer le dossier de recette correspondant et tout son contenu du magasin Blob.
    *   Les Server Actions appellent également `revalidatePath` pour signaler à Next.js de mettre à jour les données mises en cache pour les pages pertinentes.

*   **Variables d'Environnement pour le Déploiement Vercel** :
    *   `BLOB_READ_WRITE_TOKEN` : **Crucial**. Ce token permet à l'application de s'authentifier et d'interagir avec votre magasin Vercel Blob. Il doit être configuré dans les paramètres de votre projet Vercel.
    *   `TOTP_SECRET` : **Crucial pour la Connexion Admin**. Une chaîne secrète encodée en Base32 utilisée pour la génération et la vérification TOTP. Générez-la une fois et stockez-la en toute sécurité.
    *   `NEXT_PUBLIC_TOTP_ISSUER_NAME` : Le nom affiché dans les applications d'authentification (par exemple, "BrewCrafter App").
    *   `NEXT_PUBLIC_TOTP_ACCOUNT_NAME` : Le nom de compte affiché dans les applications d'authentification (par exemple, "admin").

Ce stockage basé sur le cloud assure que vos recettes sont persistantes à travers les déploiements et accessibles de n'importe où.

## Développement Local

Pour exécuter BrewCrafter localement :

1.  Clonez le dépôt.
2.  Installez les dépendances : `npm install` (ou `yarn install`).
3.  **Configurez les Variables d'Environnement** :
    *   Créez un fichier nommé `.env.local` à la racine de votre projet.
    *   Ajoutez les variables suivantes, en remplaçant les valeurs de remplacement :
        ```
        BLOB_READ_WRITE_TOKEN=votre_token_vercel_blob_lecture_ecriture_ici
        TOTP_SECRET=VOTRE_SECRET_TOTP_BASE32_UNIQUE_ICI
        NEXT_PUBLIC_TOTP_ISSUER_NAME="BrewCrafter Local"
        NEXT_PUBLIC_TOTP_ACCOUNT_NAME="localadmin"
        ```
    *   Vous pouvez obtenir `BLOB_READ_WRITE_TOKEN` depuis l'onglet "Storage" de votre projet Vercel après avoir lié un magasin Blob.
    *   Pour `TOTP_SECRET`, générez une chaîne Base32 robuste (par exemple, en utilisant un script local avec `speakeasy` ou un générateur en ligne de confiance). **Ce secret doit être unique et conservé en toute sécurité.**
4.  Exécutez le serveur de développement : `npm run dev`.
5.  Ouvrez [http://localhost:9002](http://localhost:9002) (ou le port spécifié dans `package.json`) dans votre navigateur.
6.  **Première Configuration Admin** :
    *   Naviguez vers `http://localhost:9002/admin/setup-totp`.
    *   Scannez le QR code avec votre application d'authentification (par exemple, Google Authenticator, Authy).
    *   Vous pouvez maintenant utiliser les codes générés pour vous connecter en tant qu'admin via le bouton de l'en-tête.
    *   La page de configuration TOTP n'est pas liée dans la navigation principale et est destinée à la configuration admin initiale. **Elle doit être sécurisée ou supprimée après la configuration dans un environnement de production.**

En développement local, "Import recipe" et "New recipe" sauvegarderont les fichiers sur votre magasin Vercel Blob si `BLOB_READ_WRITE_TOKEN` est correctement configuré et valide.

---

Ce README vise à fournir un aperçu complet de l'application BrewCrafter.
