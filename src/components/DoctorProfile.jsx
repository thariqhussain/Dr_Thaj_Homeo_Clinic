import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { CARE_AREAS, QUALIFICATIONS } from '../data/content';
import { onIntro } from '../lib/intro';
import { prefersReducedMotion } from '../lib/utils';
import useLanyardBadge, { DOCTOR_IMG } from './BadgeStage';

/* Qualifications + areas of care. The doctor's portrait/bio card lives in DoctorCard.jsx (hero, right side).

   Idea: the doctor's two trainings (medicine + psychology) are the whole story, so each credential is set at
   poster size in its own tile. Beside them hangs the clinic badge (BadgeStage.jsx, a swinging lanyard card).
   Below it the areas of care are a plain printed list: every area and every condition visible at once, no accordion.

   Built to the taste-skill house rules, with the site's own palette and type kept:
   flat fields only (no gradient, no blobs), tone steps instead of borders or shadows, no icon squares,
   running text in full ink, and a heading on each part. The `dp-*` class names are GSAP selector hooks,
   scoped to this section by gsap.context().

   SCROLL SEQUENCE (desktop with the 3D badge, motion allowed; everything else gets the plain static layout):
   the profile is invisible at first. Scrolling out of the hero, the hero's doctor cut-out is swapped for a flying copy that
   drifts to the middle of the screen and grows. The section then pins; a tornado of cards (the heading, both credential
   tiles and a few ghost cards) spirals up around the photo, unwinds into its real places, and the photo shrinks onto the ID
   badge, where the 3D card fades in. Everything is one function of two scroll values (see render()), so scrolling back
   plays it in reverse. Tuning knobs are the constants just below the component imports.

   Content: QUALIFICATIONS and CARE_AREAS in content.js (the `icon` field of CARE_AREAS is no longer used). */

/* "M.Sc Psychology" → figure "M.Sc", rest "Psychology" */
function splitTitle(title) {
  const parts = title.split(' ');
  const figure = parts.find((p) => /\d/.test(p)) || parts[0];
  return { figure, rest: parts.filter((p) => p !== figure).join(' ') };
}

/* with the hero pinned, it is held in place for this long (in viewport heights) after the profile has pinned, so the spiral is
   already coming in over the still hero; only then does the hero's background scroll away, while the spiral keeps spinning */
const HERO_HOLD = 0.5;
const PIN_LENGTH = 3;         // how much scrolling the pinned spiral takes, in viewport heights
/* the last part of the pin is a still hold: the spiral has finished and the badge is settled, and scrolling back up by
   this much changes nothing. That gives the visitor room to drag the ID card without the doctor leaving it at the first
   nudge of the scroll. (0.88 = the sequence finishes at 88% of the pin, the last 12% is the hold.) */
const SETTLE = 0.88;
const CARD_FEET = 0.79;       // where the badge's photo ends (its feet), as a fraction of the viewport height
const DOCTOR_H = 0.75;        // the doctor's height at the middle of the hero, as a fraction of the viewport height (feet on the bottom edge)
const FACE_GROW = 1200 / 1060;   // the badge's photo got this much taller (DOCTOR_FACE_H in BadgeStage.jsx: 1060 → 1200); the landing follows
const CARD_H = 0.375 * FACE_GROW;   // the landed photo's height as a fraction of the viewport height
/* phones / tablets: the badge sits in its own box, and the card inside it shrinks relative to the box as the box gets taller (measured at
   354px and 519px tall boxes). These give where the photo's feet end and how tall the photo is, as fractions of the box's height. */
const inlineFeet = () => 0.943;
const inlinePhoto = (h) => FACE_GROW * Math.min(0.47, Math.max(0.38, 0.466 - 0.00026 * (h - 354)));
const TAU = Math.PI * 2;
const clamp = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
/* the doctor leaves the hero card quickly: she is at the middle after the first part of the hero's scroll, then holds still there
   (instead of drifting along with the whole scroll) until the spiral takes over */
const RAMP = 0.38;
/* phones / tablets: the hero's own doctor stays where she stands on the screen at her own size (no zoom) and only drifts to the centre while
   the hero scrolls up behind her, so she comes down to the middle of the screen. The spiral starts once SPIRAL_START of the hero has scrolled
   out of view (0.7 = 70%); from there its first SPIRAL_LEAD_P share plays until the profile pins, so the spiral surrounds her the moment she
   has arrived. */
const SPIRAL_START = 0.7;
const SPIRAL_LEAD_P = 0.1;
/* phones / tablets: she reaches her resting place (the middle of the screen) after this share of the scroll distance to where the spiral
   starts (0.6 = early, 1 = exactly as the spiral begins). Lower = she moves faster for the same scroll. */
const TRAVEL = 0.6;
const COMPACT_BELOW = 1024;   // phones and tablets use the gentle version above (desktop keeps the big zoom)
const ramp = (progress) => clamp(progress / RAMP);

/* one colour per card while it is in the tornado */
const TINTS = {
  head: '#f2c14e',
  tiles: ['#7fb7e6', '#f08a8a'],
  ghosts: ['#9fd59a', '#c3a6e8', '#f6a6c9', '#ffb86b'],
};

/* little extras that ride the tornado with the cards: sparkle stars. They are plain absolutely
   positioned elements moved with transforms only (the same few gsap.set calls per scroll tick as the cards), they fade in as the
   spiral opens and fade out as the cards settle, so the finished layout is unchanged.
   h = where in the funnel (0 top … 1 bottom), r = orbit size vs the cards, ph = start angle, sp = spin speed, rot = tilt, size in px */
