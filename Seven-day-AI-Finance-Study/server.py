#!/usr/bin/env python3
"""
7-Day AI Systems & Finance Study Tracker
=========================================
Portable Python server with SQLite persistence.
Zero external dependencies — uses only Python's standard library.

Usage:
    python3 server.py              # starts on port 8080
    python3 server.py --port 9000  # custom port

Data is stored in tracker.db alongside this script.
Copy the whole folder to any machine with Python 3.7+ and it just works.
"""

import http.server
import json
import sqlite3
import os
import sys
import webbrowser
import threading
import argparse
from pathlib import Path
from urllib.parse import urlparse

ROOT_DIR = Path(__file__).parent.resolve()
DB_FILE = ROOT_DIR / "tracker.db"

DEFAULT_STATE = {
    "tasks": {},
    "journal": {},
    "timeLog": {},
    "activeDay": 1,
    "journalDay": 1,
    "startDate": None,
    "theme": "dark",
}


# ───────────────────────── Database ──────────────────────────

def get_connection():
    """Thread-local SQLite connection (http.server is single-threaded, but just in case)."""
    conn = sqlite3.connect(str(DB_FILE))
    conn.execute("PRAGMA journal_mode=WAL")  # safer for concurrent reads
    return conn


def init_db():
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS app_state (
            id    INTEGER PRIMARY KEY CHECK (id = 1),
            data  TEXT NOT NULL
        )
        """
    )
    # Seed with default state if empty
    cur = conn.execute("SELECT COUNT(*) FROM app_state")
    if cur.fetchone()[0] == 0:
        conn.execute(
            "INSERT INTO app_state (id, data) VALUES (1, ?)",
            [json.dumps(DEFAULT_STATE)],
        )
    conn.commit()
    conn.close()


def db_get_state() -> dict:
    conn = get_connection()
    cur = conn.execute("SELECT data FROM app_state WHERE id = 1")
    row = cur.fetchone()
    conn.close()
    if row:
        return json.loads(row[0])
    return DEFAULT_STATE.copy()


def db_save_state(state: dict):
    conn = get_connection()
    conn.execute(
        "UPDATE app_state SET data = ? WHERE id = 1",
        [json.dumps(state, ensure_ascii=False)],
    )
    conn.commit()
    conn.close()


def db_reset_state():
    conn = get_connection()
    conn.execute(
        "UPDATE app_state SET data = ? WHERE id = 1",
        [json.dumps(DEFAULT_STATE)],
    )
    conn.commit()
    conn.close()


# ───────────────────── HTTP Handler ──────────────────────────

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
    """Serves static files + a tiny JSON REST API for state persistence."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    # ── API routes ──

    def _send_json(self, data: dict, status: int = 200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(length)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/state":
            self._send_json(db_get_state())
        else:
            super().do_GET()

    def do_PUT(self):
        path = urlparse(self.path).path
        if path == "/api/state":
            try:
                state = json.loads(self._read_body())
                db_save_state(state)
                self._send_json({"ok": True})
            except Exception as e:
                self._send_json({"error": str(e)}, status=400)
        else:
            self._send_json({"error": "not found"}, status=404)

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/reset":
            db_reset_state()
            self._send_json(db_get_state())
        else:
            self._send_json({"error": "not found"}, status=404)

    # ── Logging ──

    def log_message(self, fmt, *args):
        # Only log API calls, not every static file fetch
        req = args[0] if args else ""
        if "/api/" in req:
            sys.stderr.write(
                f"  ├─ {self.address_string()} {req} {args[1] if len(args) > 1 else ''}\n"
            )

    def guess_type(self, path):
        ext = Path(path).suffix.lower()
        return MIME_OVERRIDES.get(ext, super().guess_type(path))


# ───────────────────── Main ──────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="7-Day AI Systems & Finance Study Tracker"
    )
    parser.add_argument(
        "--port", "-p", type=int, default=8080, help="Port to serve on (default: 8080)"
    )
    parser.add_argument(
        "--no-browser", action="store_true", help="Don't auto-open browser"
    )
    args = parser.parse_args()

    init_db()

    server = http.server.HTTPServer(("127.0.0.1", args.port), TrackerHandler)

    port_str = str(args.port)
    banner = f"""
╔══════════════════════════════════════════════════╗
║  📚  AI Systems & Finance Study Tracker          ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  🌐  http://localhost:{port_str:<25s}       ║
║  💾  Database: {DB_FILE.name:<33s} ║
║  📁  Serving:  {str(ROOT_DIR.name) + '/':<33s} ║
║                                                  ║
║  Press Ctrl+C to stop                            ║
╚══════════════════════════════════════════════════╝
"""
    print(banner)

    if not args.no_browser:
        threading.Timer(
            0.5, lambda: webbrowser.open(f"http://localhost:{args.port}")
        ).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  👋 Server stopped. Your progress is saved in tracker.db\n")
        server.server_close()


if __name__ == "__main__":
    main()
