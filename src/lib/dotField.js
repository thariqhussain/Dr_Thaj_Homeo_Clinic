/* Interactive dot grid for the hero (plain 2D canvas, no libraries).
   Draws the same dot grid as the static CSS backdrop (same spacing, colour and edge fade), so the hand-over is
   invisible. Dots near the cursor glow, grow slightly and are pushed gently away, then spring back when it leaves.

   Cost control: the loop only runs while something is moving. It stops once the dots have settled, when the
   hero is off-screen, and never starts on touch or reduced-motion (the static CSS dots stay). */

const GAP = 22;                 // dot spacing in css px — keep equal to `background-size` of .hero-dots
const R0 = 1.05;                // resting dot radius
const BASE_A = 0.32;            // resting dot opacity (same as the CSS gradient)
const REACH = 130;              // how far from the cursor dots react (px)
const PUSH = 16;                // how far the nearest dots get pushed (px)
const K = 0.1, DAMP = 0.8;      // spring stiffness / damping — lower K = softer, lower DAMP = less bounce
const BASE = [90, 138, 106];    // resting colour
const HOT = [46, 108, 72];      // colour of dots under the cursor
const LEVELS = 10;              // resting opacity is batched into this many levels (keeps drawing fast)
const TAU = Math.PI * 2;

export function createDotField({ canvas, layer, listenOn }) {
  const area = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!ctx || !area) return { destroy() {} };

  let cw = 0, ch = 0, dpr = 1, n = 0;
  let x0, y0, ox, oy, vx, vy, gl, ba, hot, starts = [];
  let cx = -9999, cy = -9999, px = -9999, py = -9999, present = false;
  let raf = 0, last = 0, running = false, visible = true;

  /* lay the dots out, skipping the ones the edge fade makes invisible, and sort them by resting opacity */
  const build = () => {
    cw = area.clientWidth; ch = area.clientHeight;
    if (!cw || !ch) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    const list = [];
    for (let y = GAP / 2; y < ch; y += GAP) {
      for (let x = GAP / 2; x < cw; x += GAP) {
        /* same fade as the CSS mask: ellipse 80% 75% at 58% 45%, opaque to 25%, clear at 82% */
        const t = Math.hypot((x - 0.58 * cw) / (0.8 * cw), (y - 0.45 * ch) / (0.75 * ch));
        const a = Math.min(1, Math.max(0, (0.82 - t) / 0.57));
        if (a < 0.03) continue;
        list.push([x, y, Math.min(LEVELS - 1, Math.max(0, Math.ceil(a * LEVELS) - 1))]);
      }
    }
    list.sort((p, q) => p[2] - q[2]);
    n = list.length;
    x0 = new Float32Array(n); y0 = new Float32Array(n); ba = new Float32Array(n);
    ox = new Float32Array(n); oy = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n);
    gl = new Float32Array(n); hot = new Uint8Array(n);
    starts = new Array(LEVELS + 1).fill(n);
    for (let i = n - 1; i >= 0; i--) starts[list[i][2]] = i;
    for (let l = LEVELS - 1; l >= 0; l--) if (starts[l] > starts[l + 1]) starts[l] = starts[l + 1];
    list.forEach(([x, y, l], i) => { x0[i] = x; y0[i] = y; ba[i] = (BASE_A * (l + 1)) / LEVELS; });
    return true;
  };

  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    /* resting dots: one path per opacity level */
    for (let l = 0; l < LEVELS; l++) {
      const a = starts[l], b = starts[l + 1];
      if (a >= b) continue;
      ctx.fillStyle = `rgba(${BASE[0]},${BASE[1]},${BASE[2]},${((BASE_A * (l + 1)) / LEVELS).toFixed(3)})`;
      ctx.beginPath();
      for (let i = a; i < b; i++) {
        if (hot[i]) continue;
        const X = x0[i] + ox[i], Y = y0[i] + oy[i];
        ctx.moveTo(X + R0, Y); ctx.arc(X, Y, R0, 0, TAU);
      }
      ctx.fill();
    }
    /* dots under the cursor: greener, bigger, more opaque */
    for (let i = 0; i < n; i++) {
      if (!hot[i]) continue;
      const g = Math.min(1, gl[i]);
      const r = Math.round(BASE[0] + (HOT[0] - BASE[0]) * g), gg = Math.round(BASE[1] + (HOT[1] - BASE[1]) * g), b = Math.round(BASE[2] + (HOT[2] - BASE[2]) * g);
      ctx.fillStyle = `rgba(${r},${gg},${b},${(ba[i] + g * (0.8 - ba[i])).toFixed(3)})`;
      const rad = R0 * (1 + g * 1.3);
      const X = x0[i] + ox[i], Y = y0[i] + oy[i];
      ctx.beginPath(); ctx.arc(X, Y, rad, 0, TAU); ctx.fill();
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
  draw();                                               // first frame matches the CSS dots exactly…
  layer.classList.add('is-live');                       // …so the CSS layer can be switched off without a visible change
  listenOn.addEventListener('pointermove', onMove);
  listenOn.addEventListener('pointerleave', onLeave);

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