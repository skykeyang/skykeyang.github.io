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

  function timeAgo(dateStr) {
    const now = new Date();
    const d = new Date(dateStr + "T00:00:00");
    const diff = now - d;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  function getMonthYear(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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

  // Sort newest first
  posts.sort((a, b) => b.date.localeCompare(a.date));

  // Fetch status
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

  // ─── Build heatmap ──────────────────────────────────────
  if (heatmapEl) {
    // Map dates to post counts
    const countMap = {};
    posts.forEach(p => { countMap[p.date] = (countMap[p.date] || 0) + 1; });

    // Build 53-week grid ending at today
    const today = new Date();
    today.setHours(0,0,0,0);

    // Find the Monday ~53 weeks ago
    const start = new Date(today);
    start.setDate(start.getDate() - 370); // a bit more than 53 weeks
    // Roll back to Monday
    const startDay = start.getDay(); // 0=Sun
    const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
    start.setDate(start.getDate() + mondayOffset);

    // Collect dates for each cell
    const cells = [];
    const weeks = [];
    let current = new Date(start);

    // Month tracking for header
    const monthLabels = [];
    let lastMonth = -1;

    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().slice(0, 10);
        const count = countMap[dateStr] || 0;
        const level = count === 0 ? 0 : count === 1 ? 2 : count <= 2 ? 3 : 4;

        // Track month labels
        const m = current.getMonth();
        if (m !== lastMonth && current <= today) {
          monthLabels.push({ col: w, label: current.toLocaleDateString("en-US", { month: "short" }) });
          lastMonth = m;
        }

        if (current <= today) {
          week.push({ date: dateStr, count, level });
        }
        current = new Date(current);
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }

    // Determine month label positions (first col where each month appears)
    const monthPositions = [];
    let seenMonths = {};
    for (let w = 0; w < weeks.length; w++) {
      for (let d = 0; d < 7; d++) {
        const cell = weeks[w][d];
        if (!cell) continue;
        const month = cell.date.slice(0, 7);
        if (!seenMonths[month]) {
          seenMonths[month] = true;
          monthPositions.push({ col: w, label: new Date(cell.date + "T00:00:00").toLocaleDateString("en-US", { month: "short" }) });
        }
      }
    }

    // Build header with month labels
    const headerWidth = monthPositions.length > 0
      ? (monthPositions[1] ? (monthPositions[1].col - monthPositions[0].col) : 4) * 14
      : 50;

    let html = '<div class="heatmap-wrap">';
    html += '<div class="heatmap-header">';
    html += '<div style="width:36px;flex-shrink:0"></div>';
    let lastCol = -1;
    monthPositions.forEach(mp => {
      const gap = (mp.col - lastCol - 1) * 14;
      html += `<div class="heatmap-month" style="margin-left:${Math.max(0, gap)}px">${mp.label}</div>`;
      lastCol = mp.col;
    });
    html += '</div>';

    // Build grid
    html += '<div class="heatmap-grid">';
    const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''];
    for (let d = 0; d < 7; d++) {
      html += `<div class="heatmap-day-label">${dayLabels[d]}</div>`;
      for (let w = 0; w < 53; w++) {
        const cell = weeks[w] && weeks[w][d];
        if (cell) {
          const title = cell.count > 0 ? `${cell.count} post${cell.count > 1 ? 's' : ''} on ${cell.date}` : cell.date;
          html += `<div class="heatmap-cell level-${cell.level}" title="${escapeHtml(title)}"></div>`;
        } else {
          html += '<div style="width:12px;height:12px"></div>';
        }
      }
    }
    html += '</div>';

    // Legend
    html += '<div class="heatmap-legend"><span>Less</span>';
    for (let i = 0; i <= 4; i++) {
      html += `<div class="heatmap-cell level-${i}"></div>`;
    }
    html += '<span>More</span></div></div>';

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

    // Hot topic
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

  // ─── Render console feed ────────────────────────────────
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

      // Month header
      const d = new Date(monthKey + "-01T00:00:00");
      const monthLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const header = document.createElement("div");
      header.className = "console-month-header";
      header.innerHTML = `
        <span class="console-month-label">${escapeHtml(monthLabel)}</span>
        <span class="console-month-count">${monthPosts.length} post${monthPosts.length > 1 ? 's' : ''}</span>
        <span class="console-month-line"></span>
      `;
      feed.appendChild(header);

      // Posts in this month
      monthPosts.forEach((p, idx) => {
        const entry = document.createElement("button");
        entry.className = "console-entry reveal";
        entry.dataset.postId = p.id || idx;
        entry.dataset.filterTags = (p.tags || []).join(",");

        const moodHtml = p.mood ? escapeHtml(p.mood) : "";
        const dateShort = p.date ? p.date.slice(5) : "";
        const tagHtml = (p.tags || []).map(t =>
          `<span class="console-tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`
        ).join("");

        entry.innerHTML = `
          <span class="console-date">${escapeHtml(dateShort)}</span>
          <span class="console-mood">${moodHtml}</span>
          <span class="console-title">${escapeHtml(p.title)}</span>
          <span class="console-tags">${tagHtml}</span>
        `;

        // Expandable body
        const bodyWrap = document.createElement("div");
        bodyWrap.className = "console-body-wrap";
        const bodyDiv = document.createElement("div");
        bodyDiv.className = "console-body";

        if (p.summary) {
          const summaryP = document.createElement("p");
          summaryP.style.margin = "0 0 0.5rem";
          summaryP.style.fontSize = "0.9rem";
          summaryP.style.color = "var(--text-secondary)";
          summaryP.textContent = p.summary;
          bodyDiv.appendChild(summaryP);
        }

        if (p.body) {
          const bodyInner = document.createElement("div");
          bodyInner.className = "console-body-inner";
          bodyInner.innerHTML = `<div>${formatBody(p.body)}</div>`;

          const toggle = document.createElement("button");
          toggle.className = "button button-secondary console-toggle";
          toggle.textContent = "Read more";
          toggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const open = bodyWrap.classList.toggle("is-open");
            toggle.textContent = open ? "Show less" : "Read more";
          });

          bodyDiv.appendChild(bodyInner);
          bodyWrap.appendChild(bodyDiv);
          bodyWrap.appendChild(toggle);
          entry.appendChild(bodyWrap);
        } else {
          bodyWrap.appendChild(bodyDiv);
          entry.appendChild(bodyWrap);
        }

        feed.appendChild(entry);

        // IntersectionObserver for reveal
        if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          const obs = new IntersectionObserver(
            (entries) => {
              entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); }
              });
            },
            { threshold: 0.05, rootMargin: "0px 0px -16px 0px" }
          );
          obs.observe(entry);
        } else {
          entry.classList.add("is-visible");
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

  // ─── Search filtering ──────────────────────────────────
  let searchQuery = "";

  function applySearch() {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      filteredPosts = [...posts];
    } else {
      filteredPosts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.summary || "").toLowerCase().includes(q) ||
        (p.body || "").toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    renderFeed(filteredPosts);
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      applySearch();
    });
  }

  // ─── Tag filtering via click delegation ─────────────────
  feed.addEventListener("click", (e) => {
    const tag = e.target.closest(".console-tag");
    if (!tag) return;
    e.stopPropagation(); // don't trigger entry expand

    const tagName = tag.dataset.tag;
    tag.classList.toggle("is-active");
    const activeTags = [...feed.querySelectorAll(".console-tag.is-active")].map(el => el.dataset.tag);

    if (activeTags.length === 0) {
      filteredPosts = [...posts];
    } else {
      filteredPosts = posts.filter(p =>
        (p.tags || []).some(t => activeTags.includes(t))
      );
    }

    // Apply search filter on top of tag filter
    applySearch();
  });

  // ─── Entry expand/collapse on click (not on tag) ───────
  feed.addEventListener("click", (e) => {
    const entry = e.target.closest(".console-entry");
    if (!entry) return;
    if (e.target.closest(".console-tag") || e.target.closest(".console-toggle")) return;

    const bodyWrap = entry.querySelector(".console-body-wrap");
    const toggle = entry.querySelector(".console-toggle");
    if (!bodyWrap) return;

    const isOpen = bodyWrap.classList.toggle("is-open");
    entry.classList.toggle("is-expanded", isOpen);
    if (toggle) toggle.textContent = isOpen ? "Show less" : "Read more";
  });

  // ─── Initial render ─────────────────────────────────────
  renderFeed(posts);
})();