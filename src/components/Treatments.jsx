import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { BENTO_LAYOUTS, TREATMENTS, TREATMENT_CATEGORIES } from '../data/content';
import { useInView } from '../hooks/useInView';
import { canHover, prefersReducedMotion } from '../lib/utils';

const CYCLE = 6;   // seconds each category stays on screen before the section moves on by itself

/* Desktop / tablet sizes. Written with min-width variants so they never apply on phones,
   where the compact bento below takes over. */
const SIZE_CLASS = {
  xl: 'min-[640px]:col-span-2 min-[1100px]:row-span-2',
  wide: 'min-[640px]:col-span-2',
  '': '',
};

/* Phone bento: always 2 columns, every tile of the category visible at once (no sideways swiping).
     4 tiles → big tile on the left spanning 2 rows, two small ones beside it, one wide strip underneath
     3 tiles → big tile on the left spanning 2 rows, two small ones stacked beside it
     2 tiles → two full-width strips
   The strings are written out in full so Tailwind can see them. */
const MOBILE_SPAN = {
  4: ['max-sm:row-span-2', '', '', 'max-sm:col-span-2'],
  3: ['max-sm:row-span-2', '', ''],
  2: ['max-sm:col-span-2', 'max-sm:col-span-2'],
};
const MOBILE_ROWS = { 4: 'max-sm:grid-rows-3', 3: 'max-sm:grid-rows-2', 2: 'max-sm:grid-rows-2' };

function Tile({ t, size, mobileSpan, mobileBig, index, live, onOpen }) {
  const big = size === 'xl' || size === 'wide';
  const reveal = big ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 group-focus-visible:max-h-24 group-focus-visible:opacity-100';
  return (
    <button
      type="button" onClick={(e) => onOpen(t, e.currentTarget)} aria-haspopup="true"
      style={{ animationDelay: `${index * 70}ms` }}
      className={`bento-tile group relative isolate flex min-w-0 flex-col justify-end overflow-hidden cursor-pointer rounded-3xl border-0 bg-p7 p-[22px] text-left font-body text-white no-underline
                  focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-accent-light
                  max-sm:rounded-2xl max-sm:p-2.5
                  ${SIZE_CLASS[size]} ${mobileSpan} ${live ? 'animate-bento-in motion-reduce:animate-none' : 'opacity-0'}`}
    >
      <img
        src={`/assets/treatments/${t.img}`} alt="" loading="lazy" decoding="async"
        className="absolute inset-0 -z-[2] h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.07]"
      />
      <span className="glass-chip absolute left-[18px] top-[18px] rounded-full px-[13px] py-1.5 text-[11px] font-semibold uppercase tracking-[.08em] text-white max-sm:left-2 max-sm:top-2 max-sm:px-2 max-sm:py-[3px] max-sm:text-[9px] max-sm:tracking-[.06em]">
        {t.chip}
      </span>
      <span
        aria-hidden="true"
        className="glass-chip absolute right-3.5 top-3.5 grid h-10 w-10 place-items-center rounded-full text-lg leading-none text-white
                   [transition:transform_.35s_cubic-bezier(.34,1.2,.64,1),background_.3s_ease,color_.3s_ease]
                   max-sm:right-2 max-sm:top-2 max-sm:h-6 max-sm:w-6 max-sm:text-xs
                   group-hover:-rotate-45 group-hover:bg-white/90 group-hover:text-p9 group-focus-visible:-rotate-45 group-focus-visible:bg-white/90 group-focus-visible:text-p9"
      >
        &rarr;
      </span>
      <div className="relative">
        <span
          className={`block font-display font-normal text-white max-sm:leading-[1.15]
                      ${size === 'xl' ? 'text-[clamp(28px,2.8vw,40px)] leading-[1.1]' : 'text-[clamp(18px,1.6vw,22px)] leading-[1.2]'}
                      ${mobileBig ? 'max-sm:text-[clamp(17px,5vw,21px)]' : 'max-sm:text-[clamp(13px,3.7vw,15px)]'}`}
        >
          {t.title}
        </span>
        {/* descriptions are hidden on phones to keep the tiles compact */}
        {t.sub && (
          <span className={`mt-2 block overflow-hidden text-[13px] leading-normal text-white/[.84] [transition:max-height_.45s_ease,opacity_.35s_ease] max-sm:hidden [@media(hover:none)]:max-h-24 [@media(hover:none)]:opacity-100 ${reveal}`}>
            {t.sub}
          </span>
        )}
      </div>
    </button>
  );
}

const itemsOf = (t) => t.items || (t.sub ? t.sub.split(', ') : []);

