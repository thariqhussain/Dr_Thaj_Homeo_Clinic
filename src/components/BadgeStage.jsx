import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { CLINIC_PHONE, DOCTOR_CARD, MAPS_URL, SOCIALS } from '../data/content';
import { prefersReducedMotion } from '../lib/utils';

/* The swinging clinic badge (React Bits Lanyard), used by DoctorProfile. Its two faces are painted at runtime: the FRONT carries
   the doctor's picture, name and role, the BACK carries the details and four logo tiles (Instagram, Facebook, WhatsApp, Google Maps; links come from
   SOCIALS and MAPS_URL). Tap or click a logo to open its page; tap anywhere else on the card to flip it.

   OVERLAY (desktop, mouse, WebGL): the 3D canvas covers the whole section it lives in (a viewport-tall panel at its top), sits above the content, and ignores the mouse except while the pointer is over the card, so links and
   text under it stay clickable and the card can be dragged over any of them. The strap hangs from the stage column's centre.
   Touch screens and narrow windows keep the card boxed in its column. Built only when needed (md+, WebGL, stage near the
   viewport), so three.js stays out of the first load. Without WebGL it becomes a flat lime tile with the same QR codes.
   Data-saver and low-memory devices skip the 3D badge. Needs `three`. */

const Lanyard = lazy(() => import('./Lanyard'));

/* the badge follows the client's reference card: pure black body with a light-lime border (#c5e29f, sampled from the reference ID card).
   Constant names are kept from the old blue design so the rest of the file needs no changes. */
const LIME = '#c5e29f';     // the border colour from the reference image
const BLUE = '#000000';     // card body: pure black
const BLUE_DEEP = '#000000';
const PEACH = '#9ad06b';    // accent (role text start, ticks, heading): leaf green from the reference logo
const YELLOW = LIME;        // accent (role text end, outline, role line): the lime of the border
const INK = '#1c2233';      // dark text on the white logo tiles
const CARD_MID = LIME;      // edge colour of the 3D card (the rim matches the border)
const STRAP = '#000000';    // lanyard strap: black, like the reference
/* the doctor's picture goes on the FRONT face of the badge. File lives in public/assets/doctors/ (BASE_URL keeps it working under a sub-path deploy) */
export const CLINIC_LOGO = `${import.meta.env.BASE_URL}assets/doctors/clinic_logo.webp`;   // the clinic logo, shown on both faces
export const CLINIC_LOGO_BACK = CLINIC_LOGO;   // same logo on the back face
export const DOCTOR_IMG = `${import.meta.env.BASE_URL}assets/doctors/drThaj.webp`;   // same cut-out as the hero card, so the scroll sequence can land it on the badge

const BADGES = [
  { icon: 'instagram', label: 'Instagram' },
  { icon: 'facebook', label: 'Facebook' },
  { icon: 'whatsapp', label: 'WhatsApp' },
  { icon: 'maps', label: 'Google Maps' },
];

