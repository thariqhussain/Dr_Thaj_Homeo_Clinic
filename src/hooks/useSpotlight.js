import { useEffect } from 'react';

/* Writes --mx / --my on the element so a CSS radial-gradient can follow the cursor. */
export function useSpotlight(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0, ev = null;
    const move = (e) => {
      ev = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${ev.clientX - r.left}px`);
        el.style.setProperty('--my', `${ev.clientY - r.top}px`);
      });
    };
    el.addEventListener('pointermove', move);
    return () => { el.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, [ref]);
}