/* The condition chips used by both the hover card and the "All conditions" panel */
function ConditionChips({ items }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {items.map((x) => (
        <li key={x} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[12.5px] leading-snug text-white/90">{x}</li>
      ))}
    </ul>
  );
}

export default function Treatments() {
  const [cat, setCat] = useState(TREATMENT_CATEGORIES[0].id);
  const [live, setLive] = useState(false);           // true once the section has scrolled into view
  /* auto-advance only on pointer devices: on touch there is no hover to pause it, so it would
     switch category while the visitor is swiping or reading the tiles */
  const [auto, setAuto] = useState(() => canHover());
  const [paused, setPaused] = useState(false);       // hovering / focusing the cards or the grid
  const [edge, setEdge] = useState({ l: false, r: false });   // is there more category cards off-screen to the left / right?
  const [reduced] = useState(() => prefersReducedMotion());
  const [sectionRef, inView] = useInView({ threshold: 0.3 });
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const hintRef = useRef(null);
  const tabRefs = useRef([]);
  const barRefs = useRef([]);
  const tweenRef = useRef(null);
  const holdRef = useRef(false);
  const wrapRefs = useRef([]);                       // one wrapper per category card (card + hover panel)
  const toggleRef = useRef(null);                    // the "All conditions" button
  const closeRef = useRef(null);                     // close button inside the conditions panel
  const tipTimer = useRef(null);
  const [tip, setTip] = useState(null);              // id of the category whose hover panel is open (mouse / keyboard focus)
  const [detail, setDetail] = useState(null);       // the tile whose conditions are open in the panel (null = none)
  const detailOpener = useRef(null);                 // the tile button to give focus back to
  const detailClose = useRef(null);
  const [listOpen, setListOpen] = useState(false);   // the full "All conditions" panel over the tiles (touch + keyboard + screen readers)

  const len = TREATMENT_CATEGORIES.length;
  const idx = TREATMENT_CATEGORIES.findIndex((c) => c.id === cat);
  const nextCat = TREATMENT_CATEGORIES[(idx + 1) % len];
  const cycling = auto && live && !reduced;
  const activeCat = TREATMENT_CATEGORIES[idx];
  const hasList = Boolean(activeCat.conditions?.length);

  useEffect(() => { if (inView) setLive(true); }, [inView]);
  useEffect(() => { if (panelRef.current) panelRef.current.scrollLeft = 0; }, [cat]);
  useEffect(() => { setListOpen(false); setDetail(null); setTip(null); }, [cat]);

  /* hover panel: a short delay on enter so sweeping the mouse across the row doesn't flicker */
  const showTip = (id, delay = 0) => { clearTimeout(tipTimer.current); tipTimer.current = setTimeout(() => setTip(id), delay); };
  const hideTip = (id) => { clearTimeout(tipTimer.current); setTip((t) => (t === id ? null : t)); };
  useEffect(() => () => clearTimeout(tipTimer.current), []);

  /* full panel: focus moves in when it opens, Escape closes it and returns focus to the button */
  useEffect(() => {
    if (!listOpen) return;
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') { setListOpen(false); toggleRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [listOpen]);

  /* tile panel: focus moves in when it opens, Escape closes it and returns focus to the tile */
  const closeDetail = () => { setDetail(null); detailOpener.current?.focus(); };
  const openDetail = (tile, el) => { detailOpener.current = el; setListOpen(false); setDetail(tile); };
  useEffect(() => {
    if (!detail) return;
    detailClose.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') { setDetail(null); detailOpener.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [detail]);

  /* ── scroll cues for the category row ── */
  const updateEdge = () => {
    const el = listRef.current;
    if (!el) return;
    const l = el.scrollLeft > 4;
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setEdge((e) => (e.l === l && e.r === r ? e : { l, r }));
  };
  useEffect(() => {
    updateEdge();
    window.addEventListener('resize', updateEdge);
    return () => window.removeEventListener('resize', updateEdge);
  }, []);

  /* the arrow on the right edge gently nudges sideways while there's more to scroll to */
  useEffect(() => {
    const el = hintRef.current;
    if (!el || reduced) return;
    const tw = gsap.to(el, { x: 5, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    return () => { tw.kill(); gsap.set(el, { clearProps: 'x' }); };
  }, [edge.r, reduced]);

  /* one card-width step (arrow buttons) */
  const step = (dir) => {
    const el = listRef.current, card = tabRefs.current[0];
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 10), behavior: 'smooth' });
  };

  /* the row fades out on whichever side still has hidden cards */
  const fadeMask = edge.l || edge.r
    ? `linear-gradient(to right, transparent 0, #000 ${edge.l ? 36 : 0}px, #000 calc(100% - ${edge.r ? 56 : 0}px), transparent 100%)`
    : undefined;

  /* keep the active card in view when the card row scrolls sideways (phones).
     Aligned to the start (16px = the row's side padding) so it matches the scroll-snap. */
  useEffect(() => {
    const list = listRef.current, el = wrapRefs.current[idx];
    if (!list || !el || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: Math.max(0, el.offsetLeft - 16), behavior: 'smooth' });
  }, [idx]);

  /* the progress bar on the active card is the auto-advance timer: when it fills, move to the next category.
     It holds while the cards/grid are hovered or while the section is off-screen. */
  useEffect(() => {
    holdRef.current = paused || listOpen || !!detail || !inView;
    tweenRef.current?.paused(holdRef.current);
  }, [paused, listOpen, detail, inView]);

  useEffect(() => {
    const bars = barRefs.current;
    gsap.set(bars, { scaleX: (i) => (i === idx && !cycling ? 1 : 0), transformOrigin: 'left center' });
    if (!cycling) return;
    const tw = gsap.to(bars[idx], {
      scaleX: 1, duration: CYCLE, ease: 'none',
      onComplete: () => setCat(TREATMENT_CATEGORIES[(idx + 1) % len].id),
    });
    tw.paused(holdRef.current);
    tweenRef.current = tw;
    return () => tw.kill();
  }, [idx, cycling, len]);

  const choose = (id) => { setAuto(false); setCat(id); };

  const visible = TREATMENTS.filter((t) => t.cat === cat);
  const recipe = BENTO_LAYOUTS[visible.length] || [];
  const mobileSpans = MOBILE_SPAN[visible.length] || [];

  const onTabKey = (e, i) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + len) % len;
    choose(TREATMENT_CATEGORIES[j].id);
    tabRefs.current[j]?.focus();
  };

  return (
    <section
      id="treatments"
      ref={sectionRef}
      className="flex h-[100svh] min-h-[680px] scroll-mt-0 flex-col bg-transparent px-12 pb-7 pt-[88px] text-center
                 max-lg:px-8
                 max-sm:h-auto max-sm:min-h-0 max-sm:px-0 max-sm:pb-[22px] max-sm:pt-[84px]
                 max-[375px]:pb-5 max-[375px]:pt-20"
    >
      <p className="eyebrow eyebrow-light !mb-2">Treatments</p>
      <h2 className="mb-5 font-display text-[clamp(26px,3.2vw,40px)] font-normal text-p9 max-sm:mb-3 max-sm:px-4 max-sm:text-[clamp(18px,5.2vw,22px)] max-sm:leading-tight">
        Gentle solutions for the body's toughest problems
      </h2>

      {/* category cards: photo, name, count — the active one carries the auto-advance progress bar.
          On phones the row scrolls sideways, so it fades out at the edge that still has cards behind it
          and shows a small arrow button (the right one nudges) — otherwise nobody knows it moves. */}
      <div className="relative mx-auto mb-5 w-full max-w-[1120px] max-sm:mb-3">
        <div
          ref={listRef}
          role="tablist" aria-label="Treatment categories"
          onScroll={updateEdge}
          onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
          style={fadeMask ? { WebkitMaskImage: fadeMask, maskImage: fadeMask } : undefined}
          className="relative flex w-full gap-3
                     max-sm:snap-x max-sm:scroll-px-4 max-sm:gap-2.5 max-sm:overflow-x-auto max-sm:px-4 max-sm:py-1 max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden"
        >
          {TREATMENT_CATEGORIES.map((c, i) => {
            const on = c.id === cat;
            const count = TREATMENTS.filter((t) => t.cat === c.id).length;
            const cover = TREATMENTS.find((t) => t.cat === c.id)?.img;
            const conds = c.conditions || [];
            const showing = tip === c.id && conds.length > 0;
            return (
              <div
                key={c.id} role="presentation"
                ref={(el) => (wrapRefs.current[i] = el)}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') showTip(c.id, 120); }}
                onPointerLeave={(e) => { if (e.pointerType === 'mouse') hideTip(c.id); }}
                onFocus={(e) => { if (e.target.matches?.(':focus-visible')) showTip(c.id); }}
                onBlur={() => hideTip(c.id)}
                onKeyDown={(e) => { if (e.key === 'Escape') hideTip(c.id); }}
                className="relative min-w-0 flex-1 max-sm:flex-[0_0_62%] max-sm:snap-start"
              >
              <button
                type="button" role="tab" id={`tab-${c.id}`}
                ref={(el) => (tabRefs.current[i] = el)}
                aria-selected={on} aria-controls="bentoPanel" tabIndex={on ? 0 : -1}
                onClick={() => choose(c.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={`group/card relative isolate h-[92px] w-full cursor-pointer overflow-hidden rounded-2xl border-0 bg-p7 p-0 text-left font-body
                            [transition:transform_.35s_cubic-bezier(.34,1.2,.64,1),box-shadow_.3s_ease] motion-reduce:transition-none
                            focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent
                            max-sm:h-[84px]
                            ${on ? '-translate-y-0.5 shadow-[0_0_0_2px_#dff0e6,0_18px_30px_-16px_rgba(20,33,26,.7)]' : 'shadow-[0_10px_20px_-14px_rgba(20,33,26,.5)] hover:-translate-y-0.5'}`}
              >
                {cover && (
                  <img
                    src={`/assets/treatments/${cover}`} alt="" loading="lazy" decoding="async"
                    className={`absolute inset-0 -z-[2] h-full w-full object-cover [transition:transform_.8s_ease,filter_.4s_ease] motion-reduce:transition-none
                                ${on ? 'scale-110' : 'saturate-[.7] group-hover/card:scale-105 group-hover/card:saturate-100'}`}
                  />
                )}
                <span aria-hidden="true" className={`absolute inset-0 -z-[1] bg-gradient-to-t from-p9/90 via-p9/45 to-p9/10 [transition:opacity_.3s] ${on ? 'opacity-100' : 'opacity-90'}`} />
                <span className="glass-chip absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">{conds.length || count}</span>
                <span className={`absolute inset-x-3.5 bottom-3.5 font-display text-[clamp(14px,1.25vw,17px)] leading-[1.15] max-sm:text-[15px] max-[375px]:text-sm ${on ? 'text-white' : 'text-white/90'}`}>
                  {c.label}
                </span>
                <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-[3px] bg-white/25 [transition:opacity_.3s] ${on ? 'opacity-100' : 'opacity-0'}`}>
                  <span ref={(el) => (barRefs.current[i] = el)} className="block h-full bg-accent-light" />
                </span>
              </button>

              {/* hover / keyboard-focus panel (desktop & tablet with a mouse). Hidden from assistive tech on purpose:
                  the same list is in the "All conditions" panel below, which everyone can reach. */}
              {conds.length > 0 && (
                <div
                  aria-hidden="true"
                  className={`absolute top-full z-30 w-[300px] pt-2 max-sm:hidden ${i >= len / 2 ? 'right-0' : 'left-0'}
                              [transition:opacity_.18s_ease,transform_.18s_ease,visibility_.18s] motion-reduce:transition-none
                              ${showing ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'}`}
                >
                  <div className="rounded-2xl bg-[radial-gradient(120%_90%_at_50%_0%,#254033_0%,#14211a_70%)] p-4 text-left shadow-[0_26px_50px_-24px_rgba(10,20,14,.8)]">
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[.1em] text-accent-light">{c.label}</p>
                    <ConditionChips items={conds} />
                    <p className="mt-3 text-[12px] leading-snug text-white/70">…and more. Ask us about any health concern.</p>
                  </div>
                </div>
              )}
              </div>
            );
          })}
        </div>

        {/* scroll arrows — phones only, shown only while there is more to reveal on that side
            (aria-hidden: the tabs themselves are reachable with the arrow keys) */}
        {edge.l && (
          <button
            type="button" aria-hidden="true" tabIndex={-1} onClick={() => step(-1)}
            className="absolute inset-y-0 left-1.5 my-auto grid h-9 w-9 place-items-center rounded-full border border-line bg-white/90 text-p9 shadow-[0_8px_20px_-8px_rgba(33,37,41,.55)] sm:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        )}
        {edge.r && (
          <button
            ref={hintRef}
            type="button" aria-hidden="true" tabIndex={-1} onClick={() => step(1)}
            className="absolute inset-y-0 right-1.5 my-auto grid h-9 w-9 place-items-center rounded-full border border-line bg-white/90 text-p9 shadow-[0_8px_20px_-8px_rgba(33,37,41,.55)] sm:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>

      {/* key={cat} remounts the tiles so the entrance animation replays on every tab change.
          Phones: a compact 2-column bento at a fixed height — every tile of the category is visible at once. */}
      <div
        key={cat}
        id="bentoPanel" role="tabpanel" aria-labelledby={`tab-${cat}`} ref={panelRef}
        onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}
        className={`relative mx-auto mb-[18px] grid min-h-0 w-full max-w-[1120px] flex-1 auto-rows-[minmax(0,1fr)] grid-cols-4 gap-4 text-left
                    max-lg:grid-cols-2 max-lg:gap-3.5
                    max-sm:mb-3.5 max-sm:h-[clamp(380px,60svh,520px)] max-sm:flex-none max-sm:gap-2 max-sm:px-4
                    ${MOBILE_ROWS[visible.length] || ''}`}
      >
        {listOpen && hasList && !detail && (
          <div
            id="allConditions" role="region" aria-label={`All conditions: ${activeCat.label}`}
            className="absolute inset-0 z-20 flex flex-col overflow-hidden rounded-3xl bg-[radial-gradient(120%_90%_at_50%_0%,#254033_0%,#14211a_70%)] p-7 max-sm:rounded-2xl max-sm:p-4"
          >
            <div className="mb-4 flex flex-none items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.1em] text-accent-light">All conditions we treat</p>
                <h3 className="font-display text-[clamp(20px,2.4vw,30px)] font-normal leading-[1.15] text-white">{activeCat.label}</h3>
              </div>
              <button
                ref={closeRef} type="button" onClick={() => { setListOpen(false); toggleRef.current?.focus(); }} aria-label="Close the list of conditions"
                className="grid h-9 w-9 flex-none cursor-pointer place-items-center rounded-full border border-white/25 bg-white/10 text-white transition-colors duration-200 hover:bg-white hover:text-p9
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <ConditionChips items={activeCat.conditions} />
            </div>
            <p className="mt-4 flex-none text-[13px] leading-snug text-white/75">
              …and more. Don’t see your concern? Ask us at your consultation.{' '}
              <a href="#booking" onClick={() => setListOpen(false)} className="font-medium text-accent-light underline underline-offset-2">Book now →</a>
            </p>
          </div>
        )}
        {detail && (
          <div
            role="region" aria-label={`Treatments: ${detail.title}`}
            className="absolute inset-0 z-20 flex flex-col overflow-hidden rounded-3xl bg-[radial-gradient(120%_90%_at_50%_0%,#254033_0%,#14211a_70%)] p-7 max-sm:rounded-2xl max-sm:p-4"
          >
            <div className="mb-4 flex flex-none items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.1em] text-accent-light">Treatments under</p>
                <h3 className="font-display text-[clamp(20px,2.4vw,30px)] font-normal leading-[1.15] text-white">{detail.title}</h3>
              </div>
              <button
                ref={detailClose} type="button" onClick={closeDetail} aria-label="Close"
                className="grid h-9 w-9 flex-none cursor-pointer place-items-center rounded-full border border-white/25 bg-white/10 text-white transition-colors duration-200 hover:bg-white hover:text-p9
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <ConditionChips items={itemsOf(detail)} />
              <p className="mt-4 text-[13px] leading-snug text-white/75">…and more. Ask us about any health concern.</p>
            </div>
            <a
              href="#booking" onClick={() => setDetail(null)}
              className="mt-4 inline-flex flex-none items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-p9 no-underline transition-colors duration-200 hover:bg-accent-light
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
            >
              Book a consultation →
            </a>
          </div>
        )}
        {visible.map((t, i) => {
          const span = mobileSpans[i] ?? '';
          return (
            <Tile
              key={t.title} t={t} size={recipe[i] ?? ''} index={i} live={live} onOpen={openDetail}
              mobileSpan={span}
              mobileBig={span.includes('row-span-2') || visible.length === 2}
            />
          );
        })}
      </div>

      <div className="flex flex-none flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 max-sm:gap-x-4">
        <button
          type="button" onClick={() => choose(nextCat.id)}
          className="cursor-pointer rounded-full border-[1.5px] border-p9/70 bg-white/70 px-5 py-2 font-body text-sm font-medium text-p9 transition-[background,color] duration-200 hover:bg-p9 hover:text-p1 max-sm:px-4 max-sm:text-[13px]"
        >
          Next<span className="max-[400px]:hidden">: {nextCat.label}</span> →
        </button>
        {hasList && (
          <button
            ref={toggleRef} type="button" onClick={() => { setDetail(null); setListOpen((o) => !o); }}
            aria-expanded={listOpen} aria-controls={listOpen ? 'allConditions' : undefined}
            className="cursor-pointer rounded-full border-[1.5px] border-p9 bg-p9 px-5 py-2 font-body text-sm font-medium text-p1 transition-colors duration-200 hover:bg-p8 max-sm:px-4 max-sm:text-[13px]"
          >
            {listOpen ? 'Hide conditions' : 'See all conditions'}
          </button>
        )}
        <a href="#booking" className="link-arrow-light">Book a consultation →</a>
      </div>
    </section>
  );
}