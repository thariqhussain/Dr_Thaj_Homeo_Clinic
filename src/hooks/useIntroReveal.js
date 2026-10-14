import { useLayoutEffect } from 'react';
import { gsap } from '../lib/gsap';
import { onIntro } from '../lib/intro';
import { prefersReducedMotion } from '../lib/utils';

/* Hides an element, then fades it up once the page-load sequence reaches `after` (default: the doctor photo is in). */
export function useIntroReveal(ref, { after = 'doctor', y = 20, delay = 0, duration = 0.8 } = {}) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const tw = gsap.from(el, { y, opacity: 0, duration, delay, ease: 'power3.out', paused: true, clearProps: 'transform,opacity' });
    const off = onIntro(after, () => tw.play());
    return () => { off(); tw.kill(); gsap.set(el, { clearProps: 'transform,opacity' }); };
  }, [ref, after, y, delay, duration]);
}