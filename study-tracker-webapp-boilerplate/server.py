#!/usr/bin/env python3
"""
Study Tracker — Generalized Server
====================================
Loads syllabus from syllabus.toml, persists state in db.ndjson.
Zero external dependencies — uses only Python's standard library.

Usage:
    python3 server.py
    python3 server.py --port 9000
    python3 server.py --host 0.0.0.0 --syllabus /data/syllabus.toml
"""

import http.server
import json
import os
import sys
import argparse
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime, timezone

# ───────────────────────── TOML Parser ──────────────────────────
# Use tomllib (Python 3.11+) or tomli, with built-in fallback.

try:
    import tomllib
except ImportError:
    try:
        import tomli as tomllib  # type: ignore
    except ImportError:
        tomllib = None  # type: ignore


def _split_top_level(s, sep):
    """Split string by separator at the top level (respecting brackets/quotes)."""
    parts, depth_sq, depth_cu, in_str, cur = [], 0, 0, None, []
    for c in s:
        if c in ('"', "'") and in_str is None:
            in_str = c; cur.append(c)
        elif c == in_str:
            in_str = None; cur.append(c)
        elif in_str:
            cur.append(c)
        elif c == '[': depth_sq += 1; cur.append(c)
        elif c == ']': depth_sq -= 1; cur.append(c)
        elif c == '{': depth_cu += 1; cur.append(c)
        elif c == '}': depth_cu -= 1; cur.append(c)
        elif c == sep and depth_sq == 0 and depth_cu == 0:
            parts.append(''.join(cur)); cur = []
        else:
            cur.append(c)
    if cur:
        parts.append(''.join(cur))
    return parts


def _parse_basic_string(s):
    """Parse a basic TOML quoted string."""
    i, result = 1, []
    while i < len(s):
        c = s[i]
        if c == '\\' and i + 1 < len(s):
            nc = s[i + 1]
            result.append({'n': '\n', 't': '\t', '"': '"', '\\': '\\'}
                          .get(nc, '\\' + nc))
            i += 2
        elif c == '"':
            break
        else:
            result.append(c); i += 1
    return ''.join(result)


def _parse_value(s):
    """Parse a TOML value (string, bool, int, float, array, inline table)."""
    s = s.strip()
    if s.startswith('"'):
        return _parse_basic_string(s)
    if s.startswith("'"):
        end = s.index("'", 1)
        return s[1:end]
    if s == 'true':
        return True
    if s == 'false':
        return False
    if s.startswith('['):
        inner = s[1:s.rindex(']')].strip()
        if not inner:
            return []
        items = _split_top_level(inner, ',')
        return [_parse_value(it.strip()) for it in items if it.strip()]
    if s.startswith('{'):
        inner = s[1:s.rindex('}')].strip()
        if not inner:
            return {}
        result = {}
        for pair in _split_top_level(inner, ','):
            pair = pair.strip()
            if '=' in pair:
                k, v = pair.split('=', 1)
                result[k.strip()] = _parse_value(v.strip())
        return result
    try:
        return int(s)
    except ValueError:
        pass
    try:
        return float(s)
    except ValueError:
        pass
    return s


def _strip_inline_comment(s):
    """Strip trailing # comment from a value line, respecting strings."""
    in_str = None
    for i, c in enumerate(s):
        if c in ('"', "'") and in_str is None:
            in_str = c
        elif c == in_str:
            in_str = None
        elif c == '#' and in_str is None:
            return s[:i].rstrip()
    return s


def _navigate_aot(root, parts):
    """Navigate for [[array.of.tables]] syntax."""
    current = root
    for i, part in enumerate(parts):
        if i < len(parts) - 1:
            if part not in current:
                current[part] = [{}]
            current = current[part][-1]
        else:
            if part not in current:
                current[part] = []
            new_entry = {}
            current[part].append(new_entry)
            return new_entry
    return current


def _navigate_table(root, parts):
    """Navigate for [table.path] syntax."""
    current = root
    for part in parts:
        if part not in current:
            current[part] = {}
        current = current[part]
    return current


