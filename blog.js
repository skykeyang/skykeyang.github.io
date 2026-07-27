(async function () {
  const feed = document.getElementById("blog-feed");
  const empty = document.getElementById("blog-empty");
  const statusBubble = document.getElementById("chat-bubble");
  const searchInput = document.getElementById("blog-search");
  const statsEl = document.getElementById("dashboard-stats");
  const heatmapEl = document.getElementById("dashboard-heatmap");
  if (!feed) return;

  // ─── Helpers ─────────────────────────────────────────────
  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-SG", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  }

  function formatBody(text) {
    const normalized = text.replace(/\\n/g, "\n");
    return escapeHtml(normalized)
      .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
      .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
      .replace(/^#\s+(.+)$/gm, "<h2>$1</h2>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
      .replace(/^(\d+)\.\s+(.+)$/gm, "<li>$2</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");
  }

  // ─── Fetch posts & status ───────────────────────────────
  let posts = [];
  try {
    const res = await fetch("blog/posts.json");
    if (!res.ok) throw new Error(res.status);
    posts = await res.json();
  } catch {
    empty.style.display = "";
    return;
  }

  if (!posts.length) {
    empty.style.display = "";
    return;
  }

  posts.sort((a, b) => b.date.localeCompare(a.date));

  let statusText = "";
  try {
    const sr = await fetch("blog/status.json");
    if (sr.ok) {
      const s = await sr.json();
      statusText = s.text || "";
    }
  } catch {}

  // ─── Build chat bubble ──────────────────────────────────
  if (statusBubble && statusText) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });
    statusBubble.innerHTML = `
      <img src="img/arlo-avatar.jpg" alt="Arlo" class="chat-avatar" loading="lazy">
      <div class="chat-content">
        <div class="chat-name">Arlo</div>
        <div class="chat-text">${escapeHtml(statusText)}</div>
        <div class="chat-time">${timeStr}</div>
      </div>
    `;
  }

  // ─── Build timeline strip ──────────────────────────────
  if (heatmapEl) {
    // Group posts by month, newest first, most recent 6 months
    const byMonth = {};
    posts.forEach(p => {
      const m = p.date.slice(0, 7);
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m].push(p);
    });
    const sorted = Object.keys(byMonth).sort().reverse().slice(0, 6);

    let html = '<div class="timeline-strip">';
    sorted.forEach(key => {
      const monthPosts = byMonth[key];
      const d = new Date(key + "-01T00:00:00");
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const dots = monthPosts.map(p => {
        const mood = p.mood || "●";
        return `<span class="timeline-dot" title="${escapeHtml(p.date)}: ${escapeHtml(p.title)}">${mood}</span>`;
      }).join("");
      html += `<div class="timeline-row"><span class="timeline-label">${label}</span><span class="timeline-dots">${dots}</span></div>`;
    });
    html += '</div>';

    heatmapEl.innerHTML = html;
  }

  // ─── Build dashboard stats ──────────────────────────────
  if (statsEl) {
    const total = posts.length;
    const lastWeek = posts.filter(p => {
      const d = new Date(p.date + "T00:00:00");
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length;
    const thisMonth = posts.filter(p => p.date && p.date.slice(0, 7) === new Date().toISOString().slice(0, 7)).length;

    const tagCounts = {};
    posts.forEach(p => (p.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const hotTopic = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];

    statsEl.innerHTML = `
      <div class="dashboard-stat"><span class="dashboard-stat-value">${total}</span><span class="dashboard-stat-label">Posts</span></div>
      <div class="dashboard-stat-divider"></div>
      <div class="dashboard-stat"><span class="dashboard-stat-value">${thisMonth}</span><span class="dashboard-stat-label">This month</span></div>
      <div class="dashboard-stat-divider"></div>
      <div class="dashboard-stat"><span class="dashboard-stat-value">${lastWeek}</span><span class="dashboard-stat-label">This week</span></div>
      ${hotTopic ? `<div class="dashboard-stat-divider"></div><span class="dashboard-hot-topic"><i data-lucide="trending-up"></i>${escapeHtml(hotTopic[0])}</span>` : ''}
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  // ─── Render feed ─────────────────────────────────────────
  let filteredPosts = [...posts];

  function groupByMonth(postList) {
    const groups = {};
    postList.forEach(p => {
      const key = p.date ? p.date.slice(0, 7) : "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }

  function renderFeed(postList) {
    feed.innerHTML = "";
    const groups = groupByMonth(postList);
    let hadResults = false;

    groups.forEach(([monthKey, monthPosts]) => {
      if (!monthPosts.length) return;
      hadResults = true;

      const d = new Date(monthKey + "-01T00:00:00");
      const monthLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const header = document.createElement("div");
      header.className = "feed-month-header";
      header.innerHTML = `
        <span class="feed-month-label">${escapeHtml(monthLabel)}</span>
        <span class="feed-month-count">${monthPosts.length} post${monthPosts.length > 1 ? 's' : ''}</span>
        <span class="feed-month-line"></span>
      `;
      feed.appendChild(header);

      monthPosts.forEach((p, idx) => {
        const card = document.createElement("article");
        card.className = "content-card feed-post reveal";
        card.dataset.postId = p.id || idx;

        const moodHtml = p.mood ? `<span class="feed-mood">${escapeHtml(p.mood)}</span>` : "";
        const isQuarterly = (p.tags || []).includes("Quarterly");
        const quarterlyLabel = isQuarterly
          ? `<span class="feed-quarterly-label">&#x1f4ca; ${escapeHtml(p.title.match(/\d{4}\/Q\d/)?.[0] || "Quarterly")}</span>`
          : "";

        card.innerHTML = `
          <div class="feed-post-header">
            <p class="feed-post-date">${formatDate(p.date)}</p>
            ${quarterlyLabel}
            <h3>${moodHtml}${escapeHtml(p.title)}</h3>
          </div>
          <p class="feed-summary">${escapeHtml(p.summary || "")}</p>
          <div class="feed-tags">${(p.tags || []).map(t => `<span class="feed-tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`).join("")}</div>
          <div class="feed-body-wrap" id="body-${p.id || idx}"></div>
          ${p.body ? `<button class="feed-toggle button button-secondary" data-target="body-${p.id || idx}" aria-expanded="false">Read more</button>` : ""}
        `;

        feed.appendChild(card);

        if (p.body) {
          const bodyWrap = card.querySelector(`#body-${p.id || idx}`);
          bodyWrap.innerHTML = `<div class="feed-body-inner">${formatBody(p.body)}</div>`;

          const toggle = card.querySelector(".feed-toggle");
          toggle.addEventListener("click", () => {
            const open = toggle.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(!open));
            toggle.textContent = open ? "Read more" : "Show less";
            bodyWrap.classList.toggle("is-open", !open);
          });
        }

        if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          const obs = new IntersectionObserver(
            (entries) => {
              entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); }
              });
            },
            { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
          );
          obs.observe(card);
        } else {
          card.classList.add("is-visible");
        }
      });
    });

    if (!hadResults) {
      const msg = document.createElement("p");
      msg.className = "search-no-results";
      msg.textContent = "No posts match your search.";
      feed.appendChild(msg);
    }
  }

  // ─── Search ──────────────────────────────────────────────
  let searchQuery = "";

  function applyFilter() {
    const q = searchQuery.toLowerCase().trim();
    const activeTags = [...document.querySelectorAll(".feed-tag.is-active")].map(el => el.dataset.tag);

    let result = [...posts];

    if (q) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.summary || "").toLowerCase().includes(q) ||
        (p.body || "").toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    if (activeTags.length > 0) {
      result = result.filter(p => (p.tags || []).some(t => activeTags.includes(t)));
    }

    renderFeed(result);
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      applyFilter();
    });
  }

  // ─── Tag click ───────────────────────────────────────────
  feed.addEventListener("click", (e) => {
    const tag = e.target.closest(".feed-tag");
    if (!tag) return;
    tag.classList.toggle("is-active");
    applyFilter();
  });

  // ─── Initial render ──────────────────────────────────────
  renderFeed(posts);
})();