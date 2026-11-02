import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { CLINIC_PHONE, DOCTOR_CARD, MAPS_URL, SOCIALS } from '../data/content';
import { isLowPower, prefersReducedMotion } from '../lib/utils';

/* The swinging clinic badge (React Bits Lanyard), used by DoctorProfile. Its two faces are painted at runtime: the FRONT carries
   the doctor's picture and details, the BACK carries four logo tiles (Instagram, Facebook, WhatsApp, Google Maps; links come from
   SOCIALS and MAPS_URL). Tap or click a logo to open its page; tap anywhere else on the card to flip it.

   OVERLAY (desktop, mouse, WebGL): the 3D canvas covers the whole section it lives in (a viewport-tall panel at its top), sits above the content, and ignores the mouse except while the pointer is over the card, so links and
   text under it stay clickable and the card can be dragged over any of them. The strap hangs from the stage column's centre.
   Touch screens and narrow windows keep the card boxed in its column. Built only when needed (md+, WebGL, stage near the
   viewport), so three.js stays out of the first load. Without WebGL it becomes a flat green tile with the same QR codes.
   Data-saver and low-memory devices skip the 3D badge. Needs `three`. */

const Lanyard = lazy(() => import('./Lanyard'));

const DEEP = '#2f5a3f';   // the deep green: the accent on the badge text
const PAPER = '#fbfcfa';  // the badge's card colour (white, with the coloured shapes below on top)
const INK = '#1f2a44';    // the badge's text
/* the doctor's picture goes on the FRONT face of the badge. File lives in public/assets/doctors/ (BASE_URL keeps it working under a sub-path deploy) */
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

/* low-power devices skip the 3D badge and the pinned scroll sequence that goes with it (they get the plain static profile) */
const lowPower = isLowPower;

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

/* the badge's decoration: overlapping translucent triangles in the corners (multiply, so where two cross the colours mix).
   Painted once into the face picture, so they cost nothing while the badge swings. [points, colour, opacity] in picture pixels. */
const SHAPE_TOP = [
  [[[0, 0], [520, 0], [0, 300]], '#f6c945', 0.95],
  [[[130, 0], [700, 0], [340, 250]], '#ee5b7e', 0.8],
  [[[0, 120], [260, 40], [120, 230]], '#8a6fd1', 0.55],
  [[[1024, 0], [1024, 360], [760, 120]], '#8dbb3c', 0.8],
  [[[1024, 160], [1024, 360], [900, 250]], '#f58a2e', 0.85],
  [[[560, 0], [1024, 0], [1024, 140]], '#b24aa2', 0.6],
];
const SHAPE_BOTTOM = [
  [[[0, 1440], [0, 1220], [250, 1440]], '#b24aa2', 0.75],
  [[[0, 1440], [0, 1330], [150, 1440]], '#f58a2e', 0.9],
  [[[0, 1300], [110, 1440], [150, 1330]], '#f6c945', 0.8],
  [[[1024, 1440], [1024, 1250], [820, 1440]], '#ee5b7e', 0.75],
  [[[1024, 1440], [1024, 1340], [900, 1440]], '#8dbb3c', 0.85],
  [[[1024, 1330], [930, 1440], [900, 1360]], '#f6c945', 0.8],
];
function paintShapes(ctx, shapes) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  shapes.forEach(([pts, color, alpha]) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

function newFace() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1440;
  const ctx = c.getContext('2d');
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, 1024, 1440);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  return { c, ctx };
}

/* FRONT: clinic name, a flip hint, the doctor's cut-out, and the doctor's details on a plate along the bottom edge */
function drawFront(photo, fonts) {
  const { c, ctx } = newFace();
  paintShapes(ctx, SHAPE_TOP);
  ctx.font = `72px ${fonts.display}`;
  ctx.fillText('Dr. Thaj Homoeo Clinic', 512, 320);
  ctx.font = `42px ${fonts.body}`;
  ctx.fillStyle = 'rgba(31,42,68,.7)';
  ctx.fillText(`${fonts.verb} the badge to flip`, 512, 380);
  if (photo) {
    const h = 1020;
    const w = (photo.naturalWidth / photo.naturalHeight) * h;
    ctx.drawImage(photo, (1024 - w) / 2, 1440 - h, w, h);
  }
  /* details plate: the photo fades into the card colour, then name, degrees, registration and phone */
  const fade = ctx.createLinearGradient(0, 1060, 0, 1440);
  fade.addColorStop(0, 'rgba(251,252,250,0)');
  fade.addColorStop(0.42, 'rgba(251,252,250,.94)');
  fade.addColorStop(1, 'rgba(251,252,250,1)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 1060, 1024, 380);
  paintShapes(ctx, SHAPE_BOTTOM);
  const lines = [
    { t: DOCTOR_CARD.name, font: `68px ${fonts.display}`, color: INK, big: true },
    { t: DOCTOR_CARD.degrees, font: `600 40px ${fonts.body}`, color: DEEP },
    { t: DOCTOR_CARD.role, font: `36px ${fonts.body}`, color: 'rgba(31,42,68,.8)' },
    { t: DOCTOR_CARD.reg, font: `34px ${fonts.body}`, color: 'rgba(31,42,68,.8)' },
    { t: CLINIC_PHONE?.display ? `Clinic: ${CLINIC_PHONE.display}` : '', font: `34px ${fonts.body}`, color: 'rgba(31,42,68,.8)' },
  ].filter((l) => l.t);
  /* stack the filled lines upwards from the bottom margin, so a missing field never leaves a gap */
  let y = 1402;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    ctx.font = lines[i].font;
    ctx.fillStyle = lines[i].color;
    ctx.fillText(lines[i].t, 512, y);
    y -= lines[i - 1]?.big ? 70 : 50;
  }
  return c.toDataURL('image/png');
}

