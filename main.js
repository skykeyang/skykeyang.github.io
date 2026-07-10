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

// Approach cards: stagger reveal on scroll
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
  const approachObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          approachObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );
  document.querySelectorAll(".approach-card").forEach((card) => approachObserver.observe(card));
} else {
  document.querySelectorAll(".approach-card").forEach((card) => card.classList.add("is-revealed"));
}

// 3D tilt on portfolio cards
const portfolioCards = document.querySelectorAll(".portfolio-card");
if (!window.matchMedia("(hover: none)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  portfolioCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateY = ((x - centerX) / centerX) * 8;
      const rotateX = -((y - centerY) / centerY) * 8;
      card.style.setProperty("--tilt-x", `${rotateX}deg`);
      card.style.setProperty("--tilt-y", `${rotateY}deg`);
      card.style.setProperty("--glow-x", `${(x / rect.width) * 100}%`);
      card.style.setProperty("--glow-y", `${(y / rect.height) * 100}%`);
    });
    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

// Animated stat counters
const statValues = document.querySelectorAll(".stat-value");
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target, 10);
          const duration = 1800;
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            el.textContent = current.toLocaleString();
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              el.textContent = target.toLocaleString();
            }
          };
          requestAnimationFrame(animate);
          statObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.4 }
  );
  statValues.forEach((el) => statObserver.observe(el));
} else {
  statValues.forEach((el) => {
    el.textContent = parseInt(el.dataset.target, 10).toLocaleString();
  });
}

// Hero particle network
const heroCanvas = document.getElementById("hero-canvas");
if (heroCanvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const ctx = heroCanvas.getContext("2d");
  let particles = [];
  let animationId = null;
  let isVisible = true;
  const PARTICLE_COUNT = window.innerWidth < 768 ? 25 : 50;
  const MAX_DISTANCE = 140;

  function resizeCanvas() {
    const hero = heroCanvas.parentElement;
    heroCanvas.width = hero.offsetWidth;
    heroCanvas.height = hero.offsetHeight;
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * heroCanvas.width,
        y: Math.random() * heroCanvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5
      });
    }
  }

  function getColors() {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return {
      particle: isDark ? "rgba(125, 211, 252, 0.5)" : "rgba(37, 99, 235, 0.4)",
      line: isDark ? "rgba(125, 211, 252, 0.12)" : "rgba(37, 99, 235, 0.1)"
    };
  }

  function animate() {
    if (!isVisible) return;
    ctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
    const colors = getColors();

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > heroCanvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > heroCanvas.height) p.vy *= -1;
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DISTANCE) {
          ctx.strokeStyle = colors.line;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 1 - dist / MAX_DISTANCE;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    ctx.globalAlpha = 1;
    particles.forEach((p) => {
      ctx.fillStyle = colors.particle;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    animationId = requestAnimationFrame(animate);
  }

  resizeCanvas();
  initParticles();
  animate();

  window.addEventListener("resize", () => {
    resizeCanvas();
    initParticles();
  });

  // Pause when offscreen
  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animationId) {
          animate();
        } else if (!isVisible && animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      });
    },
    { threshold: 0 }
  );
  heroObserver.observe(heroCanvas.parentElement);
} else if (heroCanvas) {
  heroCanvas.style.display = "none";
}

if (window.lucide) {
  window.lucide.createIcons();
}
