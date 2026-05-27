/* =========================================================
   LUVIRA × JoviRX — Interactive Postcard Gallery
   Each product has 6 pages. Gallery shows page 1 as the cover.
   Zoom-in opens a 6-page carousel.
   ========================================================= */

/* Each product shows 4 pages:
   [1 bottle (mg-variants collapsed to one)] → what-is-it → reconstitution → dosage chart.
   `pages` lists the exact image numbers in public/.  The extra bottle-variant
   images (e.g. 2,3,4 for Semaglutide) are simply not referenced. */
const PRODUCTS = [
  { slug: 'semaglutide',      name: 'Semaglutide',      pages: [1, 5, 6, 7]     },
  { slug: 'tesamorelin',      name: 'Tesamorelin',      pages: [8, 11, 12, 13]  },
  { slug: 'tirzepatide',      name: 'Tirzepatide',      pages: [14, 18, 19, 20] },
  { slug: 'bpc-157',          name: 'BPC-157',          pages: [21, 23, 24, 25] },
  { slug: 'retatrutide',      name: 'Retatrutide',      pages: [26, 28, 29, 30] },
  { slug: 'nad',              name: 'NAD+',             pages: [31, 33, 34, 35] },
  { slug: 'ghk-cu',           name: 'GHK-Cu',           pages: [36, 39, 40, 41] },
  { slug: 'thymosin-alpha-1', name: 'Thymosin Alpha 1', pages: [42, 44, 45, 46] },
  { slug: 'mots-c',           name: 'MOTS-C',           pages: [47, 49, 50, 51] },
  { slug: 'igf-1-lr3',        name: 'IGF-1-LR3',        pages: [52, 53, 54, 55] },
  { slug: 'glow-blend',       name: 'BPC-157 + TB4 + GHK-Cu (Glow Blend)', pages: [56, 57, 58, 59] },
];

const POSTCARDS = PRODUCTS.map((p) => {
  const pages = p.pages.map(n => `public/${n}.png`);
  return { ...p, cover: pages[0], pages };
});

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

// Lightbox
const lightbox    = $('#lightbox');
const lbCard      = $('#lightboxCard');
const lbTrack     = $('#lbTrack');
const lbPrev      = $('#lbPrev');
const lbNext      = $('#lbNext');
const lbPageNum   = $('#lbPageNum');
const lbPageTotal = $('#lbPageTotal');
const lbDots      = $('#lbDots');
const lbProduct   = $('#lbProduct');
const lbShareUrl  = $('#lbShareUrl');
const lbCopyBtn   = $('#lbCopyBtn');
const lightboxClose = $('#lightboxClose');

let currentIndex = 0;
let cardEls = [];
let isKiosk = false;
let lbPage = 0;

/* ---------- URL helpers ---------- */
function findIndexBySlug(slug) {
  if (!slug) return -1;
  const s = slug.toLowerCase();
  return POSTCARDS.findIndex(p => p.slug === s);
}
function getSlugFromURL() {
  let path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (path.endsWith('index.html')) path = '';
  if (path) {
    const idx = findIndexBySlug(path);
    if (idx >= 0) return POSTCARDS[idx].slug;
  }
  const params = new URLSearchParams(window.location.search);
  const q = (params.get('p') || '').toLowerCase();
  if (q) {
    const idx = findIndexBySlug(q);
    if (idx >= 0) return POSTCARDS[idx].slug;
  }
  const h = window.location.hash.replace(/^#/, '').toLowerCase();
  if (h) {
    const idx = findIndexBySlug(h);
    if (idx >= 0) return POSTCARDS[idx].slug;
  }
  return null;
}
function buildShareURL(slug) { return `${window.location.origin}/${slug}`; }
function pushURL(slug)    { history.pushState   (slug ? { slug } : {}, '', slug ? `/${slug}` : '/'); }
function replaceURL(slug) { history.replaceState(slug ? { slug } : {}, '', slug ? `/${slug}` : '/'); }

/* ---------- Build gallery ---------- */
function buildCards() {
  capTotal.textContent = String(POSTCARDS.length).padStart(2, '0');

  POSTCARDS.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.index = i;
    card.dataset.slug = p.slug;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${p.name} — click to view all pages`);
    card.innerHTML = `
      <div class="card-inner">
        <div class="face front">
          <img src="${p.cover}" alt="${p.name}" loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async" draggable="false" />
          <span class="flip-badge">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/>
            </svg>
            View
          </span>
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
      <img src="${p.cover}" alt="" loading="lazy" decoding="async" draggable="false" />
    `;
    railTrack.appendChild(thumb);

    const gc = document.createElement('button');
    gc.className = 'gc';
    gc.dataset.index = i;
    gc.setAttribute('aria-label', `Open ${p.name}`);
    gc.innerHTML = `
      <img src="${p.cover}" alt="${p.name}" loading="lazy" decoding="async" draggable="false" />
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
      openLightbox();
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

/* ---------- Gallery interactions ---------- */
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
  openLightbox();          // center card → zoom into carousel
}

prevBtn.addEventListener('click', prev);
nextBtn.addEventListener('click', next);

/* Keyboard */
document.addEventListener('keydown', (e) => {
  if (!lightbox.hidden) {
    if (e.key === 'Escape' && !isKiosk) closeLightbox();
    if (e.key === 'ArrowRight') lbGo(lbPage + 1);
    if (e.key === 'ArrowLeft')  lbGo(lbPage - 1);
    return;
  }
  if (!gridOverlay.hidden && e.key === 'Escape') { closeGridView(); return; }
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft')  prev();
  if (e.key === 'z' || e.key === 'Z' || e.key === 'Enter') openLightbox();
  if (e.key === 'g' || e.key === 'G') toggleGridView();
});

/* ---------- Swipe on gallery (advance card) ---------- */
let touchStartX = 0, touchStartY = 0, touchMoved = false, touchAxis = null;
carousel.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchMoved = false; touchAxis = null;
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

/* ---------- Pointer parallax tilt on center card ---------- */
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
    inner.style.transform = `rotateY(${-dx * 5}deg) rotateX(${dy * 4}deg)`;
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

/* =========================================================
   Lightbox (6-page carousel)
   ========================================================= */

function buildLightboxTrack(postcard) {
  lbTrack.innerHTML = '';
  postcard.pages.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'lb-slide';
    slide.innerHTML = `<img src="${src}" alt="${postcard.name} — page ${i + 1}" decoding="async" draggable="false" />`;
    lbTrack.appendChild(slide);
  });
  lbPageTotal.textContent = postcard.pages.length;

  // Dots
  lbDots.innerHTML = '';
  postcard.pages.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'lb-dot';
    d.setAttribute('aria-label', `Go to page ${i + 1}`);
    d.addEventListener('click', (e) => { e.stopPropagation(); lbGo(i); });
    lbDots.appendChild(d);
  });
}

