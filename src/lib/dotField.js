/* Interactive icon field for the hero (plain 2D canvas, no libraries).
   A faint scatter of homoeopathy-clinic icons — mostly pellets, then leaves, drops, crosses and bottles — laid out on
   a loose grid. Icons near the cursor glow, grow slightly and are pushed gently away (leaves also turn), then spring
   back when it leaves.

   Cost control: the loop only runs while something is moving. It stops once the icons have settled, when the
   hero is off-screen, and never starts on touch or reduced-motion (the icons are then just drawn once, still). */

const GAP = 22;                 // icon spacing in css px (odd rows are shifted half a step)
const JITTER = 3.5;             // random offset of each icon from its grid spot (px)
const BASE_A = 0.3;             // resting icon opacity
const GROW = 0.55;              // how much more an icon grows under the cursor (0.55 = +55%)
const TURN = 0.8;               // how far leaves turn under the cursor (radians)
const REACH = 130;              // how far from the cursor dots react (px)
const PUSH = 16;                // how far the nearest dots get pushed (px)
const K = 0.1, DAMP = 0.8;      // spring stiffness / damping — lower K = softer, lower DAMP = less bounce
const BASE = [90, 138, 106];    // resting colour
const HOT = [46, 108, 72];      // colour of icons under the cursor
const LEVELS = 10;              // resting opacity is batched into this many levels (keeps drawing fast)
const TAU = Math.PI * 2;

/* icon kinds, picked per grid cell: mostly pellets */
const PELLET = 0, LEAF = 1, DROP = 2, CROSS = 3, BOTTLE = 4;
const pick = (h) => (h < 0.6 ? PELLET : h < 0.8 ? LEAF : h < 0.9 ? DROP : h < 0.96 ? CROSS : BOTTLE);

/* adds one icon (centre X,Y, size factor s, rotation rot) to the current path — filled shapes only, so each opacity
   level can still be drawn as a single path */
function addShape(ctx, kind, X, Y, s, rot) {
  if (kind === PELLET) {
    const r = 2 * s;
    ctx.moveTo(X + r, Y); ctx.arc(X, Y, r, 0, TAU);
  } else if (kind === LEAF) {
    const c = Math.cos(rot), n = Math.sin(rot), L = 6 * s, W = 5.2 * s;
    const pt = (x, y) => [X + x * c - y * n, Y + x * n + y * c];
    const a = pt(-L, 0), m1 = pt(0, -W), e = pt(L, 0), m2 = pt(0, W);
    ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(m1[0], m1[1], e[0], e[1]); ctx.quadraticCurveTo(m2[0], m2[1], a[0], a[1]);
  } else if (kind === DROP) {
    ctx.moveTo(X, Y - 5 * s);
    ctx.bezierCurveTo(X + 5 * s, Y, X + 4 * s, Y + 4.5 * s, X, Y + 4.5 * s);
    ctx.bezierCurveTo(X - 4 * s, Y + 4.5 * s, X - 5 * s, Y, X, Y - 5 * s);
  } else if (kind === CROSS) {
    ctx.rect(X - 4 * s, Y - s, 8 * s, 2 * s); ctx.rect(X - s, Y - 4 * s, 2 * s, 8 * s);
  } else {
    ctx.rect(X - 2.6 * s, Y - 1.5 * s, 5.2 * s, 5.5 * s); ctx.rect(X - 1.4 * s, Y - 4.2 * s, 2.8 * s, 2.4 * s);
  }
}
const rand = (ix, iy, k) => { const v = Math.sin(ix * 127.1 + iy * 311.7 + k * 74.7) * 43758.5453; return v - Math.floor(v); };

export function createDotField({ canvas, layer, listenOn, interactive = true }) {
  const area = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!ctx || !area) return { destroy() {} };

  let cw = 0, ch = 0, dpr = 1, n = 0;
  let x0, y0, ox, oy, vx, vy, gl, ba, hot, kind, rot0, starts = [];
  let cx = -9999, cy = -9999, px = -9999, py = -9999, present = false;
  let raf = 0, last = 0, running = false, visible = true;

  /* lay the dots out, skipping the ones the edge fade makes invisible, and sort them by resting opacity */
  const build = () => {
    cw = area.clientWidth; ch = area.clientHeight;
    if (!cw || !ch) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    const list = [];
    for (let iy = 0, y = GAP / 2; y < ch; y += GAP, iy++) {
      for (let ix = 0, x = GAP / 2 + (iy % 2 ? GAP / 2 : 0); x < cw; x += GAP, ix++) {
        /* same fade as the CSS mask: ellipse 80% 75% at 58% 45%, opaque to 25%, clear at 82% */
        const t = Math.hypot((x - 0.58 * cw) / (0.8 * cw), (y - 0.45 * ch) / (0.75 * ch));
        const a = Math.min(1, Math.max(0, (0.82 - t) / 0.57));
        if (a < 0.03) continue;
        list.push([
          x + (rand(ix, iy, 1) - 0.5) * 2 * JITTER, y + (rand(ix, iy, 2) - 0.5) * 2 * JITTER,
          Math.min(LEVELS - 1, Math.max(0, Math.ceil(a * LEVELS) - 1)),
          pick(rand(ix, iy, 3)), (rand(ix, iy, 4) - 0.5) * Math.PI * 1.2,
        ]);
      }
    }
    list.sort((p, q) => p[2] - q[2]);
    n = list.length;
    x0 = new Float32Array(n); y0 = new Float32Array(n); ba = new Float32Array(n);
    ox = new Float32Array(n); oy = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n);
    gl = new Float32Array(n); hot = new Uint8Array(n); kind = new Uint8Array(n); rot0 = new Float32Array(n);
    starts = new Array(LEVELS + 1).fill(n);
    for (let i = n - 1; i >= 0; i--) starts[list[i][2]] = i;
    for (let l = LEVELS - 1; l >= 0; l--) if (starts[l] > starts[l + 1]) starts[l] = starts[l + 1];
    list.forEach(([x, y, l, k, r], i) => { x0[i] = x; y0[i] = y; ba[i] = (BASE_A * (l + 1)) / LEVELS; kind[i] = k; rot0[i] = r; });
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
        addShape(ctx, kind[i], X, Y, 1, rot0[i]);
      }
      ctx.fill();
    }
    /* icons under the cursor: greener, bigger, more opaque (leaves turn) */
    for (let i = 0; i < n; i++) {
      if (!hot[i]) continue;
      const g = Math.min(1, gl[i]);
      const r = Math.round(BASE[0] + (HOT[0] - BASE[0]) * g), gg = Math.round(BASE[1] + (HOT[1] - BASE[1]) * g), b = Math.round(BASE[2] + (HOT[2] - BASE[2]) * g);
      ctx.fillStyle = `rgba(${r},${gg},${b},${(ba[i] + g * (0.8 - ba[i])).toFixed(3)})`;
      const X = x0[i] + ox[i], Y = y0[i] + oy[i];
      ctx.beginPath(); addShape(ctx, kind[i], X, Y, 1 + g * GROW, rot0[i] + g * TURN); ctx.fill();
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