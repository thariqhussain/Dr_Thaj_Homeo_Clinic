import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { useMagnetic } from '../hooks/useMagnetic';
import { canHover, prefersReducedMotion } from '../lib/utils';
import { createSpotlightLens } from '../lib/spotlightLens';
import { createFocusPull } from '../lib/focusPull';
import { createInkTrail } from '../lib/inkTrail';
import { createWaterReveal } from '../lib/waterReveal';
import './DoctorCard.css';

/* Doctor card on the right of the hero: pop-out portrait, overlapping name plate, bio, CTA.
   Styled by DoctorCard.css (plain CSS, scales with the card's width).
   The `dc-*` classes double as GSAP selector hooks, scoped by gsap.context(). */

const PHOTO = '/assets/doctors/drThaj.png';             // transparent cut-out (shown by default)
const PHOTO_ALT = '/assets/doctors/drThajGreySuit.png';    // transparent cut-out revealed on hover

/* which hover effect brings in the second photo:
   'water' = water ripple (WebGL)  |  'ink' = ink-trail reveal (canvas)  |  'focus' = soft focus pull (CSS)  |  'lens' = spotlight lens (WebGL) */
const HOVER_EFFECT = 'water';
const EFFECTS = { water: createWaterReveal, ink: createInkTrail, focus: createFocusPull, lens: createSpotlightLens };

export default function DoctorCard() {
  const card = useRef(null);
  const cta = useRef(null);
  useMagnetic(cta);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: card.current, start: 'top 90%', once: true } })
        .fromTo('.dc-arch-clip', { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power4.inOut', clearProps: 'clipPath' })
        .from('.dc-cut', { y: 70, opacity: 0, duration: 1.2 }, '<0.35')
        .from('.dc-ring', { scale: 0.7, opacity: 0, duration: 1.2 }, '<0.1')
        .from('.dc-eyebrow', { y: 14, opacity: 0, duration: 0.6 }, '-=0.9')
        .from('.dc-plate', { x: 40, opacity: 0, scale: 0.96, duration: 0.8 }, '-=0.5')
        .from('.dc-line > span', { yPercent: 115, duration: 0.9, stagger: 0.12 }, '-=0.5')
        .from('.dc-bio', { y: 20, opacity: 0, duration: 0.7 }, '-=0.5')
        .from('.dc-cta', { y: 20, opacity: 0, duration: 0.7 }, '-=0.45')
        .from('.dc-badge', { scale: 0.5, opacity: 0, duration: 0.7, ease: 'back.out(1.8)' }, '-=0.6');

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
    return () => ctx.revert();
  }, []);

  /* hover swap to the second photo (skipped for reduced motion; falls back to the plain <img>) */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const host = card.current.querySelector('.dc-cut-inner');
    const img = host.querySelector('.dc-photo');
    const create = EFFECTS[HOVER_EFFECT] || createFocusPull;
    const fx = create({ host, baseSrc: img.currentSrc || img.src, revealSrc: PHOTO_ALT });
    return () => fx.destroy();
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
          <a ref={cta} href="#booking" className="dc-cta">+ Request Appointment</a>
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
          <div className="dc-badge">
            <span className="dc-badge-dot pause-offscreen" />
            B.H.M.S · M.Sc Psychology
          </div>
        </div>
      </div>
    </aside>
  );
}