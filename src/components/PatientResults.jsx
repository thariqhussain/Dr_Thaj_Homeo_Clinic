import { useCallback, useEffect, useRef, useState } from 'react';
import { RESULTS } from '../data/content';
import { glideTo } from '../lib/utils';

/* Patient results: one horizontal strip, two images per view (one on phones).
   Arrow buttons (or swipe / trackpad / keyboard) move the strip; tapping an image opens it full view.
   Data lives in content.js → RESULTS. Each result is { id, condition, img } where `img` is a ready-made
   before/after image (the condition name is already written inside the image). `condition` is used for alt text only. */

const GAP = 24; // px — must match gap-6 on the strip

const FRAME =
  'relative w-full overflow-hidden rounded-[22px] bg-[#0d1114] shadow-[0_30px_60px_-28px_rgba(33,37,41,.4),0_0_0_6px_rgba(255,255,255,.7)]';

const ARROW =
  'grid h-11 w-11 place-items-center rounded-full border border-accent/30 bg-white text-p9 shadow-[0_10px_24px_-12px_rgba(33,37,41,.5)] ' +
  'transition-[opacity,background,color] duration-200 hover:bg-p9 hover:text-white ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent';

function Chevron({ dir }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  );
}

/* Full-view viewer: one image at a time, arrows + Esc + ←/→ keys, click outside to close. */
function Lightbox({ index, onClose, onStep }) {
  const closeBtn = useRef(null);
  const r = RESULTS[index];
  const many = RESULTS.length > 1;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onStep(-1);
      else if (e.key === 'ArrowRight') onStep(1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeBtn.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onStep]);

  return (
    <div
      role="dialog" aria-modal="true" aria-label={`${r.condition}, image ${index + 1} of ${RESULTS.length}`}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(10,12,13,.88)] p-4 backdrop-blur-sm overscroll-contain max-sm:p-2"
    >
      <button
        ref={closeBtn} type="button" onClick={onClose} aria-label="Close full view"
        className={`${ARROW} absolute right-4 top-4 z-[2] max-sm:right-2 max-sm:top-2`}
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      {many && (
        <button type="button" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); onStep(-1); }} className={`${ARROW} absolute left-4 top-1/2 z-[2] -translate-y-1/2 max-sm:left-2`}>
          <Chevron dir="left" />
        </button>
      )}

      <img
        src={r.img} alt={`${r.condition}: before and after treatment`} onClick={(e) => e.stopPropagation()}
        className="max-h-[88svh] max-w-[min(1100px,100%)] rounded-[14px] bg-[#0d1114] object-contain shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)]"
      />

      {many && (
        <button type="button" aria-label="Next image" onClick={(e) => { e.stopPropagation(); onStep(1); }} className={`${ARROW} absolute right-4 top-1/2 z-[2] -translate-y-1/2 max-sm:right-2`}>
          <Chevron dir="right" />
        </button>
      )}
    </div>
  );
}

