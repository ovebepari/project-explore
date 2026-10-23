# Converting Any Syllabus to `syllabus.toml`

> **Purpose**: Give this file + your syllabus content to any AI (ChatGPT, Claude, Gemini, etc.) and ask it to produce a `syllabus.toml` you can directly load into the Study Tracker app.

---

## Prompt Template

Copy-paste this into your AI chat, replacing the placeholder:

```
I have a study syllabus that I want to convert into a specific TOML format
for a study tracker app. Read the format specification below, then convert
my syllabus into a valid `syllabus.toml` file.

FORMAT SPECIFICATION:
<paste everything from the "Format Specification" section below>

MY SYLLABUS:
<paste your syllabus here — can be any format: PDF text, bullet points,
 course outline, markdown, table of contents, or even just a topic list>
```

---

## Format Specification

### Overview

The file is a [TOML](https://toml.io/) configuration with this hierarchy:

```
[meta]               → App title and subtitle
[[days]]             → One entry per study day/session
  [[days.blocks]]    → Time blocks within a day (morning, afternoon, etc.)
    [[days.blocks.tasks]]  → Individual tasks (become checkboxes)
```

### Schema

```toml
# ─── Required: App metadata ───
[meta]
title = "string"       # App title shown in header (e.g. "ML Study Plan")
subtitle = "string"    # Subtitle/tagline (e.g. "8-Week Sprint")

# ─── One [[days]] entry per study session ───
[[days]]
title = "string"       # Full title (e.g. "Day 1: Linear Algebra Foundations")
subtitle = "string"    # Description (e.g. "Vectors, matrices, and transforms")
label = "string"       # Short label for the nav pill (e.g. "LinAlg")

# ─── One or more [[days.blocks]] per day ───
[[days.blocks]]
title = "string"       # Block title (e.g. "Morning — Theory")
badge = "string"       # One of: "morning", "afternoon", "evening", "bonus"
icon = "string"        # Emoji icon (e.g. "☀️", "🔧", "🌙", "⭐")
is_bonus = false       # Optional. Set to true for bonus/optional blocks

# ─── One or more [[days.blocks.tasks]] per block ───
[[days.blocks.tasks]]
text = "string"        # Task description (becomes a checkbox)
resources = [          # Optional. List of resource links
  { label = "string", url = "string" }
]
```

### Field Reference

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `meta.title` | ✅ | string | App header title |
| `meta.subtitle` | ✅ | string | Tagline under the title |
| `days[].title` | ✅ | string | Shown as the day panel heading |
| `days[].subtitle` | ✅ | string | Description below the heading |
| `days[].label` | ✅ | string | Short label for the navigation pill (1-2 words) |
| `blocks[].title` | ✅ | string | Block heading (include time of day if relevant) |
| `blocks[].badge` | ✅ | string | `"morning"`, `"afternoon"`, `"evening"`, or `"bonus"` |
| `blocks[].icon` | ✅ | string | Single emoji: `"☀️"` / `"🔧"` / `"🌙"` / `"⭐"` |
| `blocks[].is_bonus` | ❌ | bool | Default `false`. Set `true` for optional content |
| `tasks[].text` | ✅ | string | Actionable task description |
| `tasks[].resources` | ❌ | array | Links: `[{ label = "...", url = "..." }]` |

### Badge + Icon Conventions

| Badge | Icon | When to use |
|-------|------|-------------|
| `"morning"` | `"☀️"` | First block of the day, theory, reading |
| `"afternoon"` | `"🔧"` | Hands-on practice, exercises, projects |
| `"evening"` | `"🌙"` | Review, reflection, synthesis, journaling |
| `"bonus"` | `"⭐"` | Optional deep-dives, extra credit (set `is_bonus = true`) |

---

## Complete Example

```toml
[meta]
title = "Machine Learning Foundations"
subtitle = "7-Day Study Sprint"

# ── Day 1 ──
[[days]]
title = "Day 1: Linear Algebra Review"
subtitle = "Vectors, matrices, eigenvalues — the math behind ML"
label = "LinAlg"

[[days.blocks]]
title = "Morning — Core Theory"
badge = "morning"
icon = "☀️"

[[days.blocks.tasks]]
text = "Read Chapter 2 of 'Mathematics for Machine Learning': Linear Algebra. Take notes on key definitions (span, basis, rank)."
resources = [{ label = "MML Book Ch.2", url = "https://mml-book.github.io/book/chapter02.pdf" }]

[[days.blocks.tasks]]
text = "Watch 3Blue1Brown 'Essence of Linear Algebra' playlist (episodes 1-4, ~45 min total)."
resources = [{ label = "3B1B Playlist", url = "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" }]

[[days.blocks]]
title = "Afternoon — Practice Problems"
badge = "afternoon"
icon = "🔧"

[[days.blocks.tasks]]
text = "Complete exercises 2.1–2.10 from MML book. Show full working."

[[days.blocks.tasks]]
text = "Implement matrix multiplication from scratch in Python/NumPy. Verify against np.matmul()."

[[days.blocks]]
title = "Evening — Review & Reflect"
badge = "evening"
icon = "🌙"

[[days.blocks.tasks]]
text = "Summarize today's key concepts in your own words. Write down 3 things you found surprising."

[[days.blocks.tasks]]
text = "Create flashcards for: determinant, eigenvalue, eigenvector, singular value, rank."

[[days.blocks]]
title = "Bonus Deep-Dives"
badge = "bonus"
icon = "⭐"
is_bonus = true

[[days.blocks.tasks]]
text = "Read Gilbert Strang's 'The Four Fundamental Subspaces' paper."
resources = [{ label = "Strang Paper", url = "https://example.com/strang-subspaces" }]

# ── Day 2 ──
[[days]]
title = "Day 2: Probability & Statistics"
subtitle = "Distributions, Bayes' theorem, and maximum likelihood"
label = "Prob/Stats"

[[days.blocks]]
title = "Morning — Probability Foundations"
badge = "morning"
icon = "☀️"

[[days.blocks.tasks]]
text = "Read MML Chapter 6: Probability and Distributions. Focus on Gaussian, Bernoulli, and Categorical distributions."

[[days.blocks.tasks]]
text = "Work through the Bayes' theorem derivation. Solve 5 practice problems."

[[days.blocks]]
title = "Afternoon — Hands-On"
badge = "afternoon"
icon = "🔧"

[[days.blocks.tasks]]
text = "Implement a Naive Bayes classifier from scratch in Python. Test on a simple text classification dataset."

[[days.blocks]]
title = "Evening — Synthesis"
badge = "evening"
icon = "🌙"

[[days.blocks.tasks]]
text = "Write a 1-page summary connecting probability to machine learning. How does MLE relate to model training?"
```

---

## Tips for Good Syllabi

### Writing effective task descriptions
- **Be specific**: "Read Chapter 3, sections 3.1–3.4" not "Read the textbook"
- **Be actionable**: Start with a verb — "Implement", "Read", "Watch", "Solve", "Write"
- **Include scope**: "Complete exercises 1–10" not "Do some exercises"
- **Add context**: "Focus on the gradient descent intuition" helps guide study

### Structuring days
- **3-4 blocks per day** is the sweet spot (morning theory → afternoon practice → evening review)
- **5-8 tasks per day** total — enough to feel progress, not so many it's overwhelming
- **Always include an evening review block** — reflection cements learning
- **Add bonus blocks** for motivated learners — keeps the core manageable

### Handling different syllabus formats

| Your input | How to structure it |
|------------|-------------------|
| Course with weekly modules | Each module → one `[[days]]` entry |
| Textbook with chapters | Each chapter or chapter group → one day |
| Video course with sections | Each section → one day, videos as tasks |
| Topic list (no structure) | Group related topics into 3-5 per day |
| Exam prep / revision | One day per subject, blocks by topic area |
| Multi-week bootcamp | Each day of the bootcamp → one `[[days]]` entry |

### What the app does with this file
1. Server reads `syllabus.toml` on first startup
2. Days appear as navigation pills at the top
3. Blocks appear as collapsible cards within each day
4. Tasks become checkboxes you can check off
5. Resources appear as clickable links under each task
6. All progress is saved in `db.ndjson` (append-only event log)
7. You can add more days, blocks, tasks, and comments dynamically in the UI
8. Export your progress as JSON or re-export the modified syllabus as TOML

---

## Loading Into the App

### Option A: File replacement (before first run)
```bash
cp my-syllabus.toml syllabus.toml
python3 server.py
```

### Option B: Docker volume mount
```bash
docker run -p 8080:8080 \
  -v ./my-syllabus.toml:/data/syllabus.toml \
  -v ./data:/data \
  study-tracker
```

### Option C: Import via UI (while running)
1. Click the ⬇️ **Data** button in the header
2. Click **Load Syllabus `.toml`**
3. Select your file
4. Confirm — the app reloads with the new syllabus

### Option D: API
```bash
curl -X POST http://localhost:8080/api/import/syllabus \
  -H 'Content-Type: text/plain' \
  --data-binary @my-syllabus.toml
```
