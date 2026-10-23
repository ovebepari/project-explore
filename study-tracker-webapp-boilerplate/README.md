# 📚 Study Tracker

A dynamic, syllabus-driven study tracker you can run anywhere with Docker. Define your study plan in a simple TOML file, track progress with checkboxes, comments, and a timer — all persisted in a git-friendly format.

![Zero dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen) ![Python 3.12](https://img.shields.io/badge/python-3.12--slim-blue) ![Docker](https://img.shields.io/badge/docker-ready-blue)

---

## Quick Start

### Docker (recommended)

```bash
# Pull or build
docker build -t study-tracker .

# Run with default syllabus
docker run -p 8080:8080 study-tracker

# Run with your own syllabus + persistent data
docker run -p 8080:8080 \
  -v ./my-syllabus.toml:/data/syllabus.toml \
  -v ./data:/data \
  study-tracker
```

Open **http://localhost:8080**

### Without Docker

```bash
python3 server.py                     # http://localhost:8080
python3 server.py --port 3000         # custom port
python3 server.py --syllabus path.toml  # custom syllabus
```

Requires Python 3.6+ — zero external dependencies.

---

## How It Works

```
┌─────────────────┐     startup      ┌──────────────┐
│  syllabus.toml  │ ───────────────▶ │   server.py  │
│  (your plan)    │                  │  (Python 3)  │
└─────────────────┘                  └──────┬───────┘
                                            │
                    ┌───────────────────────┬┘
                    ▼                       ▼
             ┌─────────────┐       ┌──────────────┐
             │  db.ndjson   │       │  Browser UI  │
             │  (WAL log)   │       │  (vanilla JS)│
             └─────────────┘       └──────────────┘
```

1. **`syllabus.toml`** defines your study plan (days → blocks → tasks)
2. **`server.py`** parses it on first startup and serves a single-page app
3. **`db.ndjson`** stores all changes as an append-only event log
4. **Browser UI** renders everything dynamically — add days, tasks, comments on the fly

---

## Docker Usage

### Volumes

| Mount point | Purpose |
|-------------|---------|
| `/data/syllabus.toml` | Your custom syllabus (overrides the built-in one) |
| `/data/db.ndjson` | Persisted progress (auto-created) |

### Examples

**Basic — just try it out:**
```bash
docker run -p 8080:8080 study-tracker
```

**Custom syllabus:**
```bash
docker run -p 8080:8080 \
  -v /path/to/my-syllabus.toml:/data/syllabus.toml \
  study-tracker
```

**Persistent data (survives container restart):**
```bash
docker run -p 8080:8080 \
  -v ./data:/data \
  study-tracker
```

**Full setup — custom syllabus + persistent data + custom port:**
```bash
docker run -d --name tracker \
  -p 3000:8080 \
  -v ./my-syllabus.toml:/data/syllabus.toml \
  -v ./data:/data \
  --restart unless-stopped \
  study-tracker
```

**Docker Compose:**
```yaml
# docker-compose.yml
services:
  tracker:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./my-syllabus.toml:/data/syllabus.toml
      - tracker-data:/data
    restart: unless-stopped

volumes:
  tracker-data:
```

### Environment & CLI Flags

The server accepts these flags (set via Docker CMD override if needed):

| Flag | Default | Description |
|------|---------|-------------|
| `--host` | `0.0.0.0` | Bind address |
| `--port` | `8080` | Port |
| `--syllabus` | `/data/syllabus.toml` | Syllabus file path |
| `--db` | `/data/db.ndjson` | Event log file path |

---

## Creating a Syllabus

### Option 1: Write it yourself

```toml
[meta]
title = "My Study Plan"
subtitle = "2-Week Sprint"

[[days]]
title = "Day 1: Getting Started"
subtitle = "Core concepts and first steps"
label = "Basics"

[[days.blocks]]
title = "Morning — Theory"
badge = "morning"
icon = "☀️"

[[days.blocks.tasks]]
text = "Read Chapter 1 and take notes on key definitions."
resources = [{ label = "Textbook", url = "https://example.com" }]

[[days.blocks.tasks]]
text = "Watch the intro lecture (30 min)."

[[days.blocks]]
title = "Afternoon — Practice"
badge = "afternoon"
icon = "🔧"

[[days.blocks.tasks]]
text = "Complete exercises 1-5."

[[days.blocks]]
title = "Evening — Review"
badge = "evening"
icon = "🌙"

[[days.blocks.tasks]]
text = "Summarize what you learned in your own words."
```

### Option 2: Use AI to convert any syllabus

See **[instructions.md](instructions.md)** — it contains a ready-to-use AI prompt template. Just paste your course outline, textbook TOC, or topic list alongside the format spec and any AI will produce a valid `syllabus.toml`.

### Option 3: Build it in the app

Start with a minimal syllabus (or even empty), then use the **+ ADD DAY**, **+ Add block**, and **+ Add task** buttons in the UI to build your plan interactively. Export the result as TOML via the Data panel.

---

## Features

| Feature | Description |
|---------|-------------|
| ✅ **Checkboxes** | Track task completion per day |
| ➕ **Dynamic CRUD** | Add/edit/remove days, blocks, tasks on the fly |
| 💬 **Comments** | Add inline comments to any task |
| ⏱ **Timer** | Session timer with per-day time logging |
| 📓 **Journal** | Per-day journal/notes section |
| 🔗 **Resources** | Attach links to tasks (built-in or custom) |
| 🌗 **Dark/Light** | Theme toggle |
| 📦 **Export/Import** | State (JSON), Syllabus (TOML), Events (NDJSON) |
| ✏️ **Inline Edit** | Click any text to edit — title, days, blocks, tasks |
| 🎉 **Confetti** | Celebration when you complete a day |
| 🔥 **Streak** | Consecutive day completion counter |

---

## Export / Import (Git Workflow)

The app has a **⬇️ Data** button in the header that opens export/import options:

### Export
| Format | File | Contents |
|--------|------|----------|
| **State** | `tracker-state.json` | Everything — structure + progress + journal + comments |
| **Syllabus** | `syllabus.toml` | Structure only — days, blocks, tasks (no progress) |
| **Events** | `db.ndjson` | Raw append-only event log |

### Import
| Format | Effect |
|--------|--------|
| **State `.json`** | Restores everything (structure + progress) |
| **Syllabus `.toml`** | Loads new structure, resets progress |

### Git workflow
```bash
# After a study session — export state from the UI
# Save tracker-state.json to your repo

git add tracker-state.json syllabus.toml
git commit -m "day 3 complete"
git push

# On another machine
git pull
docker run -p 8080:8080 -v ./data:/data study-tracker
# Import tracker-state.json via the UI
```

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/state` | Full current state |
| `POST` | `/api/event` | Append an event |
| `POST` | `/api/reset` | Clear progress (keep structure) |
| `POST` | `/api/reload` | Re-init from syllabus.toml on disk |
| `GET` | `/api/export/state` | Download state as JSON |
| `GET` | `/api/export/syllabus` | Download structure as TOML |
| `GET` | `/api/export/events` | Download event log |
| `POST` | `/api/import/state` | Upload state JSON |
| `POST` | `/api/import/syllabus` | Upload syllabus TOML |

---

## File Structure

```
├── server.py          # Python server (zero deps, stdlib only)
├── syllabus.toml      # Default syllabus (edit or replace)
├── instructions.md    # AI prompt for converting syllabi
├── Dockerfile         # Docker image definition
├── .dockerignore
├── .gitignore
├── public/
│   ├── index.html     # Minimal HTML shell
│   ├── app.js         # Dynamic SPA (vanilla JS)
│   └── style.css      # F13-inspired dark/light theme
└── db.ndjson          # Event log (auto-created, gitignored)
```

---

## License

MIT
