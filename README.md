# Resume Maker 9000

Resume Maker 9000 is a local-first resume builder. The app is built with React, TanStack Router, Tailwind CSS, shadcn/ui, and Zustand. It keeps the resume editor, dashboard, and preview on one canonical workspace state so edits are reflected everywhere immediately.

## Features

- Create, rename, duplicate, delete, and switch between multiple resumes.
- Edit personal details, summary, experience, education, projects, skills, certifications, awards, and languages.
- Configure visible sections, ordering, page size, template, fonts, and accent color.
- Add, edit, delete, and reorder repeatable entries and links.
- Autosave to local storage with hydration status, save status, undo, and redo.
- Import and export individual resumes as versioned JSON backups.
- Accept legacy Svelte profile-shaped JSON and migrate the old `profiles` local-storage records on first load.
- Preview, print/download through the browser print flow, share a preview link, and use the app offline after it is installed as a Capacitor app.

Resumes remain on the device by default. No account or server upload is required.

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
pnpm build           # Production client/server build in build/client/ and build/server/
pnpm preview         # Serve the production build locally
pnpm generate-routes # Regenerate TanStack Router's routeTree.gen.ts
```

The project uses the `@/*` and `#/*` aliases for `src/`. Components under `src/components/ui` follow the shadcn/ui composition style; feature code lives under `src/features`.

## Storage and migration

The Zustand workspace is persisted under `resume-workspace:v1`. On hydration it first reads that versioned workspace. If no workspace exists, it looks for the old Svelte `profiles` index and each profile's local-storage record, normalizes those records into the React document model, and writes the migrated workspace. A migration marker prevents repeating the legacy import. Existing data can also be moved manually with the dashboard's Import JSON and Export JSON actions.

The exported formats are versioned. Keep exported JSON files if you need a backup before clearing browser storage or changing devices.

## Capacitor workflow

TanStack Start writes the browser bundle to `build/client/`, matching `capacitor.config.ts` (`webDir: "build/client"`). After installing the native dependencies, sync the web bundle into Android and iOS:

```bash
pnpm build
npx cap sync
npx cap open android
npx cap open ios
```

Use Android Studio or Xcode to run and sign the native apps. Native projects in `android/` and `ios/` are kept in the repository; do not edit generated web assets by hand.
