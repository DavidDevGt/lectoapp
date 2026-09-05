// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

// ===== PARTICLES =====
const container = document.getElementById('particles-container');
if (container) {
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-duration: ${4 + Math.random() * 8}s;
      animation-delay: ${Math.random() * 6}s;
      opacity: ${0.2 + Math.random() * 0.4};
      width: ${1 + Math.random() * 2}px;
      height: ${1 + Math.random() * 2}px;
    `;
    container.appendChild(p);
  }
}

// ===== COUNTER ANIMATION =====
function animateCounter(el, target, suffix, duration) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(eased * target);
    el.textContent = value;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
    }
  };
  requestAnimationFrame(update);
}

// ===== INTERSECTION OBSERVER =====
const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };

const generalObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      generalObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Elements to animate on scroll
const animatedEls = document.querySelectorAll(
  '.problem-card, .pain-item, .component-card, .stack-category, ' +
  '.quality-stat, .pattern-card, .timeline-item'
);
animatedEls.forEach(el => generalObserver.observe(el));

// ===== COUNTER TRIGGER =====
const metricsEl = document.getElementById('hero-metrics');
if (metricsEl) {
  const metricObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = entry.target.querySelectorAll('.metric-card');
        cards.forEach((card, i) => {
          const numEl = card.querySelector('.metric-number');
          const target = parseInt(numEl.dataset.target, 10);
          const suffix = card.querySelector('.metric-suffix') ? card.querySelector('.metric-suffix').textContent : '';
          setTimeout(() => animateCounter(numEl, target, suffix, 1500), i * 150);
        });
        metricObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  metricObserver.observe(metricsEl);
}

// ===== SMOOTH SCROLL NAV =====
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ===== VIDEO PLACEHOLDER INTERACTION =====
const playBtn = document.getElementById('video-play-btn');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    const label = document.querySelector('.video-label');
    if (label) {
      label.textContent = 'Demo disponible en Sprint 4 — coming soon';
    }
  });
  playBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playBtn.click();
    }
  });
}

// ===== STAGGER ANIMATIONS for timeline =====
document.querySelectorAll('.timeline-item').forEach((el, i) => {
  el.style.transitionDelay = `${i * 0.1}s`;
});

// ===== ACTIVE NAV LINK =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        link.style.background = '';
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.style.color = 'var(--indigo-light)';
          link.style.background = 'rgba(99,102,241,0.08)';
        }
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => navObserver.observe(s));

console.log('%cLectoApp Portfolio', 'font-size:20px; font-weight:bold; color:#6366F1;');
console.log('%c349 tests | TDD estricto | TypeScript strict | Node.js + React + React Native', 'color:#94A3B8;');
