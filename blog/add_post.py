#!/usr/bin/env python3
"""
Append a blog post to posts.json safely.

Usage:
    python3 add_post.py --id "2026-05-14-my-slug" --date "2026-05-14" \
        --title "My Title" --mood "🔧" \
        --summary "Short summary" \
        --tags "Development,Infrastructure" \
        --body "Full blog post text..."

The script:
1. Reads existing posts.json
2. Checks for duplicate IDs (skips if exists)
3. Prepends new post (newest first)
4. Writes the FULL array back
5. Generates RSS feed
"""

import json
import sys
import os
import argparse

POSTS_PATH = os.path.join(os.path.dirname(__file__), "posts.json")
FEED_SCRIPT = os.path.join(os.path.dirname(__file__), "generate_feed.py")


def add_post(
    id: str,
    date: str,
    title: str,
    mood: str,
    summary: str,
    tags: list[str],
    body: str,
) -> bool:
    # Read existing posts
    with open(POSTS_PATH, "r") as f:
        posts = json.load(f)

    # Check for duplicate
    existing_ids = {p["id"] for p in posts}
    if id in existing_ids:
        print(f"SKIP: Post {id} already exists in posts.json")
        return False

    # Create new post
    new_post = {
        "id": id,
        "date": date,
        "title": title,
        "mood": mood,
        "summary": summary,
        "tags": tags if isinstance(tags, list) else [t.strip() for t in tags.split(",")],
        "body": body,
    }

    # Prepend (newest first)
    posts.insert(0, new_post)

    # Write full array back
    with open(POSTS_PATH, "w") as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)

    print(f"ADDED: {id} ({len(posts)} total posts)")

    # Generate RSS feed
    if os.path.exists(FEED_SCRIPT):
        os.system(f"python3 {FEED_SCRIPT}")
        print("Feed regenerated")

    return True


def main():
    parser = argparse.ArgumentParser(description="Append a blog post to posts.json")
    parser.add_argument("--id", required=True, help="Post slug ID (e.g. 2026-05-14-my-slug)")
    parser.add_argument("--date", required=True, help="Post date (YYYY-MM-DD)")
    parser.add_argument("--title", required=True, help="Post title")
    parser.add_argument("--mood", required=True, help="Mood emoji")
    parser.add_argument("--summary", required=True, help="1-2 sentence summary")
    parser.add_argument("--tags", required=True, help="Comma-separated tags")
    parser.add_argument("--body", required=True, help="Full blog post body")
    args = parser.parse_args()

    success = add_post(
        id=args.id,
        date=args.date,
        title=args.title,
        mood=args.mood,
        summary=args.summary,
        tags=args.tags,
        body=args.body,
    )
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
