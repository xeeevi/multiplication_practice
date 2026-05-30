# Contributing

Thank you for helping improve this app! Here's everything you need to get started.

## Prerequisites

- Node.js ≥ 18 (v20 recommended)
- npm ≥ 9

## Local setup

```bash
git clone <repo-url>
cd mult_practice
npm install
npm run dev          # starts the Vite dev server at http://localhost:5173
```

## Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run all Vitest tests once |
| `npm run test:watch` | Re-run tests on file changes |
| `npm run coverage` | Generate a coverage report in `coverage/` |
| `npm run lint` | ESLint across all TS/TSX files |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Prettier — format all files |
| `npm run format:check` | Prettier — check without writing |

## Project structure

```
src/
  lib/
    game/       Pure game logic (question generation, scoring, constants)
    storage/    localStorage helpers (scores, error stats, player name, language)
    i18n/       Translation strings — CA, ES, EN
  hooks/        React hooks (useGame, useLanguage, useCoarsePointer, …)
  screens/      Full-screen React components (Setup, Game, Results, Leaderboard)
  components/   Reusable UI pieces (NumberPad, ProgressBar, Confetti, …)
  types.ts      Shared TypeScript types
```

## Adding a new language

1. Copy `src/lib/i18n/ca.ts` → `src/lib/i18n/<code>.ts` and translate all strings.
2. Add the new `Lang` value to `src/types.ts`.
3. Import and register in `src/lib/i18n/index.ts`.
4. Add a button to `src/components/LanguageBar.tsx`.
5. The key-parity test in `src/lib/i18n/i18n.test.ts` will catch missing keys.

## Coding conventions

- **TypeScript strict mode** — no `any`, no unused variables.
- **Tailwind** for all styling. Theme colours live in `tailwind.config.ts` under `school.*`.
- **Pure functions first** — keep `lib/game/` and `lib/storage/` free of React imports.
- **Tests** — pure logic goes in `*.test.ts` (Vitest). UI interactions in `*.test.tsx`
  (React Testing Library).
- **Commits** — conventional format preferred: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`.

## Submitting a PR

1. Fork the repo, create a branch from `main`.
2. Make your changes and add/update tests.
3. Run `npm test && npm run lint` — both must pass.
4. Open a pull request using the provided template.
