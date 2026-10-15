import { useCallback, useEffect, useRef, useState } from 'react';
import { glideTo } from '../lib/utils';
import { CLINIC_PHOTOS } from '../data/content';

/* Highlights & updates: ONE horizontal strip of images.
   Arrow buttons move it one image at a time (swiping / trackpad scroll works too, and snaps).
   Every image is shown at its own proportions, nothing is cropped.
   Clicking an image opens a larger view: Esc closes, ← → move, focus returns to the image. */

const N = CLINIC_PHOTOS.length;

const Arrow = ({ dir, atEdge, onClick }) => (
  <button
    type="button" aria-label={dir < 0 ? 'Previous image' : 'Next image'} aria-disabled={atEdge || undefined} onClick={onClick}
    className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-line bg-white/90 text-p9 shadow-[0_8px_20px_-8px_rgba(33,37,41,.5)]
               [transition:opacity_.25s,background_.25s,transform_.3s_cubic-bezier(.34,1.4,.64,1)] hover:bg-accent-light active:scale-95
               motion-reduce:transition-none ${atEdge ? 'opacity-35' : ''}
               focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent`}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  </button>
);

export default function Gallery() {
  const [open, setOpen] = useState(-1);                 // image in the larger view, -1 = closed
  const [edge, setEdge] = useState({ start: true, end: false });
  const strip = useRef(null);
  const opener = useRef(null);                          // image button to give focus back to
  const closeBtn = useRef(null);

  /* ── the strip ── */
  const updateEdge = useCallback(() => {
    const el = strip.current;
    if (!el) return;
    const start = el.scrollLeft < 4;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdge((e) => (e.start === start && e.end === end ? e : { start, end }));
  }, []);

  useEffect(() => {
    updateEdge();
    const el = strip.current;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateEdge) : null;
    if (ro && el) { ro.observe(el); [...el.children].forEach((c) => ro.observe(c)); }   // photos load late and change the strip's width
    window.addEventListener('resize', updateEdge);
    return () => { ro?.disconnect(); window.removeEventListener('resize', updateEdge); };
  }, [updateEdge]);

  /* move to the next / previous image (images differ in width, so find the one nearest the left edge) */
  const step = (dir) => {
    const el = strip.current;
    if (!el) return;
    const items = [...el.children];
    const left = el.scrollLeft;
    let cur = 0;
    items.forEach((it, i) => { if (Math.abs(it.offsetLeft - items[0].offsetLeft - left) < Math.abs(items[cur].offsetLeft - items[0].offsetLeft - left)) cur = i; });
    const target = Math.min(items.length - 1, Math.max(0, cur + dir));
    glideTo(el, items[target].offsetLeft - items[0].offsetLeft);
  };

  /* ── the larger view ── */
  const close = useCallback(() => { setOpen(-1); opener.current?.focus(); }, []);
  const go = useCallback((d) => setOpen((i) => (i < 0 ? i : (i + d + N) % N)), []);

  useEffect(() => {
    if (open < 0) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeBtn.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, close, go]);

  if (!N) return null;
  const cur = CLINIC_PHOTOS[open];

  return (
    <section id="gallery" aria-labelledby="gl-title" className="relative px-12 py-[72px] max-lg:px-8 max-lg:py-14 max-sm:px-4 max-sm:py-10 max-[375px]:px-3">
      <div className="mx-auto max-w-[1120px]">
        <header className="mb-8 flex items-end justify-between gap-6 max-sm:mb-6">
          <div className="max-w-[560px]">
            <h2 id="gl-title" className="mb-2 font-display text-[clamp(28px,3.4vw,44px)] font-normal leading-[1.1] text-p9">Highlights &amp; updates</h2>
            <p className="text-[15px] leading-[1.7] text-p7">Moments and updates from Dr. Thaj Homoeo Clinic. Use the arrows to browse.</p>
          </div>
          <div className="flex flex-none gap-2.5">
            <Arrow dir={-1} atEdge={edge.start} onClick={() => step(-1)} />
            <Arrow dir={1} atEdge={edge.end} onClick={() => step(1)} />
          </div>
        </header>

        <ul
          ref={strip} onScroll={updateEdge} aria-label="Highlights and updates"
          className="relative m-0 flex snap-x snap-mandatory list-none gap-4 overflow-x-auto p-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-sm:gap-3"
        >
          {CLINIC_PHOTOS.map((p, i) => (
            <li key={p.src} className="flex-none snap-start">
              <button
                type="button" aria-label={`Open image: ${p.alt}`}
                onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }}
                className="group block cursor-zoom-in overflow-hidden rounded-2xl border-0 bg-accent-light p-0
                           focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <img
                  src={p.src} alt={p.alt} loading="lazy" decoding="async" draggable="false" onLoad={updateEdge}
                  className="block h-[clamp(260px,52svh,460px)] w-auto max-w-[calc(100vw-40px)] object-contain transition-transform duration-[700ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {open >= 0 && (
        <div
          role="dialog" aria-modal="true" aria-label={cur.alt}
          onClick={close}
          className="fixed inset-0 z-[200] grid place-items-center bg-[#0d1511]/90 p-4 backdrop-blur-sm"
        >
          <img
            src={cur.src} alt={cur.alt} onClick={(e) => e.stopPropagation()}
            className="max-h-[86svh] max-w-full rounded-2xl object-contain shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)]"
          />
          <button
            ref={closeBtn} type="button" aria-label="Close image" onClick={(e) => { e.stopPropagation(); close(); }}
            className="absolute right-4 top-4 grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/25
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          {N > 1 && (
            <>
              <button type="button" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); go(-1); }}
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
              </button>
              <button type="button" aria-label="Next image" onClick={(e) => { e.stopPropagation(); go(1); }}
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}