/* the four logos, as small SVG pictures (painted onto the badge, and used as plain images in the no-WebGL tile) */
const LOGO_SVG = {
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".6" stop-color="#d62976"/><stop offset=".8" stop-color="#962fbf"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="url(#g)"/><rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" stroke-width="3"/><circle cx="24" cy="24" r="6.5" fill="none" stroke="#fff" stroke-width="3"/><circle cx="32" cy="16" r="2" fill="#fff"/></svg>`,
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#1877f2"/><path d="M26.5 40V26.5H31l.7-5.3h-5.2v-3.4c0-1.500.4-2.600 2.600-2.600h2.800V10.500c-.5-.1-2.100-.2-4-.2-4 0-6.700 2.400-6.700 6.900v4H16.500v5.300h4.700V40h5.300z" fill="#fff"/></svg>`,
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#25d366"/><path d="M35 23.500A11 11 0 0 1 18.600 33.100L13 34.500l1.500-5.400A11 11 0 1 1 35 23.500z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M19.500 19.500c0 4.700 3.800 8.500 8.500 8.500l1.800-2-2.800-1.400-1.200.9a6 6 0 0 1-2.600-2.600l.9-1.200-1.400-2.800-1.200 0z" fill="#fff"/></svg>`,
  maps: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#e8f0fe"/><path d="M24 6c-7 0-12.500 5.400-12.500 12.300 0 8.600 9.600 17.600 11.600 23.300.3.8 1.500.8 1.800 0 2-5.700 11.600-14.700 11.600-23.300C36.500 11.400 31 6 24 6z" fill="#ea4335"/><path d="M24 6c-3.300 0-6.200 1.500-8.200 3.800L24 20V6z" fill="#fbbc04"/><path d="M36.500 18.300c0-2.800-.9-5.300-2.400-7.400L24 20l12.500 7.200c0-3 0-6.800 0-8.900z" fill="#4285f4" opacity=".9"/><circle cx="24" cy="18.500" r="5" fill="#fff"/></svg>`,
};
const logoSrc = (icon) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(LOGO_SVG[icon])}`;

/* ── small hooks ── */
function useMedia(query) {
  const [on, setOn] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setOn(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [query]);
  return on;
}

/* true (and stays true) once `node` is within `margin` of the viewport */
function useNear(node, margin = '500px 0px') {
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near || !node) return undefined;
    if (!('IntersectionObserver' in window)) { setNear(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true); }, { rootMargin: margin });
    io.observe(node);
    return () => io.disconnect();
  }, [near, node, margin]);
  return near;
}

const hasWebGL = () => {
  try {
    const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
};

/* the 3D badge is skipped only for data-saver or a device that reports 2 GB of memory or less
   (the site-wide isLowPower() also rules out most phones and tablets, which then got no badge at all) */
const lowPower = () => !!navigator.connection?.saveData || (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2);

/* ── badge faces: one 1024×1440 picture per face (the top ~14% stays clear for the strap clip) ── */
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function newFace(color) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1440;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1024, 1440);
  ctx.textAlign = 'left';
  /* the lime border running round the whole face, inset a little from the edge */
  ctx.save();
  ctx.strokeStyle = LIME; ctx.lineWidth = 12;
  roundedRect(ctx, 22, 22, 1024 - 44, 1440 - 44, 70);
  ctx.stroke();
  ctx.restore();
  return { c, ctx };
}

const checkMark = (ctx, x, y, color, size = 1) => {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 6 * size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 11 * size, y + 12 * size); ctx.lineTo(x + 30 * size, y - 12 * size); ctx.stroke();
  ctx.restore();
};

/* the clinic logo as it is (transparent, no plate behind it); returns its width */
function platedLogo(ctx, logo, x, y, h) {
  let lh = h;
  let lw = logo ? (logo.naturalWidth / logo.naturalHeight) * lh : lh;
  if (lw > 420) { lw = 420; lh = logo ? lw / (logo.naturalWidth / logo.naturalHeight) : lw; }   // a very wide logo is scaled down
  if (logo) ctx.drawImage(logo, x, y + (h - lh) / 2, lw, lh);
  return lw;
}

/* break a line into lines no wider than maxW (at the spaces) */
function wrapLines(ctx, text, maxW) {
  const out = [];
  let line = '';
  text.split(' ').forEach((w) => {
    const t = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(t).width > maxW) { out.push(line); line = w; } else line = t;
  });
  if (line) out.push(line);
  return out;
}

/* shrink a line of text until it fits */
function fitFont(ctx, text, weight, size, family, maxW) {
  let px = size;
  ctx.font = `${weight} ${px}px ${family}`;
  while (ctx.measureText(text).width > maxW && px > 30) { px -= 2; ctx.font = `${weight} ${px}px ${family}`; }
  return px;
}

const DOCTOR_FACE_H = 1200;   // the doctor's height on the front face (of 1440), centred. DoctorProfile's CARD_H / inlinePhoto follow it (1200/1060 of the old 1060).

/* the doctor's name as two lines: everything but the last word, then the last word */
/* the doctor's name as shown on the card: single-letter initials such as "S." are left out ("Dr. S. Mohammed Thajudeen" → "Dr. Mohammed Thajudeen") */
const cardWords = () => DOCTOR_CARD.name.split(' ').filter((w) => w && !/^[A-Za-z]\.?$/.test(w));
const nameLines = () => {
  const words = cardWords();
  return words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [words[0] || DOCTOR_CARD.name];
};

/* the name in up to three short lines, so it stays in the narrow column left of the centred doctor */
const nameLines3 = () => {
  const w = cardWords();
  if (w.length < 3) return nameLines();
  return [w.slice(0, w.length - 2).join(' '), w[w.length - 2], w[w.length - 1]];
};

/* a very light whitish-grey pattern printed INSIDE the card, behind everything else: THREE heartbeat (pulse) lines, level and evenly spaced
   down the card, each peak sprouting a small leaf (half the size of the first design). Drawn on both faces. */
const PULSE_ROW = new Path2D('M0 70H80l9-9 9 9h22l9 11 15-58 15 78 9-31h92l9-8 9 8H360');
const PULSE_STEM = new Path2D('M154 22q3-8 9-11');
const PULSE_LEAF = new Path2D('M163 11c6-6 14-6 18-3 0 8-6 13-18 3z');
function pulsePattern(ctx) {
  const K = 1.25;                                   // size of the pulse (one repeat is 360 × K px wide)
  ctx.save();
  ctx.strokeStyle = 'rgba(197,226,159,.16)'; ctx.fillStyle = 'rgba(197,226,159,.12)';   // faint lime on black
  ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  [0.25, 0.5, 0.75].forEach((f) => {                // three lines, a quarter of the card's height apart
    for (let x = 0; x < 1024; x += 360 * K) {
      ctx.save();
      ctx.translate(x, 1440 * f - 70 * K);
      ctx.scale(K, K);
      ctx.stroke(PULSE_ROW); ctx.stroke(PULSE_STEM); ctx.fill(PULSE_LEAF);
      ctx.restore();
    }
  });
  ctx.restore();
}

/* FRONT (black): clinic logo top right, the name top left (three short lines), the role set huge and vertical
   (peach → yellow) down the left side in TWO layers with the doctor between them: the solid letters sit BEHIND the doctor, an
   outline of the same letters in the same colours sits IN FRONT of him. The doctor is big and centred, standing at the bottom.
   The top ~14% stays clear for the strap clip. */
function drawFront(photo, clinicLogo, fonts) {
  const { c, ctx } = newFace(BLUE);
  pulsePattern(ctx);
  const body = fonts.body;
  const lw = platedLogo(ctx, clinicLogo, 0, -999, 190);   // measure only (drawn off the face), then place at the right edge
  platedLogo(ctx, clinicLogo, 1024 - 56 - lw, 100, 190);

  /* the vertical role: bottom → top, two lines side by side, a little in from the left edge and a little bigger */
  const words = (DOCTOR_CARD.role || 'Homoeopathic Doctor').toUpperCase().split(/\s+/).filter(Boolean);
  const cut = Math.ceil(words.length / 2);
  const rl = words.length > 1 ? [words.slice(0, cut).join(' '), words.slice(cut).join(' ')] : [words[0]];
  const START = 1436;
  const LEN = START - 305;                         // runs up to just under the name
  const X0 = 92;                                   // how far in from the left edge
  if ('letterSpacing' in ctx) ctx.letterSpacing = '-6px';          // slightly tight letters, so the role can be set bigger
  const vfs = Math.min(280, ...rl.map((t) => fitFont(ctx, t, 800, 280, body, LEN - 6)));   // -10: room for the extra-bold outline
  const paintRole = (layer) => rl.forEach((t, i) => {
    ctx.save();
    ctx.translate(X0 + vfs * 0.74 + i * vfs * 1.0, START);
    ctx.rotate(-Math.PI / 2);
    const g = ctx.createLinearGradient(0, 0, LEN, 0);
    g.addColorStop(0, PEACH); g.addColorStop(1, YELLOW);
    ctx.strokeStyle = g; ctx.font = `800 ${vfs}px ${body}`; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
    if (layer === 'back') {
      ctx.fillStyle = g; ctx.lineWidth = Math.max(4, vfs * 0.045);   // an outline in the same fill makes the letters heavier than the font's boldest weight
      ctx.fillText(t, 7, 0); ctx.strokeText(t, 7, 0);
    } else {
      ctx.strokeStyle = YELLOW;                                      // the thin outline is plain yellow
      ctx.lineWidth = Math.max(2.5, vfs * 0.022);                    // outline only (thin), drawn over the doctor
      ctx.strokeText(t, 7, 0);
    }
    ctx.restore();
  });

  paintRole('back');                                // layer 1: the solid text, behind the doctor

  /* layer 2: the doctor, big and centred, standing at the bottom */
  if (photo) {
    const h = DOCTOR_FACE_H;
    const w = (photo.naturalWidth / photo.naturalHeight) * h;
    /* the doctor sits so that his left-most edge lands in the MIDDLE of the last role line (the one next to him, "PHYSICIAN"):
       the doctor covers the right half of that word and the left half stays clear (50% revealed). The edge is measured from the
       cut-out's own transparent margin, so it holds for any photo. */
    const lastBase = X0 + vfs * 0.74 + (rl.length - 1) * vfs;   // baseline of the last role line
    const targetX = lastBase - vfs * 0.36;                        // its middle (cap height is about 0.72 of the font size)
    let x = (1024 - w) / 2;                                       // fallback: centred
    try {
      const sc = 0.25, cw = Math.max(1, Math.round(w * sc)), ch = Math.max(1, Math.round(h * sc));
      const t = document.createElement('canvas'); t.width = cw; t.height = ch;
      const tc = t.getContext('2d', { willReadFrequently: true });
      tc.drawImage(photo, 0, 0, cw, ch);
      const px = tc.getImageData(0, 0, cw, ch).data;
      let left = -1;
      for (let cx = 0; cx < cw && left < 0; cx += 1) {
        for (let cy = 0; cy < ch; cy += 1) { if (px[(cy * cw + cx) * 4 + 3] > 40) { left = cx; break; } }
      }
      if (left >= 0) x = targetX - left / sc;
    } catch { /* keep the centred position */ }
    ctx.drawImage(photo, x, 1440 - h, w, h);
  }

  /* (the thin outline of the role text that used to be drawn over the doctor has been removed) */
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  /* the name (over everything, in the column left of the doctor's head) */
  ctx.fillStyle = '#ffffff';
  const nl = nameLines3();
  const npx = Math.min(...nl.map((t) => fitFont(ctx, t, 800, 92, body, 320)));
  ctx.font = `800 ${npx}px ${body}`;
  nl.forEach((t, i) => ctx.fillText(t, 64, 100 + npx * 0.98 + i * npx * 1.02));

  return c.toDataURL('image/png');
}

/* BACK (black, like the front): the name big and white, the role, the details with ticks, "Tap a logo to connect !" over the four logo tiles,
   the clinic at the bottom. Returns the picture and where each tile is (in picture pixels), so a tap on a tile opens its link. */
function drawBack(items, logos, clinicLogo, fonts) {
  const { c, ctx } = newFace(BLUE);
  pulsePattern(ctx);
  const body = fonts.body;
  const nl = nameLines();
  const npx = Math.min(...nl.map((t) => fitFont(ctx, t, 800, 104, body, 900)));
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${npx}px ${body}`;
  let y = 232 + npx * 0.9;
  nl.forEach((t) => { ctx.fillText(t, 64, y); y += npx * 1.02; });
  ctx.fillStyle = YELLOW;
  ctx.font = `700 40px ${body}`;
  y += 10;
  if (DOCTOR_CARD.role) { ctx.fillText(DOCTOR_CARD.role, 64, y); y += 30; }

  /* details with a tick */
  y += 44;
  const detail = (text, weight, size, color) => {
    ctx.font = `${weight} ${size}px ${body}`;
    ctx.fillStyle = color;
    wrapLines(ctx, text, 800).forEach((t, i) => { ctx.fillText(t, 118, y); y += size * 1.4; if (i === 0) checkMark(ctx, 64, y - size * 1.4 - 8, PEACH, 0.9); });
    y += 10;
  };
  if (DOCTOR_CARD.degrees) detail(DOCTOR_CARD.degrees, 700, 30, '#ffffff');
  if (DOCTOR_CARD.reg) detail(DOCTOR_CARD.reg, 500, 28, 'rgba(255,255,255,.82)');
  if (CLINIC_PHONE?.display) detail(`Clinic: ${CLINIC_PHONE.display}`, 600, 30, '#ffffff');

  /* heading + the four logo tiles */
  const headY = Math.max(y + 70, 800);
  ctx.fillStyle = PEACH;
  ctx.font = `800 40px ${body}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${fonts.verb} a logo to connect !`, 512, headY);
  ctx.textAlign = 'left';

  const tile = 204, gap = 26;
  const x0 = (1024 - (4 * tile + 3 * gap)) / 2;
  const y0 = headY + 40;
  const hits = [];
  items.slice(0, 4).forEach((it, i) => {
    const x = x0 + i * (tile + gap);
    ctx.save();
    ctx.shadowColor = 'rgba(197,226,159,.25)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#ffffff';
    roundedRect(ctx, x, y0, tile, tile, 40);
    ctx.fill();
    ctx.restore();
    const logo = logos[i];
    if (logo) ctx.drawImage(logo, x + (tile - 112) / 2, y0 + 28, 112, 112);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.font = `600 28px ${body}`;
    ctx.fillText(it.label, x + tile / 2, y0 + tile - 28);
    ctx.textAlign = 'left';
    hits.push({ x, y: y0, w: tile, h: tile, url: it.url, label: it.label });
  });
  ctx.fillStyle = 'rgba(255,255,255,.62)';
  ctx.font = `500 26px ${body}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${fonts.verb} the card elsewhere to flip it`, 512, y0 + tile + 62);
  ctx.textAlign = 'left';

  /* footer: the clinic logo, big and centred (no text) */
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(64, 1212, 896, 3);
  const flw = platedLogo(ctx, clinicLogo, 0, -999, 180);   // measure only
  platedLogo(ctx, clinicLogo, (1024 - flw) / 2, 1236, 180);
  return { url: c.toDataURL('image/png'), hits };
}