/* falling sparkles and little homoeopathy pieces down both sides while the spiral runs (hidden below md, where there is no side space):
   stars and leaves, tablets, capsules, pellets, a glass medicine bottle and a dropper bottle.
   side 0 = left lane, 1 = right lane; ph = where in its fall it starts (0…1); sp = relative fall speed; lx = place across the lane (0…1);
   sway = how far it drifts sideways (px). Their fall is driven by the scroll, so when scrolling stops they stop. */
const SPARK_SPEED = 2600;   // px of fall over the whole spiral, for sp = 1
const SPARK_COLORS = ['#f2c14e', '#9fd59a', '#f6a6c9', '#7fb7e6', '#ffb86b', '#c3a6e8'];
const SPARK_KINDS = ['star', 'tablet', 'leaf', 'bottle', 'capsule', 'pellets', 'star', 'dropper', 'tablet', 'leaf', 'capsule', 'bottle'];
const SPARKS = Array.from({ length: 4 }, (_, i) => {
  const kind = SPARK_KINDS[i % SPARK_KINDS.length];
  const big = kind === 'bottle' || kind === 'dropper';
  return {
    side: i % 2,
    kind,
    color: SPARK_COLORS[(i * 5 + 1) % SPARK_COLORS.length],
    size: (big ? 34 : 20) + ((i * 7) % 5) * (big ? 5 : 6),
    ph: ((i * 37) % 9) / 9,
    sp: 0.7 + ((i * 3) % 6) * 0.14,
    lx: ((i * 11) % 7) / 6,
    sway: 8 + (i % 4) * 6,
    rot: kind === 'bottle' || kind === 'dropper' ? ((i * 29) % 50) - 25 : (i * 47) % 180,
    turn: big ? 40 : 260,    // how much it turns over the whole spiral (the bottles only rock a little)
  };
});
const SparkShape = ({ d }) => {
  const sz = { width: d.size, height: d.size };
  switch (d.kind) {
    case 'star':
      return <svg viewBox="0 0 24 24" {...sz} fill={d.color}><path d="M12 0C12.8 7 17 11.2 24 12 17 12.8 12.8 17 12 24 11.2 17 7 12.8 0 12 7 11.2 11.2 7 12 0z" /></svg>;
    case 'leaf':
      return <svg viewBox="0 0 24 24" {...sz} fill={d.color}><path d="M2 22C2 10 10 2 22 2 22 14 14 22 2 22z" /><path d="M4 20L16 8" stroke="#fff" strokeOpacity=".6" strokeWidth="1.4" strokeLinecap="round" /></svg>;
    case 'capsule':
      return <svg viewBox="0 0 24 24" {...sz}><rect x="2" y="8" width="20" height="8" rx="4" fill={d.color} /><rect x="12" y="8" width="10" height="8" rx="4" fill="#fff" fillOpacity=".75" /></svg>;
    case 'tablet':   // round tablet with a score line and a soft highlight
      return <svg viewBox="0 0 24 24" {...sz}><circle cx="12" cy="12" r="10" fill={d.color} /><path d="M3.500 12h17" stroke="#fff" strokeOpacity=".8" strokeWidth="1.6" strokeLinecap="round" /><path d="M6.500 7.500a8 8 0 0 1 5-3" stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>;
    case 'pellets':  // a few tiny homoeopathic pellets
      return <svg viewBox="0 0 24 24" {...sz}><circle cx="7" cy="14" r="3.600" fill={d.color} /><circle cx="15.500" cy="16" r="3.600" fill="#fff" fillOpacity=".85" /><circle cx="12" cy="7.500" r="3.600" fill={d.color} fillOpacity=".8" /><circle cx="19" cy="8.500" r="2.600" fill={d.color} /></svg>;
    case 'bottle':   // amber glass medicine bottle with a white label and a cap
      return <svg viewBox="0 0 24 32" {...sz} style={{ height: d.size * 1.33 }}><rect x="7" y="1" width="10" height="5" rx="1.500" fill="#2f5a3f" /><path d="M8 6h8v3c3 1 4 3 4 5v13a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V14c0-2 1-4 4-5V6z" fill="#c8862e" /><rect x="6.500" y="15" width="11" height="9" rx="1.500" fill="#fbfcfa" /><path d="M9 18.500h6M9 21h4" stroke="#2f5a3f" strokeWidth="1.200" strokeLinecap="round" /><path d="M7 11c0-.8 1-1.500 2-1.700" stroke="#fff" strokeOpacity=".5" strokeWidth="1.300" strokeLinecap="round" fill="none" /></svg>;
    default:         // dropper bottle: rubber bulb on top, a glass body with a drop of liquid
      return <svg viewBox="0 0 24 32" {...sz} style={{ height: d.size * 1.33 }}><path d="M12 1c3 0 4.500 2 4.500 4.500V8h-9V5.500C7.500 3 9 1 12 1z" fill="#2f5a3f" /><rect x="6.500" y="8" width="11" height="3.500" rx="1.200" fill="#9aa5a0" /><path d="M7.500 11.500h9V13c2 1.200 3 3 3 5v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9c0-2 1-3.800 3-5v-1.500z" fill={d.color} fillOpacity=".85" /><path d="M7 17.500c0-1 .8-1.800 2-2.200" stroke="#fff" strokeOpacity=".6" strokeWidth="1.400" strokeLinecap="round" fill="none" /></svg>;
  }
};

