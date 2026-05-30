# Practica les Taules - Multiplication Practice App

## Project Overview
A single-page web app (in Catalan) for an 8-year-old to practice multiplication tables (1-10). Built as a single `index.html` file with embedded CSS and JS — no build tools or dependencies.

## Architecture
- **Single file**: `index.html` contains all HTML, CSS, and JS
- **No frameworks**: Vanilla HTML/CSS/JS only
- **Storage**:
  - `mult_practice_scores` — JSON array of score entries (leaderboard, up to 50)
  - `mult_practice_errors` — nested JSON `{ "<lowercase-name>": { "AxB": { attempts, errors } } }`; partitioned per user so each child's adaptive stats are independent
  - `mult_player_name` — last-used player name
  - `mult_lang` — chosen UI language (`ca`/`es`/`en`)
- **Player name**: used as-is for scores; lowercased+trimmed as the error-stats bucket key (`getUserKey()`)

## Key Design Decisions
- **Language**: UI supports Catalan (default), Spanish, and UK English via a language switcher; choice persisted in `localStorage` key `mult_lang`
- **Target audience**: 8-year-old child — UI should be friendly, colorful, and neutral (not gendered)
- **Theme**: Warm light school theme (cream/ivory background, high-contrast text, chunky tactile buttons)
- **Font**: Nunito (loaded from Google Fonts)
- **Input**: On-screen number pad + "Comprova/Check" button always visible; keyboard+Enter also works on desktop; on touch-only devices the native keyboard is suppressed so kids use the on-screen pad

## Game Modes
All modes have 20 questions. The timer is per-question, not global.
- **Sense limit (Free mode)**: No time limit per question, x1 multiplier
- **5 segons**: 5s per question, x3 score multiplier
- **10 segons**: 10s per question, x2 score multiplier
- **20 segons**: 20s per question, x1.5 score multiplier
- If time runs out on a question, it counts as wrong and shows the correct answer

## Scoring Formula
- Base: 10 points per correct answer
- Streak bonus: +2 per consecutive correct (max +20 at streak of 10)
- Formula: `(10 + min(streak, 10) * 2) * multiplier`
- Wrong answer resets streak to 0

## Leaderboard
- Top 50 scores stored in localStorage
- Filterable by mode (all / free / 5s / 10s / 20s)
- Shows: rank, name, score, correct/total, mode

## File Structure
```
mult_practice/
  index.html    - The entire app
  CLAUDE.md     - This file (project context for Claude)
  README.md     - User-facing documentation
```

## Adaptive Question Selection
- `generateQuestionList()` builds a weighted pool per round: weight = `1 + 2 × errorRate × confidence`, capped at ~3×. `confidence = min(attempts, 5) / 5` so fresh facts are not penalised.
- Picks questions one at a time using weighted-random; enforces **max 4 repeats** per fact and **≥2 other questions gap** between repeats of the same fact. Gracefully relaxes spacing (but not the cap) if needed, falling back to "no immediate repeat" then full pool.
- `selectWeak()` and `getWeakProblems()` already read the per-user stats slice (`getErrorStats()`), so the "Les que fallo" button is automatically personalised.

## Development Notes
- To test: just open `index.html` in a browser (no server needed)
- All state is managed in the global `gameState` object during gameplay
- Screens are toggled by adding/removing the `.active` class
- Confetti animation spawns on results screen when accuracy >= 70%
