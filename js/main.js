/* ============================================
   ALPFA W&M — Main JS
   ============================================ */

// ============================================
// CUSTOM CURSOR
// ============================================

const dot  = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');

if (dot && ring) {
  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  // Ring follows with lerp for smooth trail
  (function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  })();

  // Hover effect on interactive elements
  const interactives = document.querySelectorAll(
    'a, button, .btn, .event-card, .feature-card, .tier-card, .board-card, .gallery-item, .sponsor-name'
  );

  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      dot.classList.add('hover');
      ring.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      dot.classList.remove('hover');
      ring.classList.remove('hover');
    });
  });
}

// ============================================
// NAV SCROLL EFFECT
// ============================================

const nav = document.getElementById('nav');

if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ============================================
// MOBILE NAV
// ============================================

const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close on nav link click
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// ============================================
// SCROLL REVEAL
// ============================================

const revealEls = document.querySelectorAll('[data-reveal]');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = entry.target.style.transitionDelay || '0s';
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// ============================================
// STAT COUNTER ANIMATION
// ============================================

function animateCounter(el, target, suffix = '') {
  const duration = 1800;
  const start = performance.now();

  const tick = (now) => {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.floor(eased * target);
    el.textContent = current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target.toLocaleString() + suffix;
  };

  requestAnimationFrame(tick);
}

const statNums = document.querySelectorAll('[data-count]');

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      animateCounter(el, target, suffix);
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

statNums.forEach(el => statObserver.observe(el));

// ============================================
// IMAGE LOAD — show img, hide placeholder
// ============================================

document.querySelectorAll('.image-frame img').forEach(img => {
  if (img.complete && img.naturalWidth > 0) {
    img.classList.add('loaded');
    const placeholder = img.nextElementSibling;
    if (placeholder && placeholder.classList.contains('img-placeholder')) {
      placeholder.style.display = 'none';
    }
  } else {
    img.addEventListener('load', () => {
      img.classList.add('loaded');
      const placeholder = img.nextElementSibling;
      if (placeholder && placeholder.classList.contains('img-placeholder')) {
        placeholder.style.display = 'none';
      }
    });
  }
});

// ============================================
// MINI SLIDESHOW (inside carousel card)
// ============================================

document.querySelectorAll('.mini-show').forEach(function (wrap) {
  const slide  = wrap.closest('.carousel-slide');
  const dotsEl = slide ? slide.querySelector('.mini-dots') : null;
  if (!dotsEl) return;

  const imgs = Array.from(wrap.querySelectorAll('.mini-img'));
  if (!imgs.length) return;

  let current = 0;
  let timer;

  // Build dots
  imgs.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'mini-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Photo ' + (i + 1));
    d.addEventListener('click', (e) => { e.stopPropagation(); goTo(i); resetTimer(); });
    dotsEl.appendChild(d);
  });

  function goTo(n) {
    imgs[current].classList.remove('active');
    dotsEl.children[current].classList.remove('active');
    current = (n + imgs.length) % imgs.length;
    imgs[current].classList.add('active');
    dotsEl.children[current].classList.add('active');
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 3200);
  }

  // Click card to advance manually
  wrap.addEventListener('click', () => { goTo(current + 1); resetTimer(); });

  resetTimer();
});

// ============================================
// PHOTO CAROUSEL
// ============================================

document.querySelectorAll('.carousel-wrap').forEach(function (wrap) {
  const track   = wrap.querySelector('.carousel-track');
  const prevBtn = wrap.querySelector('.carousel-prev');
  const nextBtn = wrap.querySelector('.carousel-next');
  const dotsEl  = wrap.querySelector('.carousel-dots');

  const slides     = Array.from(track.querySelectorAll('.carousel-slide'));
  // Desktop shows the whole row (up to 4) at once; smaller screens page through it
  const perPage    = () => window.innerWidth <= 600 ? 1 : window.innerWidth <= 900 ? 2 : Math.min(slides.length, 4);
  let   current    = 0;

  function totalPages() { return Math.ceil(slides.length / perPage()); }

  function layout() {
    track.style.gridTemplateColumns = `repeat(${perPage()}, 1fr)`;
    wrap.classList.toggle('single-page', totalPages() <= 1);
  }

  function buildDots() {
    dotsEl.innerHTML = '';
    for (let i = 0; i < totalPages(); i++) {
      const d = document.createElement('button');
      d.className = 'carousel-dot' + (i === current ? ' active' : '');
      d.setAttribute('aria-label', 'Page ' + (i + 1));
      d.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(d);
    }
  }

  function goTo(page) {
    current = (page + totalPages()) % totalPages();
    const pp    = perPage();
    const start = current * pp;
    slides.forEach((s, i) => {
      const shouldShow = i >= start && i < start + pp;
      if (shouldShow && !s.classList.contains('active')) {
        s.classList.add('active', 'fade-in');
        s.addEventListener('animationend', () => s.classList.remove('fade-in'), { once: true });
      } else if (!shouldShow) {
        s.classList.remove('active', 'fade-in');
      }
    });
    dotsEl.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  window.addEventListener('resize', () => { layout(); buildDots(); goTo(0); });

  layout();
  buildDots();
  goTo(0);
});

// ============================================
// INSTAGRAM FEED (events page)
// ============================================

(function () {
  const feed = document.getElementById('igFeed');
  if (!feed) return;

  const esc = (str) => str.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  fetch('/api/instagram')
    .then((r) => r.ok ? r.json() : Promise.reject())
    .then(({ posts }) => {
      if (!posts || !posts.length) return;
      const grid = document.createElement('div');
      grid.className = 'ig-grid';
      grid.innerHTML = posts.map((p) => {
        const date = new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const caption = p.caption.length > 120 ? p.caption.slice(0, 120).trim() + '…' : p.caption;
        return `
          <a class="ig-post" href="${esc(p.permalink)}" target="_blank" rel="noopener">
            <div class="ig-post-img">
              <img src="${esc(p.image)}" alt="${esc(caption || 'Instagram post')}" loading="lazy" />
              ${p.isVideo ? '<span class="ig-post-video">&#9654;</span>' : ''}
            </div>
            <div class="ig-post-body">
              <p class="ig-post-date">${date}</p>
              <p class="ig-post-caption">${esc(caption)}</p>
            </div>
          </a>`;
      }).join('');
      feed.replaceChildren(grid);
    })
    .catch(() => { /* keep the "Follow on Instagram" fallback */ });
})();

// ============================================
// HERO LOGO — 3D TILT + SHINE
// ============================================

