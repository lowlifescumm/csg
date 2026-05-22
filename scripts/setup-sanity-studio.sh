#!/usr/bin/env bash
# Setup Sanity Studio for CosmicSpiritGuide
# Run this inRender SSH or any environment with Node.js 20+

set -e

STUDIO_DIR="$(cd "$(dirname "$0")"; pwd)/sanity-studio"
cd "$STUDIO_DIR"

echo "=== CSG Sanity Studio Setup ==="
echo "Project: kicslgfz"
echo "Dataset: production"
echo

# Install dependencies (studio uses React 18, isolated from main app)
if [ ! -d node_modules ]; then
  echo "→ Installing studio dependencies..."
  npm install
fi

# Verify
if [ ! -f sanity.config.ts ]; then
  echo "✗ sanity.config.ts not found!"
  exit 1
fi

echo "✓ Dependencies installed"
echo

echo "=== Studio Commands ==="
echo "  npm run dev       → local dev on http://localhost:3333"
echo "  npm run build     → build studio"
echo "  npm run deploy    → deploy to https://kicslgfz.sanity.studio"
echo
echo "=== First Steps ==="
echo "  1. npm run dev (or deploy)"
echo "  2. Log in with your Sanity account"
echo "  3. Create categories: Astrology, Tarot, Spirituality, Moon Phases, Compatibility"
echo "  4. Create tags: beginner, advanced, daily-guidance, love, career, etc."
echo "  5. Create your first blog post"
echo
echo "After you have content in Sanity, the Next.js app will serve it automatically."
echo "Empty Sanity → automatic fallback to PostgreSQL."
