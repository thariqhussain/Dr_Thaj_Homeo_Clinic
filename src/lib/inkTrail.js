/* Ink-trail reveal (plain 2D canvas, no WebGL).
   Moving the pointer over the portrait "paints" the second photo into view with soft, slightly bleeding brush
   strokes. Each stroke lingers for a moment, then fades away, so the first photo comes back by itself;
   leaving the portrait makes the remaining ink fade out straight away. Touch: a tap paints a big blot.
   The first photo stays visible underneath — this canvas only draws the second photo through the brush mask.
   If either image fails to load, the plain portrait is left untouched. */

const BRUSH = 0.15;       // brush radius as a fraction of the portrait's width — raise for fatter strokes
const HOLD = 0.9;         // seconds a stroke stays fully visible
const FADE = 1.1;         // seconds it then takes to fade out
const TOTAL = (HOLD + FADE) * 1000;
const MAX_STAMPS = 420;

const loadImage = (src) => new Promise((res, rej) => {
  const i = new Image();
  i.onload = () => res(i); i.onerror = rej; i.src = src;
});

/* a soft round brush: solid core, feathered edge */
function makeSprite() {
  const s = document.createElement('canvas');
  s.width = s.height = 128;
  const c = s.getContext('2d');
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,.95)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  return s;
}

function init(host, B) {
  const canvas = document.createElement('canvas');
  canvas.className = 'dc-fx';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  const mask = document.createElement('canvas');
  const mctx = mask.getContext('2d');
  if (!ctx || !mctx) return () => {};
  const sprite = makeSprite();

  let W = 1, H = 1, dpr = 1;
  let stamps = [];                       // { x, y, r, t } in canvas pixels, t = creation time (ms)
  let raf = 0, running = false;
  let lastX = null, lastY = null, lastT = 0;

  /* object-fit: cover, aligned to the bottom — same framing the <img> and the other effects use */
  const source = () => {
    const bx = W / H, tx = B.naturalWidth / B.naturalHeight;
    if (bx > tx) { const sh = B.naturalWidth / bx; return [0, B.naturalHeight - sh, B.naturalWidth, sh]; }
    const sw = B.naturalHeight * bx; return [(B.naturalWidth - sw) / 2, 0, sw, B.naturalHeight];
  };

  const render = (now) => {
    mctx.clearRect(0, 0, W, H);
    for (const s of stamps) {
      const age = (now - s.t) / 1000;
      const a = age < HOLD ? 1 : Math.max(0, 1 - (age - HOLD) / FADE);
      if (a <= 0) continue;
      const r = s.r * (1 + 0.3 * (1 - Math.exp(-age * 4)));               // the ink bleeds outwards a little
      mctx.globalAlpha = a;
      mctx.drawImage(sprite, s.x - r, s.y - r, r * 2, r * 2);
    }
    mctx.globalAlpha = 1;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(B, ...source(), 0, 0, W, H);                            // second photo…
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0);                                            // …kept only where the ink is
    ctx.globalCompositeOperation = 'source-over';
  };

  const frame = (now) => {
    stamps = stamps.filter((s) => now - s.t < TOTAL);
    render(now);
    if (stamps.length) raf = requestAnimationFrame(frame);
    else running = false;
  };
  const kick = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };

  const resize = () => {
    const cw = host.clientWidth, ch = host.clientHeight;
    if (!cw || !ch) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = mask.width = Math.round(cw * dpr);
    H = canvas.height = mask.height = Math.round(ch * dpr);
    stamps = [];
    render(performance.now());
  };

  const toPx = (e) => {
    const r = host.getBoundingClientRect();
    return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
  };
  const stamp = (x, y, r, now) => {
    const j = r * 0.12;                                                   // a little jitter keeps strokes from looking mechanical
    stamps.push({ x: x + (Math.random() - 0.5) * j, y: y + (Math.random() - 0.5) * j, r: r * (0.9 + Math.random() * 0.2), t: now });
    if (stamps.length > MAX_STAMPS) stamps.splice(0, stamps.length - MAX_STAMPS);
  };

  const onEnter = (e) => {
    if (e.pointerType === 'touch') return;
    [lastX, lastY] = toPx(e); lastT = performance.now();
  };
  const onMove = (e) => {
    if (e.pointerType === 'touch') return;
    const now = performance.now();
    const [x, y] = toPx(e);
    if (lastX === null) { lastX = x; lastY = y; lastT = now; }
    const dx = x - lastX, dy = y - lastY, dist = Math.hypot(dx, dy);
    const speed = dist / dpr / Math.max(now - lastT, 1);                  // css px per ms
    const r = W * BRUSH * (0.72 + Math.min(speed / 1.3, 1) * 0.65);       // faster strokes are fatter
    const step = Math.max(r * 0.3, 2);
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 1; i <= n; i++) stamp(lastX + (dx * i) / n, lastY + (dy * i) / n, r, now);
    lastX = x; lastY = y; lastT = now;
    kick();
  };
  const onLeave = (e) => {
    if (e.pointerType === 'touch') return;
    lastX = lastY = null;
    const early = (HOLD - 0.1) * 1000;                                    // start fading the remaining ink right away
    stamps.forEach((s) => { s.t -= early; });
    kick();
  };
  const onDown = (e) => {
    if (e.pointerType !== 'touch') return;
    const [x, y] = toPx(e);
    stamp(x, y, W * BRUSH * 1.9, performance.now());
    kick();
  };

  host.addEventListener('pointerenter', onEnter);
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', onLeave);
  host.addEventListener('pointerdown', onDown);
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  host.appendChild(canvas);
  resize();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    host.removeEventListener('pointerenter', onEnter);
    host.removeEventListener('pointermove', onMove);
    host.removeEventListener('pointerleave', onLeave);
    host.removeEventListener('pointerdown', onDown);
    canvas.remove();
  };
}

export function createInkTrail({ host, revealSrc }) {
  let destroyed = false, cleanup = () => {};
  loadImage(revealSrc)
    .then((b) => { if (!destroyed) cleanup = init(host, b); })
    .catch(() => {});
  return { destroy() { destroyed = true; cleanup(); } };
}