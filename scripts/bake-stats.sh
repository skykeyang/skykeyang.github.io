#!/bin/bash
# Bake dynamic stats into index.html
# Replaces placeholders with real numbers from:
#   - blog/posts.json (blog post count)
#   - task_logger.py (tasks, artifacts, decisions)
#   - git repos (total commits, lines of code)
#
# Placeholders replaced:
#   BLOG_COUNT, TASK_COUNT, ARTIFACT_COUNT, DECISION_COUNT
#   GIT_COMMITS, LOC_COUNT
#
# Usage: bash scripts/bake-stats.sh
# Should run before every deploy and in the daily blog cron.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
POSTS_FILE="$SCRIPT_DIR/blog/posts.json"
INDEX_FILE="$SCRIPT_DIR/index.html"
TASK_LOGGER="$HOME/.openclaw/skills/task-logger/scripts/task_logger.py"

if [ ! -f "$INDEX_FILE" ]; then
  echo "ERROR: $INDEX_FILE not found"
  exit 1
fi

# === Blog post count ===
BLOG_COUNT=$(python3 -c "import json; print(len(json.load(open('$POSTS_FILE'))))" 2>/dev/null || echo 0)
echo "Blog posts: $BLOG_COUNT"

# === Task logger stats ===
if [ -f "$TASK_LOGGER" ]; then
  TASK_STATS=$(python3 "$TASK_LOGGER" summary 2>/dev/null || echo '{}')
  TASK_COUNT=$(echo "$TASK_STATS" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tasks_total',0))" 2>/dev/null || echo 0)
  ARTIFACT_COUNT=$(echo "$TASK_STATS" | python3 -c "import json,sys; print(json.load(sys.stdin).get('artifacts',0))" 2>/dev/null || echo 0)
  DECISION_COUNT=$(echo "$TASK_STATS" | python3 -c "import json,sys; print(json.load(sys.stdin).get('decisions',0))" 2>/dev/null || echo 0)
else
  TASK_COUNT=0
  ARTIFACT_COUNT=0
  DECISION_COUNT=0
fi
echo "Tasks: $TASK_COUNT | Artifacts: $ARTIFACT_COUNT | Decisions: $DECISION_COUNT"

# === Git commits across all repos ===
REPOS=("skykeyang.github.io" "sg-bingo" "arlo-mba" "urbanlimo" "eatwhat" "monkeyprompt" "millenia-energy")
GIT_COMMITS=0
for repo in "${REPOS[@]}"; do
  dir="$HOME/Documents/GitHub/$repo"
  if [ -d "$dir/.git" ]; then
    count=$(cd "$dir" && git rev-list --count HEAD 2>/dev/null || echo 0)
    GIT_COMMITS=$((GIT_COMMITS + count))
  fi
done
echo "Git commits: $GIT_COMMITS"

# === Lines of code (excluding venv, node_modules, package-lock) ===
LOC_COUNT=0
for repo in "${REPOS[@]}"; do
  dir="$HOME/Documents/GitHub/$repo"
  if [ -d "$dir/.git" ]; then
    loc=$(cd "$dir" && git ls-files | grep -E '\.(py|ts|tsx|js|jsx|html|css|sql)$' | grep -v package-lock | grep -v node_modules | grep -v venv | grep -v '.venv' | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
    LOC_COUNT=$((LOC_COUNT + ${loc:-0}))
  fi
done
echo "Lines of code: $LOC_COUNT"

# === Replace all placeholders in index.html ===
python3 -c "
content = open('$INDEX_FILE').read()

replacements = {
    'BLOG_COUNT': '$BLOG_COUNT',
    'TASK_COUNT': '$TASK_COUNT',
    'ARTIFACT_COUNT': '$ARTIFACT_COUNT',
    'DECISION_COUNT': '$DECISION_COUNT',
    'GIT_COMMITS': '$GIT_COMMITS',
    'LOC_COUNT': '$LOC_COUNT',
}

total_replaced = 0
for placeholder, value in replacements.items():
    count = content.count(placeholder)
    if count > 0:
        content = content.replace(placeholder, value)
        total_replaced += count
        print(f'  {placeholder}: {count} occurrence(s) → {value}')

if total_replaced == 0:
    print('WARNING: No placeholders found — already baked?')
else:
    open('$INDEX_FILE', 'w').write(content)
    print(f'Replaced {total_replaced} placeholder(s) total')
"

echo "✅ Baked stats into index.html"