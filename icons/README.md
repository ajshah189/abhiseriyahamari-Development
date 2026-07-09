# PWA Icons

## ICONS NEEDED BEFORE LAUNCH

Generate PNG icons at these sizes: 72, 96, 128, 144, 152, 192, 384, 512.

- **Background:** `#0a0a0f` (dark night)
- **Foreground:** `#d4af6a` (gold) ✈ symbol
- **Safe zone:** Keep the ✈ within the inner 80% for maskable icons

## Tools

- https://maskable.app — verify maskable icon safe zones
- https://realfavicongenerator.net — generate all sizes from one source image
- https://www.pwabuilder.com/imageGenerator — PWA icon generator

## Current fallback

`icon.svg` serves as a fallback for browsers that support SVG icons (most modern browsers).
The PNG sizes listed in `manifest.json` will 404 until real icons are generated — this is
fine for development and testing but must be resolved before the wedding launch.

## Generation script

Run `node scripts/generate-icons.js` after installing the `canvas` package:

```bash
npm install canvas
node scripts/generate-icons.js
```

This outputs all PNG sizes into this `/icons/` folder.
