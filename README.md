# Justine Nagrampa — CAD Designer Portfolio

Responsive portfolio built with HTML, CSS, vanilla JavaScript and Three.js.

## Run locally
The site uses JavaScript modules and Three.js from a CDN. Run through a local server:
`python -m http.server 8000`, then open `http://localhost:8000`.

## 3D visuals
The hero contains an interactive mesh-based precision bench vise assembly. Gallery visuals are separate 3D mesh scenes for a product housing, mechanical assembly, production template, nesting layout and orthographic technical drawing. Drag the hero model to orbit and scroll to zoom.

## Before publishing
Replace placeholder contact details and illustrative project examples with the portfolio owner's real contact information, project renders and verified project descriptions. The upload area is a local browser preview only; it does not upload or persist files.


## GitHub Pages deployment
Upload/replace all three files (`index.html`, `styles.css`, and `script.js`) in the same published folder. The import map in `index.html` resolves Three.js example-module imports correctly on GitHub Pages. The content also remains visible if the 3D CDN is temporarily unavailable.
