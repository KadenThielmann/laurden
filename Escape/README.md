# Escape

A static escape game with independent acts. Open `Escape/` to begin Act 1.

```text
Escape/
  index.html       Entry point to Act 1
  shared/style.css Shared appearance for all acts
  act-1/           Act 1 pages, logic, configuration, cards and photograph
  act-2/           Act 2 pages, logic, content and assets
  act-3/           Act 3 placeholder
```

Each act owns its pages, scripts and assets. Shared styles live in `shared/`; Act 2 adds its own `act2.css`. Puzzle and asset URLs resolve relative to each act's script, so deployment works at a domain root or under a project subfolder.

## Adding another act

Create a sibling `act-4/` directory with an `index.html` and its own content and scripts. Link its stylesheet to `../shared/style.css` (or `../../shared/style.css` from a nested room). Point the previous act's completion destination to `../act-4/`, resolved relative to that act's root. Keep assets local to the act unless several acts use them.

Act 1's next destination is in `act-1/config.js`; Act 2's is in `act-2/content.js`. Keep these sibling-relative paths when adding acts.

## Preview and deployment

From the repository root, run `python3 -m http.server 8000` and open `http://localhost:8000/Escape/`. Deploy the whole repository to GitHub Pages as before; no build step is required. The folder name `Escape` is case-sensitive on the host.

The old `act1/` directory contains only compatibility page redirects. Existing Act 1, Act 2 and Act 3 page bookmarks still reach their corresponding pages, retaining query strings and fragments. Keep those redirects while old links remain in circulation. They contain no puzzle logic or assets.
