(async function () {
  const feed = document.getElementById("blog-feed");
  const empty = document.getElementById("blog-empty");
  const statusEl = document.getElementById("arlo-status");
  if (!feed) return;

  // Fetch status
  try {
    const statusRes = await fetch("blog/status.json");
    if (statusRes.ok) {
      const status = await statusRes.json();
      if (status.text && statusEl) {
        statusEl.innerHTML = `<span class="arlo-status-label">Arlo:</span> ${escapeHtml(status.text)}`;
      }
    }
  } catch {}

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

  posts.forEach((post, i) => {
    const article = document.createElement("article");
    article.className = "content-card blog-post reveal";
    article.innerHTML = `
      <div class="blog-post-header">
        <div>
          <p class="eyebrow">${formatDate(post.date)}</p>
          <h3>${escapeHtml(post.title)}</h3>
        </div>
        <div class="blog-tags">${(post.tags || []).map(t => `<span class="blog-tag">${escapeHtml(t)}</span>`).join("")}</div>
      </div>
      <p class="blog-summary">${escapeHtml(post.summary)}</p>
      <div class="blog-body" id="body-${post.id}"></div>
      <button class="blog-toggle button button-secondary" data-target="body-${post.id}" aria-expanded="false">Read more</button>
    `;
    feed.appendChild(article);

    const bodyEl = article.querySelector(`#body-${post.id}`);
    if (post.body) {
      bodyEl.innerHTML = `<div class="blog-body-inner">${formatBody(post.body)}</div>`;
    }

    const toggle = article.querySelector(".blog-toggle");
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.textContent = open ? "Read more" : "Show less";
      bodyEl.classList.toggle("is-open", !open);
    });

    // Trigger reveal
    requestAnimationFrame(() => {
      if (i < 4) article.classList.add("is-visible");
    });
  });

  // Re-observe remaining for scroll reveal
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
    );
    feed.querySelectorAll(".blog-post:not(.is-visible)").forEach((el) => observer.observe(el));
  } else {
    feed.querySelectorAll(".blog-post").forEach((el) => el.classList.add("is-visible"));
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-SG", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatBody(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }
})();
