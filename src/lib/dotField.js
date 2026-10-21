/* Interactive medical-icon field for the hero (plain 2D canvas, no libraries).
   Plus crosses, stethoscopes, caduceus symbols, pill bottles and capsules are scattered at random places and in
   different sizes across the hero, with clear space between neighbours. Icons near the cursor glow, grow, turn and are
   pushed away with a springy overshoot, then wobble back when it leaves.

   Cost control: the loop only runs while something is moving. It stops once the icons have settled, when the
   hero is off-screen, and never starts on touch or reduced-motion (the icons are then just drawn once, still). */

const UNIT = 7;                 // icon radius at size 1 (css px); sizes run MIN_S..MAX_S times this
const MIN_S = 0.8, MAX_S = 2.1;
const SPACE = 14;               // clear space kept between two icons (px)
const DENSITY = 1 / 2600;       // icons attempted per px² — higher = fuller hero
const BASE_A = 0.26;            // resting icon opacity
const GROW = 0.45;              // how much more an icon grows under the cursor
const TURN = 0.7;               // how far icons turn under the cursor (radians)
const REACH = 150;              // how far from the cursor icons react (px)
const PUSH = 24;                // how far the nearest icons get pushed (px)
const K = 0.12, DAMP = 0.86;    // spring stiffness / damping — higher DAMP = bouncier overshoot, lower = calmer
const BASE = [90, 138, 106];    // resting colour
const HOT = [46, 108, 72];      // colour of icons under the cursor
const LEVELS = 10;              // resting opacity is batched into this many levels (keeps drawing fast)
const TAU = Math.PI * 2;

const CROSS = 0, BOTTLE = 1, STETH = 2, CADUCEUS = 3, CAPSULE = 4;
const KINDS = [CROSS, CROSS, BOTTLE, STETH, STETH, CADUCEUS, CAPSULE, CAPSULE];

/* adds one icon (centre X,Y, size s, rotation rot) to the current path. Only filled shapes (rings are drawn as
   an outer circle plus a reversed inner one), so each opacity level can be filled as a single path. */
