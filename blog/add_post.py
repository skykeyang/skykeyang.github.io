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
from difflib import SequenceMatcher

POSTS_PATH = os.path.join(os.path.dirname(__file__), "posts.json")
FEED_SCRIPT = os.path.join(os.path.dirname(__file__), "generate_feed.py")


def similarity(a: str, b: str) -> float:
    """Return similarity ratio between two strings (0.0 to 1.0)."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


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

    # Check for duplicate ID
    existing_ids = {p["id"] for p in posts}
    if id in existing_ids:
        print(f"SKIP: Post {id} already exists in posts.json")
        return False

    # Check for similar posts (same topic written twice with different IDs)
    # Only compare against recent posts (last 3 days) to avoid false positives
    SIMILARITY_THRESHOLD = 0.6
    from datetime import datetime, timedelta
    cutoff = (datetime.strptime(date, "%Y-%m-%d") - timedelta(days=3)).strftime("%Y-%m-%d")
    
    for post in posts:
        # Skip old posts
        if post.get("date", "") < cutoff:
            continue
            
        title_sim = similarity(title, post.get("title", ""))
        summary_sim = similarity(summary, post.get("summary", ""))
        # Check if tags overlap significantly
        new_tags = set(tags) if isinstance(tags, set) else {t.strip() for t in tags} if isinstance(tags, str) else set(tags)
        old_tags = set(post.get("tags", []))
        tag_overlap = len(new_tags & old_tags) / max(len(new_tags | old_tags), 1)

        # If title or summary is very similar, or summary is moderately similar with high tag overlap
        max_text_sim = max(title_sim, summary_sim)
        similar_with_tags = summary_sim > 0.4 and tag_overlap > 0.3
        if max_text_sim > SIMILARITY_THRESHOLD or similar_with_tags:
            print(f"SKIP: New post is too similar to existing post '{post.get('title', '')}' (title_sim={title_sim:.2f}, summary_sim={summary_sim:.2f}, tag_overlap={tag_overlap:.2f})")
            print(f"  Existing: id={post['id']} date={post.get('date','')}")
            print(f"  New:      id={id} date={date}")
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
