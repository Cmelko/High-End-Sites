const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const revealItems = document.querySelectorAll(".reveal");
const countItems = document.querySelectorAll("[data-count]");
const tiltItems = document.querySelectorAll("[data-tilt]");
const parallaxItems = document.querySelectorAll("[data-parallax]");
const depthScenes = document.querySelectorAll("[data-depth-scene]");
const cursorOrb = document.querySelector("[data-cursor-orb]");
const year = document.querySelector("[data-year]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

if (year) {
  year.textContent = new Date().getFullYear();
}

const syncHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 16);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

if (navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

revealItems.forEach((item, index) => {
  item.style.setProperty("--stagger", `${Math.min(index * 70, 420)}ms`);
});

const animateCount = (item) => {
  const target = Number(item.dataset.count);
  if (!Number.isFinite(target) || prefersReducedMotion) return;

  const duration = 1200;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    item.textContent = String(Math.round(target * eased));

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  item.textContent = "0";
  requestAnimationFrame(tick);
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        entry.target.querySelectorAll("[data-count]").forEach(animateCount);

        if (entry.target.matches(".image-panel, .image-card")) {
          entry.target.classList.add("is-lit");
        }

        entry.target.querySelectorAll(".image-panel, .image-card").forEach((item) => {
          item.classList.add("is-lit");
        });

        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.14,
  },
);

revealItems.forEach((item) => revealObserver.observe(item));

if (!prefersReducedMotion && hasFinePointer && cursorOrb) {
  window.addEventListener(
    "pointermove",
    (event) => {
      cursorOrb.style.opacity = "1";
      cursorOrb.style.transform = `translate3d(${event.clientX - 110}px, ${event.clientY - 110}px, 0)`;
    },
    { passive: true },
  );

  window.addEventListener("pointerleave", () => {
    cursorOrb.style.opacity = "0";
  });
}

if (!prefersReducedMotion && hasFinePointer) {
  tiltItems.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      item.style.transform = `rotateX(${-y * 5}deg) rotateY(${x * 7}deg) translateY(-3px)`;
    });

    item.addEventListener("pointerleave", () => {
      item.style.transform = "";
    });
  });
}

const depthSceneState = new WeakMap();

const applyDepthScene = (scene) => {
  const state = depthSceneState.get(scene);
  if (!state) return;

  scene.querySelectorAll("[data-depth]").forEach((layer) => {
    const depth = Number(layer.dataset.depth) || 0;
    const x = state.x * depth;
    const y = state.y * depth + state.scroll * depth * 0.28;
    const scale = layer.classList.contains("scene-bg") ? " scale(1.06)" : "";
    layer.style.transform = `translate3d(${x}px, ${y}px, 0)${scale}`;
  });
};

if (!prefersReducedMotion) {
  depthScenes.forEach((scene) => {
    depthSceneState.set(scene, { x: 0, y: 0, scroll: 0 });

    if (hasFinePointer) {
      scene.addEventListener("pointermove", (event) => {
        const rect = scene.getBoundingClientRect();
        const state = depthSceneState.get(scene);
        state.x = (event.clientX - rect.left) / rect.width - 0.5;
        state.y = (event.clientY - rect.top) / rect.height - 0.5;
        applyDepthScene(scene);
      });

      scene.addEventListener("pointerleave", () => {
        const state = depthSceneState.get(scene);
        state.x = 0;
        state.y = 0;
        applyDepthScene(scene);
      });
    }
  });
}

let ticking = false;

const syncParallax = () => {
  parallaxItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const distance = rect.top + rect.height / 2 - viewportCenter;
    const offset = Math.max(Math.min(distance * -0.025, 9), -9);
    item.style.backgroundPosition = `center calc(50% + ${offset}px)`;
  });

  depthScenes.forEach((scene) => {
    const state = depthSceneState.get(scene);
    if (!state) return;

    const rect = scene.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const distance = rect.top + rect.height / 2 - viewportCenter;
    state.scroll = Math.max(Math.min(distance * -0.012, 7), -7);
    applyDepthScene(scene);
  });

  ticking = false;
};

if (!prefersReducedMotion) {
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(syncParallax);
        ticking = true;
      }
    },
    { passive: true },
  );

  syncParallax();
}