export default function PatientResults() {
  const n = RESULTS.length;
  const strip = useRef(null);
  const opener = useRef(null);                       // the card that opened the viewer, so focus can return to it
  const [view, setView] = useState({ first: 1, last: Math.min(2, n), perView: 2, canPrev: false, canNext: n > 2 });
  const [open, setOpen] = useState(null);            // index of the image in full view, or null

  const measure = useCallback(() => {
    const el = strip.current;
    const slide = el?.firstElementChild;
    if (!slide) return;
    const step = slide.offsetWidth + GAP;
    const perView = Math.max(1, Math.round((el.clientWidth + GAP) / step));
    const first = Math.round(el.scrollLeft / step);
    setView({
      first: first + 1,
      last: Math.min(first + perView, n),
      perView,
      canPrev: el.scrollLeft > 4,
      canNext: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, [n]);

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) { ro.observe(el); [...el.children].forEach((c) => ro.observe(c)); }
    return () => { ro?.disconnect(); el.removeEventListener('scroll', measure); window.removeEventListener('resize', measure); };
  }, [measure]);

  const go = (dir) => {
    const el = strip.current;
    const slide = el?.firstElementChild;
    if (!slide) return;
    const stepPx = slide.offsetWidth + GAP;
    const perView = Math.max(1, Math.round((el.clientWidth + GAP) / stepPx));
    glideTo(el, Math.round(el.scrollLeft / stepPx) * stepPx + dir * stepPx * perView);   // never depends on the dimmed state
  };

  const openAt = (i, e) => { opener.current = e.currentTarget; setOpen(i); };
  const close = useCallback(() => { setOpen(null); opener.current?.focus(); }, []);
  const step = useCallback((d) => setOpen((i) => (i === null ? i : (i + d + n) % n)), [n]);

  /* keep the strip in step with the viewer so closing it lands on the image you were last looking at */
  useEffect(() => {
    if (open === null) return;
    const el = strip.current;
    const slide = el?.children[open];
    if (slide) slide.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  }, [open]);

  if (!n) return null;

  return (
    <section
      id="results" aria-labelledby="pr-title"
      className="relative isolate mx-2.5 my-2.5 overflow-hidden rounded-[18px] border border-accent/20 bg-[linear-gradient(160deg,#f7f9f5_0%,#e7efe5_100%)] px-12 py-16
                 max-lg:px-8 max-lg:py-12 max-sm:px-4 max-sm:py-10 max-[375px]:px-3"
    >
      <span aria-hidden="true" className="orb z-0 -left-24 top-10 h-[320px] w-[320px] bg-accent/[.22]" />
      <span aria-hidden="true" className="orb z-0 -bottom-24 -right-16 h-[300px] w-[300px] bg-accent-light/90" />

      <div className="relative z-[1] mx-auto w-full max-w-[1040px]">
        <header className="mx-auto mb-8 max-w-[620px] text-center max-md:mb-6">
          <h2 id="pr-title" className="mb-2 font-display text-[clamp(26px,3vw,38px)] font-normal leading-[1.1] text-p9">
            Results our patients have seen
          </h2>
          <p className="text-[14.5px] leading-[1.6] text-p7">
            These results are not typical , individual results will vary
          </p>
        </header>

        {/* controls: position readout on the left, arrows on the right */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-[13.5px] text-p7" aria-live="polite">
            {view.first === view.last ? `${view.first}` : `${view.first}–${view.last}`} of {n}
          </p>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous results" aria-disabled={!view.canPrev || undefined} onClick={() => go(-1)} className={`${ARROW} ${view.canPrev ? '' : 'opacity-35'}`}><Chevron dir="left" /></button>
            <button type="button" aria-label="Next results" aria-disabled={!view.canNext || undefined} onClick={() => go(1)} className={`${ARROW} ${view.canNext ? '' : 'opacity-35'}`}><Chevron dir="right" /></button>
          </div>
        </div>

        <div
          ref={strip} role="region" aria-roledescription="carousel" aria-label="Patient results"
          className="-mx-2 flex snap-x snap-mandatory gap-6 overflow-x-auto px-2 pb-8 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {RESULTS.map((r, i) => (
            <figure
              key={r.id ?? r.condition} aria-roledescription="slide" aria-label={`${i + 1} of ${n}`}
              className="m-0 shrink-0 basis-[calc(50%-12px)] snap-start max-md:basis-full"
            >
              <button
                type="button" onClick={(e) => openAt(i, e)} aria-label={`View ${r.condition} in full`}
                className={`${FRAME} block aspect-[5/4] cursor-zoom-in p-0 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-accent`}
              >
                <img
                  src={r.img} alt={`${r.condition}: before and after treatment`}
                  loading="lazy" decoding="async" draggable="false"
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </button>
            </figure>
          ))}
        </div>

        <p className="mx-auto mt-2 max-w-[560px] text-center text-[12px] leading-relaxed text-p6">
          Every patient responds differently. These photos show individual cases and are not a promise of results.
        </p>
      </div>

      {open !== null && <Lightbox index={open} onClose={close} onStep={step} />}
    </section>
  );
}