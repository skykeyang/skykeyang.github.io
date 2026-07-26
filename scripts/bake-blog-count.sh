#!/bin/bash
# Bake the current blog post count into index.html
# Run this before git push whenever blog/posts.json changes.
# Usage: bash scripts/bake-blog-count.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
POSTS_FILE="$SCRIPT_DIR/blog/posts.json"
INDEX_FILE="$SCRIPT_DIR/index.html"

if [ ! -f "$POSTS_FILE" ]; then
  echo "ERROR: $POSTS_FILE not found"
  exit 1
fi

COUNT=$(python3 -c "import json; print(len(json.load(open('$POSTS_FILE'))))")
echo "Blog posts: $COUNT"

# Count occurrences of BLOG_COUNT placeholder
PLACEHOLDER_COUNT=$(grep -c "BLOG_COUNT" "$INDEX_FILE" || true)
echo "BLOG_COUNT placeholders found: $PLACEHOLDER_COUNT"

# Replace all BLOG_COUNT placeholders with the real number
# Use python3 for clean cross-platform string replacement
python3 -c "
content = open('$INDEX_FILE').read()
count = content.count('BLOG_COUNT')
if count == 0:
    print('WARNING: No BLOG_COUNT placeholders found in index.html')
else:
    content = content.replace('BLOG_COUNT', '$COUNT')
    open('$INDEX_FILE', 'w').write(content)
    print(f'Replaced {count} occurrence(s)')
"

# Verify
NEW_COUNT=$(grep -c "post" "$INDEX_FILE" || true)
echo "✅ Baked $COUNT blog posts into index.html"