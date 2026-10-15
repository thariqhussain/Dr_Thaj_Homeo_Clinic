import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { introDone, onIntro } from '../lib/intro';
import { useMagnetic } from '../hooks/useMagnetic';
import { canHover, prefersReducedMotion } from '../lib/utils';
import './DoctorCard.css';

/* Doctor card on the right of the hero: pop-out portrait, overlapping name plate, bio, CTA.
   Styled by DoctorCard.css (plain CSS, scales with the card's width).
   The `dc-*` classes double as GSAP selector hooks, scoped by gsap.context(). */

const PHOTO = '/assets/doctors/drThaj.webp';             // transparent cut-out (shown by default)
const PHOTO_ALT = '/assets/doctors/drThajGreySuit.webp';    // transparent cut-out revealed on hover

/* which hover effect brings in the second photo:
   'water' = water ripple (WebGL)  |  'ink' = ink-trail reveal (canvas)  |  'focus' = soft focus pull (CSS)  |  'lens' = spotlight lens (WebGL) */
const HOVER_EFFECT = 'water';
/* each effect is its own chunk and only the chosen one is ever downloaded (after the hero has painted) */
const EFFECT_LOADERS = {
  water: () => import('../lib/waterReveal').then((m) => m.createWaterReveal),
  ink: () => import('../lib/inkTrail').then((m) => m.createInkTrail),
  focus: () => import('../lib/focusPull').then((m) => m.createFocusPull),
  lens: () => import('../lib/spotlightLens').then((m) => m.createSpotlightLens),
};

export default function DoctorCard() {
  const card = useRef(null);
  const cta = useRef(null);
  useMagnetic(cta);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    let offNav = () => {};
    const ctx = gsap.context(() => {
      /* paused on purpose: it starts once the navbar intro has finished AND the card is on screen.
         The portrait comes first; ~0.65s in (as it finishes rising) it tells the rest of the hero to start. */
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
        .fromTo('.dc-arch-clip', { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power4.inOut', clearProps: 'clipPath' })
        .from('.dc-cut', { y: 70, opacity: 0, duration: 0.9 }, '<0.25')
        .from('.dc-ring', { scale: 0.7, opacity: 0, duration: 0.9 }, '<0.1')
        .from('.dc-eyebrow', { y: 14, opacity: 0, duration: 0.45 }, '-=0.7')
        .from('.dc-plate', { x: 40, opacity: 0, scale: 0.96, duration: 0.6 }, '-=0.4')
        .from('.dc-line > span', { yPercent: 115, duration: 0.7, stagger: 0.1 }, '-=0.4')
        .from('.dc-bio', { y: 20, opacity: 0, duration: 0.5 }, '-=0.4')
        .from('.dc-cta', { y: 20, opacity: 0, duration: 0.5 }, '-=0.35')
        .from('.dc-badge', { scale: 0.5, opacity: 0, duration: 0.5, ease: 'back.out(1.8)' }, '-=0.4')
        .add(() => introDone('doctor'), 0.65);

      let navOk = false, seen = false, played = false;
      const tryPlay = () => { if (navOk && seen && !played) { played = true; tl.play(); } };
      ScrollTrigger.create({ trigger: card.current, start: 'top 90%', once: true, onEnter: () => { seen = true; tryPlay(); } });
      offNav = onIntro('nav', () => {
        navOk = true;
        if (!seen) introDone('doctor');   // card is below the fold (phones): don't hold the headline back, the card plays when scrolled to
        tryPlay();
      }, 5000);

      /* pointer-only: the arch tilts, and the pop-out cut-out slides the opposite way for depth */
      if (canHover()) {
        const visual = card.current.querySelector('.dc-visual');
        const arch = card.current.querySelector('.dc-arch');
        const cut = card.current.querySelector('.dc-cut');
        const rx = gsap.quickTo(arch, 'rotationX', { duration: 0.6, ease: 'power3.out' });
        const ry = gsap.quickTo(arch, 'rotationY', { duration: 0.6, ease: 'power3.out' });
        const px = gsap.quickTo(cut, 'x', { duration: 0.7, ease: 'power3.out' });
        const py = gsap.quickTo(cut, 'y', { duration: 0.7, ease: 'power3.out' });
        visual.addEventListener('pointermove', (e) => {
          const r = visual.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
          ry(nx * 10); rx(-ny * 10);
          px(-nx * 14); py(-ny * 10);
        });
        visual.addEventListener('pointerleave', () => { rx(0); ry(0); px(0); py(0); });
      }
    }, card);
    return () => { offNav(); ctx.revert(); };
  }, []);

  /* hover swap to the second photo (skipped for reduced motion; falls back to the plain <img>).
     Starts only once the browser is idle, so the WebGL code and the second photo never compete with the first paint. */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let fx = null;
    let cancelled = false;
    const host = card.current.querySelector('.dc-cut-inner');
    const img = host.querySelector('.dc-photo');

    const start = async () => {
      const create = await (EFFECT_LOADERS[HOVER_EFFECT] || EFFECT_LOADERS.focus)();
      if (cancelled) return;
      fx = create({ host, baseSrc: img.currentSrc || img.src, revealSrc: PHOTO_ALT });
    };
    const handle = 'requestIdleCallback' in window
      ? window.requestIdleCallback(start, { timeout: 2500 })
      : window.setTimeout(start, 400);

    return () => {
      cancelled = true;
      if ('requestIdleCallback' in window) window.cancelIdleCallback(handle); else clearTimeout(handle);
      fx?.destroy();
    };
  }, []);

  return (
    <aside ref={card} className="dc" aria-labelledby="dc-name">
      <div className="dc-grid">
        <div className="dc-text">
          <p className="dc-eyebrow">Meet your doctor</p>
          <div className="dc-plate pause-offscreen">
            <h2 id="dc-name" className="dc-name">
              <span className="dc-line"><span>Dr. S. Mohammed</span></span>
              <span className="dc-line dc-line-accent"><span>Thajudeen</span></span>
            </h2>
          </div>
          <p className="dc-bio">
            Dr. Thaj Homoeo Clinic offers personalised homoeopathic care for thyroid, respiratory, digestive, joint, women’s and children’s health, treating the person as a whole.
          </p>
          <a ref={cta} href="#booking" className="dc-cta">
            Request Appointment
            <span className="dc-cta-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </span>
          </a>
        </div>

        <div className="dc-visual">
          <svg className="dc-ring pause-offscreen" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="97" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 7" strokeLinecap="round" />
          </svg>
          <div className="dc-arch">
            {/* the mint arch is only the backdrop now… */}
            <div className="dc-arch-clip" />
            {/* …the doctor is a separate layer that grows past its top and sides */}
            <div className="dc-cut">
              <div className="dc-cut-inner">
                <img className="dc-photo" src={PHOTO} alt="Dr. S. Mohammed Thajudeen" width="340" height="430" decoding="async" draggable="false" />
              </div>
            </div>
          </div>
          {/* education plaque: icon tile + label + the two degrees stacked */}
          <div className="dc-badge">
            <span className="dc-badge-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5z" />
                <path d="M6 11.7v4.3c0 1.2 2.7 2.7 6 2.7s6-1.5 6-2.7v-4.3" />
                <path d="M22 9.5v5" />
              </svg>
            </span>
            <span className="dc-badge-text">
              <span className="dc-badge-label">Education</span>
              <strong className="dc-badge-deg">B.H.M.S</strong>
              <span className="dc-badge-deg dc-badge-deg2">M.Sc Psychology</span>
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}