function addShape(ctx, kind, X, Y, s, rot) {
  const k = (UNIT / 7) * s, c = Math.cos(rot), n = Math.sin(rot);
  const px = (x, y) => X + (x * c - y * n) * k, py = (x, y) => Y + (x * n + y * c) * k;
  const poly = (pts) => { ctx.moveTo(px(pts[0], pts[1]), py(pts[0], pts[1])); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(px(pts[i], pts[i + 1]), py(pts[i], pts[i + 1])); ctx.closePath(); };
  const rect = (x, y, w, h) => poly([x, y, x + w, y, x + w, y + h, x, y + h]);
  const disc = (x, y, r) => { ctx.moveTo(px(x + r, y), py(x + r, y)); ctx.arc(px(x, y), py(x, y), r * k, rot, rot + TAU); };
  const hole = (x, y, r) => { ctx.moveTo(px(x + r, y), py(x + r, y)); ctx.arc(px(x, y), py(x, y), r * k, rot, rot - TAU, true); };
  if (kind === CROSS) {
    rect(-6, -1.9, 12, 3.8); rect(-1.9, -6, 3.8, 12);
  } else if (kind === BOTTLE) {
    rect(-3.6, -2.2, 7.2, 8.4); rect(-2.2, -5.8, 4.4, 3.2);
    hole(0, 2, 1.7);                                   // label dot
  } else if (kind === STETH) {
    ctx.moveTo(px(5.6, -1), py(5.6, -1)); ctx.arc(px(0, -1), py(0, -1), 5.6 * k, rot, rot + Math.PI);     // U-shaped tube
    ctx.arc(px(0, -1), py(0, -1), 4.2 * k, rot + Math.PI, rot, true); ctx.closePath();
    rect(-0.7, 4.4, 1.4, 2.6);
    disc(0, 7.6, 2.4); hole(0, 7.6, 1.2);              // chest piece
    disc(-4.9, -3.6, 1.1); disc(4.9, -3.6, 1.1);       // ear tips
  } else if (kind === CADUCEUS) {
    rect(-0.7, -5.5, 1.4, 12.5); disc(0, -6.4, 1.3);
    poly([0, -3.6, -5.8, -6.4, -4.2, -3.8, -6, -2.4, -3, -2.2, 0, -1.6]);   // left wing
    poly([0, -3.6, 5.8, -6.4, 4.2, -3.8, 6, -2.4, 3, -2.2, 0, -1.6]);       // right wing
    disc(0, 1.6, 2.5); hole(0, 1.6, 1.4); disc(0, 5, 2.2); hole(0, 5, 1.1); // snake coils
  } else {
    const r = 2.6;                                     // capsule: a pill lying along the x axis
    rect(-4.2, -r, 8.4, 2 * r); disc(-4.2, 0, r); disc(4.2, 0, r);
  }
}
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export function createDotField({ canvas, layer, listenOn, interactive = true }) {
  const area = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!ctx || !area) return { destroy() {} };

  let cw = 0, ch = 0, dpr = 1, n = 0;
  let x0, y0, ox, oy, vx, vy, gl, ba, hot, kind, rot0, size, starts = [];
  let cx = -9999, cy = -9999, px = -9999, py = -9999, present = false;
  let raf = 0, last = 0, running = false, visible = true;

  /* lay the dots out, skipping the ones the edge fade makes invisible, and sort them by resting opacity */
  const build = () => {
    cw = area.clientWidth; ch = area.clientHeight;
    if (!cw || !ch) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    /* random scatter: biggest icons first, each tried at random spots until it clears all neighbours (dart throwing).
       Seeded, so a resize gives the same arrangement instead of reshuffling. */
    const rand = rng(20240613), list = [], placed = [];
    const want = Math.round(cw * ch * DENSITY);
    const sizes = Array.from({ length: want }, () => MIN_S + Math.pow(rand(), 1.6) * (MAX_S - MIN_S)).sort((u, v) => v - u);
    for (const sz of sizes) {
      const rad = UNIT * sz * 1.1;
      for (let tries = 0; tries < 24; tries++) {
        const x = rad + rand() * (cw - 2 * rad), y = rad + rand() * (ch - 2 * rad);
        /* same fade as the CSS mask: ellipse 80% 75% at 58% 45%, opaque to 25%, clear at 82% */
        const t = Math.hypot((x - 0.58 * cw) / (0.8 * cw), (y - 0.45 * ch) / (0.75 * ch));
        const a = Math.min(1, Math.max(0, (0.82 - t) / 0.57));
        if (a < 0.03) continue;
        if (placed.some((q) => Math.hypot(q[0] - x, q[1] - y) < q[2] + rad + SPACE)) continue;
        placed.push([x, y, rad]);
        list.push([x, y, Math.min(LEVELS - 1, Math.max(0, Math.ceil(a * LEVELS) - 1)), KINDS[Math.floor(rand() * KINDS.length)], (rand() - 0.5) * 1.1, sz]);
        break;
      }
    }
    list.sort((p, q) => p[2] - q[2]);
    n = list.length;
    x0 = new Float32Array(n); y0 = new Float32Array(n); ba = new Float32Array(n);
    ox = new Float32Array(n); oy = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n);
    gl = new Float32Array(n); hot = new Uint8Array(n); kind = new Uint8Array(n); rot0 = new Float32Array(n); size = new Float32Array(n);
    starts = new Array(LEVELS + 1).fill(n);
    for (let i = n - 1; i >= 0; i--) starts[list[i][2]] = i;
    for (let l = LEVELS - 1; l >= 0; l--) if (starts[l] > starts[l + 1]) starts[l] = starts[l + 1];
    list.forEach(([x, y, l, k, r, z], i) => { x0[i] = x; y0[i] = y; ba[i] = (BASE_A * (l + 1)) / LEVELS; kind[i] = k; rot0[i] = r; size[i] = z; });
    return true;
  };

  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    /* resting icons: one path per opacity level */
    for (let l = 0; l < LEVELS; l++) {
      const a = starts[l], b = starts[l + 1];
      if (a >= b) continue;
      ctx.fillStyle = `rgba(${BASE[0]},${BASE[1]},${BASE[2]},${((BASE_A * (l + 1)) / LEVELS).toFixed(3)})`;
      ctx.beginPath();
      for (let i = a; i < b; i++) {
        if (hot[i]) continue;
        const X = x0[i] + ox[i], Y = y0[i] + oy[i];
        addShape(ctx, kind[i], X, Y, size[i], rot0[i]);
      }
      ctx.fill();
    }
    /* icons under the cursor: greener, bigger, more opaque (they turn) */
    for (let i = 0; i < n; i++) {
      if (!hot[i]) continue;
      const g = Math.min(1, gl[i]);
      const r = Math.round(BASE[0] + (HOT[0] - BASE[0]) * g), gg = Math.round(BASE[1] + (HOT[1] - BASE[1]) * g), b = Math.round(BASE[2] + (HOT[2] - BASE[2]) * g);
      ctx.fillStyle = `rgba(${r},${gg},${b},${(ba[i] + g * (0.8 - ba[i])).toFixed(3)})`;
      const X = x0[i] + ox[i], Y = y0[i] + oy[i];
      ctx.beginPath(); addShape(ctx, kind[i], X, Y, size[i] * (1 + g * GROW), rot0[i] + g * TURN * (i % 2 ? 1 : -1)); ctx.fill();
    }
  };

  /* one physics step; returns how much is still moving (0 = everything is at rest) */
  const update = (dt) => {
    const k = Math.min(dt * 60, 2.2), damp = Math.pow(DAMP, k), kk = K * k;
    const f = 1 - Math.exp(-20 * dt);
    if (present) { cx += (px - cx) * f; cy += (py - cy) * f; }
    let act = present && Math.abs(px - cx) + Math.abs(py - cy) > 0.5 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const dx = x0[i] - cx, dy = y0[i] - cy;
      let tx = 0, ty = 0, g = 0;
      const d2 = dx * dx + dy * dy;
      if (d2 < REACH * REACH) {
        const d = Math.sqrt(d2) || 1;
        const s = 1 - d / REACH;
        const push = s * s * PUSH;
        tx = (dx / d) * push; ty = (dy / d) * push;
        g = s * Math.sqrt(s);
      }
      vx[i] = (vx[i] + (tx - ox[i]) * kk) * damp; vy[i] = (vy[i] + (ty - oy[i]) * kk) * damp;
      ox[i] += vx[i] * k; oy[i] += vy[i] * k;
      gl[i] += (g - gl[i]) * 0.18;
      hot[i] = gl[i] > 0.02 ? 1 : 0;
      const m = Math.abs(vx[i]) + Math.abs(vy[i]) + Math.abs(tx - ox[i]) + Math.abs(ty - oy[i]) + Math.abs(g - gl[i]);
      if (m > act) act = m;
    }
    return act;
  };

  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const act = update(dt);
    draw();
    if (act < 0.03 && !present) {                       // everything has sprung back: stop until the pointer returns
      for (let i = 0; i < n; i++) { ox[i] = oy[i] = vx[i] = vy[i] = gl[i] = 0; hot[i] = 0; }
      draw(); running = false; return;
    }
    raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (running || !visible) return;
    running = true; last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const onMove = (e) => {
    if (e.pointerType === 'touch') return;
    const r = canvas.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top;
    if (!present) { present = true; cx = px; cy = py; }
    kick();
  };
  const onLeave = (e) => {
    if (e.pointerType === 'touch') return;
    present = false; px = py = cx = cy = -9999;         // the dots spring back on their own
    kick();
  };

  /* the loop is pointless off-screen */
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) {
      present = false; px = py = cx = cy = -9999;
      cancelAnimationFrame(raf); running = false;
      for (let i = 0; i < n; i++) { ox[i] = oy[i] = vx[i] = vy[i] = gl[i] = 0; hot[i] = 0; }
      draw();
    }
  });
  io.observe(area);

  const ro = new ResizeObserver(() => { if (build()) draw(); });
  ro.observe(area);

  if (!build()) { io.disconnect(); ro.disconnect(); return { destroy() {} }; }
  draw();
  layer.classList.add('is-live');                       // the canvas owns the backdrop now: switch the CSS fallback off
  if (interactive) {
    listenOn.addEventListener('pointermove', onMove);
    listenOn.addEventListener('pointerleave', onLeave);
  }

  return {
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      listenOn.removeEventListener('pointermove', onMove);
      listenOn.removeEventListener('pointerleave', onLeave);
      layer.classList.remove('is-live');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}