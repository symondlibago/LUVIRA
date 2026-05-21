/* =========================================================
   LUVIRA × JoviRX — Interactive Postcard Gallery
   ========================================================= */

const POSTCARDS = [
  { slug: 'semaglutide',       name: 'Semaglutide',                         front: 'public/1.png',  back: 'public/2.png'  },
  { slug: 'tesamorelin',       name: 'Tesamorelin',                         front: 'public/3.png',  back: 'public/4.png'  },
  { slug: 'tirzeptazide',      name: 'Tirzeptazide',                        front: 'public/5.png',  back: 'public/6.png'  },
  { slug: 'bpc-157',           name: 'BPC-157',                             front: 'public/7.png',  back: 'public/8.png'  },
  { slug: 'retatrutide',       name: 'Retatrutide',                         front: 'public/9.png',  back: 'public/10.png' },
  { slug: 'nad',               name: 'NAD+',                                front: 'public/11.png', back: 'public/12.png' },
  { slug: 'ghk-cu',            name: 'GHK-Cu',                              front: 'public/13.png', back: 'public/14.png' },
  { slug: 'thymosin-alpha-1',  name: 'Thymosin Alpha 1',                    front: 'public/15.png', back: 'public/16.png' },
  { slug: 'mots-c',            name: 'MOTS-C',                              front: 'public/17.png', back: 'public/18.png' },
  { slug: 'igf-1-lr3',         name: 'IGF-1-LR3',                           front: 'public/19.png', back: 'public/20.png' },
  { slug: 'glow-blend',        name: 'BPC-157 + TB4 + GHK-Cu (Glow Blend)', front: 'public/21.png', back: 'public/22.png' },
];

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const carousel    = $('#carousel');
const railTrack   = $('#railTrack');
const capIdx      = $('#capIdx');
const capName     = $('#capName');
const capTotal    = $('#capTotal');
const prevBtn     = $('#prevBtn');
const nextBtn     = $('#nextBtn');
const gridOverlay = $('#gridOverlay');
const gridCards   = $('#gridCards');
const viewToggle  = $('#viewToggle');
const closeGrid   = $('#closeGrid');
const lightbox    = $('#lightbox');
const lbCard      = $('#lightboxCard');
const lbFront     = $('#lbFront');
const lbBack      = $('#lbBack');
const lightboxClose = $('#lightboxClose');
const lightboxFlip  = $('#lightboxFlip');
const lbShareUrl  = $('#lbShareUrl');
const lbCopyBtn   = $('#lbCopyBtn');

let currentIndex = 0;
let cardEls = [];
let isKiosk = false;   // true when a slug URL was opened directly

const FLIP_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.3M21 12a9 9 0 0 1-15.5 6.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>`;

/* ---------- URL helpers ---------- */
function findIndexBySlug(slug) {
  if (!slug) return -1;
  const s = slug.toLowerCase();
  return POSTCARDS.findIndex(p => p.slug === s);
}
function getSlugFromURL() {
  // Pathname
  let path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (path.endsWith('index.html')) path = '';
  if (path) {
    const idx = findIndexBySlug(path);
    if (idx >= 0) return POSTCARDS[idx].slug;
  }
  // Query
  const params = new URLSearchParams(window.location.search);
  const q = (params.get('p') || '').toLowerCase();
  if (q) {
    const idx = findIndexBySlug(q);
    if (idx >= 0) return POSTCARDS[idx].slug;
  }
  // Hash
  const h = window.location.hash.replace(/^#/, '').toLowerCase();
  if (h) {
    const idx = findIndexBySlug(h);
    if (idx >= 0) return POSTCARDS[idx].slug;
  }
  return null;
}
function buildShareURL(slug) {
  // Use clean path so QR-scanned URL looks like https://site.com/semaglutide
  return `${window.location.origin}/${slug}`;
}
function pushURL(slug) {
  if (!slug) {
    if (window.location.pathname !== '/') {
      history.pushState({}, '', '/');
    }
    return;
  }
  history.pushState({ slug }, '', `/${slug}`);
}
function replaceURL(slug) {
  if (!slug) {
    history.replaceState({}, '', '/');
    return;
  }
  history.replaceState({ slug }, '', `/${slug}`);
}

/* ---------- Build cards ---------- */
function buildCards() {
  capTotal.textContent = String(POSTCARDS.length).padStart(2, '0');

  POSTCARDS.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.index = i;
    card.dataset.slug = p.slug;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${p.name} postcard — click to flip`);
    card.innerHTML = `
      <div class="card-inner">
        <div class="face front">
          <img src="${p.front}" alt="${p.name} postcard front" loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async" draggable="false" />
          <span class="flip-badge">${FLIP_SVG} Flip</span>
        </div>
        <div class="face back">
          <img src="${p.back}" alt="${p.name} postcard back — details and QR code" loading="lazy" decoding="async" draggable="false" />
          <span class="flip-badge">${FLIP_SVG} Back</span>
        </div>
      </div>
    `;
    carousel.appendChild(card);

    const thumb = document.createElement('button');
    thumb.className = 'thumb';
    thumb.dataset.index = i;
    thumb.setAttribute('aria-label', `Show ${p.name}`);
    thumb.innerHTML = `
      <span class="thumb-num">${String(i + 1).padStart(2, '0')}</span>
      <img src="${p.front}" alt="" loading="lazy" decoding="async" draggable="false" />
    `;
    railTrack.appendChild(thumb);

    const gc = document.createElement('button');
    gc.className = 'gc';
    gc.dataset.index = i;
    gc.setAttribute('aria-label', `Open ${p.name}`);
    gc.innerHTML = `
      <img src="${p.front}" alt="${p.name}" loading="lazy" decoding="async" draggable="false" />
      <span class="gc-label"><span class="gc-num">${String(i + 1).padStart(2, '0')}</span>${p.name}</span>
    `;
    gridCards.appendChild(gc);
  });

  cardEls = $$('.card', carousel);

  cardEls.forEach(el => el.addEventListener('click', onCardClick));
  $$('.thumb', railTrack).forEach(el => {
    el.addEventListener('click', () => goTo(parseInt(el.dataset.index, 10)));
  });
  $$('.gc', gridCards).forEach(el => {
    el.addEventListener('click', () => {
      goTo(parseInt(el.dataset.index, 10));
      closeGridView();
    });
  });
}

