# Resume Maker 9000

Resume Maker 9000 is a local-first resume builder. The app is built with React, TanStack Router, Tailwind CSS, shadcn/ui, and Zustand. It keeps the resume editor, dashboard, and preview on one canonical workspace state so edits are reflected everywhere immediately.

## Features

- Create, rename, duplicate, delete, and switch between multiple resumes.
- Edit personal details, summary, experience, education, projects, skills, certifications, awards, and languages.
- Choose from 25 templates for different jobs (ATS-first, sidebar, creative, executive, academic, and more), then fine-tune page size, fonts, and accent color.
- Browse every template in the template explorer (`/templates`) with realistic sample content for the roles it suits, filter by job family, ATS rating, photo, or multi-page support, and apply one to an existing resume.
- Real multi-page pagination: content is split into A4 or Letter sheets without breaking entries, sections continue with their headings, and multi-page templates add running headers and page numbers. The on-screen preview matches the printed PDF page for page.
- Configure visible sections and their order.
- Add, edit, delete, and reorder repeatable entries and links.
- Autosave to local storage with hydration status, save status, undo, and redo.
- Import and export individual resumes as versioned JSON backups.
- Expose the whole create-edit-preview workflow as WebMCP tools so AI agents can drive the app autonomously, including `recommend-templates` and `list-templates` for choosing a template that fits the user's job.
- Accept legacy Svelte profile-shaped JSON and migrate the old `profiles` local-storage records on first load.
- Preview and print in the browser, download or share PDFs through the bundled native bridge, and use the app offline after it is installed as a Capacitor app.

Resumes remain on the device by default. No account or server upload is required.

## Templates

Every template is described once in `src/features/resume-preview/templates/catalog.ts`. The catalog drives the renderer, the template picker, the explorer, and the WebMCP tools, so the same metadata that people read is what agents use to choose:

- **Who it is for**: `bestFor` job titles, `industries`, `categories` (job families), and `careerLevels`.
- **Trade-offs**: an `ats` rating with notes, `pages` guidance (one page, one to two, or multi-page), `photo` support, `strengths`, and `considerations`.
- **Design**: layout (single column or a left/right sidebar), header, entry, skills and contact styles, portrait placement, and whether continuation pages get a running header and page numbers.

Rendering lives in `src/features/resume-preview/document/`:

- `flows.ts` turns the resume into ordered groups of units that must not be split (a job, a skill group, a paragraph).
- `ResumeDocument.tsx` lays that content out once, invisibly, measures it, and renders real sheets; `paginate.ts` decides the page breaks.
- `document.css` holds the page geometry, the shared variants, and one block of rules per template. Sizes are in `pt` and `mm` so screen, browser PDF, and native PDF match.

To add a template:

1. Add a catalog entry with a unique, permanent `id`, honest descriptions, and a `samplePersona` that resembles its intended user (see `templates/personas.ts`).
2. Add its rules to `document.css` under a `.rp-doc[data-template='<id>']` block. Use `gap` and padding rather than top margins so pagination stays exact.
3. Add the id to `seo/templates.mjs` (a test keeps it in sync with the catalog).
4. Run `pnpm test`, then `pnpm verify:pdf-preview http://localhost:3000/` with the dev server running. It prints every template to PDF with a one-page and a multi-page sample and checks that each PDF has the same number of pages as the preview.

## Local development

Install dependencies with pnpm, then start Vite:

```bash
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm check           # TypeScript validation
pnpm test            # Vitest tests
pnpm build           # Web build in build/web/client/ and build/web/server/
pnpm build:capacitor # Native webview build in build/capacitor/client/
pnpm verify:seo      # Verify public SEO output and native content exclusion
pnpm verify:pdf-preview http://localhost:3000/  # Print every template to PDF and compare page counts
pnpm preview         # Serve the web production build locally
pnpm generate-routes # Regenerate TanStack Router's routeTree.gen.ts
```

The project uses the `@/*` and `#/*` aliases for `src/`. Components under `src/components/ui` follow the shadcn/ui composition style; feature code lives under `src/features`.

## Storage and migration

The Zustand workspace is persisted under `resume-workspace:v1`. On hydration it first reads that versioned workspace. If no workspace exists, it looks for the old Svelte `profiles` index and each profile's local-storage record, normalizes those records into the React document model, and writes the migrated workspace. A migration marker prevents repeating the legacy import. Existing data can also be moved manually with the dashboard's Import JSON and Export JSON actions.

The exported formats are versioned. Keep exported JSON files if you need a backup before clearing browser storage or changing devices.

## Web and Capacitor builds

The web and native artifacts are deliberately separate. `pnpm build:web` prerenders the indexable homepage and adds web-only search guides under `build/web/client/`. `pnpm build:capacitor` writes only the application artifact to `build/capacitor/client/`, matching `capacitor.config.ts`.

After installing the native dependencies, build and sync the Capacitor artifact with one command:

```bash
pnpm cap:sync
npx cap open android
npx cap open ios
```

Use Android Studio or Xcode to run and sign the native apps. Do not run `cap sync` after `pnpm build:web`; `pnpm cap:sync` always rebuilds the native artifact first. Native projects in `android/` and `ios/` are kept in the repository; do not edit generated web assets by hand.
