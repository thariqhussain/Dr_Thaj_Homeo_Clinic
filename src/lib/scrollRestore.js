/* Keeps the visitor on the same part of the page after a reload / hard reload — without slowing the load down.

   Why the browser can't do it alone: App.jsx mounts most sections late (empty placeholders first), so when the
   browser tries to restore the scroll position the page is too short and it ends up near the top.

   What happens instead:
     1. While you browse, we remember (in sessionStorage) where you are — the section + how far into it — and the
        real height and margins of every section we have seen.
     2. On a reload / back-forward, App.jsx draws every not-yet-loaded section as an empty placeholder with that
        exact remembered height + margins. The page is therefore the right length straight away, so we can jump
        to your spot before the first paint, without mounting anything we don't need.
     3. Only the sections near your spot load immediately; the rest keep loading one by one when the browser is idle,
        exactly as on a normal visit. Because the placeholders were the right size, nothing shifts when they arrive.
     4. For a few seconds we keep correcting the position if the page height still changes (images loading), and stop
        the moment you scroll, touch, click or press a key.
   A normal visit (new tab, link click, typed URL) still starts at the top. */

const KEY = 'drthaj:scroll';
const SLOT_KEY = 'drthaj:slots';
const MIN_Y = 300;        // closer to the top than this → just start at the top
const PIN_MS = 6000;      // longest time we keep correcting the position
const WIDTH_TOLERANCE = 24;

if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

const read = (k) => { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch { return null; } };

/* read once, at startup, before anything can overwrite it. null unless this load is a reload / back-forward.
   Returns { id, off, y, slots } — `slots` = remembered { [sectionId]: { h, mt, mb } }, or null if the window width changed. */
export function readSavedScroll() {
  try {
    const type = performance.getEntriesByType('navigation')[0]?.type;
    if (type !== 'reload' && type !== 'back_forward') return null;
    const pos = read(KEY);
    if (!pos || pos.y < MIN_Y) return null;
    const sl = read(SLOT_KEY);
    const slots = sl && Math.abs(sl.w - window.innerWidth) <= WIDTH_TOLERANCE ? sl.items : null;
    return { ...pos, slots };
  } catch { return null; }
}

/* the section whose top edge is at / above the top of the screen, and how far we have scrolled into it */
function anchor() {
  let best = null;
  document.querySelectorAll('section[id], footer[id]').forEach((el) => {
    const top = el.getBoundingClientRect().top;
    if (top <= 8) best = { id: el.id, off: Math.round(-top) };
  });
  return best || {};
}

/* real height + margins of every mounted section (the hero is never a placeholder, so it is skipped) */
function measureSlots() {
  const items = { ...(read(SLOT_KEY)?.items || {}) };
  document.querySelectorAll('section[id], footer[id]').forEach((el) => {
    if (el.id === 'home') return;
    const cs = getComputedStyle(el);
    items[el.id] = { h: el.offsetHeight, mt: parseFloat(cs.marginTop) || 0, mb: parseFloat(cs.marginBottom) || 0 };
  });
  return items;
}

/* call from a layout effect (so the jump happens before the first paint). Returns a cleanup function. */
export function startScrollMemory(saved) {
  let saving = !saved;                      // while we are still restoring, don't overwrite the saved spot
  let timer = 0;
  const save = () => {
    if (!saving) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ ...anchor(), y: Math.round(window.scrollY) }));
      sessionStorage.setItem(SLOT_KEY, JSON.stringify({ w: window.innerWidth, items: measureSlots() }));
    } catch { /* private mode / storage full */ }
  };
  const onScroll = () => { if (!timer) timer = setTimeout(() => { timer = 0; save(); }, 200); };
  const onHide = () => { if (document.visibilityState === 'hidden') save(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', onHide);

  let endPin = () => {};
  if (saved) {
    const target = () => {
      const el = saved.id && document.getElementById(saved.id);
      return el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY + (saved.off || 0)) : saved.y;
    };
    const apply = () => {
      const t = target();
      if (Math.abs(window.scrollY - t) > 2) window.scrollTo({ top: t, behavior: 'instant' });   // 'instant' beats the CSS smooth-scroll
    };
    const ro = new ResizeObserver(apply);                         // page height changed (section / image loaded) → re-apply
    ro.observe(document.documentElement);
    const poll = setInterval(apply, 250);
    const stop = setTimeout(() => endPin(), PIN_MS);
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    const onInput = () => endPin();
    inputs.forEach((t) => window.addEventListener(t, onInput, { passive: true, once: true }));
    window.addEventListener('load', apply, { once: true });
    endPin = () => {
      ro.disconnect(); clearInterval(poll); clearTimeout(stop);
      inputs.forEach((t) => window.removeEventListener(t, onInput));
      window.removeEventListener('load', apply);
      endPin = () => {};
      saving = true; save();
    };
    apply();
  }

  return () => {
    endPin();
    clearTimeout(timer);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pagehide', save);
    document.removeEventListener('visibilitychange', onHide);
  };
}