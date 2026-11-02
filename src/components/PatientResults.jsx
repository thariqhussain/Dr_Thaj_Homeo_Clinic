import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { RESULTS as ALL_RESULTS } from '../data/content';
import { prefersReducedMotion } from '../lib/utils';

/* Patient results — a normal section (no pinning, it scrolls past like any other).
   The before/after cards sit in one row you can swipe or drag; arrow buttons and an "n of N" counter move it on every screen size.
   Tapping any card opens it full view. Every case in content.js → RESULTS is shown: { id, condition, img }, where `img` is a ready-made
   before/after image (the condition name is already written inside it). `condition` is used for alt text only. */

/* every case in content.js is shown */
const RESULTS = ALL_RESULTS;
/* one tint per card, the same family as the other sections' colours */
const TINTS = ['#9fd59a', '#f6a6c9', '#ffb86b', '#7fb7e6'];

const FRAME =
  'relative w-full overflow-hidden rounded-[22px] bg-[#0d1114] shadow-[0_40px_80px_-30px_rgba(0,0,0,.65),0_0_0_1px_rgba(255,255,255,.14)]';

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

const pad2 = (v) => String(v).padStart(2, '0');

export default function PatientResults() {
  const n = RESULTS.length;
  const root = useRef(null);
  const strip = useRef(null);
  const opener = useRef(null);                       // the card that opened the viewer, so focus can return to it
  const [open, setOpen] = useState(null);            // index of the image in full view, or null
  const [view, setView] = useState({ at: 1, canPrev: false, canNext: n > 1 });
  const [swiped, setSwiped] = useState(false);

  /* how far one card moves the row: one card + the gap */
  const stepPx = () => {
    const el = strip.current;
    const a = el?.children[0];
    const b = el?.children[1];
    return a && b ? b.offsetLeft - a.offsetLeft : a ? a.offsetWidth : 1;
  };
  const measure = useCallback(() => {
    const el = strip.current;
    if (!el || !el.children.length) return;
    const step = stepPx();
    setView({
      at: Math.min(n, Math.max(1, Math.round(el.scrollLeft / step) + 1)),
      canPrev: el.scrollLeft > 4,
      canNext: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
    if (el.scrollLeft > 24) setSwiped(true);
  }, [n]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  /* the arrows move the row by the number of cards that are in view (at least one) */
  const go = (dir) => {
    const el = strip.current;
    if (!el) return;
    const step = stepPx();
    const per = Math.max(1, Math.floor(el.clientWidth / step));
    el.scrollBy({ left: dir * step * per, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.pr-head > *', { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: root.current, start: 'top 80%', once: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  const openAt = (i, e) => { opener.current = e.currentTarget; setOpen(i); };
  const close = useCallback(() => { setOpen(null); opener.current?.focus(); }, []);
  const step = useCallback((d) => setOpen((i) => (i === null ? i : (i + d + n) % n)), [n]);

  if (!n) return null;

  return (
    <section
      id="results" ref={root} aria-labelledby="pr-title" data-nav-dark
      className="relative isolate mx-2.5 my-2.5 overflow-hidden rounded-[18px] bg-[radial-gradient(120%_100%_at_0%_0%,#254033_0%,#14211a_60%,#0d1511_100%)] px-12 py-10 text-white
                 max-lg:px-8 max-lg:py-9 max-sm:px-4 max-sm:py-8"
    >
      <span aria-hidden="true" className="orb z-0 -left-24 top-10 h-[320px] w-[320px] bg-accent/[.28]" />
      <span aria-hidden="true" className="orb z-0 -bottom-24 -right-16 h-[300px] w-[300px] bg-accent-light/[.12]" />

      <div className="relative z-[1] mx-auto max-w-[1240px]">
        <header className="pr-head mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[.16em] text-mint">Patient results</p>
            <h2 id="pr-title" className="font-display text-[clamp(26px,2.8vw,40px)] font-normal leading-[1.08] tracking-[-.02em]">
              Results our patients have seen
            </h2>
            <p className="mt-2 max-w-[460px] text-[14px] leading-[1.6] text-white/70 max-sm:text-[14px]">
              {n} real cases, shared with the patients’ consent. Tap any photo to see it in full.
            </p>
          </div>

          {/* counter + arrows: on every screen size */}
          {n > 1 && (
            <div className="flex items-center gap-4">
              <p className="m-0 text-[14px] tabular-nums text-white/70" aria-live="polite">{pad2(view.at)} / {pad2(n)}</p>
              <div className="flex gap-2">
                {[['Previous results', -1, 'left', view.canPrev], ['Next results', 1, 'right', view.canNext]].map(([l, d, dir, can]) => (
                  <button
                    key={l} type="button" aria-label={l} aria-disabled={!can || undefined} onClick={() => can && go(d)}
                    className={`${ARROW} cursor-pointer ${can ? '' : 'cursor-default opacity-35'}`}
                  >
                    <Chevron dir={dir} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        <div
          ref={strip} onScroll={measure} role="region" aria-roledescription="carousel" aria-label="Patient results" tabIndex={0}
          className="-mx-2 flex snap-x snap-mandatory gap-6 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {RESULTS.map((r, i) => (
            <figure
              key={r.id ?? r.condition} aria-label={`${i + 1} of ${n}`}
              className="pr-card group m-0 shrink-0 basis-[calc(50%-12px)] snap-start max-md:basis-[84%] lg:basis-[calc((100%-48px)/3)]"
            >
              <button
                type="button" onClick={(e) => openAt(i, e)} aria-label={`View ${r.condition} in full`}
                className={`${FRAME} block aspect-[5/4] cursor-zoom-in p-0 transition-transform duration-500 ease-out [@media(hover:hover)]:group-hover:-translate-y-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-mint`}
              >
                {/* a coloured edge along the top of each photo */}
                <span aria-hidden="true" className="absolute inset-x-0 top-0 z-[1] h-1.5" style={{ background: TINTS[i % TINTS.length] }} />
                <img
                  src={r.img} alt={`${r.condition}: before and after treatment`}
                  loading="lazy" decoding="async" draggable="false"
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </button>
              {/* caption plate: the case number in its colour, the condition, and a hint to open it */}
              <figcaption className="mt-3 flex items-center gap-3 px-1">
                <span className="grid h-9 min-w-9 flex-none place-items-center rounded-full px-2.5 text-[13px] font-semibold tabular-nums text-p9" style={{ background: TINTS[i % TINTS.length] }}>
                  {pad2(i + 1)}
                </span>
                <span className="min-w-0 flex-1 font-display text-[clamp(17px,1.5vw,22px)] leading-tight text-white">{r.condition}</span>
                <span aria-hidden="true" className="hidden flex-none text-[12.5px] text-white/55 transition-colors duration-300 group-hover:text-white sm:inline">View full →</span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* phones / tablets: this line says "swipe" until they have */}
        {!swiped && n > 1 && (
          <p aria-hidden="true" className="mt-2 flex items-center justify-center gap-1.5 text-[13px] font-medium text-mint lg:hidden">
            Swipe to see more
            <svg className="animate-pulse" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </p>
        )}

        <p className="mt-3 max-w-[640px] text-[12px] leading-relaxed text-white/55">
          These results are not typical, individual results will vary. Every patient responds differently; these photos show individual cases and are not a promise of results.
        </p>
      </div>

      {open !== null && <Lightbox index={open} onClose={close} onStep={step} />}
    </section>
  );
}