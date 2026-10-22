# Study Tracker Webapp — Boilerplate

A 7-day study tracker webapp with task checkboxes, session timer, daily journal, progress stats, Google Docs-style comments, and custom resource links. Zero dependencies — runs on Python's standard library.

## Quick Start

```bash
python3 server.py          # starts on http://localhost:8080
python3 server.py --port 3000   # custom port
```

## Architecture

```
├── server.py              # Python stdlib HTTP server + NDJSON event store
├── public/
│   ├── index.html         # Single-page app shell
│   ├── style.css          # f13.com-inspired dark/light theme (do not edit)
│   └── app.js             # ✏️ SYLLABUS lives here — this is what you edit
└── db.json                # Auto-created append-only event log
```

## How to Add Your Syllabus

**You only need to edit 2 files:** `public/app.js` (the SYLLABUS object) and `public/index.html` (titles + day pill labels).

### 1. Edit `public/app.js` — Replace the SYLLABUS object

The SYLLABUS is a JS object keyed by day number (1–7). Each day has:

```javascript
const SYLLABUS = {
  1: {
    title: "Day 1: Topic Name",          // shown as panel header
    subtitle: "Brief description",        // shown below title
    blocks: [                             // array of collapsible blocks
      {
        id: "d1-morning",                 // unique block id
        title: "Morning — Block Name",    // collapsible header text
        badge: "morning",                 // "morning" | "afternoon" | "evening" | "bonus"
        icon: "☀️",                       // emoji for the header
        isBonus: false,                   // true = doesn't count toward main progress
        tasks: [
          {
            id: "d1m1",                   // GLOBALLY UNIQUE task id
            text: "Task description...",  // what to do
            resources: [                  // optional links
              { label: "Link Name", url: "https://..." }
            ]
          }
        ]
      }
    ]
  },
  // ... days 2–7
};
```

**ID convention:** `d{day}{block_letter}{number}` — e.g. `d3a2` = Day 3, Afternoon, Task 2.

### 2. Edit `public/index.html` — Customize labels

Search for `✏️ CUSTOMIZE` comments. You need to update:
- `<title>` and `<h1>` — your study plan name
- Day pill labels — short topic names for each day tab
- Timer day count, journal tabs — match your day count
- Footer text

### Rules

- **Task IDs must be globally unique** across all days/blocks
- **Badge must be one of:** `morning`, `afternoon`, `evening`, `bonus`
- **`isBonus: true`** blocks are tracked separately (bonus tasks counter)
- **Resources are optional** — tasks without resources just show the checkbox + text
- **Users can add custom resources** at runtime via the "+ Resource" button
- **Days 1–7 are hardcoded** in the HTML (day pills, timer, journal tabs). If you need fewer/more days, edit those HTML sections too.

## Features Included

| Feature | How it works |
|---------|-------------|
| ✅ Task checkboxes | Click to complete, progress updates in real-time |
| ⏱️ Session timer | Start/pause/stop, logs hours per day |
| 📝 Daily journal | One textarea per day, auto-saved |
| 📊 Stats dashboard | Tasks done, hours, streak, bonus count |
| 💬 Comments | Google Docs-style — always visible on the right |
| 🔗 Custom resources | Add your own links to any task |
| 🌓 Dark/Light theme | Toggle in header, persisted |
| 🎊 Confetti | Fires when you complete a day! |
| 💾 Persistence | Append-only NDJSON event log (db.json) |

## Storage

All state is stored in `db.json` as an append-only NDJSON event log. Each line is one event:

```json
{"t":"2026-01-01T00:00:00Z","op":"task","id":"d1m1","v":true}
{"t":"2026-01-01T00:01:00Z","op":"comment_add","id":"d1m2","v":"review this"}
{"t":"2026-01-01T12:00:00Z","op":"snapshot","v":{...full state...}}
```

On startup, the server replays all events to reconstruct state. On graceful shutdown, it appends a snapshot. Reset via the ↻ button in the UI.

## No Dependencies

- **Server:** Python 3.6+ standard library only (http.server, json)
- **Frontend:** Vanilla HTML/CSS/JS, Google Fonts (Inter, JetBrains Mono)
- **No npm, no build step, no node_modules**