/* The lanyard ribbon: one repeating tile, painted like the faces. The strap turns the picture a quarter turn, so the tile's left→right
   runs DOWN the ribbon. The tile is kept short (about 3.7× as long as the ribbon is wide, name on two lines) so that one whole
   "logo + Dr. Thaj Homoeo Clinic" fits in the visible length of the ribbon on a phone, a tablet and the big desktop badge. */
/* The lanyard ribbon: ONE picture that is much longer than the ribbon, with the clinic logo once, upright, a little above the card.
   The strap turns its picture a quarter turn (the picture's left→right runs DOWN the ribbon), so the logo is drawn turned the other
   way here and comes out straight. The tile is so long (STRAP_TILE × the ribbon's width) that it never repeats along the ribbon.
   If the logo ever shows upside down, or at the wrong end, set STRAP_FLIP to true. */
const STRAP_TILE = 16;
const STRAP_FLIP = false;
function drawStrap(clinicLogo) {
  const A = 256;                                   // across the ribbon
  const L = A * STRAP_TILE;                        // along the ribbon
  const c = document.createElement('canvas');
  c.width = L; c.height = A;                       // (transparent: the ribbon's own colour shows through)
  const ctx = c.getContext('2d');
  if (clinicLogo) {
    const lw = A - 14;                             // the logo's width across the ribbon (the ribbon's own width is the limit)
    const lh = lw / (clinicLogo.naturalWidth / clinicLogo.naturalHeight);
    const cy = STRAP_FLIP ? A * 1.7 : L - A * 1.7;  // where along the ribbon the logo's centre sits (just above the card)
    ctx.translate(0, A);
    ctx.rotate(-Math.PI / 2);                      // now (x, y) = (across, along) of the upright ribbon
    if (STRAP_FLIP) { ctx.translate(A / 2, cy); ctx.rotate(Math.PI); ctx.translate(-A / 2, -cy); }
    ctx.drawImage(clinicLogo, (A - lw) / 2, cy - lh / 2, lw, lh);
  }
  return c.toDataURL('image/png');
}

