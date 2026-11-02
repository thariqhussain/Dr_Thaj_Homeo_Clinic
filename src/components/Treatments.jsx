import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { TREATMENTS, TREATMENT_CATEGORIES as CATS } from '../data/content';
import { prefersReducedMotion } from '../lib/utils';

/* Treatments — five departments, each with its own colour.
   Desktop: a rail of big department names on the left (number, name, how many treatments; the active one is lit in its colour with a
   sliding bar), the department's treatments on the right as photo cards (the first one large; the conditions each covers are chips
   that appear on the photo), then every condition in the department as a cloud of chips.
   Phones and tablets: the departments are a swipeable row of pills; the cards swipe too (a fingertip beats a hover).
   A complaint search jumps to the right department and marks the card and condition that match.
   The whole section eases in as it scrolls into view. */

const FIND = CATS.flatMap((c, ci) => (c.conditions || []).map((name) => ({ name, ci })));
const TOTAL = new Set(FIND.map((f) => f.name.toLowerCase())).size;
const TAB_LABEL = { metabolic: 'Metabolic', family: 'Women & children', skin: 'Skin & hair', pain: 'Pain & mind', systems: 'Body systems' };
const TABS = CATS.map((c) => ({ label: TAB_LABEL[c.id] || c.label }));
/* one colour per department (the same family as the colours in the doctor section's tornado) */
const TINT = { metabolic: '#9fd59a', family: '#f6a6c9', skin: '#ffb86b', pain: '#7fb7e6', systems: '#c3a6e8' };
const pad2 = (v) => String(v).padStart(2, '0');
const TREATMENTS_OF = Object.fromEntries(CATS.map((c) => [c.id, TREATMENTS.filter((t) => t.cat === c.id)]));

/* every department's photos are small (a few hundred KB in all), so once the first department is on screen they are fetched and decoded
   in the browser's idle time, nearest department first. Switching department then never waits on the network. */
const WARM = [];
function warmImages(from) {
  if (navigator.connection?.saveData) return () => {};
  const order = CATS.map((_, i) => i).filter((i) => i !== from).sort((a, b) => Math.abs(a - from) - Math.abs(b - from));
  const srcs = order.flatMap((i) => (TREATMENTS_OF[CATS[i].id] || []).map((t) => `/assets/treatments/${t.img}`));
  let n = 0;
  let handle = 0;
  const idle = 'requestIdleCallback' in window;
  const next = () => {
    if (n >= srcs.length) return;
    const im = new Image();
    im.decoding = 'async';
    im.src = srcs[n++];
    im.decode?.().catch(() => {});
    WARM.push(im);                                   // keep a reference so the decoded picture stays cached
    handle = idle ? window.requestIdleCallback(next, { timeout: 1500 }) : window.setTimeout(next, 120);
  };
  handle = idle ? window.requestIdleCallback(next, { timeout: 3000 }) : window.setTimeout(next, 600);
  return () => { if (idle) window.cancelIdleCallback(handle); else clearTimeout(handle); n = srcs.length; };
}

