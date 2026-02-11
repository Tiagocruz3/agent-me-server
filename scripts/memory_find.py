#!/usr/bin/env python3
"""Simple markdown memory finder (MVP v1).

Searches markdown memory tree by query terms + recency.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path


def score(text: str, terms: list[str]) -> int:
    low = text.lower()
    return sum(low.count(t) for t in terms)


def main() -> int:
    parser = argparse.ArgumentParser(description="Search markdown memory files")
    parser.add_argument("query", help="search query")
    parser.add_argument("--base-dir", default="memory", help="memory root")
    parser.add_argument("--limit", type=int, default=8, help="max results")
    args = parser.parse_args()

    base = Path(os.path.expanduser(args.base_dir)).resolve()
    if not base.exists():
        print(f"memory dir not found: {base}")
        return 1

    terms = [t.lower() for t in args.query.split() if t.strip()]
    hits: list[tuple[int, Path, str]] = []

    for path in base.rglob("*.md"):
        try:
            content = path.read_text(encoding="utf-8")
        except Exception:
            continue
        s = score(content, terms)
        if s <= 0:
            continue
        first_line = next((ln.strip() for ln in content.splitlines() if ln.strip()), "")
        hits.append((s, path, first_line))

    hits.sort(key=lambda x: (x[0], x[1].stat().st_mtime), reverse=True)
    for s, p, first_line in hits[: args.limit]:
        print(f"[{s}] {p}: {first_line}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
