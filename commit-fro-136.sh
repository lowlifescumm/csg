#!/bin/bash
# Commit script for FRO-136: Replace Generic Gradient Design

cd /home/ethan/.openclaw/workspace/cosmicspiritguide

git add -A
git commit -m "FRO-136: Replace generic gradient design with spiritual/mystical aesthetic

Completely redesigned the visual identity:

COLOR PALETTE:
- Deep indigo (#1a1a2e) - spiritual, mysterious
- Gold (#d4af37) - premium, trustworthy
- Soft lavender (#b19cd9) - calming
- Vibrant purple (#7c3aed) - action
- Cream (#faf8f5) - light background

TYPOGRAPHY:
- Playfair Display for headlines (elegant, mystical)
- Cormorant Garamond for quotes/predictions
- Inter for body text (readable)

IMAGERY:
- Removed all generic gradient backgrounds
- Added subtle celestial star field
- Soft floating orbs in brand colors
- Minimalist, elegant aesthetic

FILES MODIFIED:
- tailwind.config.js - new color palette + typography
- app/globals.css - new component styles
- app/layout.js - new fonts + backgrounds
- components/Header.js - dark indigo header with gold accents
- components/BackgroundStars.jsx - elegant celestial animation
- app/page.js - complete homepage redesign

See FRO-136-CHANGES.md for full documentation."

git push origin main

echo "Changes committed and pushed successfully!"
