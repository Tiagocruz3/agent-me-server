# Dynamic Memory Filing System (MVP v1)

This repository includes a lightweight markdown-native memory layer:

- `scripts/memory_router.py` — classifies and routes free text notes into `memory/` categories.
- `scripts/memory_find.py` — searches markdown memory files by keywords + recency.

## Memory layout

```text
memory/
  index.md
  daily/YYYY-MM-DD.md
  topics/*.md
  people/*.md
  projects/*.md
  decisions.md
  todos.md
```

## Route a note

```bash
python3 scripts/memory_router.py \
  --base-dir memory \
  --source telegram \
  --text "Decided to prioritize in-app OAuth in phase 2"
```

## Search notes

```bash
python3 scripts/memory_find.py "oauth phase 2" --base-dir memory --limit 10
```

## Notes

- Classification is heuristic (keyword-based) in v1.
- Frontmatter metadata is added per entry for future automation.
- This MVP is intentionally simple and local-first.
