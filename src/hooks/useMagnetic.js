import { useEffect } from 'react';
import { gsap } from '../lib/gsap';
import { canHover, prefersReducedMotion } from '../lib/utils';

/* Button gently follows the cursor (pointer devices only). */
export function useMagnetic(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !canHover()) return;
    const cx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const cy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      cx((e.clientX - (r.left + r.width / 2)) * 0.25);
      cy((e.clientY - (r.top + r.height / 2)) * 0.25);
    };
    const leave = () => { cx(0); cy(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.set(el, { clearProps: 'x,y' });
    };
  }, [ref]);
}