/* BACK: four logo tiles in a 2 × 2 grid on a decorated card. Returns the picture and where each tile is (in picture pixels),
   so a tap on a tile can open its link (see the onFaceClick handler below). */
function drawBack(items, logos, fonts) {
  const { c, ctx } = newFace();
  paintShapes(ctx, SHAPE_TOP);
  paintShapes(ctx, SHAPE_BOTTOM);

  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = `66px ${fonts.display}`;
  ctx.fillText('Dr. Thaj Homoeo Clinic', 512, 318);
  ctx.fillStyle = DEEP;
  ctx.font = `600 34px ${fonts.body}`;
  ctx.fillText('F I N D   U S   O N L I N E', 512, 378);
  /* divider with a star */
  ctx.fillStyle = 'rgba(31,42,68,.25)';
  ctx.fillRect(250, 424, 210, 3);
  ctx.fillRect(564, 424, 210, 3);
  ctx.fillStyle = '#f2c14e';
  ctx.font = `40px ${fonts.body}`;
  ctx.fillText('✦', 512, 438);

  const tile = 360, gap = 40;
  const x0 = (1024 - (2 * tile + gap)) / 2;
  const y0 = 500;
  const hits = [];
  items.slice(0, 4).forEach((it, i) => {
    const x = x0 + (i % 2) * (tile + gap);
    const y = y0 + Math.floor(i / 2) * (tile + gap);
    /* card: soft shadow, white tile, the logo, the name */
    ctx.save();
    ctx.shadowColor = 'rgba(31,42,68,.22)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#fff';
    roundedRect(ctx, x, y, tile, tile, 56);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(31,42,68,.1)';
    ctx.lineWidth = 2;
    roundedRect(ctx, x, y, tile, tile, 56);
    ctx.stroke();
    const logo = logos[i];
    if (logo) ctx.drawImage(logo, x + (tile - 188) / 2, y + 52, 188, 188);
    ctx.fillStyle = '#212529';
    ctx.font = `600 44px ${fonts.body}`;
    ctx.fillText(it.label, x + tile / 2, y + tile - 52);
    hits.push({ x, y, w: tile, h: tile, url: it.url, label: it.label });
  });
  ctx.fillStyle = 'rgba(31,42,68,.85)';
  ctx.font = `38px ${fonts.body}`;
  ctx.fillText(`${fonts.verb} a logo to open it`, 512, 1326);
  ctx.fillStyle = 'rgba(31,42,68,.6)';
  ctx.font = `34px ${fonts.body}`;
  ctx.fillText(`${fonts.verb} the card elsewhere to flip it`, 512, 1380);
  return { url: c.toDataURL('image/png'), hits };
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
        await Promise.all([document.fonts.load(`72px ${fonts.display}`), document.fonts.load(`600 88px ${fonts.body}`)]);
      } catch { /* paint with whatever is available */ }
      if (off) return;
      const [photo, ...logos] = await Promise.all([loadPhoto(DOCTOR_IMG), ...items.slice(0, 4).map((it) => loadPhoto(logoSrc(it.icon)))]);
      if (off) return;
      const back = drawBack(items, logos, fonts);
      hitsRef.current = back.hits;
      /* [front with the doctor, front without, back]: the scroll sequence shows the empty front until the doctor lands on it */
      setFaces([photo ? drawFront(photo, fonts) : back.url, photo ? drawFront(null, fonts) : back.url, back.url]);
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
            cardColor={PAPER} finish="matte" strapColor="#14211a"
            size={overlay ? 0.48 : phone ? 0.66 : 0.6} strapLength={overlay ? 0.6 : 0.5} anchor={overlay ? anchor : 'center'}
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
    <div className="rounded-[18px] p-7" style={{ color: INK, backgroundColor: PAPER, backgroundImage: 'linear-gradient(135deg,#f6c945 0 9%,transparent 9%),linear-gradient(315deg,#ee5b7e 0 9%,transparent 9%)', boxShadow: 'inset 0 0 0 1px rgba(31,42,68,.1)' }}>
      <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0">
        {items.map((it) => (
          <li key={it.icon}>
            <a
              href={it.url} target="_blank" rel="noopener" aria-label={`Open our ${it.label} page`}
              className="flex flex-col items-center gap-3 rounded-2xl bg-paper p-4 text-[15px] font-semibold text-p9 no-underline shadow-[0_6px_18px_-8px_rgba(31,42,68,.3)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5a3f]"
            >
              <img src={logoSrc(it.icon)} alt="" width="64" height="64" className="block h-16 w-16" />
              {it.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="mb-0 mt-5 text-[16px] leading-[1.5]" style={{ color: 'rgba(31,42,68,.8)' }}>Tap a logo to open it.</p>
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
  /* the scroll sequence (doctor flies from the hero and lands on the badge) runs whenever the 3D badge can, motion is allowed and the hero fits the screen */
  const sequence = canGL && !prefersReducedMotion() && heroFits;
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
  const showStage = items.length > 0 && (canGL || wide);
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