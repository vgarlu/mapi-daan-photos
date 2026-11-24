/* Mapi - Daan — galería */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const grid = $('#grid');
  const nav = $('#nav');
  const lb = $('#lb');
  const lbImg = $('#lb-img');
  const lbSpin = $('#lb-spin');
  const lbCount = $('#lb-count');
  const lbPrev = $('#lb-prev');
  const lbNext = $('#lb-next');
  const lbFav = $('#lb-fav');
  const lbDl = $('#lb-dl');

  const FAV_KEY = 'md2026:favs';
  let favs = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]'));
  const saveFavs = () => localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));

  let DATA = { scenes: [], photos: [] };
  let view = [];          // photos currently rendered
  let current = -1;       // lightbox index into view
  const FIRST_SCENE_NAME = /retratos?/i;
  const defaultScene = () => {
    const s = (DATA.scenes || []).find(x => FIRST_SCENE_NAME.test(x.name));
    return s ? String(s.id) : (DATA.scenes[0] ? String(DATA.scenes[0].id) : 'all');
  };
  let activeScene = 'all';
  let onlyFavs = false;

  const heartSVG = (on) =>
    `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 20s-7-4.4-7-9.3A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.7C19 15.6 12 20 12 20z" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.2"/></svg>`;

  const thumbURL = (p) => `thumbs/${p.id}.webp`;
  const fullURL = (p) => `images/${p.id}.jpg`;

  /* ---------- NAV ---------- */
  function buildNav() {
    const names = (n) => n.toUpperCase();
    // Retratos primero; el resto conserva el orden original
    const ordered = [...DATA.scenes].sort((a, b) =>
      (FIRST_SCENE_NAME.test(b.name) ? 1 : 0) - (FIRST_SCENE_NAME.test(a.name) ? 1 : 0));
    activeScene = defaultScene();
    nav.innerHTML = ordered
      .map(s => `<a href="#gallery" data-scene="${s.id}"${String(s.id) === activeScene ? ' class="active"' : ''}>${names(s.name)}</a>`)
      .join('');

    nav.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-scene]');
      if (!a) return;
      e.preventDefault();
      selectScene(a.dataset.scene);
    });
    syncHdrHeight();
  }

  // el header crece si las categorías ocupan más de una fila
  function syncHdrHeight() {
    const h = $('#hdr');
    if (!h) return;
    const px = Math.round(h.getBoundingClientRect().height);
    if (px > 0) document.documentElement.style.setProperty('--hdr-h', px + 'px');
  }

  function markActive(scene) {
    nav.querySelectorAll('a[data-scene]').forEach(a =>
      a.classList.toggle('active', String(a.dataset.scene) === String(scene)));
  }

  /* ---------- GRID ---------- */
  function selectScene(scene) {
    activeScene = scene;
    onlyFavs = false;
    $('#fav-toggle').classList.remove('on');
    markActive(scene);
    render();
    window.scrollTo({ top: galleryTop(), behavior: 'smooth' });
  }

  const galleryTop = () => $('#gallery').offsetTop - 0;

  const BATCH = 48;
  let shown = 0;

  function render() {
    if (onlyFavs) {
      view = DATA.photos.filter(p => favs.has(String(p.id)));
    } else if (activeScene === 'all') {
      view = DATA.photos;
    } else {
      view = DATA.photos.filter(p => String(p.s) === String(activeScene));
    }
    $('#counter').textContent = `${view.length} ${view.length === 1 ? 'foto' : 'fotos'}`;
    grid.replaceChildren();
    shown = 0;
    fill();
  }

  function addBatch() {
    const start = shown;
    const end = Math.min(shown + BATCH, view.length);
    if (start >= end) return;
    const frag = document.createDocumentFragment();
    for (let i = start; i < end; i++) {
      const p = view[i];
      const t = document.createElement('div');
      t.className = 'tile' + (p.l ? ' wide' : '');
      t.dataset.i = i;
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = p.w;
      img.height = p.h;
      img.src = thumbURL(p);
      img.alt = '';
      img.addEventListener('load', () => { img.classList.add('loaded'); t.classList.add('ready'); }, { once: true });
      img.addEventListener('error', () => { t.classList.add('ready'); }, { once: true });
      const fav = document.createElement('button');
      fav.className = 'fav' + (favs.has(String(p.id)) ? ' on' : '');
      fav.innerHTML = heartSVG(favs.has(String(p.id)));
      fav.dataset.id = p.id;
      fav.addEventListener('click', (e) => { e.stopPropagation(); toggleFav(p, fav); });
      t.append(img, fav);
      frag.append(t);
    }
    shown = end;
    grid.append(frag);
  }

  // carga por lotes según la distancia al final del grid (sin depender de IntersectionObserver)
  function fill() {
    let guard = 0;
    while (shown < view.length && guard++ < 40) {
      const bottom = grid.getBoundingClientRect().bottom;
      if (bottom - window.innerHeight > 1800) break;
      addBatch();
    }
  }

  let lastFill = 0;
  const onScroll = () => {
    const now = performance.now();
    if (now - lastFill < 120) return;
    lastFill = now;
    fill();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { syncHdrHeight(); onScroll(); }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHdrHeight);

  grid.addEventListener('click', (e) => {
    const favBtn = e.target.closest('.fav');
    if (favBtn) return;
    const t = e.target.closest('.tile');
    if (t) openLB(Number(t.dataset.i));
  });

  function toggleFav(p, el) {
    const id = String(p.id);
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    saveFavs();
    if (el) { el.classList.toggle('on', favs.has(id)); el.innerHTML = heartSVG(favs.has(id)); }
    document.querySelectorAll(`.fav[data-id="${id}"]`).forEach(b => {
      b.classList.toggle('on', favs.has(id));
      b.innerHTML = heartSVG(favs.has(id));
    });
    if (current >= 0) syncLBFav();
    if (onlyFavs) render();
  }

  $('#fav-toggle').addEventListener('click', () => {
    onlyFavs = !onlyFavs;
    $('#fav-toggle').classList.toggle('on', onlyFavs);
    markActive(onlyFavs ? 'favs' : activeScene);
    render();
    window.scrollTo({ top: galleryTop(), behavior: 'smooth' });
  });

  /* ---------- LIGHTBOX ---------- */
  function openLB(i) {
    if (i < 0 || i >= view.length) return;
    current = i;
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    show();
  }

  function show() {
    const p = view[current];
    if (!p) return;
    lbImg.classList.remove('shown');
    lbSpin.classList.add('on');
    const src = fullURL(p);
    const tmp = new Image();
    tmp.onload = () => {
      lbImg.src = src;
      lbImg.classList.add('shown');
      lbSpin.classList.remove('on');
      lb.classList.add('has-bg');
      lb.style.setProperty('--lb-bg', `url("${thumbURL(p)}")`);
    };
    tmp.onerror = () => { lbImg.src = src; lbImg.classList.add('shown'); lbSpin.classList.remove('on'); };
    tmp.src = src;
    lbCount.textContent = `${current + 1} / ${view.length}`;
    lbPrev.disabled = current === 0;
    lbNext.disabled = current === view.length - 1;
    lbDl.href = src;
    lbDl.setAttribute('download', `${p.id}.jpg`);
    syncLBFav();
    const absThumb = new URL(thumbURL(p), location.href).href;
    document.documentElement.style.setProperty('--lb-thumb', `url("${absThumb}")`);
  }

  function syncLBFav() {
    const p = view[current];
    if (!p) return;
    lbFav.classList.toggle('on', favs.has(String(p.id)));
    lbFav.innerHTML = heartSVG(favs.has(String(p.id))) + '<span>Favorita</span>';
  }

  function closeLB() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    current = -1;
  }

  const next = () => { if (current < view.length - 1) { current++; show(); } };
  const prev = () => { if (current > 0) { current--; show(); } };

  $('#lb-close').addEventListener('click', closeLB);
  lbPrev.addEventListener('click', prev);
  lbNext.addEventListener('click', next);
  lbFav.addEventListener('click', () => { if (view[current]) toggleFav(view[current], null); });
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-stage')) closeLB(); });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  let tx = 0, ty = 0;
  lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
    else if (dy > 90) closeLB();
  });

  /* ---------- COVER ---------- */
  const enterGallery = () => {
    if (!grid.children.length && DATA.photos.length) render();
    document.body.classList.remove('is-cover');
    history.replaceState(null, '', '#gallery');
    window.scrollTo({ top: galleryTop(), behavior: 'auto' });
  };
  $('#enter').addEventListener('click', enterGallery);
  $('#cover').addEventListener('click', (e) => { if (!e.target.closest('.cover-photo')) enterGallery(); });
  document.querySelector('.brand').addEventListener('click', (e) => {
    e.preventDefault();
    document.body.classList.add('is-cover');
    history.replaceState(null, '', '#cover');
    window.scrollTo(0, 0);
  });

  /* ---------- BOOT ---------- */
  fetch('data/photos.json')
    .then(r => r.json())
    .then(d => {
      DATA = d;
      buildNav();
      syncHdrHeight();
      // la parrilla se construye al entrar en la galería (o si se llega por enlace directo)
      if (location.hash === '#gallery' || !document.body.classList.contains('is-cover')) render();
      if (location.hash === '#gallery') document.body.classList.remove('is-cover');
    })
    .catch(err => {
      grid.innerHTML = '<p style="padding:40px;font-size:14px">No se pudo cargar la galería.</p>';
      console.error(err);
    });
})();
