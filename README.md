# Algorithm Backpack

A GitHub Pages-ready static homepage that presents algorithm flowcharts as a pixel-art RPG inventory.

The homepage is plain HTML, CSS, and JavaScript. Each sub-pack represents a skill group such as planning, control, optimization, or learning. Each item icon links to a generated flowchart page under `/algorithms/<slug>/`.

## Structure

```text
index.html
styles.css
script.js
data/
  skills.json
assets/
  pixel/
    icons/
scripts/
  build_static_pages.py
src/
  <algorithm>/
docs/
  ... MkDocs source pages
```

## How It Works

- `src/` remains the source of truth for algorithm metadata and diagrams
- MkDocs builds the flowchart pages under `/algorithms/`
- The root `index.html` is a custom pixel-art equipment homepage
- `scripts/build_static_pages.py` builds the MkDocs site and then overlays the custom homepage, data, and downloaded assets into the final static bundle

## Local Preview

Install dependencies once:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Build the full static site:

```bash
python3 scripts/build_static_pages.py
```

Preview it locally:

```bash
python3 -m http.server 8000 -d site
```

Then open `http://localhost:8000`.

## GitHub Pages Deployment

Push to `main`. The workflow in `.github/workflows/pages.yml` runs `scripts/build_static_pages.py` and deploys the final `site/` output to GitHub Pages.

Make sure the repository Pages source is set to `GitHub Actions`.

## Edit the Inventory

Homepage content lives in `data/skills.json`.

Each group looks like this:

```json
{
  "name": "Planning Pack",
  "accent": "#64c88a",
  "description": "Search, sampling, and road-aligned trajectory generation for motion planning.",
  "capacity": 9,
  "items": [
    {
      "name": "A*",
      "slug": "astar",
      "icon": "gold_key.png",
      "rarity": "common",
      "detail": "Heuristic graph search for shortest-path planning on discrete maps.",
      "keywords": ["graph search", "heuristics", "pathfinding"]
    }
  ]
}
```

## Add a New Skill Group

Add a new object to the top-level `groups` array in `data/skills.json`.

## Add a New Item

Add a new object to the target group's `items` array in `data/skills.json`.

Important fields:

- `slug`: must match the generated flowchart route under `/algorithms/<slug>/`
- `icon`: must match a file name under `assets/pixel/icons/`
- `rarity`: use `common`, `uncommon`, `rare`, or `epic`

## Add a New Algorithm Flowchart

1. Create `src/<algorithm>/`
2. Add `meta.yaml`
3. Add `diagram.mmd` or `diagram.dot`
4. If you want it on the homepage inventory, also add an item entry in `data/skills.json`
5. Rebuild with `python3 scripts/build_static_pages.py`

## Customize the Pixel Style

- Colors and borders: edit CSS variables in `styles.css`
- Typography: update the Google Fonts import in `index.html`
- Item icons: swap files in `assets/pixel/icons/`

## Asset Credits

- Idylwild's Inventory by Idylwild, CC0
  Source: https://opengameart.org/content/idylwilds-inventory