def parse_toml_str(text):
    """Parse a subset of TOML sufficient for syllabus files."""
    result = {}
    current = result
    lines = text.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line or line.startswith('#'):
            i += 1
            continue
        if line.startswith('[[') and line.endswith(']]'):
            path = line[2:-2].strip().split('.')
            current = _navigate_aot(result, path)
            i += 1
            continue
        # Check for [table] but NOT [array_value — bracket count must balance
        if line.startswith('[') and line.endswith(']') and '=' not in line:
            path = line[1:-1].strip().split('.')
            current = _navigate_table(result, path)
            i += 1
            continue
        if '=' in line:
            eq = line.index('=')
            key = line[:eq].strip()
            val_str = _strip_inline_comment(line[eq + 1:].strip())
            # Handle multi-line arrays/inline-tables: join lines until balanced
            open_sq = val_str.count('[') - val_str.count(']')
            open_cu = val_str.count('{') - val_str.count('}')
            while (open_sq > 0 or open_cu > 0) and i + 1 < len(lines):
                i += 1
                next_line = lines[i].strip()
                if not next_line or next_line.startswith('#'):
                    continue
                val_str += ' ' + next_line
                open_sq = val_str.count('[') - val_str.count(']')
                open_cu = val_str.count('{') - val_str.count('}')
            current[key] = _parse_value(val_str)
        i += 1
    return result


def load_toml(path):
    """Load and parse a TOML file."""
    if tomllib is not None:
        with open(path, "rb") as f:
            return tomllib.load(f)
    with open(path, "r", encoding="utf-8") as f:
        return parse_toml_str(f.read())


# ───────────────────────── Config ────────────────────────────────

ROOT_DIR = Path(__file__).parent.resolve()

# These are set in main() from CLI args
DB_FILE = ROOT_DIR / "db.ndjson"
SYLLABUS_FILE = ROOT_DIR / "syllabus.toml"


# ───────────────────────── State ─────────────────────────────────

