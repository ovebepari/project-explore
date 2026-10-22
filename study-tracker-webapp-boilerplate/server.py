#!/usr/bin/env python3
"""
7-Day AI Systems & Finance Study Tracker
=========================================
Portable Python server with NDJSON event-sourced persistence.
Zero external dependencies — uses only Python's standard library.

Usage:
    python3 server.py              # starts on port 8080
    python3 server.py --port 9000  # custom port

Data is stored in db.json alongside this script as append-only NDJSON.
Each line is a timestamped event. State is rebuilt by replaying the log.
"""

import http.server
import json
import os
import sys
import argparse
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent.resolve()
DB_FILE = ROOT_DIR / "db.json"
LEGACY_DB = ROOT_DIR / "tracker.db"

DEFAULT_STATE = {
    "tasks": {},
    "journal": {},
    "timeLog": {},
    "customResources": {},
    "comments": {},
    "activeDay": 1,
    "journalDay": 1,
    "startDate": None,
    "theme": "dark",
}

# ───────────────────────── Event Store ──────────────────────────

_state = None  # In-memory state, rebuilt from event log on startup


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _deep_copy(obj):
    """Deep copy dicts/lists without importing copy."""
    if isinstance(obj, dict):
        return {k: _deep_copy(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_deep_copy(v) for v in obj]
    return obj


def apply_event(state, event):
    """Apply a single event to the state dict, mutating in place."""
    op = event.get("op")
    if op == "task":
        state["tasks"][event["id"]] = event["v"]
    elif op == "journal":
        day_key = str(event["day"])
        if event.get("v"):
            state["journal"][day_key] = event["v"]
        else:
            state["journal"].pop(day_key, None)
    elif op == "time":
        day_key = str(event["day"])
        state["timeLog"][day_key] = state["timeLog"].get(day_key, 0) + event["v"]
    elif op == "set":
        if event["k"] in DEFAULT_STATE:
            state[event["k"]] = event["v"]
    elif op == "res_add":
        tid = event["id"]
        state.setdefault("customResources", {})
        if tid not in state["customResources"]:
            state["customResources"][tid] = []
        state["customResources"][tid].append(
            {"label": event["label"], "url": event["url"]}
        )
    elif op == "res_rm":
        tid = event["id"]
        cr = state.get("customResources", {})
        if tid in cr:
            idx = event["idx"]
            if 0 <= idx < len(cr[tid]):
                cr[tid].pop(idx)
            if not cr[tid]:
                del cr[tid]
    elif op == "comment_add":
        tid = event["id"]
        state.setdefault("comments", {})
        if tid not in state["comments"]:
            state["comments"][tid] = []
        state["comments"][tid].append(
            {"text": event["v"], "t": event.get("t", "")}
        )
    elif op == "comment_rm":
        tid = event["id"]
        comments = state.get("comments", {})
        if tid in comments:
            idx = event["idx"]
            if 0 <= idx < len(comments[tid]):
                comments[tid].pop(idx)
            if not comments[tid]:
                del comments[tid]
    elif op == "snapshot":
        state.clear()
        state.update(_deep_copy(event["v"]))
    elif op == "reset":
        theme = state.get("theme", "dark")
        state.clear()
        fresh = _deep_copy(DEFAULT_STATE)
        fresh["theme"] = theme
        state.update(fresh)


def load_state():
    """Replay db.json to reconstruct current state."""
    state = _deep_copy(DEFAULT_STATE)
    if DB_FILE.exists():
        with open(DB_FILE, "r", encoding="utf-8") as f:
            for num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    apply_event(state, json.loads(line))
                except (json.JSONDecodeError, KeyError, IndexError) as e:
                    sys.stderr.write(f"  ⚠ Skipping line {num}: {e}\n")
    return state


def append_event(event):
    """Append a timestamped event to db.json and apply it to in-memory state."""
    event["t"] = _now()
    with open(DB_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")
    apply_event(_state, event)


def migrate_from_sqlite():
    """One-time migration: read tracker.db → snapshot in db.json → rename."""
    if not LEGACY_DB.exists():
        return
    try:
        import sqlite3

        conn = sqlite3.connect(str(LEGACY_DB))
        cur = conn.execute("SELECT data FROM app_state WHERE id = 1")
        row = cur.fetchone()
        conn.close()
        if row:
            old_state = json.loads(row[0])
            snapshot = {"t": _now(), "op": "snapshot", "v": old_state}
            with open(DB_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(snapshot, ensure_ascii=False) + "\n")
            sys.stderr.write("  ✓ Migrated state from tracker.db → db.json\n")
        LEGACY_DB.rename(LEGACY_DB.with_suffix(".db.migrated"))
        sys.stderr.write("  ✓ Renamed tracker.db → tracker.db.migrated\n")
    except Exception as e:
        sys.stderr.write(f"  ⚠ Migration failed: {e}\n")


# ───────────────────────── HTTP Handler ──────────────────────────

VALID_OPS = frozenset(
    ("task", "journal", "time", "set", "res_add", "res_rm", "comment_add", "comment_rm")
)

MIME_OVERRIDES = {
    ".js": "application/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
}


class TrackerHandler(http.server.SimpleHTTPRequestHandler):
    """Serves static files from public/ + event-sourced JSON API."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR / "public"), **kwargs)

    # ── Helpers ──

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(length)

    # ── API routes ──

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/state":
            self._send_json(_state)
        else:
            super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/event":
            try:
                event = json.loads(self._read_body())
                if event.get("op") not in VALID_OPS:
                    self._send_json({"error": "invalid op"}, 400)
                    return
                append_event(event)
                self._send_json({"ok": True})
            except Exception as e:
                self._send_json({"error": str(e)}, 400)
        elif path == "/api/reset":
            append_event({"op": "reset"})
            self._send_json(_state)
        else:
            self._send_json({"error": "not found"}, 404)

    # ── Logging ──

    def log_message(self, fmt, *args):
        req = str(args[0]) if args else ""
        if "/api/" in req:
            sys.stderr.write(
                f"  ├─ {self.address_string()} {req} {args[1] if len(args) > 1 else ''}\n"
            )

    def guess_type(self, path):
        ext = Path(path).suffix.lower()
        return MIME_OVERRIDES.get(ext, super().guess_type(path))


# ───────────────────────── Main ──────────────────────────────────


def main():
    global _state

    parser = argparse.ArgumentParser(
        description="7-Day AI Systems & Finance Study Tracker"
    )
    parser.add_argument(
        "--port", "-p", type=int, default=8080, help="Port to serve on (default: 8080)"
    )
    args = parser.parse_args()

    # Migrate from SQLite if needed, then replay event log
    migrate_from_sqlite()
    _state = load_state()

    server = http.server.HTTPServer(("127.0.0.1", args.port), TrackerHandler)

    n_events = 0
    if DB_FILE.exists():
        with open(DB_FILE, "r", encoding="utf-8") as f:
            n_events = sum(1 for line in f if line.strip())

    port_str = str(args.port)
    store_info = f"db.json ({n_events} events)"
    banner = f"""
╔══════════════════════════════════════════════════╗
║  📚  AI Systems & Finance Study Tracker          ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  🌐  http://localhost:{port_str:<25s}       ║
║  💾  Store:   {store_info:<33s} ║
║  📁  Serving: {"public/":<33s} ║
║                                                  ║
║  Press Ctrl+C to stop                            ║
╚══════════════════════════════════════════════════╝
"""
    print(banner)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        # Write snapshot on graceful shutdown for faster next startup
        if _state:
            append_event({"op": "snapshot", "v": _deep_copy(_state)})
            sys.stderr.write("  ✓ Snapshot written on shutdown\n")
        print("\n  👋 Server stopped. Your progress is saved in db.json\n")
        server.server_close()


if __name__ == "__main__":
    main()