function lbGo(i) {
  const total = POSTCARDS[currentIndex].pages.length;
  lbPage = ((i % total) + total) % total;
  lbTrack.style.transform = `translate3d(${-lbPage * 100}%, 0, 0)`;
  lbPageNum.textContent = lbPage + 1;
  $$('.lb-dot', lbDots).forEach((d, k) => d.classList.toggle('is-active', k === lbPage));
}

function openLightbox(opts = {}) {
  const p = POSTCARDS[currentIndex];
  buildLightboxTrack(p);
  lbPage = 0;
  lbTrack.style.transition = 'none';
  lbGo(0);
  // re-enable transition next frame
  requestAnimationFrame(() => { lbTrack.style.transition = ''; });

  lbProduct.textContent = p.name;
  lbShareUrl.textContent = buildShareURL(p.slug);

  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';

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
lbPrev.addEventListener('click', (e) => { e.stopPropagation(); lbGo(lbPage - 1); });
lbNext.addEventListener('click', (e) => { e.stopPropagation(); lbGo(lbPage + 1); });
lightbox.addEventListener('click', (e) => { if (e.target === lightbox && !isKiosk) closeLightbox(); });

/* Click on the card itself: advance to next page (so users can tap-tap through) */
lbCard.addEventListener('click', (e) => {
  e.stopPropagation();
  lbGo(lbPage + 1);
});

/* Swipe inside the lightbox to change page */
let lbTouchX = 0, lbTouchY = 0, lbMoved = false, lbAxis = null;
lbCard.addEventListener('touchstart', (e) => {
  lbTouchX = e.touches[0].clientX;
  lbTouchY = e.touches[0].clientY;
  lbMoved = false; lbAxis = null;
}, { passive: true });
lbCard.addEventListener('touchmove', (e) => {
  const dx = e.touches[0].clientX - lbTouchX;
  const dy = e.touches[0].clientY - lbTouchY;
  if (!lbAxis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
    lbAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  }
  if (lbAxis === 'x' && Math.abs(dx) > 8) lbMoved = true;
}, { passive: true });
lbCard.addEventListener('touchend', (e) => {
  if (!lbMoved || lbAxis !== 'x') return;
  const dx = e.changedTouches[0].clientX - lbTouchX;
  if (Math.abs(dx) > 40) lbGo(lbPage + (dx < 0 ? 1 : -1));
});

/* Copy URL */
lbCopyBtn.addEventListener('click', async (e) => {
  e.stopPropagation();
  const url = lbShareUrl.textContent.trim();
  try {
    await navigator.clipboard.writeText(url);
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  }
  lbCopyBtn.classList.add('is-copied');
  const span = lbCopyBtn.querySelector('span');
  const prev = span.textContent;
  span.textContent = 'Copied';
  setTimeout(() => {
    span.textContent = prev;
    lbCopyBtn.classList.remove('is-copied');
  }, 1500);
});

/* Back/forward navigation */
window.addEventListener('popstate', () => {
  if (isKiosk) return;
  const slug = getSlugFromURL();
  if (slug) {
    const idx = findIndexBySlug(slug);
    if (idx >= 0) {
      currentIndex = idx;
      layout();
      openLightbox({ skipURL: true });
      return;
    }
  }
  if (!lightbox.hidden) {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }
});

/* ---------- Footer year ---------- */
$('#year').textContent = new Date().getFullYear();

/* ---------- Init ---------- */
buildCards();

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
  replaceURL(slug);
})();

window.addEventListener('load', () => {
  // Preload page 1 of every product immediately; rest after idle
  POSTCARDS.forEach(p => { const im = new Image(); im.src = p.cover; });
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 800));
  idle(() => {
    POSTCARDS.forEach(p => p.pages.slice(1).forEach(src => { const im = new Image(); im.src = src; }));
  });
});
