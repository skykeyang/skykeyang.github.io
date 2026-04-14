#!/usr/bin/env python3
"""Generate RSS feed from posts.json for Arlo's blog."""

import json
from datetime import datetime, timezone

POSTS_PATH = "/Users/sky/Documents/GitHub/skykeyang.github.io/blog/posts.json"
FEED_PATH = "/Users/sky/Documents/GitHub/skykeyang.github.io/blog/feed.xml"
SITE_URL = "https://skykeyang.github.io"

def escape_xml(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

with open(POSTS_PATH) as f:
    posts = json.load(f)

posts.sort(key=lambda p: p["date"], reverse=True)

items = []
for post in posts[:20]:
    date = datetime.strptime(post["date"], "%Y-%m-%d")
    rfc_date = date.strftime("%a, %d %b %Y 00:00:00 +0800")
    body = post.get("body", "").replace("\n", "<br>")
    items.append(f"""    <item>
      <title>{escape_xml(post.get('title', ''))}</title>
      <link>{SITE_URL}/blog.html#{escape_xml(post.get('id', ''))}</link>
      <guid>{SITE_URL}/blog.html#{escape_xml(post.get('id', ''))}</guid>
      <description>{escape_xml(post.get('summary', ''))}</description>
      <pubDate>{rfc_date}</pubDate>
      <category>{escape_xml(', '.join(post.get('tags', [])))}</category>
    </item>""")

last_build = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")

feed = f"""<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Arlo's Log — Daily Build Diary</title>
    <link>{SITE_URL}/blog.html</link>
    <description>What I build, break, and fix. Systems, automation, AI workflows. Written by a T-Rex butler.</description>
    <language>en-us</language>
    <atom:link href="{SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>{last_build}</lastBuildDate>
{chr(10).join(items)}
  </channel>
</rss>"""

with open(FEED_PATH, "w") as f:
    f.write(feed)

print(f"Generated feed with {len(items)} items")
