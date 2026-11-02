import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { PATIENT_TAGS, REVIEWS as ALL_REVIEWS, REVIEWS_URL } from '../data/content';
import { prefersReducedMotion } from '../lib/utils';

/* Patient feedback (Justdial), as a "wall".
   Desktop: a sticky intro on the left (the 5.0 rating, the things patients appreciate); on the right two columns of review cards
   that drift in opposite directions as you scroll past, each card coloured by a tab across its top.
   Phones and tablets: the cards are one swipeable row, one card per view. Long reviews are cut with a "Read more" toggle so cards
   stay a similar height. Reviews live in content.js → REVIEWS; the tints are the same family as the doctor section's. */

const LONG = 230;                                     // reviews longer than this many characters get "Read more"
const REVIEWS = ALL_REVIEWS.slice(0, 6);   // only the first 6 are shown; the rest are read on Justdial (link below)
const N = REVIEWS.length;
const TINTS = ['#9fd59a', '#f6a6c9', '#ffb86b', '#7fb7e6', '#c3a6e8', '#f2c14e'];
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

function Card({ r, i }) {
  const long = r.text.length > LONG;
  const [open, setOpen] = useState(false);
  const tint = TINTS[i % TINTS.length];
  return (
    <li
      aria-label={`Review ${i + 1} of ${N}`} style={{ '--o': i }}
      className="tm-card max-lg:[order:var(--o)] relative flex-none overflow-hidden rounded-[22px] bg-paper p-7 shadow-[0_30px_50px_-34px_rgba(33,37,41,.45)]
                 max-lg:w-[min(84vw,560px)] max-lg:snap-center max-sm:p-5 lg:w-full"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5" style={{ background: tint }} />
      <span aria-hidden="true" className="absolute right-5 top-3 font-display text-[88px] leading-none opacity-30" style={{ color: tint }}>”</span>
      <div role="img" aria-label="5 out of 5 stars" className="mb-4 text-[17px] tracking-[3px] text-[#f2b134]">★★★★★</div>
      <blockquote className={`m-0 text-[16px] leading-[1.7] text-p8 ${long && !open ? 'line-clamp-6' : ''}`}>{r.text}</blockquote>
      {long && (
        <button
          type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
          className="mt-3 cursor-pointer border-0 bg-transparent p-0 font-body text-[14px] font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
      <div className="mt-6 flex items-center gap-3">
        <span aria-hidden="true" className="grid h-11 w-11 flex-none place-items-center rounded-full font-display text-[17px] text-p9" style={{ background: tint }}>{initials(r.name)}</span>
        <div className="leading-tight">
          <p className="m-0 text-[15px] font-semibold text-p9">{r.name}</p>
          <p className="m-0 mt-1 text-[13px] text-p6">via Justdial</p>
        </div>
      </div>
    </li>
  );
}

export default function Testimonials() {
  const root = useRef(null);
  const strip = useRef(null);                       // phones / tablets: the swipeable row
  const [view, setView] = useState({ at: 1, canPrev: false, canNext: N > 1 });
  const [swiped, setSwiped] = useState(false);
  const stepPx = () => {
    const li = strip.current?.querySelector('li');
    return li ? li.offsetWidth + 16 : 1;            // one card + the 16px gap
  };
  const onStrip = useCallback(() => {
    const el = strip.current;
    if (!el) return;
    const step = stepPx();
    setView({
      at: Math.min(N, Math.max(1, Math.round(el.scrollLeft / step) + 1)),
      canPrev: el.scrollLeft > 4, canNext: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
    if (el.scrollLeft > 24) setSwiped(true);
  }, []);
  const goStrip = (d) => strip.current?.scrollBy({ left: d * stepPx(), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  /* split alternately into two columns so both are about the same height */
  const cols = [REVIEWS.filter((_, i) => i % 2 === 0).map((r) => [r, REVIEWS.indexOf(r)]), REVIEWS.filter((_, i) => i % 2 === 1).map((r) => [r, REVIEWS.indexOf(r)])];

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.tm-intro > *', { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: root.current, start: 'top 75%', once: true } });
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        const opts = { ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } };
        gsap.fromTo('.tm-col-a', { y: 70 }, { y: -90, ...opts });
        gsap.fromTo('.tm-col-b', { y: -50 }, { y: 70, ...opts });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="patient-voices" ref={root} aria-labelledby="tm-title"
      className="relative overflow-x-clip px-12 py-28 max-lg:px-8 max-lg:py-20 max-sm:px-4 max-sm:py-14"
    >
      <div className="mx-auto grid max-w-[1180px] items-start gap-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <div className="tm-intro lg:sticky lg:top-28">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[.16em] text-accent">Patient feedback</p>
          <h2 id="tm-title" className="mb-8 font-display text-[clamp(36px,4.8vw,70px)] font-normal leading-[1.02] tracking-[-.02em] text-p9">
            What our patients <em className="text-accent">say</em>
          </h2>

          <div className="mb-8 flex items-center gap-5">
            <span aria-hidden="true" className="font-display text-[clamp(64px,7vw,100px)] leading-[.9] tabular-nums text-p9">5.0</span>
            <div>
              <div aria-hidden="true" className="text-[22px] tracking-[3px] text-[#f2b134]">★★★★★</div>
              <p className="m-0 mt-1.5 text-[15px] text-p7"><span className="sr-only">Rated 5.0 out of 5. </span>{N} reviews on Justdial</p>
            </div>
          </div>

          <ul className="m-0 mb-8 flex list-none flex-wrap gap-2 p-0" aria-label="What patients appreciate">
            {PATIENT_TAGS.map((t, i) => (
              <li key={t} className="rounded-full px-3.5 py-1.5 text-[14px] text-p9" style={{ background: `${TINTS[i % TINTS.length]}66` }}>{t}</li>
            ))}
          </ul>

          <a
            href={REVIEWS_URL} target="_blank" rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-p9 px-6 py-3 text-[15px] font-semibold text-p1 no-underline transition-colors duration-200 hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Read all reviews on Justdial <span aria-hidden="true">→</span>
          </a>
        </div>

        {N > 0 && (
          <div ref={strip} onScroll={onStrip} role="region" aria-roledescription="carousel" aria-label="Patient reviews" tabIndex={0}
               className="flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-lg:-mx-8 max-sm:-mx-4 max-lg:px-[calc((100vw-min(84vw,560px))/2)] max-lg:scroll-px-[calc((100vw-min(84vw,560px))/2)] lg:grid lg:grid-cols-2 lg:gap-5 lg:overflow-visible lg:pb-0">
            {/* on desktop each column is its own list (they drift); on phones / tablets they are flattened into one row */}
            {cols.map((col, ci) => (
              <ul key={ci} className={`m-0 flex list-none gap-4 p-0 max-lg:contents lg:flex-col lg:gap-5 ${ci === 0 ? 'tm-col-a' : 'tm-col-b lg:mt-16'}`}>
                {col.map(([r, i]) => <Card key={`${i}-${r.name}`} r={r} i={i} />)}
              </ul>
            ))}
          </div>
        )}

        {/* phones / tablets: counter, arrows and a swipe hint (the desktop wall needs none) */}
        {N > 1 && (
          <div className="lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-[13.5px] tabular-nums text-p7" aria-live="polite">{view.at} of {N}</p>
              <div className="flex gap-2">
                {[['Previous review', -1, 'M15 5l-7 7 7 7', view.canPrev], ['Next review', 1, 'M9 5l7 7-7 7', view.canNext]].map(([l, d, path, can]) => (
                  <button
                    key={l} type="button" aria-label={l} aria-disabled={!can || undefined} onClick={() => can && goStrip(d)}
                    className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-p9/15 bg-white text-p9 shadow-[0_8px_20px_-12px_rgba(33,37,41,.5)] transition-[opacity,background,color] duration-200 active:bg-p9 active:text-white ${can ? '' : 'opacity-35'}`}
                  >
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
                  </button>
                ))}
              </div>
            </div>
            {!swiped && (
              <p aria-hidden="true" className="mt-2 flex items-center justify-center gap-1.5 text-[13px] font-medium text-accent">
                Swipe to read more
                <svg className="animate-pulse" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}