_state = None  # In-memory state, rebuilt from TOML + event log


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _deep_copy(obj):
    """Deep copy dicts/lists without importing copy."""
    if isinstance(obj, dict):
        return {k: _deep_copy(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_deep_copy(v) for v in obj]
    return obj


def make_default_state():
    return {
        "meta": {"title": "Study Tracker", "subtitle": ""},
        "days": [],
        "checked": {},
        "journal": {},
        "timeLog": {},
        "customResources": {},
        "comments": {},
        "activeDay": "",
        "journalDay": "",
        "startDate": None,
        "theme": "dark",
    }


def toml_to_state(toml_data):
    """Convert parsed TOML into the internal state structure."""
    meta = toml_data.get("meta", {"title": "Study Tracker", "subtitle": ""})
    days = []

    for di, raw_day in enumerate(toml_data.get("days", []), 1):
        day_id = f"day-{di}"
        blocks = []
        for bi, raw_block in enumerate(raw_day.get("blocks", []), 1):
            block_id = f"{day_id}-blk-{bi}"
            tasks = []
            for ti, raw_task in enumerate(raw_block.get("tasks", []), 1):
                task_id = f"{block_id}-task-{ti}"
                tasks.append({
                    "id": task_id,
                    "text": raw_task.get("text", ""),
                    "resources": raw_task.get("resources", []),
                })
            blocks.append({
                "id": block_id,
                "title": raw_block.get("title", ""),
                "badge": raw_block.get("badge", "morning"),
                "icon": raw_block.get("icon", "📌"),
                "isBonus": raw_block.get("is_bonus", False),
                "tasks": tasks,
            })
        days.append({
            "id": day_id,
            "title": raw_day.get("title", f"Day {di}"),
            "subtitle": raw_day.get("subtitle", ""),
            "label": raw_day.get("label", f"Day {di}"),
            "blocks": blocks,
        })

    first_day = days[0]["id"] if days else ""
    state = make_default_state()
    state["meta"] = meta
    state["days"] = days
    state["activeDay"] = first_day
    state["journalDay"] = first_day
    return state


# ───────────────────────── Event Store ───────────────────────────

VALID_OPS = frozenset((
    "task", "journal", "time", "set",
    "res_add", "res_rm",
    "comment_add", "comment_rm",
    "meta_edit",
    "day_add", "day_rm", "day_edit",
    "block_add", "block_rm", "block_edit",
    "task_add", "task_rm", "task_edit",
))


def apply_event(state, event):
    """Apply a single event to the state dict, mutating in place."""
    op = event.get("op")

    # ── Progress events ──
    if op == "task":
        state["checked"][event["id"]] = event["v"]

    elif op == "journal":
        day_id = str(event.get("dayId", event.get("day", "")))
        if event.get("v"):
            state["journal"][day_id] = event["v"]
        else:
            state["journal"].pop(day_id, None)

    elif op == "time":
        day_id = str(event.get("dayId", event.get("day", "")))
        state["timeLog"][day_id] = state["timeLog"].get(day_id, 0) + event["v"]

    elif op == "set":
        key = event["k"]
        if key in ("activeDay", "journalDay", "startDate", "theme"):
            state[key] = event["v"]

    elif op == "res_add":
        tid = event["id"]
        cr = state.setdefault("customResources", {})
        if tid not in cr:
            cr[tid] = []
        cr[tid].append({"label": event["label"], "url": event["url"]})

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
        cm = state.setdefault("comments", {})
        if tid not in cm:
            cm[tid] = []
        cm[tid].append({"text": event["v"], "t": event.get("t", "")})

    elif op == "comment_rm":
        tid = event["id"]
        cm = state.get("comments", {})
        if tid in cm:
            idx = event["idx"]
            if 0 <= idx < len(cm[tid]):
                cm[tid].pop(idx)
            if not cm[tid]:
                del cm[tid]

    # ── Structural events ──
    elif op == "day_add":
        day = _deep_copy(event["day"])
        day.setdefault("blocks", [])
        state["days"].append(day)

    elif op == "day_rm":
        day_id = event["id"]
        state["days"] = [d for d in state["days"] if d["id"] != day_id]
        # If active day was removed, switch to first
        if state.get("activeDay") == day_id:
            state["activeDay"] = state["days"][0]["id"] if state["days"] else ""
        if state.get("journalDay") == day_id:
            state["journalDay"] = state["days"][0]["id"] if state["days"] else ""

    elif op == "day_edit":
        day_id = event["id"]
        for day in state["days"]:
            if day["id"] == day_id:
                for k in ("title", "subtitle", "label"):
                    if k in event:
                        day[k] = event[k]
                break

    elif op == "block_add":
        day_id = event["dayId"]
        block = _deep_copy(event["block"])
        block.setdefault("tasks", [])
        for day in state["days"]:
            if day["id"] == day_id:
                day["blocks"].append(block)
                break

    elif op == "block_rm":
        block_id = event["id"]
        for day in state["days"]:
            day["blocks"] = [b for b in day["blocks"] if b["id"] != block_id]

    elif op == "task_add":
        block_id = event["blockId"]
        task = _deep_copy(event["task"])
        task.setdefault("resources", [])
        for day in state["days"]:
            for block in day["blocks"]:
                if block["id"] == block_id:
                    block["tasks"].append(task)
                    return

    elif op == "task_rm":
        task_id = event["id"]
        for day in state["days"]:
            for block in day["blocks"]:
                block["tasks"] = [t for t in block["tasks"] if t["id"] != task_id]
        state["checked"].pop(task_id, None)
        state.get("customResources", {}).pop(task_id, None)
        state.get("comments", {}).pop(task_id, None)

    elif op == "task_edit":
        task_id = event["id"]
        for day in state["days"]:
            for block in day["blocks"]:
                for task in block["tasks"]:
                    if task["id"] == task_id:
                        if "text" in event:
                            task["text"] = event["text"]
                        return

    elif op == "meta_edit":
        meta = state.setdefault("meta", {})
        for k in ("title", "subtitle"):
            if k in event:
                meta[k] = event[k]

    elif op == "block_edit":
        block_id = event["id"]
        for day in state["days"]:
            for block in day["blocks"]:
                if block["id"] == block_id:
                    for k in ("title", "badge", "icon", "isBonus"):
                        if k in event:
                            block[k] = event[k]
                    break

    elif op == "snapshot":
        state.clear()
        state.update(_deep_copy(event["v"]))

    elif op == "reset":
        theme = state.get("theme", "dark")
        days = _deep_copy(state.get("days", []))
        meta = _deep_copy(state.get("meta", {}))
        state.clear()
        state.update(make_default_state())
        state["meta"] = meta
        state["days"] = days
        state["theme"] = theme
        if days:
            state["activeDay"] = days[0]["id"]
            state["journalDay"] = days[0]["id"]


def load_state():
    """Load initial state from TOML, then replay db.ndjson events."""
    # Start from syllabus.toml
    if SYLLABUS_FILE.exists():
        try:
            toml_data = load_toml(str(SYLLABUS_FILE))
            state = toml_to_state(toml_data)
            sys.stderr.write(f"  ✓ Loaded syllabus from {SYLLABUS_FILE.name}\n")
        except Exception as e:
            sys.stderr.write(f"  ⚠ Failed to parse syllabus: {e}\n")
            state = make_default_state()
    else:
        sys.stderr.write(f"  ⚠ No syllabus.toml found, starting empty\n")
        state = make_default_state()

    # Replay event log
    if DB_FILE.exists():
        with open(DB_FILE, "r", encoding="utf-8") as f:
            for num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    apply_event(state, json.loads(line))
                except (json.JSONDecodeError, KeyError, IndexError, TypeError) as e:
                    sys.stderr.write(f"  ⚠ Skipping line {num}: {e}\n")

    return state


def append_event(event):
    """Append a timestamped event to db.ndjson and apply it in-memory."""
    event["t"] = _now()
    with open(DB_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")
    apply_event(_state, event)


def reload_from_toml():
    """Re-initialize state from syllabus.toml, truncating the event log."""
    global _state
    if not SYLLABUS_FILE.exists():
        return None
    toml_data = load_toml(str(SYLLABUS_FILE))
    _state = toml_to_state(toml_data)
    with open(DB_FILE, "w", encoding="utf-8") as f:
        snapshot = {"t": _now(), "op": "snapshot", "v": _deep_copy(_state)}
        f.write(json.dumps(snapshot, ensure_ascii=False) + "\n")
    return _state


# ───────────────────────── TOML Writer ───────────────────────────

def _toml_escape(s):
    """Escape a string for TOML double-quoted format."""
    return (s
            .replace('\\', '\\\\')
            .replace('"', '\\"')
            .replace('\n', '\\n')
            .replace('\t', '\\t'))


def state_to_toml(state):
    """Convert internal state back to a TOML syllabus string."""
    lines = [
        '# Study Tracker — Exported Syllabus',
        f'# Exported at {_now()}',
        '',
        '[meta]',
        f'title = "{_toml_escape(state.get("meta", {}).get("title", "Study Tracker"))}"',
        f'subtitle = "{_toml_escape(state.get("meta", {}).get("subtitle", ""))}"',
        '',
    ]

    for day in state.get('days', []):
        lines.append('[[days]]')
        lines.append(f'title = "{_toml_escape(day.get("title", ""))}"')
        lines.append(f'subtitle = "{_toml_escape(day.get("subtitle", ""))}"')
        lines.append(f'label = "{_toml_escape(day.get("label", ""))}"')
        lines.append('')

        for block in day.get('blocks', []):
            lines.append('[[days.blocks]]')
            lines.append(f'title = "{_toml_escape(block.get("title", ""))}"')
            lines.append(f'badge = "{_toml_escape(block.get("badge", "morning"))}"')
            lines.append(f'icon = "{_toml_escape(block.get("icon", ""))}"')
            if block.get('isBonus'):
                lines.append('is_bonus = true')
            lines.append('')

            for task in block.get('tasks', []):
                lines.append('[[days.blocks.tasks]]')
                lines.append(f'text = "{_toml_escape(task.get("text", ""))}"')
                resources = task.get('resources', [])
                if resources:
                    parts = []
                    for r in resources:
                        parts.append(
                            f'{{ label = "{_toml_escape(r.get("label", ""))}", '
                            f'url = "{_toml_escape(r.get("url", ""))}" }}'
                        )
                    lines.append(f'resources = [{(", ".join(parts))}]')
                lines.append('')

    return '\n'.join(lines)


def import_state_data(imported):
    """Import a full state JSON dict, replacing current state."""
    global _state
    if not isinstance(imported, dict) or "days" not in imported:
        return {"error": "Invalid state: must be a JSON object with 'days'"}
    _state = imported
    _state.setdefault("meta", {"title": "Study Tracker", "subtitle": ""})
    _state.setdefault("checked", {})
    _state.setdefault("journal", {})
    _state.setdefault("timeLog", {})
    _state.setdefault("customResources", {})
    _state.setdefault("comments", {})
    _state.setdefault("activeDay", _state["days"][0]["id"] if _state["days"] else "")
    _state.setdefault("journalDay", _state["days"][0]["id"] if _state["days"] else "")
    _state.setdefault("theme", "dark")
    with open(DB_FILE, "w", encoding="utf-8") as f:
        snapshot = {"t": _now(), "op": "snapshot", "v": _deep_copy(_state)}
        f.write(json.dumps(snapshot, ensure_ascii=False) + "\n")
    return {"ok": True, "days": len(_state["days"])}


def import_syllabus_data(body_text):
    """Import a TOML syllabus string, replacing structure (resets progress)."""
    global _state
    toml_data = parse_toml_str(body_text)
    _state = toml_to_state(toml_data)
    with open(DB_FILE, "w", encoding="utf-8") as f:
        snapshot = {"t": _now(), "op": "snapshot", "v": _deep_copy(_state)}
        f.write(json.dumps(snapshot, ensure_ascii=False) + "\n")
    return {"ok": True, "days": len(_state["days"])}


# ───────────────────────── HTTP Handler ──────────────────────────

MIME_OVERRIDES = {
    ".js": "application/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".toml": "text/plain",
}


class TrackerHandler(http.server.SimpleHTTPRequestHandler):
    """Serves static files from public/ + event-sourced JSON API."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR / "public"), **kwargs)

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def _send_download(self, body_bytes, filename, content_type="application/octet-stream"):
        """Send a file download response."""
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body_bytes)))
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body_bytes)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(length)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/state":
            self._send_json(_state)
        elif path == "/api/export/state":
            body = json.dumps(_state, ensure_ascii=False, indent=2).encode("utf-8")
            self._send_download(body, "tracker-state.json", "application/json")
        elif path == "/api/export/syllabus":
            body = state_to_toml(_state).encode("utf-8")
            self._send_download(body, "syllabus.toml", "text/plain; charset=utf-8")
        elif path == "/api/export/events":
            if DB_FILE.exists():
                body = DB_FILE.read_bytes()
            else:
                body = b""
            self._send_download(body, "db.ndjson", "application/x-ndjson")
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
        elif path == "/api/reload":
            result = reload_from_toml()
            if result is not None:
                self._send_json(result)
            else:
                self._send_json({"error": "syllabus.toml not found"}, 404)
        elif path == "/api/import/state":
            try:
                imported = json.loads(self._read_body())
                result = import_state_data(imported)
                status = 200 if "ok" in result else 400
                self._send_json(result, status)
            except Exception as e:
                self._send_json({"error": str(e)}, 400)
        elif path == "/api/import/syllabus":
            try:
                body_text = self._read_body().decode("utf-8")
                result = import_syllabus_data(body_text)
                self._send_json(result)
            except Exception as e:
                self._send_json({"error": str(e)}, 400)
        else:
            self._send_json({"error": "not found"}, 404)

    def log_message(self, fmt, *args):
        req = str(args[0]) if args else ""
        if "/api/" in req:
            sys.stderr.write(
                f"  ├─ {self.address_string()} {req} "
                f"{args[1] if len(args) > 1 else ''}\n"
            )

    def guess_type(self, path):
        ext = Path(path).suffix.lower()
        return MIME_OVERRIDES.get(ext, super().guess_type(path))


# ───────────────────────── Main ──────────────────────────────────

def main():
    global _state, DB_FILE, SYLLABUS_FILE

    parser = argparse.ArgumentParser(description="Study Tracker Server")
    parser.add_argument("--port", "-p", type=int, default=8080,
                        help="Port to serve on (default: 8080)")
    parser.add_argument("--host", default="127.0.0.1",
                        help="Host to bind to (default: 127.0.0.1)")
    parser.add_argument("--db", default=None,
                        help="Path to db.ndjson (default: ./db.ndjson)")
    parser.add_argument("--syllabus", default=None,
                        help="Path to syllabus.toml (default: ./syllabus.toml)")
    args = parser.parse_args()

    if args.db:
        DB_FILE = Path(args.db).resolve()
    if args.syllabus:
        SYLLABUS_FILE = Path(args.syllabus).resolve()

    _state = load_state()

    n_days = len(_state.get("days", []))
    n_events = 0
    if DB_FILE.exists():
        with open(DB_FILE, "r", encoding="utf-8") as f:
            n_events = sum(1 for line in f if line.strip())

    server = http.server.HTTPServer((args.host, args.port), TrackerHandler)
    title = _state.get("meta", {}).get("title", "Study Tracker")
    port_str = str(args.port)
    store_info = f"db.ndjson ({n_events} events)"

    banner = f"""
╔══════════════════════════════════════════════════╗
║  📚  {title:<43s} ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  🌐  http://{args.host}:{port_str:<25s}  ║
║  💾  Store:   {store_info:<33s} ║
║  📁  Serving: {"public/":<33s} ║
║  📋  Days:    {str(n_days) + " loaded":<33s} ║
║                                                  ║
║  Press Ctrl+C to stop                            ║
╚══════════════════════════════════════════════════╝
"""
    print(banner)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        if _state:
            append_event({"op": "snapshot", "v": _deep_copy(_state)})
            sys.stderr.write("  ✓ Snapshot written on shutdown\n")
        print("\n  👋 Server stopped. Progress saved in db.ndjson\n")
        server.server_close()


if __name__ == "__main__":
    main()