function useMedia(query) {
  const [on, setOn] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const f = () => setOn(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, [query]);
  return on;
}

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/* ── complaint search: type "thyroid", pick a result, land on its department with that condition marked ── */
function Finder({ onPick }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const matches = useMemo(
    () => (term ? FIND.filter((f) => f.name.toLowerCase().includes(term) || CATS[f.ci].label.toLowerCase().includes(term)).slice(0, 6) : []),
    [term]
  );
  return (
    <div className="relative">
      <label htmlFor="treatment-search" className="sr-only">Search your complaint</label>
      <input
        id="treatment-search" type="search" value={q} autoComplete="off" placeholder="Search your complaint"
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') setQ(''); }}
        className={`h-12 w-full rounded-md border border-p9/25 bg-white/70 px-4 font-body text-base text-p9 placeholder:text-p6 ${focusRing}`}
      />
      <p role="status" className="sr-only">{term ? `${matches.length} matching conditions` : ''}</p>
      {term && (
        <div data-ui className="absolute inset-x-0 top-full z-30 mt-2 rounded-md bg-white p-1 shadow-[0_20px_40px_-20px_rgba(33,37,41,.45)]">
          {matches.length ? (
            <ul className="m-0 list-none p-0">
              {matches.map((f) => (
                <li key={`${f.ci}-${f.name}`}>
                  <button
                    type="button" onClick={() => { onPick(f); setQ(''); }}
                    className={`flex w-full cursor-pointer flex-col items-start rounded border-0 bg-transparent px-3 py-2 text-left font-body text-base leading-snug text-p9 transition-colors duration-150 hover:bg-accent-light ${focusRing}`}
                  >
                    <span>{f.name}</span>
                    <span className="text-sm text-p7">{CATS[f.ci].label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 px-3 py-2 text-base text-p9">Not listed? Ask us about any health concern.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── one department: one photo, the whole condition list as plain text, one action ── */
function BookLink({ className = '' }) {
  return (
    <a
      href="#booking"
      className={`inline-flex items-center gap-2 rounded-md bg-p9 px-6 py-3 font-body text-sm font-medium text-p1 no-underline transition-colors duration-200 hover:bg-p8 ${focusRing} ${className}`}
    >
      Book a consultation <span aria-hidden="true">→</span>
    </a>
  );
}

/* ── which conditions in the department list belong to a photo (its `items`, or its `sub` split on commas) ── */
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
const ALIAS = { hypercholesterolemia: 'high cholesterol', hypertriglyceridemia: 'high triglycerides', hyperuricemia: 'high uric acid' };
const condsOf = (t) => t.items || (t.sub || '').split(',').map((x) => x.trim()).filter(Boolean);
function matchConds(t, all) {
  const out = new Set();
  if (!t) return out;
  const byNorm = new Map(all.map((c) => [norm(c), c]));
  condsOf(t).forEach((raw) => {
    const n = norm(ALIAS[norm(raw)] || raw);
    if (byNorm.has(n)) { out.add(byNorm.get(n)); return; }
    byNorm.forEach((c, k) => { if (n.includes(k)) out.add(c); });     // "Fertility counselling services" → "Fertility counselling"
  });
  return out;
}


/* ── phones / tablets: the department tabs as a row you swipe; the chosen one is lit in its colour and kept in view ── */
function ScrollTabs({ active, onChange }) {
  const box = useRef(null);
  const refs = useRef([]);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const c = box.current;
    const el = refs.current[active];
    if (!c || !el) return;
    c.scrollTo({ left: el.offsetLeft - (c.clientWidth - el.offsetWidth) / 2, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [active]);

  const onKey = (e) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (active + d + TABS.length) % TABS.length;
    onChange(next);
    refs.current[next]?.focus();
  };

  return (
    <div
      ref={box} role="tablist" aria-label="Treatment departments" onKeyDown={onKey}
      className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:-mx-8 md:px-8"
    >
      {TABS.map((t, i) => (
        <button
          key={t.label} ref={(el) => (refs.current[i] = el)} type="button" role="tab" id={`tt-${CATS[i].id}`}
          aria-selected={i === active} aria-controls="treatments-panel" tabIndex={i === active ? 0 : -1}
          onClick={() => onChange(i)}
          className={`min-h-11 flex-none cursor-pointer snap-center whitespace-nowrap rounded-full border-0 px-5 font-body text-[15px] font-medium text-p9 transition-[background,transform] duration-200 ${focusRing}
                      ${i === active ? 'scale-105 shadow-[0_8px_18px_-10px_rgba(33,37,41,.5)]' : 'bg-white/70'}`}
          style={i === active ? { background: TINT[CATS[i].id] } : undefined}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── desktop: the rail of departments ── */
function Rail({ active, onChange }) {
  const refs = useRef([]);
  const onKey = (e) => {
    const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (active + d + TABS.length) % TABS.length;
    onChange(next);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label="Treatment departments" aria-orientation="vertical" onKeyDown={onKey} className="relative flex flex-col">
      {/* the bar that slides to the active department */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 h-[84px] w-1 rounded-full [transition:transform_.5s_cubic-bezier(.22,.7,.2,1),background_.4s]"
        style={{ transform: `translateY(${active * 84}px)`, background: TINT[CATS[active].id] }}
      />
      {TABS.map((t, i) => {
        const on = i === active;
        return (
          <button
            key={t.label} ref={(el) => (refs.current[i] = el)} type="button" role="tab" id={`tt-${CATS[i].id}`}
            aria-selected={on} aria-controls="treatments-panel" tabIndex={on ? 0 : -1} onClick={() => onChange(i)}
            className={`group flex h-[84px] cursor-pointer items-center gap-4 border-0 bg-transparent pl-6 pr-2 text-left font-display text-[clamp(22px,2vw,30px)] font-normal leading-[1.1] transition-[opacity,transform] duration-300 ${focusRing}
                        ${on ? 'translate-x-1 text-p9' : 'text-p9/45 hover:text-p9/80'}`}
          >
            <span className="font-body text-[12px] font-semibold tabular-nums tracking-[.08em]" style={{ color: on ? '#2f5a3f' : undefined }}>{pad2(i + 1)}</span>
            <span className="flex-1">{t.label}</span>
            <span className="grid h-7 min-w-7 place-items-center rounded-full px-2 font-body text-[12px] font-semibold text-p9 transition-opacity duration-300" style={{ background: TINT[CATS[i].id], opacity: on ? 1 : 0.55 }}>
              {TREATMENTS_OF[CATS[i].id]?.length ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── one treatment: a photo card, the conditions it covers as chips on the photo. Lit when it holds the condition picked in the search. ── */
function Card({ t, cat, hit, big, wide }) {
  const lit = !!hit && matchConds(t, cat.conditions).has(hit);
  const tint = TINT[cat.id];
  return (
    <article
      className={`tr-card group relative isolate overflow-hidden rounded-[22px] bg-p9 text-white max-lg:w-[calc((100%-.75rem)/2)] max-lg:flex-none max-lg:snap-start max-lg:snap-always max-sm:w-[84%]
                  ${big ? 'lg:col-span-2 lg:row-span-2' : wide ? 'lg:col-span-2' : ''} ${lit ? 'ring-4 ring-offset-2 ring-offset-transparent' : ''}`}
      style={lit ? { '--tw-ring-color': tint } : undefined}
    >
      <img
        src={`/assets/treatments/${t.img}`} alt="" decoding="async" draggable="false"
        className="absolute inset-0 h-full w-full object-cover [@media(hover:hover)]:transition-transform [@media(hover:hover)]:duration-500 [@media(hover:hover)]:ease-out [@media(hover:hover)]:group-hover:scale-[1.05]"
      />
      <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,16,13,.05)_25%,rgba(10,16,13,.82)_100%)]" />
      <span aria-hidden="true" className="absolute left-0 top-0 h-1.5 w-full" style={{ background: tint }} />
      <div className={`relative flex h-full flex-col justify-end ${big ? 'min-h-[340px] p-7 max-lg:min-h-[400px] max-sm:min-h-[340px] lg:min-h-[520px]' : 'min-h-[300px] p-5 max-lg:min-h-[400px] max-lg:p-6 max-sm:min-h-[340px] max-sm:p-5 lg:min-h-[250px]'}`}>
        <h3 className={`m-0 mb-3 font-display font-normal leading-[1.1] ${big ? 'text-[clamp(26px,2.6vw,38px)]' : 'text-[clamp(22px,1.8vw,24px)] max-lg:text-[24px]'}`}>{t.title}</h3>
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {condsOf(t).slice(0, big ? 8 : 4).map((c, ci) => (
            <li key={c} className={`rounded-full px-2.5 py-1 text-[12.5px] leading-none max-lg:px-3 max-lg:py-1.5 max-lg:text-[13.5px] ${ci > 2 ? 'max-sm:hidden' : ''}`} style={{ background: 'rgba(255,255,255,.18)' }}>{c}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function Treatments() {
  const root = useRef(null);
  const strip = useRef(null);                                // the swipeable row of treatment cards (phones / tablets)
  const [nav, setNav] = useState({ prev: false, next: false, at: 1, of: 1 });
  const [idx, setIdx] = useState(0);
  const [hit, setHit] = useState(null);                       // { ci, name } of a condition chosen in the search
  const md = useMedia('(min-width: 768px)');
  const lg = useMedia('(min-width: 1024px)');
  const cat = CATS[idx];
  const cards = TREATMENTS_OF[cat.id] || [];
  const conds = cat.conditions || [];
  const tint = TINT[cat.id];

  const select = (i) => { setIdx(i); setHit((h) => (h && h.ci === i ? h : null)); };
  const pick = (f) => { setIdx(f.ci); setHit(f); };

  /* arrows + 'n of N' for the swipeable row of cards */
  const measure = useCallback(() => {
    const el = strip.current;
    if (!el || !el.children.length) return;
    const step = el.children.length > 1 ? el.children[1].offsetLeft - el.children[0].offsetLeft : el.clientWidth;
    setNav({
      prev: el.scrollLeft > 4, next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      at: Math.min(el.children.length, Math.round(el.scrollLeft / step) + 1), of: el.children.length,
    });
  }, []);
  useEffect(() => {
    const el = strip.current;
    if (!el) return undefined;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => { el.removeEventListener('scroll', measure); window.removeEventListener('resize', measure); };
  }, [measure, idx, lg]);
  useEffect(() => { strip.current?.scrollTo({ left: 0 }); }, [idx]);
  const go = (dir) => {
    const el = strip.current;
    if (!el || !el.children.length) return;
    const step = el.children.length > 1 ? el.children[1].offsetLeft - el.children[0].offsetLeft : el.clientWidth;
    const per = Math.max(1, Math.round(el.clientWidth / step));
    el.scrollBy({ left: dir * step * per, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  /* the header and the department area ease in as the section arrives */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.tr-head > *', { y: 20, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: root.current, start: 'top 75%', once: true } });
      gsap.from('.tr-rail, .tr-tabs', { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out', scrollTrigger: { trigger: '.tr-body', start: 'top 85%', once: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  /* the other departments' photos load quietly in the background once this one is up */
  useEffect(() => warmImages(0), []);

  /* every time the department changes, its cards fade up (opacity + a short rise only). Not on first show: the section's own reveal does that. */
  const firstDeal = useRef(true);
  useEffect(() => {
    if (firstDeal.current) { firstDeal.current = false; return undefined; }
    if (prefersReducedMotion() || !root.current) return undefined;
    const t = gsap.fromTo(root.current.querySelectorAll('.tr-card'), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power2.out', clearProps: 'transform,opacity' });
    return () => t.kill();
  }, [idx]);

  return (
    <section
      id="treatments" ref={root}
      className="relative scroll-mt-0 overflow-x-clip px-12 pb-24 pt-[96px] max-lg:px-8 max-sm:px-4 max-sm:pb-14 max-sm:pt-[84px]"
    >
      {/* a wash of the department's colour behind everything, changing with the tab */}
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[520px] w-[min(1100px,90vw)] -translate-x-1/2 max-lg:h-[360px]" style={{ background: `radial-gradient(closest-side, ${tint}59, ${tint}00)` }} />

      <div className="mx-auto max-w-[1180px]">
        <div className="tr-head mb-12 grid items-end gap-6 max-sm:mb-8 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-8">
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[.16em] text-accent">Treatments</p>
            <h2 className="m-0 font-display text-[clamp(32px,4.6vw,68px)] font-normal leading-[1.04] tracking-[-.02em] text-p9">
              Gentle solutions for the body’s <em className="text-accent">toughest</em> problems
            </h2>
            <p className="mt-5 max-w-[52ch] font-body text-[17px] leading-[1.6] text-p8">
              {TOTAL} of the conditions we treat, by department. Don’t see yours? Ask us.
            </p>
          </div>
          <div className="lg:col-span-4"><Finder onPick={pick} /></div>
        </div>

        <div className="tr-body grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14">
          {/* the departments */}
          {lg ? (
            <div className="tr-rail lg:sticky lg:top-28 lg:self-start"><Rail active={idx} onChange={select} /></div>
          ) : (
            <div className="tr-tabs min-w-0"><ScrollTabs active={idx} onChange={select} /></div>
          )}

          <div className="min-w-0">
            {/* phones / tablets: how many treatments, and the arrows that move the row */}
            {!lg && cards.length > 1 && (
              <div className="mb-3 flex items-center justify-between">
                <p className="m-0 text-[13.5px] text-p7" aria-live="polite">{nav.at} of {nav.of} · {cat.label}</p>
                <div className="flex gap-2">
                  {[['Previous treatments', -1, 'M15 5l-7 7 7 7', nav.prev], ['Next treatments', 1, 'M9 5l7 7-7 7', nav.next]].map(([l, d, path, can]) => (
                    <button key={l} type="button" aria-label={l} aria-disabled={!can || undefined} onClick={() => go(d)}
                            className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-p9/15 bg-white text-p9 shadow-[0_8px_20px_-12px_rgba(33,37,41,.5)] transition-[opacity,background,color] hover:bg-p9 hover:text-white ${focusRing} ${can ? '' : 'opacity-35'}`}>
                      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* the treatments in that department */}
            <div
              ref={strip} key={`panel-${cat.id}`} id="treatments-panel" role={lg ? 'region' : 'tabpanel'} aria-label={`${cat.label} treatments`} aria-labelledby={lg ? undefined : `tt-${cat.id}`}
              tabIndex={lg ? undefined : 0}
              className="flex snap-x scroll-px-8 gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                         max-lg:-mx-8 max-lg:px-8 max-sm:-mx-4 max-sm:scroll-px-4 max-sm:px-4
                         lg:grid lg:auto-rows-[minmax(250px,auto)] lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:pb-0"
            >
              {cards.map((t, i) => (
                <Card
                  key={t.title} t={t} cat={cat} hit={hit?.name}
                  big={lg && cards.length === 3 && i === 0}                       /* 3 treatments: one large, two beside it */
                  wide={lg && cards.length === 4 && (i === 0 || i === 3)}           /* 4: two wide ones on a diagonal */
                />
              ))}
            </div>

            {/* every condition in the department, as a cloud of chips */}
            <details key={`list-${cat.id}`} open={md || !!hit} className="group mt-10 max-sm:mt-8">
              <summary className={`flex min-h-11 cursor-pointer list-none items-center gap-3 font-display text-[clamp(19px,1.8vw,26px)] font-normal leading-tight text-p9 ${focusRing} [&::-webkit-details-marker]:hidden`}>
                <span aria-hidden="true" className="h-3 w-3 flex-none rounded-full" style={{ background: tint }} />
                <span className="min-w-0">All {conds.length} conditions in {cat.label}</span>
                <span aria-hidden="true" className="font-body text-base text-p7 transition-transform duration-200 group-open:rotate-180">⌄</span>
              </summary>
              <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0 font-body">
                {conds.map((x) => {
                  const on = hit?.name === x;
                  return (
                    <li
                      key={x}
                      className={`rounded-full border px-3.5 py-1.5 text-[14.5px] leading-snug transition-colors duration-200 ${on ? 'border-transparent text-p9' : 'border-p9/15 bg-white/60 text-p9'}`}
                      style={on ? { background: tint } : undefined}
                    >
                      {x}
                    </li>
                  );
                })}
              </ul>
            </details>

            <BookLink className="mt-10 max-sm:mt-8 max-sm:w-full max-sm:justify-center" />
          </div>
        </div>
      </div>
    </section>
  );
}