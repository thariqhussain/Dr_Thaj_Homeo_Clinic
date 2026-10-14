import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { onIntro } from '../lib/intro';
import { prefersReducedMotion } from '../lib/utils';

/* Hero headline: a soft "rise from behind a mask" reveal, line by line.
   Each line sits in an overflow-hidden wrapper; its text slides up ~100% and
   fades in with a gentle stagger. It starts after the navbar intro and the doctor photo. */

const LINES = ['Natural healing.', 'Personalized care.', 'Better living.'];
const DELAY = 0.15;  // seconds after the doctor photo is in

export default function HeroHeading({ className = '' }) {
  const h1 = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    let off = () => {};
    const ctx = gsap.context(() => {
      /* hidden right away, plays once the doctor photo is in (see lib/intro.js) */
      const tw = gsap.from('.hh-line > span', {
        yPercent: 105, opacity: 0, duration: 0.8, stagger: 0.1, delay: DELAY, ease: 'power3.out',
        clearProps: 'transform,opacity', paused: true,
      });
      off = onIntro('doctor', () => tw.play());
    }, h1);
    return () => { off(); ctx.revert(); };
  }, []);

  return (
    <h1 ref={h1} className={`relative ${className}`}>
      {LINES.map((l) => (
        /* padding gives descenders room inside the mask; the negative margin cancels it out */
        <span key={l} className="hh-line block overflow-hidden" style={{ paddingBottom: '.12em', marginBottom: '-.12em' }}>
          <span className="block">{l}</span>
        </span>
      ))}
    </h1>
  );
}