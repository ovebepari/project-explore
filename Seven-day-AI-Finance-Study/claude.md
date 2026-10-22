# 7-Day AI Systems & Finance Study Tracker

## Overview

A self-contained, portable study dashboard for a 7-day intensive bootcamp covering AI/MLOps (80%) and Finance (20%). Built for DevOps/SRE engineers breaking into AI Engineering. Zero external dependencies — runs on Python 3.7+ standard library only.

## Architecture

```
server.py          → Python HTTP server + SQLite REST API (entry point)
tracker.db         → SQLite database (single-row JSON blob, WAL mode)
public/            → Frontend assets served by the server
  index.html       → Dashboard UI (semantic HTML5)
  style.css        → Design system with CSS custom properties, dark/light themes
  app.js           → All frontend logic + hardcoded syllabus data (~1300 lines)
docs/              → Reference documents (not served)
```

### Backend (server.py)

- **`http.server.SimpleHTTPRequestHandler`** subclass serving `public/` for static files
- **3 API endpoints:**
  - `GET /api/state` → returns the full app state JSON
  - `PUT /api/state` → overwrites the full app state JSON
  - `POST /api/reset` → resets state to defaults and returns it
- **State is a single JSON blob** stored in one SQLite row (`app_state` table, `id=1`). Not normalized — the entire app state is serialized/deserialized as one unit.
- Server binds to `127.0.0.1` (localhost only)

### Frontend (public/)

- **No framework** — vanilla HTML/CSS/JS with imperative DOM manipulation
- **Syllabus data** is hardcoded in `app.js` as the `SYLLABUS` object (days 1–7, ~720 lines)
- **State shape:**
  ```js
  {
    tasks: {},            // { taskId: boolean } — checkbox states
    journal: {},          // { dayNumber: string } — journal entries per day
    timeLog: {},          // { dayNumber: seconds } — timer logs per day
    customResources: {},  // { taskId: [{ label, url }] } — user-added resources
    activeDay: 1,         // currently selected day tab
    journalDay: 1,        // currently selected journal tab
    startDate: null,      // ISO string, set on first checkbox
    theme: 'dark'         // 'dark' | 'light'
  }
  ```
- **Saves are debounced** (300ms) to batch rapid checkbox clicks into one `PUT /api/state`
- **Theme** uses `localStorage` fast-cache to prevent flash on load, then syncs from SQLite
- **Task IDs** follow pattern: `d{day}{block}{index}` (e.g., `d1m1`, `d2a3`, `d7b2`)
  - Blocks: `m` = morning, `a` = afternoon, `e` = evening, `b` = bonus

### CSS Design System (style.css)

- All colors/spacing/shadows defined as CSS custom properties in `:root`
- Light theme overrides via `[data-theme="light"]` selector
- Uses Inter + JetBrains Mono from Google Fonts
- Glassmorphism header with `backdrop-filter: blur()`
- Responsive breakpoints at 900px, 700px, 480px

## Key Conventions

- **No build step, no dependencies** — this is a core design constraint. Don't add npm, pip, or any external packages.
- **State is a flat JSON blob** — don't try to normalize into multiple SQLite tables. The single-blob approach keeps the server simple.
- **All rendering is in `renderPanels()`** — when state changes visually, call `renderPanels()` then `switchDay(state.activeDay)` to re-render.
- **Interactive elements inside `<label>` wrappers** — use `event.stopPropagation()` on any buttons/inputs inside task items to prevent checkbox toggling.
- **User-provided content** must be escaped via `escapeHtml()` before rendering in innerHTML.

## Running

```bash
python3 server.py                # default port 8080, auto-opens browser
python3 server.py --port 9000    # custom port
python3 server.py --no-browser   # don't auto-open browser
```
