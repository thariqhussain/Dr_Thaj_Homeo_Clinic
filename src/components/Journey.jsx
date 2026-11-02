import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import CircularCarousel from './CircularCarousel';
import { JOURNEY } from '../data/content';
import { prefersReducedMotion } from '../lib/utils';

/* The care journey as its own section: the five steps in content.js → JOURNEY ({ title, img }) on a React Bits Circular
   Carousel. It replaces JourneyPanel (which is no longer used here).

   - Images load from public/assets/journey/<img>. Change JOURNEY_DIR if they live somewhere else.
   - The ring drifts slowly on its own and pauses while the pointer is over it. For no auto-movement at all, set
     autoplay="off" below. Drag, swipe, arrow keys or a click on a card also move it; vertical scrolling is never
     captured (only sideways wheel / trackpad movement is).
   - The section is a compact panel in the same style as Connect (same ground colour); fadeColor must match that ground.
   - `embedded` (used by Connect): no panel of its own, it fills the column it is placed in and sizes its cards to that column.
   - Needs the CircularCarousel.jsx file (React Bits source, JS + Tailwind). */

const JOURNEY_DIR = '/assets/journey/';
const ITEMS = JOURNEY.map((j) => ({ src: `${JOURNEY_DIR}${j.img}`, alt: j.title, title: j.title }));

/* card width by device. Cards are square and large, so the ring of five reads as wide as the React Bits demo
   (ring width ≈ 2.8 × card width). The stage is only as tall as the ring needs: card + 150px for the tilt and the caption. */
const cardWidthFor = () => {
  const w = window.innerWidth;
  return w < 640 ? 150 : w < 1024 ? 230 : 300;
};
function useCardWidth() {
  const [width, setWidth] = useState(cardWidthFor);
  useEffect(() => {
    const on = () => setWidth(cardWidthFor());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return width;
}

/* embedded: the ring of five is ≈ 2.8 × card width, so size the card from the column's own width */
function useColumnCardWidth(ref) {
  const [width, setWidth] = useState(180);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(130, Math.min(260, Math.round(e.contentRect.width / 2.8)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

export default function Journey({ embedded = false }) {
  const section = useRef(null);
  const own = useCardWidth();
  const colWidth = useColumnCardWidth(section);
  const cardWidth = embedded ? colWidth : own;

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: section.current, start: 'top 75%', once: true } })
        .from('.jn-head > *', { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 })
        .from('.jn-stage', { y: 30, opacity: 0, duration: 0.9, clearProps: 'transform,opacity' }, '-=0.4');
    }, section);
    return () => ctx.revert();
  }, []);

  const content = (
    <>
      <header className={`jn-head grid gap-3 ${embedded ? 'justify-items-center text-center' : 'items-end lg:grid-cols-[1.5fr_.7fr] lg:gap-14'}`}>
        <h2 id="jn-title" className="font-display text-[clamp(30px,3.4vw,44px)] font-normal leading-[1.04] tracking-[-.02em]">
          Your care journey
        </h2>
        <p className={`max-w-[420px] text-[18px] leading-[1.6] ${embedded ? '' : 'lg:pb-2'}`}>
          Five steps, from booking your visit to recovery.
        </p>
      </header>

      {/* the carousel fills its parent, so the parent needs a height */}
      <div className="jn-stage mt-4 sm:mt-6" style={{ height: cardWidth + 150 }}>
        <CircularCarousel
          items={ITEMS}
          preset="cylinder"
          aspectRatio={1}
          cardWidth={cardWidth}
          gap={cardWidth < 200 ? 20 : 40}
          cornerRadius={14}
          autoplay="drift"
          speed={10}
          captions
          fadeColor="#e4ece1"
          innerShade={0.85}
        />
      </div>
    </>
  );

  if (embedded) {
    return (
      <div id="journey" ref={section} aria-labelledby="jn-title" role="region" className="min-w-0 self-center text-p9">
        {content}
      </div>
    );
  }

  return (
    <section
      id="journey" ref={section} aria-labelledby="jn-title"
      className="relative mx-2.5 my-2.5 rounded-[18px] bg-[#e4ece1] px-12 py-16 text-p9 max-lg:px-8 max-lg:py-12 max-sm:px-4 max-sm:py-10 max-[375px]:px-3 max-[320px]:px-2.5"
    >
      <div className="mx-auto w-full max-w-[1120px]">
        {content}
      </div>
    </section>
  );
}