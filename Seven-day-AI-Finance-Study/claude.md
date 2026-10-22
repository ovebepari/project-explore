# 7-Day AI Systems & Finance Study Tracker

## Overview

A self-contained, portable study dashboard for a 7-day intensive bootcamp covering AI/MLOps (80%) and Finance (20%). Built for DevOps/SRE engineers breaking into AI Engineering. Zero external dependencies — runs on Python 3.7+ standard library only.

## Architecture

```
server.py          → Python HTTP server + NDJSON event store (entry point)
db.json            → Append-only event log (one JSON object per line)
public/            → Frontend assets served by the server
  index.html       → Dashboard UI (semantic HTML5)
  style.css        → F13-inspired design system, dark/light themes
  app.js           → All frontend logic + hardcoded syllabus data (~1300 lines)
docs/              → Reference documents (not served)
```

### Storage: Event-Sourced NDJSON

State is **not** stored as a blob. Instead, `db.json` is an append-only event log:

```jsonl
{"t":"2024-01-15T10:00:00Z","op":"snapshot","v":{...full state...}}
{"t":"2024-01-15T10:01:00Z","op":"task","id":"d1m1","v":true}
{"t":"2024-01-15T11:30:00Z","op":"journal","day":1,"v":"Learned about..."}
{"t":"2024-01-15T12:00:00Z","op":"time","day":1,"v":3600}
{"t":"2024-01-15T12:01:00Z","op":"set","k":"theme","v":"light"}
```

**Event types:** `task`, `journal`, `time`, `set`, `res_add`, `res_rm`, `snapshot`, `reset`

On startup, the server replays all events to reconstruct state. On graceful shutdown (Ctrl+C), a `snapshot` event is appended for faster next startup.

### Backend (server.py)

- **`http.server.SimpleHTTPRequestHandler`** subclass serving `public/` for static files
- **3 API endpoints:**
  - `GET /api/state` → returns the reconstructed state (in-memory)
  - `POST /api/event` → appends an event to db.json and applies it
  - `POST /api/reset` → appends a reset event, returns fresh state
- State is held in-memory after replaying the event log
- Each write is `open("db.json", "a").write(json + "\n")` — true append-only
- Server binds to `127.0.0.1` (localhost only)

### Frontend (public/)

- **No framework** — vanilla HTML/CSS/JS with imperative DOM manipulation
- **Syllabus data** is hardcoded in `app.js` as the `SYLLABUS` object (days 1–7)
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
- **Events are posted immediately** — no debouncing needed since each event is ~50 bytes
- **Theme** uses `localStorage` fast-cache to prevent flash on load
- **Task IDs** follow pattern: `d{day}{block}{index}` (e.g., `d1m1`, `d2a3`, `d7b2`)
  - Blocks: `m` = morning, `a` = afternoon, `e` = evening, `b` = bonus

### CSS Design System (style.css)

- F13.com-inspired: dot grid background, yellow accent (#F5C518), thin borders
- All colors/spacing defined as CSS custom properties in `:root`
- Light theme overrides via `[data-theme="light"]` selector
- Uses Inter + JetBrains Mono from Google Fonts
- Square corners, monochrome palette, "+" corner markers
- Responsive breakpoints at 900px, 700px, 480px

## Key Conventions

- **No build step, no dependencies** — this is a core design constraint. Don't add npm, pip, or any external packages.
- **Append-only storage** — never modify or delete lines in db.json. All mutations are new event lines.
- **All rendering is in `renderPanels()`** — when state changes visually, call `renderPanels()` then `switchDay(state.activeDay)`.
- **Interactive elements inside `<label>` wrappers** — use `event.stopPropagation()` on buttons/inputs inside task items.
- **User-provided content** must be escaped via `escapeHtml()` before rendering in innerHTML.
- **postEvent()** sends a single event to `POST /api/event`. Each caller constructs its own event object.

## Running

```bash
python3 server.py                # default port 8080
python3 server.py --port 9000    # custom port
```