/* one wide row of treatment words across the middle of the screen, behind the doctor and the cards, sliding sideways with the scroll */
const BAND_WORDS = ['Thyroid', 'Asthma', 'Migraine', 'Joint Pain', 'Eczema', 'Digestive Care', 'Women’s Health', 'Child Health'];
const BAND_SPEED = 2600;   // px of drift over the whole spiral

const DECO_COLORS = ['#f2c14e', '#7fb7e6', '#f08a8a', '#9fd59a', '#c3a6e8', '#f6a6c9', '#ffb86b'];
const DECO = Array.from({ length: 6 }, (_, i) => ({
  kind: 'star',
  color: DECO_COLORS[(i * 2 + (i % 3)) % DECO_COLORS.length],
  h: ((i * 7) % 11) / 10,
  r: 0.78 + ((i * 5) % 7) * 0.075,
  ph: i * 1.7,
  sp: i % 2 ? 1.15 + (i % 4) * 0.12 : 0.85 + (i % 3) * 0.1,
  rot: ((i * 53) % 90) - 45,
  size: [22, 34, 52][i % 3] + (i % 4) * 4,
}));
const DecoShape = ({ d }) => (
  <svg viewBox="0 0 24 24" width={d.size} height={d.size} fill={d.color}><path d="M12 0C12.8 7 17 11.2 24 12 17 12.8 12.8 17 12 24 11.2 17 7 12.8 0 12 7 11.2 11.2 7 12 0z" /></svg>
);

const FLYER_CLASS = 'pointer-events-none absolute left-0 top-0 z-20 max-w-none select-none';
const FLYER_STYLE = { visibility: 'hidden', transformOrigin: '50% 100%', filter: 'drop-shadow(0 22px 20px rgba(33,37,41,.28)) drop-shadow(0 4px 6px rgba(33,37,41,.18))' };

const HANDOVER = 0.995;       // how far through her landing the badge's own photo takes over from the flying copy (she is virtually still by then)


/* does the hero fit on the screen? Only then can it be pinned while the doctor travels (a taller hero would be cut off) */
const heroFitsNow = () => {
  const h = document.getElementById('home');
  return !h || h.offsetHeight <= window.innerHeight * 1.04;
};
function useHeroFits() {
  const [fits, setFits] = useState(heroFitsNow);
  useEffect(() => {
    const on = () => setFits(heroFitsNow());
    window.addEventListener('resize', on);
    const t = setTimeout(on, 1500);          // the hero's fonts and images may have changed its height since first paint
    return () => { window.removeEventListener('resize', on); clearTimeout(t); };
  }, []);
  return fits;
}

