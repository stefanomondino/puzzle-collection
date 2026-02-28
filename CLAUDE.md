# Puzzle Collection - Agent Rules

## Project Overview
A PWA collection of single-file HTML puzzle games (Italian UI). Each game is a self-contained `.html` file with embedded CSS and JS. The homepage (`index.html`) links to all games.

## Game Naming
- Every game MUST have an **original, invented name** that does not correspond to any existing commercial game or well-known online puzzle name.
- Names should be short (1-2 words), evocative, and easy to remember.
- Avoid direct translations of existing game names (e.g. don't use "Sudoku", "Wordle", "Nonogram", "2048", "Minesweeper", etc.).
- The name should hint at the game mechanic without copying established brands.

## Level Generation
- Levels MUST be **procedurally generated** at runtime whenever possible, using seeded random number generators for reproducibility.
- Use a `mulberry32` or equivalent seeded PRNG so puzzles can be replayed from a seed.
- Provide difficulty settings (e.g. grid size, number of clues) rather than hand-crafted static levels.
- Each game should have a `generateRandomPuzzle()` entry point that creates a valid, solvable puzzle.
- Only use hardcoded level data when procedural generation is not feasible for the game type (e.g. word/trivia-based games with curated content).

## Score History (localStorage)
- Every game MUST persist score history locally using `localStorage`.
- Use a unique storage key per game: `<gamename>_stats` (e.g. `armonia_stats`).
- Stats object structure:
  ```js
  {
    gamesPlayed: number,
    gamesWon: number,
    currentStreak: number,
    maxStreak: number,
    lastPlayed: string // ISO date
  }
  ```
- Provide `loadStats()` and `saveStats()` helper functions following the existing pattern.
- Display a stats/history popup accessible from the game UI (e.g. via a trophy/chart icon in the header).

## Technical Conventions
- Each game is a **single self-contained HTML file** (no external JS/CSS dependencies).
- Language: **Italian** for all UI text.
- Design system: follow the existing CSS custom properties (`--bg`, `--primary`, `--card`, etc.).
- Mobile-first, touch-friendly. Disable double-tap zoom and pinch zoom.
- Include `<meta>` tags for PWA compatibility (theme-color, apple-mobile-web-app-capable, etc.).
- Add a back-to-home link (arrow or "Home" button) in each game header.
- Use semantic section comments (e.g. `// --- Persistence (localStorage) ---`) to organize code.
- When adding a new game, also update `index.html` to include a card for it and `manifest.json` if needed.
