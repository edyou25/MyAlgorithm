# Algorithm Flowcharts

A minimal-maintenance GitHub Pages site for algorithm flowcharts, generated from source files under `src/`.

## Stack

- MkDocs
- Material for MkDocs
- Python generation script
- GitHub Actions for GitHub Pages deployment

## Repository Layout

- `src/<algorithm>/meta.yaml` stores metadata
- `src/<algorithm>/diagram.mmd` stores a Mermaid flowchart
- `src/<algorithm>/diagram.dot` is an optional Graphviz fallback
- `scripts/generate_docs.py` scans `src/` and generates Markdown pages in `docs/`
- `docs/` stays thin: generated pages plus small styling and Mermaid assets

## Local Preview

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
mkdocs serve
```

`mkdocs serve` and `mkdocs build` automatically regenerate the site from `src/` through the MkDocs hook. If you want local Graphviz previews for `.dot` files, install the Graphviz CLI so `dot` is available on your machine.

## Add a New Algorithm

1. Create `src/<slug>/`.
2. Add `meta.yaml`.
3. Add `diagram.mmd` or `diagram.dot`.
4. Run `mkdocs serve` or `mkdocs build`.

The homepage and algorithm pages will be regenerated automatically.

## Deployment

Push to `main` and GitHub Actions will build and deploy the site to GitHub Pages.

In the repository settings, make sure GitHub Pages is configured to use `GitHub Actions` as the deployment source.
