import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/utils';

/* Hero headline: a soft "rise from behind a mask" reveal, line by line.
   Each line sits in an overflow-hidden wrapper; its text slides up ~100% and
   fades in with a gentle stagger. It starts after the navbar intro. */

const LINES = ['Natural healing.', 'Personalized care.', 'Better living.'];
const DELAY = 0.6;   // seconds — lets the navbar open first

export default function HeroHeading({ className = '' }) {
  const h1 = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.hh-line > span', {
        yPercent: 105, opacity: 0, duration: 1.1, stagger: 0.14, delay: DELAY, ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    }, h1);
    return () => ctx.revert();
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