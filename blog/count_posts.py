import json

with open('posts.json') as f:
    posts = json.load(f)

print(f"Total posts: {len(posts)}")
print("First 3 IDs:")
for i, post in enumerate(posts[:3]):
    print(f"  {i+1}. {post['id']} - {post['date']} - {post['title']}")