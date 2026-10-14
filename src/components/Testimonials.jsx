import { useCallback, useEffect, useRef, useState } from 'react';
import { PATIENT_TAGS, REVIEWS, REVIEWS_URL } from '../data/content';
import { prefersReducedMotion } from '../lib/utils';
import './Testimonials.css';

/* Patient feedback (Justdial): ONE horizontal strip, two reviews in view (one on phones).
   The arrows (or swipe / trackpad / ← → keys while the strip is focused) move it a full "page" at a time.
   Long reviews are cut to a few lines with a "Read more" toggle so every card stays a similar height.
   Reviews live in content.js → REVIEWS. Styling: Testimonials.css (plain CSS). */

const GAP = 20;      // px — must match `gap` on .tm-strip in Testimonials.css
const LONG = 230;    // reviews longer than this many characters get "Read more"
const N = REVIEWS.length;

function Chevron({ dir }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  );
}

function Review({ r, index }) {
  const long = r.text.length > LONG;
  const [open, setOpen] = useState(false);
  return (
    <li className="tm-slide" aria-roledescription="slide" aria-label={`${index + 1} of ${N}`}>
      <figure className="tm-card">
        <div className="tm-stars" role="img" aria-label="5 out of 5 stars">★★★★★</div>
        <blockquote className={`tm-quote${long && !open ? ' is-clamped' : ''}`}>“{r.text}”</blockquote>
        {long && (
          <button type="button" className="tm-more" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? 'Show less' : 'Read more'}
          </button>
        )}
        <figcaption className="tm-by">
          <strong>{r.name}</strong>
          <span>via Justdial</span>
        </figcaption>
      </figure>
    </li>
  );
}

export default function Testimonials() {
  const strip = useRef(null);
  const [view, setView] = useState({ first: 1, last: Math.min(2, N), perView: 2, canPrev: false, canNext: N > 2 });

  const measure = useCallback(() => {
    const el = strip.current;
    const slide = el?.firstElementChild;
    if (!slide) return;
    const step = slide.offsetWidth + GAP;
    const perView = Math.max(1, Math.round((el.clientWidth + GAP) / step));
    const first = Math.round(el.scrollLeft / step);
    setView({
      first: first + 1,
      last: Math.min(first + perView, N),
      perView,
      canPrev: el.scrollLeft > 4,
      canNext: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => { el.removeEventListener('scroll', measure); window.removeEventListener('resize', measure); };
  }, [measure]);

  const go = (dir) => {
    const el = strip.current;
    const slide = el?.firstElementChild;
    if (!slide) return;
    el.scrollBy({ left: dir * (slide.offsetWidth + GAP) * view.perView, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const onKey = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };

  return (
    <section className="tm" id="patient-voices" aria-labelledby="tm-title">
      <div className="tm-head">
        <p className="tm-eyebrow">Patient feedback</p>
        <h2 id="tm-title" className="tm-title">What our patients <em>say</em></h2>
      </div>

      <ul className="tm-tags" aria-label="What patients appreciate">
        {PATIENT_TAGS.map((t) => <li key={t}>{t}</li>)}
      </ul>

      {N > 0 && (
        <div className="tm-wrap">
          {/* controls: position readout on the left, arrows on the right */}
          <div className="tm-controls">
            <p className="tm-count" aria-live="polite">
              {view.first === view.last ? `${view.first}` : `${view.first}–${view.last}`} of {N}
            </p>
            <div className="tm-arrows">
              <button type="button" className="tm-arrow" aria-label="Previous reviews" disabled={!view.canPrev} onClick={() => go(-1)}><Chevron dir="left" /></button>
              <button type="button" className="tm-arrow" aria-label="Next reviews" disabled={!view.canNext} onClick={() => go(1)}><Chevron dir="right" /></button>
            </div>
          </div>

          <ul
            ref={strip} className="tm-strip" tabIndex={0} onKeyDown={onKey}
            role="region" aria-roledescription="carousel" aria-label="Patient reviews"
          >
            {REVIEWS.map((r, i) => <Review key={`${i}-${r.name}`} r={r} index={i} />)}
          </ul>
        </div>
      )}

      <a className="tm-link" href={REVIEWS_URL} target="_blank" rel="noopener">Read all reviews on Justdial →</a>
    </section>
  );
}