/* ---------- Carousel positioning ---------- */
function layout() {
  const n = POSTCARDS.length;
  cardEls.forEach((el, i) => {
    const diff = ((i - currentIndex) % n + n) % n;
    let pos = 'hidden';
    if (diff === 0)          pos = 'center';
    else if (diff === 1)     pos = 'right';
    else if (diff === n - 1) pos = 'left';
    else if (diff === 2)     pos = 'far-right';
    else if (diff === n - 2) pos = 'far-left';
    el.dataset.pos = pos;
    if (pos !== 'center' && el.classList.contains('is-flipped')) {
      el.classList.remove('is-flipped');
    }
  });

  const p = POSTCARDS[currentIndex];
  capIdx.textContent = String(currentIndex + 1).padStart(2, '0');
  capName.classList.add('is-swapping');
  setTimeout(() => {
    capName.textContent = p.name;
    capName.classList.remove('is-swapping');
  }, 220);

  $$('.thumb', railTrack).forEach((t, i) => {
    const active = i === currentIndex;
    t.classList.toggle('is-active', active);
    if (active) t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });
}

/* ---------- Interactions ---------- */
function goTo(i) {
  const n = POSTCARDS.length;
  currentIndex = ((i % n) + n) % n;
  layout();
}
function next() { goTo(currentIndex + 1); }
function prev() { goTo(currentIndex - 1); }

function onCardClick(e) {
  const card = e.currentTarget;
  const i = parseInt(card.dataset.index, 10);
  if (i !== currentIndex) { goTo(i); return; }
  card.classList.toggle('is-flipped');
}

prevBtn.addEventListener('click', prev);
nextBtn.addEventListener('click', next);

/* Keyboard */
document.addEventListener('keydown', (e) => {
  if (!lightbox.hidden) {
    if (e.key === 'Escape' && !isKiosk) closeLightbox();
    if (e.key === 'f' || e.key === 'F') lbCard.classList.toggle('is-flipped');
    return;
  }
  if (!gridOverlay.hidden && e.key === 'Escape') { closeGridView(); return; }
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft')  prev();
  if (e.key === 'f' || e.key === 'F') cardEls[currentIndex].classList.toggle('is-flipped');
  if (e.key === 'z' || e.key === 'Z') openLightbox();
  if (e.key === 'g' || e.key === 'G') toggleGridView();
});

/* ---------- Swipe ---------- */
let touchStartX = 0, touchStartY = 0, touchMoved = false, touchAxis = null;
carousel.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchMoved = false;
  touchAxis = null;
}, { passive: true });
carousel.addEventListener('touchmove', (e) => {
  const dx = e.touches[0].clientX - touchStartX;
  const dy = e.touches[0].clientY - touchStartY;
  if (!touchAxis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
    touchAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  }
  if (touchAxis === 'x' && Math.abs(dx) > 8) touchMoved = true;
}, { passive: true });
carousel.addEventListener('touchend', (e) => {
  if (!touchMoved || touchAxis !== 'x') return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) (dx < 0 ? next() : prev());
});

