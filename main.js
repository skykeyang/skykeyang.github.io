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

if (window.lucide) {
  window.lucide.createIcons();
}