const loadPhoto = (src) => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);                 // picture missing: the badge just shows the QR face on both sides
  img.src = src;
});

/* hidden QR canvases + font probes → painted faces → the 3D badge */
function QrBadge({ items, overlay = false, anchor = 0.5, phone = false, photoOn = true }) {
  const dispRef = useRef(null);
  const bodyRef = useRef(null);
  const hitsRef = useRef([]);                       // where each logo tile is on the back face (picture pixels)
  const [faces, setFaces] = useState(null);
  const [strap, setStrap] = useState(null);             // the ribbon picture (clinic logo + name)
  const key = items.map((i) => i.url).join('|');

  useEffect(() => {
    let off = false;
    (async () => {
      /* use the site's real display + body fonts, wait until they are loaded so the faces don't paint in a fallback */
      const touch = window.matchMedia('(hover: none)').matches;
      const fonts = {
        display: getComputedStyle(dispRef.current).fontFamily,
        body: getComputedStyle(bodyRef.current).fontFamily,
        verb: touch ? 'Tap' : 'Click',
      };
      try {
        await Promise.all([document.fonts.load(`72px ${fonts.display}`), document.fonts.load(`600 88px ${fonts.body}`), document.fonts.load(`800 60px ${fonts.body}`), document.fonts.load(`700 30px ${fonts.body}`)]);
      } catch { /* paint with whatever is available */ }
      if (off) return;
      const [photo, clinicLogo, backLogo, ...logos] = await Promise.all([loadPhoto(DOCTOR_IMG), loadPhoto(CLINIC_LOGO), loadPhoto(CLINIC_LOGO_BACK), ...items.slice(0, 4).map((it) => loadPhoto(logoSrc(it.icon)))]);
      if (off) return;
      const back = drawBack(items, logos, backLogo || clinicLogo, fonts);
      hitsRef.current = back.hits;
      setStrap(drawStrap(clinicLogo || backLogo, fonts));
      /* [front with the doctor, front without, back]: the scroll sequence shows the empty front until the doctor lands on it */
      setFaces([photo ? drawFront(photo, clinicLogo, fonts) : back.url, photo ? drawFront(null, clinicLogo, fonts) : back.url, back.url]);
    })();
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /* a tap on a logo tile opens its page; anything else on the card flips it (the badge asks with probe = true while hovering, to show a pointer) */
  const onFaceClick = (face, x, y, probe) => {
    if (face !== 'back') return false;
    const t = hitsRef.current.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    if (!t) return false;
    if (!probe) window.open(t.url, '_blank', 'noopener');
    return true;
  };

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-hidden opacity-0">
        <span ref={dispRef} className="font-display">Aa</span>
        <span ref={bodyRef} className="font-body">Aa</span>
      </div>
      {faces && (
        <Suspense fallback={null}>
          <Lanyard
            frontImage={photoOn ? faces[0] : faces[1]} backImage={faces[2]} imageFit="cover" onFaceClick={onFaceClick}
            cardColor={CARD_MID} finish="matte" strapColor={STRAP} strapImage={strap || undefined} strapWidth={0.75}
            size={overlay ? 0.48 : phone ? 0.66 : 0.6} strapLength={overlay ? 0.6 : 0.5} touchScroll={!overlay} anchor={overlay ? anchor : 'center'}
            passThrough={overlay} maxDpr={overlay || phone ? 1.5 : 2}
            className="absolute inset-0"
          />
        </Suspense>
      )}
    </>
  );
}

/* no-WebGL fallback: the same four logos as plain links on a flat tile */
function QrTile({ items }) {
  return (
    <div className="rounded-[18px] p-7" style={{ color: '#ffffff', backgroundColor: BLUE, border: `3px solid ${LIME}` }}>
      <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0">
        {items.map((it) => (
          <li key={it.icon}>
            <a
              href={it.url} target="_blank" rel="noopener" aria-label={`Open our ${it.label} page`}
              className="flex flex-col items-center gap-3 rounded-2xl bg-paper p-4 text-[15px] font-semibold text-p9 no-underline shadow-[0_6px_18px_-8px_rgba(34,34,34,.3)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5a3f]"
            >
              <img src={logoSrc(it.icon)} alt="" width="64" height="64" className="block h-16 w-16" />
              {it.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="mb-0 mt-5 text-[16px] leading-[1.5]" style={{ color: 'rgba(255,255,255,.85)' }}>Tap a logo to open it.</p>
    </div>
  );
}

/* the whole badge feature as one hook: `stage` goes in the column the badge belongs to, `overlay` goes as the LAST child of
   a `relative` section (it is absolutely positioned over that whole section). Both are null when there is nothing to show. */
export default function useLanyardBadge({ heroFits = true } = {}) {
  const [stageNode, setStageNode] = useState(null);
  const wide = useMedia('(min-width: 768px)');
  const near = useNear(stageNode);
  const [canGL] = useState(() => hasWebGL() && !lowPower());   // 3D badge allowed on this device
  const fine = useMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
  const overlayOn = fine && canGL;                 // the section-wide canvas
  /* the scroll sequence (doctor flies from the hero and lands on the badge, card spiral) is desktop-with-a-mouse only.
     Phones and tablets get just the badge, hanging in the doctor profile section. */
  const sequence = overlayOn && !prefersReducedMotion() && heroFits;
  /* whether the badge's front shows the doctor. The sequence starts without her and switches her on as she lands. */
  const [photoOn, setPhotoOn] = useState(() => !sequence);
  useEffect(() => { setPhotoOn(!sequence); }, [sequence]);
  const overlayRef = useRef(null);
  const [anchor, setAnchor] = useState(0.76);    // where across the section the strap hangs (0…1): the column's centre

  useEffect(() => {
    if (!overlayOn || !stageNode) return undefined;
    const measure = () => {
      const box = overlayRef.current;
      if (!box) return;
      const col = stageNode.getBoundingClientRect();
      const all = box.getBoundingClientRect();
      if (all.width) setAnchor(Math.round(((col.left + col.width / 2 - all.left) / all.width) * 1000) / 1000);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stageNode);
    if (overlayRef.current) ro.observe(overlayRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [overlayOn, stageNode, near]);

  const items = BADGES.map((b) => ({ ...b, url: b.icon === 'maps' ? MAPS_URL : SOCIALS.find((x) => x.icon === b.icon)?.url })).filter((b) => b.url);

  /* Phones/tablets: the box sits in normal flow. lg+: sticky in its column. Without the 3D badge a flat QR tile
     is shown, but only from 768px up (a phone can't scan its own screen). */
  const showStage = items.length > 0;   // phones get the flat tile too when 3D is not possible
  const stage = showStage && (
    <div
      ref={setStageNode} aria-hidden={overlayOn || undefined}
      className={`relative ${overlayOn ? 'min-h-[520px]' : sequence ? 'h-[clamp(380px,52svh,600px)] md:h-[clamp(460px,54svh,680px)] lg:h-[min(640px,calc(100svh-9rem))]' : canGL ? 'h-[min(480px,72svh)] md:h-[560px] lg:h-[min(720px,calc(100svh-7rem))] lg:min-h-[520px]' : ''} lg:self-start`}
    >
      {!overlayOn && (canGL ? (near && <QrBadge items={items} phone={!wide} photoOn={photoOn} />) : <QrTile items={items} />)}
    </div>
  );

  /* OVERLAY: one viewport-tall panel at the top of the section (it scrolls away with the section, it does not stick), above the content, covering the full width.
     pointer-events-none here; the canvas turns them back on only over the card. */
  const overlay = overlayOn && near && items.length > 0 && (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div ref={overlayRef} className="absolute inset-x-0 top-0 h-[100svh] max-h-full">
        <QrBadge items={items} overlay anchor={anchor} photoOn={photoOn} />
      </div>
    </div>
  );

  return { stage, overlay, overlayOn, setPhotoOn, sequence, canGL };
}