# diatknust-hub.github.io

Static GitHub Pages site for the DIAT KNUST Hub, including gallery, archive,
programme pages, and a WebAR viewer powered by `model-viewer`.

## Current Publishing Model

This site is intentionally static. GitHub Pages serves the HTML, CSS,
JavaScript, JSON, and media files directly.

Public browser-based admin editing is disabled. Do not store admin passwords,
GitHub personal access tokens, or publishing credentials in client-side code.

## Content Updates

Use one of these safer workflows:

1. Edit page HTML or JSON files locally, preview, then commit and push.
2. Edit `diat-content.json`, `diat-gallery.json`, or `diat-webar.json` through
   GitHub's authenticated editor.
3. Build a private local publishing tool later if non-technical editors need a
   guided interface.

## Local Preview

Run a static server from this folder, then open the printed local URL:

```powershell
python -m http.server 8080
```

If Python is not on PATH, use any equivalent static server. Avoid opening pages
through `file://` for final checks because JSON loading and module behavior can
differ from GitHub Pages.
