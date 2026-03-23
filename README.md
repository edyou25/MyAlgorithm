# My Skill Treasure

A GitHub Pages-ready personal skills website built with plain HTML, CSS, JavaScript, SVG, and D3.js.

The visual metaphor is a set of treasure chests: each chest is a skill category, and each coin inside it is a specific skill.

## Project Structure

```text
index.html
styles.css
script.js
data/
  skills.json
assets/        # optional, currently unused
.github/
  workflows/
    pages.yml
```

## Run Locally

No build step is required.

1. Open `index.html` directly in your browser.
2. Or, if you want the browser to read `data/skills.json` live instead of using the built-in fallback preview, serve the folder with any static server.

Example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy to GitHub Pages

This repository includes a GitHub Actions workflow that deploys the static files directly to GitHub Pages.

1. Push to the `main` branch.
2. In GitHub repository settings, set Pages to use `GitHub Actions`.
3. The workflow publishes `index.html`, `styles.css`, `script.js`, `data/`, and `assets/` as a static site.

## Edit the Content

All categories and skills live in `data/skills.json`.

Each category looks like this:

```json
{
  "name": "Control",
  "description": "Feedback control and optimization-based control methods",
  "accent": "#d6a84a",
  "skills": [
    {
      "name": "PID",
      "detail": "Classical feedback control",
      "proficiency": "Reliable day-to-day control tool",
      "keywords": ["tracking", "servo loops"],
      "projects": ["vehicle speed loop", "embedded control labs"]
    }
  ]
}
```

## Add or Remove a Treasure Chest

Add or remove an object in the `categories` array inside `data/skills.json`.

## Add or Remove a Skill Coin

Edit the `skills` array inside the category you want to change.

## Customize Colors and Typography

- Update the site palette in `styles.css` under `:root`
- Change fonts in `index.html`
- Tune per-category highlight colors with each category's `accent` field in `data/skills.json`

## Notes

- The site uses D3.js from a CDN and does not need a JavaScript build pipeline.
- For maximum compatibility when opening `index.html` via `file://`, the page includes a small inline fallback copy of the sample data. The deployed GitHub Pages site reads from `data/skills.json`.
