# Practica les Taules de Multiplicar 🔢

Multiplication tables practice app for primary-school children. Friendly school theme, on-screen number pad, adaptive question selection, and support for **Catalan**, **Spanish**, and **UK English**.

[![Build & Deploy](https://github.com/YOUR_USER/YOUR_REPO/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USER/YOUR_REPO/actions/workflows/deploy.yml)

## Features

- **Adaptive questions** — facts you get wrong appear more often in the next round
- **Per-user stats** — multiple children can share one device; stats are partitioned by name
- **On-screen number pad** — works on tablets and phones without a physical keyboard
- **4 modes** — free practice, 5 s, 10 s, 20 s (with score multipliers)
- **Leaderboard** — top 50 scores stored locally (localStorage — no server)
- **Three languages** — CA / ES / EN, switchable at any time

## Using the app

Visit the live site: **https://YOUR_USER.github.io/YOUR_REPO/**

1. Choose your language (top-right)
2. Enter your name
3. Pick the tables you want to practise
4. Choose a time mode and tap **Comencem!**

## Development

> See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # run all unit tests
npm run build      # production build → dist/
```

### Required one-time GitHub Pages setup

In your repo: **Settings → Pages → Source → GitHub Actions**. The `deploy.yml` workflow then builds and deploys on every push to `main` (free on public repos).

## Tech stack

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v3 |
| Tests | Vitest + React Testing Library |
| Deploy | GitHub Actions → GitHub Pages |

## Project structure

```
src/
  lib/game/        Question generation, scoring, constants
  lib/storage/     localStorage helpers (scores, stats, name, language)
  lib/i18n/        Translation objects — ca.ts, es.ts, en.ts
  hooks/           useGame (reducer), useLanguage (context), useCoarsePointer
  screens/         SetupScreen, GameScreen, ResultsScreen, LeaderboardScreen
  components/      NumberPad, ProgressBar, Confetti, LanguageBar, BackgroundDeco
```

## License

[MIT](LICENSE)
