/* Water-ripple image reveal (raw WebGL, no libraries).
   Draws the base photo into a canvas on top of the <img>. When the pointer enters, a wobbly
   ripple expands from the entry point and swaps in the second photo; when the pointer
   leaves, the ripple collapses and the base photo comes back. Touch: tap toggles it.
   If WebGL or either image fails, the plain <img> simply stays — nothing breaks. */

const VERT = `
attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uA; uniform sampler2D uB;
uniform vec4 uMapA; uniform vec4 uMapB;      // scale.xy, offset.zw (cover, bottom-aligned)
uniform vec2 uMouse; uniform float uAspect, uR, uTime, uMove;
vec4 smp(sampler2D t, vec4 m, vec2 uv){ return texture2D(t, uv * m.xy + m.zw); }
void main(){
  vec2 d = vUv - uMouse; d.x *= uAspect;
  float dist = length(d);
  float ang = atan(d.y, d.x);
  float wob = sin(ang * 5.0 + uTime * 2.2) * 0.012 + sin(ang * 9.0 - uTime * 3.1) * 0.007;
  float edge = dist + wob - uR;
  float ring = sin(edge * 46.0 - uTime * 7.0) * exp(-abs(edge) * 10.0);        // ripples riding the reveal edge
  float cur  = sin(dist * 52.0 - uTime * 9.0) * exp(-dist * 7.0) * uMove;      // ripples around the moving cursor
  vec2 dir = d / max(dist, 0.0001); dir.x /= uAspect;
  vec2 uv = vUv + dir * (ring * 0.016 * step(0.002, uR) + cur * 0.012);
  float m = (1.0 - smoothstep(-0.05, 0.0, edge)) * smoothstep(0.0, 0.02, uR);
  gl_FragColor = mix(smp(uA, uMapA, uv), smp(uB, uMapB, uv), m);
}`;

const loadImage = (src) => new Promise((res, rej) => {
  const i = new Image();
  i.onload = () => res(i); i.onerror = rej; i.src = src;
});

/* object-fit: cover, aligned to the bottom, expressed as a UV scale + offset (y-up) */
function coverMap(texW, texH, boxW, boxH) {
  const B = boxW / boxH, T = texW / texH;
  return B > T ? [1, T / B, 0, 0] : [B / T, 1, (1 - B / T) / 2, 0];
}

function init(host, A, B) {
  const canvas = document.createElement('canvas');
  canvas.className = 'dc-fx';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return () => {};

  const shader = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return () => {};
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return () => {};
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const makeTex = (img, unit) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const texA = makeTex(A, 0), texB = makeTex(B, 1);
  const U = (n) => gl.getUniformLocation(prog, n);
  const u = { A: U('uA'), B: U('uB'), mapA: U('uMapA'), mapB: U('uMapB'), mouse: U('uMouse'), aspect: U('uAspect'), r: U('uR'), time: U('uTime'), move: U('uMove') };
  gl.uniform1i(u.A, 0); gl.uniform1i(u.B, 1);
  gl.clearColor(0, 0, 0, 0);

  /* state */
  let R = 0, target = 0, maxR = 1.2, mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5, speed = 0;
  let raf = 0, last = 0, running = false, aspect = 1, lastX = 0, lastY = 0;

  const draw = (t) => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u.r, R); gl.uniform1f(u.time, t);
    gl.uniform2f(u.mouse, mx, my); gl.uniform1f(u.move, speed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const resize = () => {
    const cw = host.clientWidth, ch = host.clientHeight;
    if (!cw || !ch) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = cw / ch;
    gl.uniform1f(u.aspect, aspect);
    gl.uniform4fv(u.mapA, coverMap(A.naturalWidth, A.naturalHeight, cw, ch));
    gl.uniform4fv(u.mapB, coverMap(B.naturalWidth, B.naturalHeight, cw, ch));
    draw(performance.now() / 1000);
  };

  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    R += (target - R) * (1 - Math.exp(-(target > R ? 3.4 : 4.2) * dt));
    const f = 1 - Math.exp(-9 * dt);
    mx += (tmx - mx) * f; my += (tmy - my) * f;
    speed *= Math.exp(-4 * dt);
    if (target === 0 && R < 0.003 && speed < 0.01) {          // idle again: show the base photo and stop the loop
      R = 0; speed = 0; draw(now / 1000); running = false; return;
    }
    draw(now / 1000);
    raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (running) return;
    running = true; last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const toUv = (e) => {
    const r = host.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
  };
  const reachAll = (x, y) => Math.hypot(Math.max(x, 1 - x) * aspect, Math.max(y, 1 - y)) + 0.14;
  const open = (e) => {
    const [x, y] = toUv(e);
    tmx = x; tmy = y;
    if (R < 0.01) { mx = x; my = y; }                         // start the ripple exactly where the pointer entered
    maxR = reachAll(x, y); target = maxR; lastX = e.clientX; lastY = e.clientY; kick();
  };
  const close = () => { target = 0; kick(); };

  const onEnter = (e) => { if (e.pointerType !== 'touch') open(e); };
  const onMove = (e) => {
    if (e.pointerType === 'touch') return;
    const [x, y] = toUv(e);
    tmx = x; tmy = y;
    speed = Math.min(1, speed + Math.hypot(e.clientX - lastX, e.clientY - lastY) / 60);
    lastX = e.clientX; lastY = e.clientY;
    if (target > 0) kick();
  };
  const onLeave = (e) => { if (e.pointerType !== 'touch') close(); };
  const onDown = (e) => { if (e.pointerType === 'touch') (target > 0 ? close() : open(e)); };

  host.addEventListener('pointerenter', onEnter);
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', onLeave);
  host.addEventListener('pointerdown', onDown);
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  host.appendChild(canvas);
  resize();                                                   // first frame is drawn before the <img> is hidden
  host.classList.add('is-fx');

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    host.removeEventListener('pointerenter', onEnter);
    host.removeEventListener('pointermove', onMove);
    host.removeEventListener('pointerleave', onLeave);
    host.removeEventListener('pointerdown', onDown);
    host.classList.remove('is-fx');
    canvas.remove();
    gl.deleteTexture(texA); gl.deleteTexture(texB); gl.deleteBuffer(buf); gl.deleteProgram(prog);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}

export function createWaterReveal({ host, baseSrc, revealSrc }) {
  let destroyed = false, cleanup = () => {};
  Promise.all([loadImage(baseSrc), loadImage(revealSrc)])
    .then(([a, b]) => { if (!destroyed) cleanup = init(host, a, b); })
    .catch(() => {});                                         // a missing image just leaves the plain <img>
  return { destroy() { destroyed = true; cleanup(); } };
}