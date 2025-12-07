# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PWA (Progressive Web App) for citizens of Veliko Tarnovo, Bulgaria to submit air pollution reports to RIOSV (Regional Inspectorate of Environment and Water). Works offline after first visit.

## Development Commands

```bash
# Start development server at localhost:3000
npm run dev
```

No build step required - static files served directly.

## Cloudflare Pages Deployment

1. Connect repository to Cloudflare Pages
2. Build command: (leave empty)
3. Build output directory: `/` (root)
4. Deploy

The site is static - no build configuration needed.

## Architecture

- **`index.html`**: Main application (HTML, CSS, JS in one file)
- **`sw.js`**: Service worker for offline caching
- **`manifest.json`**: PWA manifest
- **`icons/`**: App icons (SVG + PNG)
- **External CDN dependencies**: docx.js, Font Awesome, Google Fonts

## Key Functions in index.html

- `buildLetterText(data)`: Generates formal letter text
- `collectData()`: Gathers form field values
- `validateForm()`: Form validation
- DOCX generation via `docx` library
- "Send to RIOSV" expects backend at `/api/send` (not implemented)

## PWA Features

- Installable on mobile/desktop
- Offline support via service worker
- Cache version: `ti-reshavash-v1` (update in sw.js when releasing new versions)

## Icons

PNG icons need to be generated from `icons/icon.svg`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

## Language

All UI is in Bulgarian, targeting Veliko Tarnovo region.
