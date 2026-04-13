const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const revealNodes = document.querySelectorAll(".reveal");
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -32px 0px"
    }
  );

  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

if (document.body.dataset.page === "home") {
  const sections = Array.from(document.querySelectorAll("main section[id]"));

  const setActiveLink = () => {
    const offset = window.scrollY + 120;
    let activeId = "";

    sections.forEach((section) => {
      if (section.offsetTop <= offset) {
        activeId = section.id;
      }
    });

    navLinks.forEach((link) => {
      const target = link.getAttribute("href");
      link.classList.toggle("is-active", target === `#${activeId}`);
    });
  };

  setActiveLink();
  window.addEventListener("scroll", setActiveLink, { passive: true });
}

// Approach cards: mobile tap toggle
document.querySelectorAll(".approach-card").forEach((card) => {
  card.addEventListener("click", () => {
    const wasActive = card.classList.contains("is-active");
    document.querySelectorAll(".approach-card.is-active").forEach((c) => c.classList.remove("is-active"));
    if (!wasActive) card.classList.add("is-active");
  });

  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.click();
    }
  });
});

// Close approach cards on outside tap
document.addEventListener("click", (e) => {
  if (!e.target.closest(".approach-card")) {
    document.querySelectorAll(".approach-card.is-active").forEach((c) => c.classList.remove("is-active"));
  }
});

if (window.lucide) {
  window.lucide.createIcons();
}
