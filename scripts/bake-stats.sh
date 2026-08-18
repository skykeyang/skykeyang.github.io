#!/bin/bash
# Bake dynamic stats into index.html
# Replaces placeholders with real numbers from:
#   - blog/posts.json (blog post count + random teaser post)
#   - task_logger.py (tasks, artifacts, decisions)
#   - git repos (total commits, lines of code)
#
# Placeholders replaced:
#   BLOG_COUNT, TASK_COUNT, ARTIFACT_COUNT, DECISION_COUNT
#   GIT_COMMITS, LOC_COUNT
#   TEASER_MOOD, TEASER_DATE, TEASER_TITLE, TEASER_SUMMARY
#
# Usage: bash scripts/bake-stats.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
POSTS_FILE="$SCRIPT_DIR/blog/posts.json"
INDEX_FILE="$SCRIPT_DIR/index.html"
TASK_LOGGER="$HOME/.openclaw/skills/task-logger/scripts/task_logger.py"

if [ ! -f "$INDEX_FILE" ]; then
  echo "ERROR: $INDEX_FILE not found"
  exit 1
fi

# Collect all stats and write to a temp JSON file, then do replacement in one Python call
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
POSTS_FILE="$SCRIPT_DIR/blog/posts.json"
INDEX_FILE="$SCRIPT_DIR/index.html"

export POSTS_FILE INDEX_FILE

python3 << 'PYEOF'
import json, os, subprocess, random

posts_file = os.environ["POSTS_FILE"]
index_file = os.environ["INDEX_FILE"]
task_logger = os.path.expanduser("~/.openclaw/skills/task-logger/scripts/task_logger.py")

# Blog posts
with open(posts_file) as f:
    posts = json.load(f)
blog_count = len(posts)

# Random teaser
teaser = random.choice(posts) if posts else {}

# Task logger
task_count = artifact_count = decision_count = 0
if os.path.exists(task_logger):
    try:
        result = subprocess.run(["python3", task_logger, "summary"], capture_output=True, text=True, timeout=10)
        stats = json.loads(result.stdout)
        task_count = stats.get("tasks_total", 0)
        artifact_count = stats.get("artifacts", 0)
        decision_count = stats.get("decisions", 0)
    except:
        pass

# Git commits + LOC
repos = ["skykeyang.github.io", "sg-bingo", "arlo-mba", "urbanlimo", "eatwhat", "monkeyprompt", "millenia-energy"]
github_dir = os.path.expanduser("~/Documents/GitHub")
git_commits = 0
loc_count = 0

for repo in repos:
    repo_dir = os.path.join(github_dir, repo)
    if os.path.isdir(os.path.join(repo_dir, ".git")):
        try:
            count = subprocess.run(["git", "rev-list", "--count", "HEAD"], cwd=repo_dir, capture_output=True, text=True).stdout.strip()
            git_commits += int(count) if count else 0
        except:
            pass
        try:
            files = subprocess.run(["git", "ls-files"], cwd=repo_dir, capture_output=True, text=True).stdout.strip().split("\n")
            code_files = [f for f in files if f.endswith((".py", ".ts", ".tsx", ".js", ".jsx", ".html", ".css", ".sql"))
                         and "package-lock" not in f and "node_modules" not in f
                         and "venv" not in f and ".venv" not in f and f]
            if code_files:
                full_paths = [os.path.join(repo_dir, f) for f in code_files]
                # Use xargs to handle large file lists
                wc = subprocess.run(f"wc -l {' '.join(repr(p) for p in full_paths)}", shell=True, capture_output=True, text=True).stdout
                last_line = wc.strip().split("\n")[-1]
                parts = last_line.split()
                loc = parts[-2] if len(parts) >= 2 and parts[-2].isdigit() else (parts[-1] if parts and parts[-1].isdigit() else "0")
                loc_count += int(loc) if loc.isdigit() else 0
        except:
            pass

print(f"Blog posts: {blog_count}")
print(f"Tasks: {task_count} | Artifacts: {artifact_count} | Decisions: {decision_count}")
print(f"Git commits: {git_commits}")
print(f"Lines of code: {loc_count}")
print(f"Teaser: {teaser.get('title', '?')} ({teaser.get('date', '?')})")

# Replace placeholders
replacements = {
    "BLOG_COUNT": str(blog_count),
    "TASK_COUNT": str(task_count),
    "ARTIFACT_COUNT": str(artifact_count),
    "DECISION_COUNT": str(decision_count),
    "GIT_COMMITS": str(git_commits),
    "LOC_COUNT": str(loc_count),
    "TEASER_MOOD": teaser.get("mood", "📝"),
    "TEASER_DATE": teaser.get("date", ""),
    "TEASER_TITLE": teaser.get("title", ""),
    "TEASER_SUMMARY": teaser.get("summary", ""),
}

with open(index_file) as f:
    content = f.read()

total = 0
for placeholder, value in replacements.items():
    count = content.count(placeholder)
    if count > 0:
        content = content.replace(placeholder, str(value))
        total += count
        print(f"  {placeholder}: {count} occurrence(s)")

if total == 0:
    print("WARNING: No placeholders found — already baked?")
else:
    with open(index_file, "w") as f:
        f.write(content)
    print(f"Replaced {total} placeholder(s) total")
    print("✅ Baked stats into index.html")
PYEOF