/* Decorative layer for the hero: a faint scatter of clinic icons (pellets, leaves, drops…) plus two botanical line-art sprigs.
   dotField.js draws the icons on a canvas; with a mouse (and no reduced-motion preference) they react to the cursor —
   see that file for the cost controls. The CSS dot grid is only a fallback until the canvas has drawn.
   The sprigs draw themselves once on load (CSS only) and then sit still; see .sprig-path in index.css. */

import { useEffect, useRef, useState } from 'react';
import { onIntro } from '../lib/intro';
import { createDotField } from '../lib/dotField';
import { canHover, prefersReducedMotion } from '../lib/utils';

const STEM = 'M46 432 C8 300 210 236 150 12';
/* x, y, rotation (deg), scale — one entry per leaf along the stem */
const LEAVES = [[42.8, 379.9, -132.6, 0.97], [50.4, 352.3, -17.1, 0.92], [64.9, 322.1, -112.8, 0.86], [83.5, 291.6, -5.1, 0.81], [104.0, 260.1, -109.4, 0.76], [124.1, 226.5, -9.1, 0.7], [141.8, 189.7, -119.9, 0.65], [154.9, 148.8, -25.1, 0.59], [161.0, 102.8, -139.7, 0.54], [150.0, 12.0, -105.0, 0.5]];
const LEAF = 'M0 0C8 -9 26 -10 40 0C26 10 8 9 0 0Z M0 0L34 0';

function Sprig({ className = '' }) {
  return (
    <svg viewBox="0 0 240 440" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={STEM} pathLength="1" className="sprig-path" />
      {LEAVES.map(([x, y, r, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
          <path d={LEAF} pathLength="1" className="sprig-path" style={{ animationDelay: `${0.05 + i * 0.07}s` }} />
        </g>
      ))}
    </svg>
  );
}

export default function HeroBackdrop() {
  const root = useRef(null);
  const layer = useRef(null);
  const canvas = useRef(null);
  /* sprigs wait (paused, undrawn) until the doctor photo is in; reduced motion shows them straight away */
  const [wait, setWait] = useState(() => !prefersReducedMotion());
  useEffect(() => {
    if (prefersReducedMotion()) return;
    return onIntro('doctor', () => setWait(false));
  }, []);

  useEffect(() => {
    /* touch / reduced motion still get the icons, drawn once and left still */
    const df = createDotField({ canvas: canvas.current, layer: layer.current, listenOn: root.current.parentElement, interactive: canHover() && !prefersReducedMotion() });
    return () => df.destroy();
  }, []);

  return (
    <div ref={root} aria-hidden="true" className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${wait ? 'sprigs-wait' : ''}`}>
      {/* the dot grid is the very first thing on screen: this wrapper fades it in (CSS, .dots-intro) */}
      <div className="dots-intro absolute inset-0">
        <div ref={layer} className="hero-dots absolute inset-0" />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      </div>
      {/* growing up from the bottom-left */}
      <Sprig className="absolute -left-2 bottom-[7%] h-[58%] w-auto text-accent/40 max-lg:h-[38%] max-sm:h-[26%]" />
      {/* hanging from the top-right */}
      <Sprig className="absolute -right-2 top-[9%] h-[36%] w-auto rotate-180 text-accent/30 max-lg:h-[26%] max-sm:hidden" />
    </div>
  );
}