/* ---------- Pointer parallax tilt ---------- */
let tiltRaf = null;
carousel.addEventListener('mousemove', (e) => {
  const center = cardEls[currentIndex];
  if (!center) return;
  const rect = center.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  const dx = (e.clientX - cx) / rect.width;
  const dy = (e.clientY - cy) / rect.height;
  if (tiltRaf) cancelAnimationFrame(tiltRaf);
  tiltRaf = requestAnimationFrame(() => {
    const inner = center.querySelector('.card-inner');
    if (!inner) return;
    const flipped = center.classList.contains('is-flipped');
    const base = flipped ? 180 : 0;
    inner.style.transform = `rotateY(${base + (-dx * 5)}deg) rotateX(${dy * 4}deg)`;
  });
});
carousel.addEventListener('mouseleave', () => {
  cardEls.forEach(c => {
    const inner = c.querySelector('.card-inner');
    if (inner) inner.style.transform = '';
  });
});

/* ---------- Grid overlay ---------- */
function openGridView() {
  gridOverlay.hidden = false;
  viewToggle.setAttribute('aria-pressed', 'true');
  document.body.style.overflow = 'hidden';
}
function closeGridView() {
  gridOverlay.hidden = true;
  viewToggle.setAttribute('aria-pressed', 'false');
  document.body.style.overflow = '';
}
function toggleGridView() { gridOverlay.hidden ? openGridView() : closeGridView(); }
viewToggle.addEventListener('click', toggleGridView);
closeGrid.addEventListener('click', closeGridView);
gridOverlay.addEventListener('click', (e) => { if (e.target === gridOverlay) closeGridView(); });

/* ---------- Lightbox + URL sync ---------- */
function openLightbox(opts = {}) {
  const p = POSTCARDS[currentIndex];
  lbFront.src = p.front; lbFront.alt = `${p.name} front`;
  lbBack.src  = p.back;  lbBack.alt  = `${p.name} back`;
  lbCard.classList.toggle('is-flipped', cardEls[currentIndex].classList.contains('is-flipped'));
  lbShareUrl.textContent = buildShareURL(p.slug);
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';

  // URL sync — push unless we're already on that URL (e.g. arrived via QR)
  if (!opts.skipURL) {
    const here = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (here !== p.slug) pushURL(p.slug);
  }
}
function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = '';
  if (!isKiosk) pushURL(null);
}
lightboxClose.addEventListener('click', closeLightbox);
lightboxFlip.addEventListener('click', () => lbCard.classList.toggle('is-flipped'));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox && !isKiosk) closeLightbox(); });
lbCard.addEventListener('click', (e) => { e.stopPropagation(); lbCard.classList.toggle('is-flipped'); });

/* Copy URL */
lbCopyBtn.addEventListener('click', async () => {
  const url = lbShareUrl.textContent.trim();
  try {
    await navigator.clipboard.writeText(url);
    lbCopyBtn.classList.add('is-copied');
    const span = lbCopyBtn.querySelector('span');
    const prev = span.textContent;
    span.textContent = 'Copied';
    setTimeout(() => {
      span.textContent = prev;
      lbCopyBtn.classList.remove('is-copied');
    }, 1500);
  } catch (err) {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  }
});

/* Double-tap → lightbox */
let lastTap = 0;
carousel.addEventListener('dblclick', (e) => {
  const card = e.target.closest('.card');
  if (card && parseInt(card.dataset.index, 10) === currentIndex) openLightbox();
});
carousel.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTap < 320 && !touchMoved) {
    const card = e.target.closest('.card');
    if (card && parseInt(card.dataset.index, 10) === currentIndex) openLightbox();
  }
  lastTap = now;
});

/* Back/forward navigation */
window.addEventListener('popstate', () => {
  if (isKiosk) return; // kiosk pages don't navigate within the gallery
  const slug = getSlugFromURL();
  if (slug) {
    const idx = findIndexBySlug(slug);
    if (idx >= 0) {
      currentIndex = idx;
      layout();
      openLightbox({ skipURL: true });
    }
  } else {
    if (!lightbox.hidden) closeLightbox.call(null);
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }
});

/* ---------- Footer year ---------- */
$('#year').textContent = new Date().getFullYear();

/* ---------- Init ---------- */
buildCards();

// Detect direct-URL visit and enter kiosk mode if matched
(function bootFromURL() {
  const slug = getSlugFromURL();
  if (!slug) { layout(); return; }
  const idx = findIndexBySlug(slug);
  if (idx < 0) { layout(); return; }
  currentIndex = idx;
  layout();
  isKiosk = true;
  document.body.classList.add('is-kiosk');
  openLightbox({ skipURL: true });
  // Normalize URL to clean form (in case arrived via ?p= or #)
  replaceURL(slug);
})();

window.addEventListener('load', () => {
  POSTCARDS.forEach((p) => {
    const a = new Image(); a.src = p.front;
    const b = new Image(); b.src = p.back;
  });
});
