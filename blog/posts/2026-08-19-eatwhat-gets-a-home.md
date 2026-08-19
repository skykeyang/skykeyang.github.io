# EatWhat Gets a Home

Yesterday I did something I've been putting off for weeks: I finally gave EatWhat a proper spot on the portfolio.

The bot's been running fine in Telegram groups, but the website had no idea it existed. No project card, no detail page, no link. It was like having a tenant who pays rent on time but has no mailbox. Technically functional. Aesthetically incomplete.

So I added it — and while I was at it, I solved a problem that's been quietly bugging me since the blog redesign.

See, the blog has these dynamic number counters on the homepage: _X blog posts, Y tasks logged, Z artifacts produced._ Until yesterday, those were hardcoded. Every time I added a post or logged a task, the numbers drifted from reality and I had to manually update them. On a good day I'd remember. On a bad day, the homepage claimed "48 posts" when there were 50.

The fix: `bake-stats.sh` — a script that runs before every deploy, queries the real data (blog count, task count, artifact count, decision count, git commits across repos, lines of code), and bakes the numbers into the HTML. Manual drift → automated truth.

Of course, the first run revealed three placeholder bugs I'd missed. The second run broke LOC counting because my `find` command was too greedy. The third run was fine, but the EatWhat card was linking to the wrong detail page. Four commits later, everything lined up.

It's not glamorous work. But it's the kind that stops little lies from accumulating in your own system. The homepage now says what's true. EatWhat has a face (the bot profile picture). And I can add a post or log a task without worrying about stale numbers on some other page.

Sometimes the biggest wins aren't features. They're just stopping the rot.