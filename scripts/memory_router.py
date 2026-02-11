#!/usr/bin/env python3
"""Dynamic markdown memory router (MVP v1).

Routes free-text notes into a structured markdown memory tree using lightweight
heuristics and frontmatter metadata.
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
from pathlib import Path

KEYWORDS = {
    "decision": ["decide", "decision", "chose", "choose", "agreed", "approved"],
    "todo": ["todo", "to-do", "task", "follow up", "follow-up", "need to", "remind"],
    "preference": ["prefer", "likes", "dislikes", "wants", "always", "never"],
    "project": ["project", "milestone", "release", "commit", "deploy", "roadmap"],
    "person": ["met", "spoke with", "talked to", "contact", "person", "team"],
}


def classify(text: str) -> str:
    t = text.lower()
    for kind, words in KEYWORDS.items():
        if any(w in t for w in words):
            return kind
    return "note"


def slugify(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9\s-]", "", value).strip().lower()
    value = re.sub(r"[\s_-]+", "-", value)
    return value[:60] or "note"


def extract_topic(text: str) -> str:
    words = [w for w in re.findall(r"[A-Za-z0-9]{3,}", text) if w.lower() not in {"the", "and", "for", "with", "from", "that", "this"}]
    return slugify(" ".join(words[:4]))


def ensure_file(path: Path, title: str) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"# {title}\n\n", encoding="utf-8")


def append_entry(path: Path, entry: str) -> None:
    with path.open("a", encoding="utf-8") as f:
        f.write(entry)


def update_index(base: Path, rel_path: Path, note_type: str) -> None:
    idx = base / "index.md"
    if not idx.exists():
        idx.write_text("# Memory Index\n\n", encoding="utf-8")
    line = f"- [{rel_path.stem}]({rel_path.as_posix()}) — {note_type}\n"
    content = idx.read_text(encoding="utf-8")
    if line not in content:
        append_entry(idx, line)


def route(base: Path, text: str, source: str, when: dt.datetime) -> Path:
    note_type = classify(text)
    date = when.date().isoformat()

    if note_type == "decision":
        target = base / "decisions.md"
        ensure_file(target, "Decisions")
    elif note_type == "todo":
        target = base / "todos.md"
        ensure_file(target, "Todos")
    elif note_type == "project":
        target = base / "projects" / f"{extract_topic(text)}.md"
        ensure_file(target, f"Project: {extract_topic(text)}")
    elif note_type == "person":
        target = base / "people" / f"{extract_topic(text)}.md"
        ensure_file(target, f"Person: {extract_topic(text)}")
    else:
        target = base / "topics" / f"{extract_topic(text)}.md"
        ensure_file(target, f"Topic: {extract_topic(text)}")

    frontmatter = (
        "---\n"
        f"type: {note_type}\n"
        f"created: {date}\n"
        f"updated: {date}\n"
        f"source: {source}\n"
        f"confidence: 0.70\n"
        "---\n"
    )
    timestamp = when.isoformat(timespec="minutes")
    entry = f"\n## {timestamp}\n{frontmatter}\n{text.strip()}\n"
    append_entry(target, entry)

    daily = base / "daily" / f"{date}.md"
    ensure_file(daily, f"Daily Log {date}")
    append_entry(daily, f"\n- [{note_type}] {text.strip()}\n")

    rel = target.relative_to(base)
    update_index(base, rel, note_type)
    return target


def main() -> int:
    parser = argparse.ArgumentParser(description="Route memory note into markdown knowledge files")
    parser.add_argument("--text", required=True, help="Raw note text")
    parser.add_argument("--source", default="manual", help="Source surface (telegram, cli, etc)")
    parser.add_argument("--base-dir", default="memory", help="Memory root directory")
    parser.add_argument("--when", default=None, help="ISO datetime override")
    args = parser.parse_args()

    when = dt.datetime.fromisoformat(args.when) if args.when else dt.datetime.now()
    base = Path(os.path.expanduser(args.base_dir)).resolve()
    base.mkdir(parents=True, exist_ok=True)

    target = route(base, args.text, args.source, when)
    print(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
