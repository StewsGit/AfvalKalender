# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Install dependencies**: `npm ci`
- **Start development server**: `npm run dev` (opens local Vite URL)
- **Run unit tests**: `npm test` (runs Node.js test runner on `tests/unit/*.test.ts`)
- **Run E2E tests**: `npx playwright test` (specs in `tests/e2e/`; starts the dev server automatically)
- **Run linting**: `npm run lint` (uses eslint with Next.js config)
- **Build for production**: `npm run build` (bundles via Vinext/Vite into Cloudflare Worker format)
- **Validate build artifacts**: `npm run validate:artifact` (runs validation script)
- **Start production preview**: `npm start` (uses vinext and wrangler)
- **Generate database migrations**: `npm run db:generate` (uses drizzle-kit)

## Project Structure & Architecture

### High-Level Architecture
The app is a full-stack React/TypeScript application deployed as a Cloudflare Worker:
- **React Interface** (`app/page.tsx`): Client-side UI with state management (`useState`, `useEffect`)
- **API Route** (`app/api/collections/route.ts`): Internal server endpoint that validates requests and calls the IVAREM provider
- **IVAREM Provider** (`services/ivarem-provider.ts`): Translates address to IVAREM IDs, fetches collection data, normalizes response
- **Cache Layer** (`services/collection-cache.ts`): Six-hour `localStorage` cache to avoid unnecessary network calls
- **Address Settings** (`services/address-settings.ts`): Abstracts `localStorage` for address persistence
- **Date Logic** (`lib/dates.ts`): Uses `Europe/Brussels` timezone to prevent UTC date-shift issues
- **Waste Normalization** (`lib/waste-normalization.ts`): Maps IVAREM fractions to standardized categories, icons, and colors

### Key Directories
- `app/` – Pages, layout, global CSS, and API routes (Next.js App Router structure)
- `services/` – Address settings, cache, and IVAREM provider (abstracted from UI)
- `lib/` – Shared types, date utilities, waste normalization, mock data
- `tests/` – Unit tests for date logic and waste normalization
- `public/` – Static assets
- `worker/` – Entry point for Cloudflare Worker production build
- `docs/` – Technical documentation (see `Afval-Kalender-Documentatie.md`)
- `build/` – Output directory for production build
- `scripts/` – Utility scripts for CI, build, validation, etc.

### Data Flow
```
User → React Interface → Internal API Route → IVAREM Provider → IVAREM
                                    ↖  Normalized CollectionResponse ← Cache
```
1. User enters address → stored in `localStorage` via `address-settings`
2. On load, app checks cache (`collection-cache`) for recent data (<6h)
3. If cache miss/expired, calls internal API route (`/api/collections`)
4. API validates request, delegates to `ivarem-provider`
5. Provider makes up to three internal requests to IVAREM endpoints (municipality → street → collections)
6. Provider normalizes response to `{address, collections: [{date, wasteTypes: [{code, name, sourceColor?}]}], lastUpdated}`
7. Response cached and returned to UI for display

### Important Files
- `app/page.tsx` – Main UI component with state (`address`, `data`, `error`, `viewState`)
- `app/layout.tsx` – Root layout, metadata, globals.css, Material Symbols
- `app/globals.css` – CSS variables (`--ink`, `--muted`, `--accent`, etc.), theme/accent tokens, and responsive grid
- `lib/theme.ts` – Accent palette, theme-mode resolution, and the pre-paint bootstrap script
- `services/ivarem-provider.ts` – Core IVAREM integration (override for other data sources)
- `services/collection-cache.ts` – Cache logic (adjust `CACHE_DURATION_MS` for testing)
- `lib/waste-normalization.ts` – Mapping rules for waste types, icons, colors
- `lib/dates.ts` – Timezone-safe date formatting/parsing
- `app/api/collections/route.ts` – Input validation and provider invocation

### Styling & Responsiveness
- Uses CSS custom properties (defined in `:root` of `globals.css`)
- Week overview uses CSS Grid with breakpoints:
  - Desktop: 7 columns (`grid-template-columns: repeat(7, 1fr)`)
  - Tablet: 2 columns (`@media (max-width: 900px)`)
  - Mobile: 1 column (`@media (max-width: 640px)`)
- Icons: Google Material Symbols (e.g., `recycling` for PMD, `compost` for GFT)
- Colors: Prefer IVAREM-provided `sourceColor`; fallback to category color; finally neutral `#6c7480`
- Theming: `data-theme` (`light`/`dark`) and `data-accent` on `<html>` drive all colour tokens; set pre-paint by the bootstrap script in `app/layout.tsx`

### Testing
- Unit tests in `tests/unit/` using Node.js test runner (`node --import tsx --test`)
- Focus on pure functions: date logic (`dates.ts`), waste normalization (`waste-normalization.ts`), theme resolution (`theme.ts`)
- E2E tests in `tests/e2e/` using Playwright (`npx playwright test`); dev server starts automatically
- Run with `npm test`; includes linting (`npm run lint`) and build validation in CI

### Environment & Tooling
- Node.js >=22.13 (enforced in `package.json` engines)
- TypeScript 5.9+ (`tsconfig.json`)
- Vite + Vinext for local dev (simulates Cloudflare Worker)
- Wrangler for Cloudflare CLI
- ESLint with `eslint-config-next`
- Tailwind CSS configured but not heavily used (custom CSS predominates)
- No database currently configured (Drizzle ORM present but unused)

### Files to Review First
1. `app/page.tsx` – Entry point and UI state machine
2. `services/ivarem-provider.ts` – External data integration point
3. `services/collection-cache.ts` – Offline/fault tolerance mechanism
4. `lib/waste-normalization.ts` – Business logic for waste categorization
5. `lib/dates.ts` – Timezone correctness cornerstone
6. `app/globals.css` – Theme and layout foundation

# Project Operating Rules

## Priorities

1. Correctness and adherence to existing conventions.
2. Small, reversible changes.
3. Evidence through tests, not assumptions.
4. Concise communication and minimal context usage.

## Required Workflow

* Read `.claude/project.config.json` first.
* Before implementation, investigate whether similar logic, tests, components, or patterns already exist.
* Place new code next to the most similar existing code; do not introduce new architecture unless necessary.
* Before starting any new feature, create a `feature/<slug>` branch from a clean working tree.
* Work in small subtasks. Test and commit each completed subtask locally.
* Push, force-push, merge, rebase, tagging, and remote branch creation are prohibited without an explicit user request.
* Never modify `main`, `master`, `develop`, or a release branch directly.
* Stop when unexpected existing changes are detected; do not overwrite them.

## Definition of Done

* Acceptance criteria have been demonstrably completed.
* Relevant unit, integration, type-checking, and linting tests pass.
* UI behavior has been verified with Playwright whenever user interaction or rendering changes.
* The diff has been reviewed for regressions, security issues, simplicity, and duplication.
* No secrets, debug code, or generated artifacts are included in the commit.
* `docs/session-log.md` and, where necessary, `docs/retrospectives/` have been updated.

Use skills for procedures; keep this file concise.
