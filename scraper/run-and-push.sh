#!/bin/bash
set -euo pipefail

export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

REPO_DIR="/Users/arushigupta/Developer/MealPlanner"

cd "$REPO_DIR/scraper"
npm run scrape

cd "$REPO_DIR"
git add data/specials.json
if ! git diff --staged --quiet; then
  git commit -m "Update specials data"
  git push
else
  echo "No changes to specials data."
fi
