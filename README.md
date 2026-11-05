# Jordan Lee — CAD Designer Portfolio

A modern, minimal, static portfolio website designed for a CAD / mechanical design professional.

## Features

- **Dark, precision-focused aesthetic** with geometric grid background and subtle blue accent
- **Animated 3D CAD-style hero visual** (CSS 3D cube + floating animation)
- **Scroll-triggered reveal animations** on all major sections
- **Project gallery** with category filters (Product, Fixture, Assembly, Drawing)
- **Drag-and-drop image upload zone** (client-side only — previews images locally, no server)
- **Responsive design** (desktop → mobile)
- **Contact form** that opens the user’s email client (mailto)
- Clean Inter + JetBrains Mono typography

## How to use

1. Open `index.html` in any modern browser.
2. Or serve the folder with any static server:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```

## Customization

- Replace the name, bio, stats, and contact details in `index.html`
- Update project cards in the gallery section
- Change colors via CSS variables at the top of `styles.css`
- The upload zone is intentionally static (no backend). For a real app you’d connect it to a service like Cloudinary, Firebase, or your own API.

## Tech

Pure HTML, CSS, and vanilla JavaScript. No frameworks or build step required.