export default function DoctorProfile() {
  const section = useRef(null);
  const heroFits = useHeroFits();
  const { stage, overlay, overlayOn, setPhotoOn, sequence } = useLanyardBadge();
  const flyer = useRef(null);       // the doctor while the profile section is pinned (inside the section)
  const heroFlyer = useRef(null);   // the doctor while the hero is pinned (inside the hero, so scrolling never moves it)
  const stageBox = useRef(null);
  const overlayBox = useRef(null);
  const spiral = sequence;      // the pinned scroll sequence: any screen with the 3D badge, motion allowed and a hero that fits
  const [compactNow] = useState(() => window.innerWidth < COMPACT_BELOW);   // phones and tablets
  const light = spiral && (!heroFits || compactNow);   // phones / tablets never pin the hero: a pinned hero jumps about on touch screens, so there the doctor is lifted off the hero card and flown instead   // the hero is taller than the screen (most phones, small tablets): it cannot be pinned, so the hero's own doctor is lifted off the page and flown instead
  const heroEl = spiral ? (light ? document.body : document.getElementById('home')) : null;

  /* plain entrance for the heading and tiles (when the spiral is off) */
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      const rise = (trigger, targets, stagger = 0.1) =>
        gsap.from(targets, {
          y: 16, opacity: 0, duration: 0.4, ease: 'power3.out', stagger: stagger / 2, clearProps: 'transform,opacity',
          scrollTrigger: { trigger, start: 'top 92%', once: true },
        });
      if (!spiral) {
        rise('.dp-head', '.dp-head > *');
        rise('.dp-tiles', '.dp-tile', 0.12);
      }
    }, section);
    return () => ctx.revert();
  }, [spiral]);

  /* the scroll sequence: the hero pins while the doctor grows in its middle and the rest of the hero slides away,
     then the profile section pins for the tornado.
     It is set up only after the hero's own intro has finished (or on the first scroll / click on the Doctor link):
     pinning moves the hero in the page, and doing that while the doctor is still settling made her glitch. */
  useEffect(() => {
    if (!spiral) return undefined;

    const setup = () => {
    const heroImg = document.querySelector('.dc-photo');
    const heroCut = document.querySelector('.dc-cut');
    const hero = document.getElementById('home');
    const right = heroCut?.closest('.dc');
    if (!heroImg || !hero || !right) return null;
    const sec = section.current;
    const fly = flyer.current;
    const flyH = heroFlyer.current;
    const left = right.parentElement.firstElementChild;
    const stats = hero.querySelector('.hero-stats');
    const leaving = [left, right, stats].filter(Boolean);
    const items = [...sec.querySelectorAll('.sp-real, .sp-ghost')].map((el) => ({
      el, ghost: el.classList.contains('sp-ghost'), tint: el.querySelector('.sp-tint'),
    }));
    /* interleave real pieces and ghosts so the helix alternates between them */
    const real = items.filter((it) => !it.ghost);
    const ghost = items.filter((it) => it.ghost);
    const order = [];
    while (real.length || ghost.length) { if (real.length) order.push(real.shift()); if (ghost.length) order.push(ghost.shift()); }
    const n = order.length;
    const decos = [...sec.querySelectorAll('.sp-deco')];
    const sparks = [...sec.querySelectorAll('.sp-spark')];
    const band = sec.querySelector('.sp-band');
    const bgEl = sec.querySelector('.sp-bg');
    const st = { p: 0 };          // the pinned spiral (0…1)
    const sa = { tA: 0 };         // the hero phase (0…1), eased so wheel steps never make the doctor judder
    const m = {};                 // measurements, refreshed whenever ScrollTrigger refreshes
    const compact = window.innerWidth < COMPACT_BELOW;
    /* TEMP debug: open the site with ?dbg=1 to see which version and path is running. Delete this block (and the two lines marked DBG) when done. */
    const dbgEl = /[?&]dbg\b/.test(window.location.search) ? document.createElement('div') : null;   // DBG
    if (dbgEl) {
      dbgEl.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99999;background:rgba(0,0,0,.8);color:#0f0;font:11px/1.3 monospace;padding:4px 6px;border-radius:4px;pointer-events:none';
      document.body.appendChild(dbgEl);
    }
    /* phones / tablets: how far she has travelled = how far the page has scrolled towards the point where the profile pins,
       so she arrives (at her own size, centred on the spiral) exactly as the spiral begins. Desktop keeps the quick ramp. */
    const rampP = (pr) => (compact ? clamp(window.scrollY / Math.max(1, (m.leadStart || hero.offsetTop + SPIRAL_START * hero.offsetHeight) * TRAVEL)) : ramp(pr));   // phones: exactly as far as the page has scrolled, no easing
    let heroTrig = null; let preTrig = null; let secTrig; let wasMoving = false; let photoShown = false;
    let glide = null;             // phones: which way the doctor last glided (true = to the centre, false = back to her hero place)

    const measure = () => {
      m.W = window.innerWidth; m.H = window.innerHeight;
      m.bandW = sec.querySelector('.sp-band-g')?.offsetWidth || 0;   // width of one copy of the word row
      gsap.set(leaving, { clearProps: 'transform,opacity' });
      gsap.set(order.map((it) => it.el), { clearProps: 'transform,opacity,zIndex' });
      const sr = sec.getBoundingClientRect();
      order.forEach((it) => {
        const r = it.el.getBoundingClientRect();
        it.nx = r.left + r.width / 2;
        it.ny = r.top - sr.top + r.height / 2;
      });
      /* the hero cut-out's resting place on screen: its centre x and its feet (she grows from the feet down to the window's bottom edge). The hero is pinned while this happens; once released it scrolls away, so that offset is added back. */
      const hr = heroImg.getBoundingClientRect();
      const feet = light ? hr.bottom + window.scrollY : hr.bottom + Math.max(0, window.scrollY - heroTrig.end);   // light: her feet's place on the page
      m.x0 = hr.left + hr.width / 2;
      m.feet0 = hr.bottom + window.scrollY;   // her feet on the screen when the page is at the top (phones hold her exactly here)
      m.feet = feet;
      m.xc = m.W / 2;
      m.K = compact ? 1 : Math.min((DOCTOR_H * m.H) / hr.height, (0.94 * m.W) / hr.width);   // at the middle she is 75% of the window tall (never wider than the screen), standing on its bottom edge
      m.pcy = 0.56 * m.H;                                                    // the tornado turns around her middle
      m.endFeet = compact ? Math.min(m.H - 24, m.pcy + 0.5 * m.K * hr.height) : m.H;   // where her feet rest at the middle (phones: centred on the spiral, not on the screen's bottom edge)
      m.leadStart = hero.offsetTop + SPIRAL_START * hero.offsetHeight;       // phones / tablets: the scroll position where 70% of the hero has gone out and the spiral starts
      const b = stageBox.current.getBoundingClientRect();
      if (overlayOn) {                                                       // desktop: the badge hangs from the whole screen
        m.cx = b.left + b.width / 2;
        m.cfeet = m.H * CARD_FEET;
        m.cs = (m.H * CARD_H) / hr.height;
      } else {                                                               // phones / tablets: the badge sits in its own box
        m.cx = b.left + b.width / 2;
        m.cfeet = b.top - sr.top + b.height * inlineFeet(b.height);
        m.cs = (b.height * inlinePhoto(b.height)) / hr.height;
      }
      m.left = sr.left;
      gsap.set([fly, flyH].filter(Boolean), { width: hr.width, height: hr.height, xPercent: -50, yPercent: -100 });
    };

    const render = () => {
      if (!m.W) return;
      /* T = how far the profile section still has to scroll before it pins. Phones / tablets: the spiral begins during the last
         the spiral begins once SPIRAL_START of the hero has scrolled out (its first SPIRAL_LEAD_P share plays until the pin), so it never waits for extra scroll */
      const T = secTrig ? Math.max(0, secTrig.start - window.scrollY) : 0;
      const lead = compact && secTrig ? clamp((window.scrollY - m.leadStart) / Math.max(1, secTrig.start - m.leadStart)) : 0;
      const prog = !compact ? st.p : T > 0 ? SPIRAL_LEAD_P * lead : SPIRAL_LEAD_P + st.p * (1 - SPIRAL_LEAD_P);
      const p = clamp(prog / SETTLE);   // the spiral, then 1 for the still hold
      const tA = sa.tA;
      const e = compact ? tA : smooth(tA);   // phones: she moves exactly as far as the page has scrolled (no easing, so nothing overshoots or bounces)

      /* the rest of the hero steps aside: headline left, doctor card right, stats strip down */
      const flying = tA > 0.001;                  // the doctor has left the hero card and is on her way
      const moving = !light && flying;            // (pinned hero only) the rest of the hero steps aside
      if (moving) {
        if (!wasMoving) gsap.killTweensOf(leaving);   // a hero intro still running must not fight the exit
        gsap.set(left, { x: -m.W * 0.55 * e, opacity: 1 - clamp(e * 1.4) });
        gsap.set(right, { x: m.W * 0.55 * e, opacity: 1 - clamp(e * 1.4) });
        if (stats) gsap.set(stats, { y: m.H * 0.5 * e, opacity: 1 - clamp(e * 1.4) });
      } else if (compact) {
        /* phones / tablets: the hero is not moved, but its text, card and stats fade quickly (opacity only) as she leaves,
           so she never slides across the headline or the buttons */
        gsap.set(leaving, { opacity: 1 - clamp(tA * 2) });
      } else if (wasMoving) {
        gsap.set(leaving, { clearProps: 'transform,opacity' });
      }
      wasMoving = moving;

      /* the doctor: desktop = hero → middle (staying on screen) → badge. Phones / tablets = the hero is not touched at all; she just
         comes down to the middle of the screen (no zoom) while the hero scrolls up, then (with the spiral) lands on the badge. */
      const u = smooth(clamp((p - 0.8) / 0.18));
      if (compact) {
        /* Two copies of her, never both visible:
           - until the spiral starts: the copy at page level (outside every section, so the pins never move it), fixed on the screen exactly
             over the hero's doctor while the hero scrolls up behind her; her place follows the scroll and eases to the centre.
           - from the moment the spiral starts: the copy inside the section, at z 20, so the back cards (z 10) turn behind her and the
             front cards (z 30) turn in front of her. Same screen place and size at the swap, so nothing jumps. */
        const flyingNow = window.scrollY > 0.5 || tA > 0.001 || p > 0;   // swapped in at the first pixel of scroll, while she is still exactly on the hero spot
        const inSpiral = p > 0;
        heroCut.style.visibility = flyingNow ? 'hidden' : '';
        let x; let y; let sc;
        if (u > 0) {                                  // landing on the badge: follows the scroll
          x = lerp(m.xc, m.cx, u); y = lerp(m.endFeet, m.cfeet, u); sc = lerp(1, m.cs, u);
        } else {                                      // coming down from the hero: follows the scroll, no timer
          const k = smooth(tA);
          x = lerp(m.x0, m.xc, k); y = lerp(m.feet0, m.endFeet, k); sc = 1;
        }
        const op = u > HANDOVER ? 0 : 1;
        if (flyH) gsap.set(flyH, { x, y, scale: sc, opacity: op, visibility: flyingNow && !inSpiral ? 'visible' : 'hidden' });
        gsap.set(fly, { x: x - m.left, y: y - T, scale: sc, opacity: op, visibility: inSpiral ? 'visible' : 'hidden', zIndex: u > 0 ? 50 : 20 });   // y - T: section coordinates (T is 0 once pinned); above the badge while she lands on it
      } else {
        const hidden = !flying && p === 0;
        heroCut.style.visibility = hidden ? '' : 'hidden';
        const x = lerp(lerp(m.x0, m.xc, e), m.cx, u);
        const look = {
          y: lerp(lerp(light ? m.feet - window.scrollY : m.feet, m.endFeet, e), m.cfeet, u),
          scale: lerp(lerp(1, m.K, e), m.cs, u),
          opacity: u > HANDOVER ? 0 : 1,   // one picture at a time: she and the badge's own photo swap in the same instant
        };
        /* two copies hand over at the moment the spiral starts: the hero's while the hero is pinned, the section's after */
        const inSection = window.scrollY >= secTrig.start - 1;   // judged by the real scroll position, so scrolling back up hands her to the hero at once
        if (flyH) gsap.set(flyH, { ...look, x, visibility: flying && !inSection ? 'visible' : 'hidden' });
        gsap.set(fly, { ...look, x: x - m.left, visibility: inSection ? 'visible' : 'hidden', zIndex: u > 0 ? 50 : 20 });   // above the badge while she lands on it / leaves it
      }
      gsap.set(overlayOn ? overlayBox.current : stageBox.current, { opacity: smooth(clamp(u / 0.35)) });   // the badge shows up as she starts to shrink towards it
      const showPhoto = u > HANDOVER;
      if (showPhoto !== photoShown) { photoShown = showPhoto; setPhotoOn(showPhoto); }
      gsap.set(bgEl, { opacity: smooth(clamp(p / 0.12)) });
      /* the falling pieces: each one falls with the scroll along its lane (left or right of the spiral), swaying a little and turning,
         fading at the top and bottom of the screen. In with the spiral, out as it settles. Transforms and opacity only. */
      if (sparks.length && m.W >= 768) {
        const o = smooth(clamp(p / 0.1)) * (1 - smooth(clamp((p - 0.72) / 0.2)));
        const lane = Math.min(0.13 * m.W, 190);
        const travel = m.H + 120;
        sparks.forEach((el, i) => {
          const d = SPARKS[i % SPARKS.length];
          const y = ((d.ph * travel + p * SPARK_SPEED * d.sp) % travel) - 60;
          const edge = smooth(clamp(y / (0.16 * m.H))) * smooth(clamp((m.H - y) / (0.16 * m.H)));
          const base = d.side ? m.W - 24 - lane + d.lx * lane : 24 + d.lx * lane;
          gsap.set(el, {
            x: base + Math.sin(p * 14 * d.sp + d.ph * 9) * d.sway - m.left, y: y - T,
            rotation: d.rot + p * d.turn * d.sp, opacity: o * edge,
          });
        });
      } else if (sparks.length) {
        gsap.set(sparks, { opacity: 0 });
      }
      /* the word band: slides sideways with the scroll, in with the spiral and out as it settles (transform + opacity only) */
      if (band && m.bandW) {
        gsap.set(band, { opacity: smooth(clamp(p / 0.1)) * (1 - smooth(clamp((p - 0.72) / 0.2))), top: m.pcy - T, yPercent: -50 });
        gsap.set(band.firstElementChild, { x: -((p * BAND_SPEED) % m.bandW) });
      }
      if (dbgEl) dbgEl.textContent = `v6 ${compact ? 'compact' : 'desktop'} ${light ? 'light' : 'pinned'} y${Math.round(window.scrollY)} tA${tA.toFixed(2)}`;   // DBG

      /* the tornado: every card has its own colour while it spins, and loses it as it settles */
      const small = m.W < 700;
      const mid = m.W < 1024;                                    // phones and tablets: bigger cards, orbiting a little tighter so they stay on screen
      const Rmax = Math.min((small ? 0.3 : mid ? 0.3 : 0.36) * m.W, 560);
      const spin = TAU * 3 * p;
      order.forEach((it, i) => {
        const a = smooth(clamp((p - i * 0.03) / 0.1));
        const s = smooth(clamp((p - 0.56 - i * 0.02) / 0.3));
        const h = i / (n - 1);                                   // 0 = top of the funnel, 1 = bottom
        const R = lerp(Rmax, Rmax * 0.5, h) * (0.3 + 0.7 * a);
        const th = i * 2.4 + spin;
        const dx = R * Math.cos(th), dz = R * 0.8 * Math.sin(th);
        const px = m.W / 2 + dx, py = m.pcy + (h - 0.5) * 0.56 * m.H;
        const depth = 0.65 + 0.35 * (dz / (Rmax * 0.8) + 1) / 2;
        gsap.set(it.el, {
          transformPerspective: 1100,
          x: lerp(px - it.nx, 0, s),
          y: lerp(py - T - it.ny, 0, s),
          z: lerp(dz, 0, s),
          scale: lerp((small ? 0.78 : mid ? 0.85 : 0.5) * a, it.ghost ? 0.15 : 1, s),
          rotationY: lerp(-Math.cos(th) * 30, 0, s),
          opacity: it.ghost ? a * (1 - s) : a * lerp(depth, 1, s),
          zIndex: s > 0.98 ? 1 : dz > 0 ? 30 : 10,
        });
        if (it.tint) gsap.set(it.tint, { opacity: 1 - s });
      });

      /* the extras: same helix, a little wider or tighter than the cards, tilting as they spin */
      decos.forEach((el, i) => {
        const d = DECO[i % DECO.length];
        const a = smooth(clamp((p - 0.03 - d.h * 0.18) / 0.12));
        const out = 1 - smooth(clamp((p - 0.6 - d.h * 0.12) / 0.22));       // gone by the time the cards have settled
        const R = lerp(Rmax * d.r, Rmax * d.r * 0.55, d.h) * (0.3 + 0.7 * a);
        const th = d.ph + spin * d.sp;
        const dz = R * 0.8 * Math.sin(th);
        const depth = 0.65 + 0.35 * (dz / (Rmax * 0.8 * d.r) + 1) / 2;
        gsap.set(el, {
          x: m.W / 2 + R * Math.cos(th) - m.left, y: m.pcy + (d.h - 0.5) * 0.62 * m.H - T,
          xPercent: -50, yPercent: -50,
          scale: (small ? 0.8 : 1) * (0.5 + 0.5 * a) * depth,
          rotation: d.rot + spin * 28 * d.sp,
          opacity: a * out * depth,
          zIndex: dz > 0 ? 32 : 12,
        });
      });
    };

    const ctx = gsap.context(() => {
      /* The hero stays pinned (without adding scroll space) until the profile section reaches the top, so the doctor reaches
         the middle exactly as the spiral begins and the profile section comes up underneath. Created first, so ScrollTrigger
         accounts for it before the section's own pin. */
      if (light) {
        /* no hero pin (the hero is taller than the screen): the doctor is lifted off the hero card at once and flown to the middle
           while the page scrolls up to the profile section. Same copy, same place, so there is only ever one of her. */
        preTrig = ScrollTrigger.create({
          trigger: hero, start: 0, end: () => hero.offsetTop + hero.offsetHeight + 10,
          onUpdate: (self) => gsap.to(sa, { tA: rampP(self.progress), duration: 0.2, ease: 'power2.out', overwrite: true, onUpdate: render }),   // a short follow: touch scroll arrives in bursts, this keeps her moving continuously
        });
      } else {
        heroTrig = ScrollTrigger.create({
          trigger: hero, start: 'top top', end: () => `+=${hero.offsetHeight + 10 + HERO_HOLD * window.innerHeight}`, pin: true, pinSpacing: false, anticipatePin: 1, refreshPriority: 2,   // pins above everything else are measured first
          onUpdate: (self) => gsap.to(sa, { tA: rampP(self.progress), duration: 0.25, ease: 'power2.out', overwrite: true, onUpdate: render }),
        });
      }
      /* scrub: true (no catch-up delay), so nothing lags behind the section when it is released */
      const tlB = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: () => `+=${PIN_LENGTH * window.innerHeight}`, pin: true, anticipatePin: 1, scrub: true, refreshPriority: 1 } })
        .fromTo(st, { p: 0 }, { p: 1, ease: 'none', onUpdate: render });
      secTrig = tlB.scrollTrigger;
    }, sec);
    const remeasure = () => { measure(); glide = null; sa.tA = rampP((heroTrig || preTrig).progress); render(); };
    remeasure();
    ScrollTrigger.addEventListener('refresh', remeasure);
    /* the pins add scroll space; every trigger further down the page (the About carousel, ...) was measured before that existed */
    ScrollTrigger.refresh();

    return {
      endY: () => secTrig.end - 1,            // the scroll position where the sequence has finished and the profile has settled
      cleanup: () => {
        ScrollTrigger.removeEventListener('refresh', remeasure);
        dbgEl?.remove();   // DBG
        ctx.revert();
        gsap.set(leaving, { clearProps: 'transform,opacity' });
        gsap.set(decos, { clearProps: 'transform,opacity,zIndex' });
        gsap.set(sparks, { clearProps: 'transform,opacity' });
        if (band) { gsap.set(band, { clearProps: 'opacity,top,transform' }); gsap.set(band.firstElementChild, { clearProps: 'transform' }); }
        gsap.set(stageBox.current, { clearProps: 'opacity' });
        heroCut.style.visibility = '';
      },
    };
    };

    let api = null;
    let started = false;
    let timer = 0;
    const start = () => {
      if (started) return;
      started = true;
      clearTimeout(timer);
      api = setup();
    };
    const offIntro = onIntro('doctor', () => { timer = setTimeout(start, 900); }, 6000);
    window.addEventListener('scroll', start, { once: true, passive: true });

    /* "Doctor" in the navbar / footer: play the whole sequence on its own, at a medium pace, and land on the settled profile */
    const html = document.documentElement;
    const onClick = (e) => {
      const link = e.target.closest?.('a[href="#doctors"]');
      if (!link) return;
      start();
      if (!api) return;
      e.preventDefault();
      ScrollTrigger.refresh();
      const to = api.endY();
      const dist = Math.abs(to - window.scrollY);
      html.style.scrollBehavior = 'auto';                                 // the page's smooth scrolling would fight the tween
      const stops = ['wheel', 'touchstart', 'keydown'];
      let tween;
      const halt = () => tween?.kill();                                   // any wheel / touch / key press takes the page back
      const restore = () => { html.style.scrollBehavior = ''; stops.forEach((n) => window.removeEventListener(n, halt)); };
      stops.forEach((n) => window.addEventListener(n, halt, { passive: true }));
      tween = gsap.to(window, {
        scrollTo: { y: to, autoKill: false },
        duration: Math.min(5, Math.max(1.6, dist / 1000)), ease: 'power1.inOut',
        onComplete: restore, onInterrupt: restore,
      });
    };
    document.addEventListener('click', onClick);

    return () => {
      offIntro();
      clearTimeout(timer);
      window.removeEventListener('scroll', start);
      document.removeEventListener('click', onClick);
      html.style.scrollBehavior = '';
      api?.cleanup();
    };
  }, [spiral, overlayOn, light]);

  return (
    <section
      id="doctors" ref={section} aria-label="Qualifications and areas of care"
      className="relative z-[2] my-2.5 overflow-x-clip px-[58px] py-24 text-p9
                 max-lg:px-[42px] max-lg:pb-16 max-lg:pt-24 max-sm:px-[26px] max-sm:pb-12 max-sm:pt-24 max-[375px]:px-[22px] max-[320px]:px-5"
    >
      {/* the section's panel; in the scroll sequence it fades in after the doctor has reached the middle */}
      <div aria-hidden="true" className="sp-bg absolute inset-x-2.5 inset-y-0 rounded-[18px] bg-[#e4ece1]" style={spiral ? { opacity: 0 } : undefined} />

      {spiral && (
        <>
          {/* the doctor, flying from the hero to the badge (a second copy lives inside the hero, see below) */}
          <img
            ref={flyer} src={DOCTOR_IMG} alt="" aria-hidden="true" draggable="false"
            className={FLYER_CLASS} style={light ? { ...FLYER_STYLE, filter: 'none' } : FLYER_STYLE}
          />
          {heroEl && createPortal(
            <img ref={heroFlyer} src={DOCTOR_IMG} alt="" aria-hidden="true" draggable="false" className={light ? 'pointer-events-none fixed left-0 top-0 z-[40] max-w-none select-none' : `${FLYER_CLASS} !z-[5]`} style={light ? { ...FLYER_STYLE, filter: 'none' } : FLYER_STYLE} />,
            heroEl,
          )}
          {/* a wide row of treatment words across the middle, behind everything (slides sideways with the scroll) */}
          <div
            aria-hidden="true"
            className="sp-band pointer-events-none absolute inset-x-0 top-[56svh] z-[1] overflow-hidden opacity-0 [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]"
          >
            <div className="flex w-max will-change-transform">
              {[0, 1].map((g) => (
                <p key={g} className="sp-band-g m-0 flex flex-none items-center whitespace-nowrap font-display text-[clamp(64px,11vw,160px)] leading-none tracking-[-.01em] text-white/90 [text-shadow:0_2px_28px_rgba(47,90,63,.38)]">
                  {[...BAND_WORDS, ...BAND_WORDS].map((w, wi) => (
                    <span key={wi} className="flex items-center">{w}<span className="mx-[.45em] text-[.45em] text-[#f2c14e]/60">✦</span></span>
                  ))}
                </p>
              ))}
            </div>
          </div>
          {/* sparkles and little homoeopathy pieces that fall down both sides while the spiral runs (see SPARKS) */}
          {SPARKS.map((d, i) => (
            <span key={i} aria-hidden="true" className="sp-spark pointer-events-none absolute left-0 top-0 z-[1] block opacity-0 will-change-transform max-md:hidden">
              <SparkShape d={d} />
            </span>
          ))}
          {/* sparkle stars and colour lines that swirl with the cards (see DECO) */}
          {DECO.map((d, i) => (
            <span key={i} aria-hidden="true" className="sp-deco pointer-events-none absolute left-0 top-0 block opacity-0 will-change-transform">
              <DecoShape d={d} />
            </span>
          ))}
          {/* extra cards that only exist inside the tornado, one per area of care plus the action */}
          {[...CARE_AREAS.map((a) => a.title), 'See all treatments'].map((t, gi) => (
            <div
              key={t} aria-hidden="true"
              className="sp-ghost pointer-events-none absolute left-1/2 top-[50svh] -ml-[min(150px,30vw)] -mt-[40px] w-[min(300px,60vw)] rounded-[18px] px-6 py-5 opacity-0 max-sm:px-5 max-sm:py-4"
              style={{ background: TINTS.ghosts[gi % TINTS.ghosts.length] }}
            >
              <p className="font-display text-[26px] font-normal leading-[1.15] max-sm:text-[21px]">{t}</p>
            </div>
          ))}
        </>
      )}

      <div className="relative mx-auto w-full max-w-[1240px]">

        {/* ── Qualifications: heading and the two credential tiles on the left, the clinic badge on the right ── */}
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-14 lg:gap-y-12">
          <header className={`dp-head sp-real relative w-fit lg:col-start-1 lg:row-start-1 ${spiral ? 'opacity-0' : ''}`}>
            {spiral && <span aria-hidden="true" className="sp-tint pointer-events-none absolute -inset-x-5 -inset-y-3 -z-10 rounded-[20px] opacity-0" style={{ background: TINTS.head }} />}
            <h2 className="font-display text-[clamp(30px,4.6vw,64px)] font-normal leading-[1.04] tracking-[-.02em]">
              Two trainings, one doctor
            </h2>
          </header>

          {/* the clinic badge: on phones and tablets it comes right after the heading (the doctor lands on it), beside everything on desktop */}
          <div ref={stageBox} className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-stretch" style={spiral && !overlayOn ? { opacity: 0 } : undefined}>{stage}</div>

          {/* two poster tiles side by side (even on a phone): the figure large, what it stands for under it */}
          <ol className="dp-tiles grid grid-cols-2 gap-3 lg:col-start-1 lg:row-start-2 lg:self-start">
            {QUALIFICATIONS.map((q, qi) => {
              const { figure, rest } = splitTitle(q.title);
              const showRest = rest && !q.desc.includes(rest);
              return (
                <li
                  key={q.title}
                  className={`dp-tile sp-real relative max-sm:[&:last-child:nth-child(odd)]:col-span-2 flex min-h-[260px] flex-col justify-between gap-10 rounded-[18px] bg-paper p-8 max-lg:min-h-[200px] max-lg:gap-6 max-lg:p-5 max-sm:min-h-[150px] max-sm:gap-3 max-sm:rounded-[14px] max-sm:p-3.5 ${spiral ? 'opacity-0' : ''}`}
                >
                  {spiral && <span aria-hidden="true" className="sp-tint pointer-events-none absolute inset-0 -z-10 rounded-[18px] opacity-0" style={{ background: TINTS.tiles[qi % TINTS.tiles.length] }} />}
                  <p className="font-display text-[clamp(30px,4.6vw,64px)] font-normal leading-none tracking-[-.02em]">{figure}</p>
                  <div className="text-[18px] leading-[1.5] max-lg:text-[16px] max-sm:text-[13px] max-sm:leading-[1.35]">
                    {showRest && <p className="mb-1 font-semibold">{rest}</p>}
                    <p>{q.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

      </div>

      <div ref={overlayBox} className="pointer-events-none absolute inset-0 z-40" style={spiral ? { opacity: 0 } : undefined}>{overlay}</div>
    </section>
  );
}