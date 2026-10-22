# 📚 7-Day AI Systems & Finance Study Tracker

A portable, self-contained study dashboard for the **7-Day Systems-First AI, MLOps & Finance Syllabus** — designed for DevOps/SRE engineers breaking into AI Engineering.

![Python](https://img.shields.io/badge/Python-3.7+-3776AB?logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Persistent-003B57?logo=sqlite&logoColor=white)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-34d399)

## ✨ Features

| Feature | Description |
|---|---|
| **📋 Day-by-day tracking** | Every task from all 7 days as interactive checkboxes — Morning, Afternoon, Evening, and Bonus blocks |
| **⏱ Session timer** | Start/pause/stop timer with hours logged per day |
| **📊 Visual dashboard** | Overall progress bar, completion %, streak counter, task/bonus stats |
| **🔗 Resource links** | YouTube playlists, docs, GitHub repos — clickable right next to each task |
| **📝 Daily journal** | Per-day notes section to jot down learnings and takeaways |
| **🎉 Celebrations** | Confetti animation when you complete a day |
| **🌙/☀️ Theme toggle** | Dark and light themes with smooth transitions |
| **💾 SQLite persistence** | All progress saved to a portable `tracker.db` file |

## 🚀 Quick Start

```bash
# Clone or download this folder, then:
python3 server.py
```

That's it. Open `http://localhost:8080` in your browser.

> **Zero dependencies.** No `pip install`, no `npm`, no build step. Just Python 3.7+ (standard library only).

### Options

```bash
python3 server.py                # default port 8080
python3 server.py --port 9000    # custom port
```

## 📁 Project Structure

```
Seven-day-AI-Finance-Study/
├── server.py                        # Python HTTP server + SQLite API
├── tracker.db                       # Your progress (auto-created on first run)
├── public/                          # Frontend assets (served by the server)
│   ├── index.html                   # Dashboard UI
│   ├── style.css                    # Dark/light theme design system
│   └── app.js                       # Frontend logic + syllabus data
├── docs/                            # Reference documents
│   ├── AI Systems & Finance Syllabus.md
│   └── syllabus_analysis.md
└── README.md
```

## 🎒 Portability

Copy the entire folder to a USB drive, another machine, or a cloud VM. All you need:

1. **Python 3.7+** (comes pre-installed on macOS and most Linux distros)
2. That's it

Your progress lives in `tracker.db` — a single SQLite file. Back it up, sync it, or carry it anywhere.

## 📖 The Syllabus

This tracker covers a 7-day intensive bootcamp (8–12 hrs/day) that maps AI concepts to infrastructure mental models you already know:

| Day | Topic | SRE Mental Model |
|---|---|---|
| **1** | Linear Algebra, MatMul & Autograd | The Math Kernel |
| **2** | Transformer Internals & LLM Lifecycle | Docker OverlayFS, CI/CD pipelines |
| **3** | GPU Architecture, SIMD & Parallel Computing | CPU cache hierarchy, NUMA topology |
| **4** | Local CPU Inference (llama.cpp) | Memory bandwidth profiling |
| **5** | Inference Engineering (vLLM, Vast.ai) | PagedAttention = OS virtual memory |
| **6** | Vector DBs, RAG & Agentic Loops | HNSW = skip-list graph, ReAct = while loop |
| **7** | Production MLOps, Vertex AI & Capstone | CT pipelines, LLM observability |

Each day also includes a **Finance** evening session (20% of study time) covering value creation, accounting, unit economics, pricing, and business model design.

## 🛠 Tech Stack

- **Backend:** Python `http.server` + `sqlite3` (standard library only)
- **Frontend:** Vanilla HTML / CSS / JavaScript
- **Storage:** SQLite with WAL journal mode
- **Fonts:** [Inter](https://fonts.google.com/specimen/Inter) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

## 📄 License

This is a personal study tool. The syllabus content was generated via a Gemini conversation. Use it however you like.
