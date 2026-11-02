import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { ABOUT_STORY } from '../data/content';
import { isLowPower, prefersReducedMotion } from '../lib/utils';
import FlexCarousel from './FlexCarousel';

/* About — full-width scrollytelling Flex Carousel, responsive for phones, tablets and desktops.
   The <section> is a tall scroll track. Inside it one `sticky` panel, exactly one viewport high, holds the heading, the
   carousel and two cards. The carousel runs edge to edge on the page itself.

   FLOW: scroll progress is turned into a continuous position (photo 0 … photo N-1) and handed straight to the carousel
   (controlRef.scrub), so the row moves exactly as far as you scroll, with a little spring for smoothness.

   CARDS: the TOP card is the chapter heading, the BOTTOM card its description. A chapter can own several photos, so the
   cards change only when the centred photo belongs to a different chapter (8 photos / 4 chapters: every 2 photos).
   In content.js → ABOUT_STORY, group photos into a chapter in either of these ways:
     { title, text, caption, imgs: ['a.jpg', 'b.jpg'] }                       one entry, several photos
     two entries that share the same `title` (and `text`)                      consecutive entries with an equal title merge
   `cta: true` on a chapter adds the "Book appointment" button to its description card.

   PHONES (< 640px) get a plain horizontal strip instead (no pinning, no WebGL): one swipeable card per photo with its chapter's
   heading and text under the picture, a counter, dots, arrows and a "swipe" hint. Same story, same order, same Book button.

   DEVICES (see useLayout):
     phones  (< 640px)    the horizontal strip described above
     (the pinned layout, if it were used on a phone, would have: smaller photo row, tighter gap, compact cards)
     tablets (640–1023px) mid-size row; portrait and landscape tuned separately
     desktop (1024px+)    full size
   The pinned scroll story is replaced by a plain grid (one tile per chapter) when WebGL2 is missing, data-saver is on,
   the device is low-power (see isLowPower), or the screen is very short (landscape phones, under 520px high), where the cards can't fit.

   NOTE: no `overflow-hidden` on <section> — it would break `position: sticky`. */

ScrollTrigger.config({ ignoreMobileResize: true });   // the mobile URL bar showing / hiding must not re-measure the track

const DWELL = 18;   // svh the last photo stays put before the page moves on
const TABS = ['#c8553d', '#a9b98a', '#e3a847', '#7fb09a'];   // card tab colours; the bottom card uses the colour two along
const DEEP = '#2f5a3f';
const pad = (i) => String(i + 1).padStart(2, '0');

const STYLE = `
@keyframes as-card-in { from { opacity: 0; transform: translateY(var(--dy, 14px)); } to { opacity: 1; transform: translateY(0); } }
`;

/* ABOUT_STORY → chapters (text) + photos (each knows its chapter) */
function buildStory(story) {
  const chapters = [];
  const photos = [];
  story.forEach((s) => {
    let ci = chapters.length - 1;
    if (ci < 0 || chapters[ci].title !== s.title) {
      chapters.push({ title: s.title, text: s.text, cta: !!s.cta });
      ci += 1;
    } else if (s.cta) {
      chapters[ci].cta = true;
    }
    [].concat(s.imgs ?? s.img ?? []).forEach((src) => photos.push({ src, alt: s.caption || s.title, title: s.title, chapter: ci }));
  });
  return { chapters, photos };
}

const hasWebGL2 = () => {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
};

/* low-power devices (data-saver, 4 GB or less, 4 cores or fewer) skip the WebGL story */
const lowPower = isLowPower;

/* photo row height (fraction of the stage), gap between photos (px) and scroll per photo (svh), by device.
   `step` is how far you scroll for one photo: smaller = the carousel moves faster for the same scroll */
function readLayout() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w < 640) return { cardHeight: 0.46, gap: 10, step: 28, phone: true };
  if (w < 1024) return { cardHeight: h > w ? 0.44 : 0.46, gap: 12, step: 26, phone: false };
  return { cardHeight: h < 700 ? 0.42 : 0.48, gap: 14, step: 24, phone: false };
}
function useLayout() {
  const [layout, setLayout] = useState(readLayout);
  useEffect(() => {
    const on = () => setLayout((prev) => {
      const next = readLayout();
      return prev.cardHeight === next.cardHeight && prev.gap === next.gap && prev.step === next.step ? prev : next;
    });
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on); };
  }, []);
  return layout;
}

function useMedia(query) {
  const [on, setOn] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setOn(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [query]);
  return on;
}

/* `shown` trails `active` by `ms` so the old text can fade out before the new one rises in */
function useSwap(active, ms = 220) {
  const [shown, setShown] = useState(active);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (active === shown) { setLeaving(false); return undefined; }
    setLeaving(true);
    const t = setTimeout(() => { setShown(active); setLeaving(false); }, ms);
    return () => clearTimeout(t);
  }, [active, shown, ms]);
  return [shown, leaving];
}

/* One card, horizontally centred (inset-x-0 + mx-auto, no transform, so GSAP can animate it freely).
   Deep green with white text so it reads on the light page. `tab` is the coloured plate behind its left edge. */
function StoryCard({ active, dir, tab, delay = 0, style, className = '', count, children }) {
  const [shown, leaving] = useSwap(active);
  return (
    <div className={`as-story-card pointer-events-none absolute inset-x-0 z-10 mx-auto ${className}`} style={style}>
      <div className="relative isolate">
        <span
          aria-hidden="true"
          className="absolute -left-4 top-[24%] -z-10 h-[52%] w-10 rounded-2xl [transition:background-color_.5s_ease] motion-reduce:transition-none sm:-left-7 sm:w-14"
          style={{ backgroundColor: tab }}
        />
        {/* the card never changes size: every chapter's text is laid in the same grid cell (the hidden ones are only there to
            hold the height of the tallest), and only the visible chapter's text moves and fades */}
        <div className="grid overflow-hidden rounded-[18px] px-4 py-3 text-white sm:rounded-[26px] sm:px-5 sm:py-4 lg:px-8 lg:py-5" style={{ backgroundColor: DEEP }}>
          {Array.from({ length: count }, (_, c) => (
            <div
              key={c === shown ? `on-${shown}` : c}
              aria-hidden={c !== shown || undefined}
              className={`[grid-area:1/1] ${c === shown ? 'animate-[as-card-in_.55s_cubic-bezier(.22,1,.36,1)_backwards] [transition:opacity_.2s_ease,transform_.2s_ease] motion-reduce:animate-none motion-reduce:transition-none' : 'invisible'}`}
              style={c === shown ? {
                '--dy': `${dir * 16}px`,
                animationDelay: `${delay}ms`,
                transitionDelay: leaving ? `${delay}ms` : '0ms',
                opacity: leaving ? 0 : 1,
                transform: leaving ? `translateY(${-dir * 10}px)` : 'none',
              } : undefined}
            >
              {children(c)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AboutStory() {
  const section = useRef(null);
  const trigger = useRef(null);
  const ctl = useRef(null);                 // FlexCarousel's controlRef: { scrub(x) }
  const lastChapter = useRef(0);
  const [active, setActive] = useState(0);          // photo centred in the carousel (counter, dots)
  const [chapter, setChapter] = useState(0);        // chapter of that photo (cards)
  const [dir, setDir] = useState(1);                // 1 = moving forward (scrolling down), -1 = back
  const [canGL] = useState(() => hasWebGL2() && !lowPower());
  const short = useMedia('(max-height: 519px)');    // landscape phones: no room for the pinned layout
  const strip = useMedia('(max-width: 639px)');     // phones: a plain horizontal row of photos (no WebGL) instead of the FlexCarousel
  const pinned = !short && (strip || canGL);        // phones always get the pinned story (their strip needs no WebGL)
  const stripRef = useRef(null);                    // phones: the row of photos that the scroll slides sideways
  const { cardHeight, gap, step, phone } = useLayout();

  const { chapters, photos } = useMemo(() => buildStory(ABOUT_STORY), []);
  const n = photos.length;
  const items = useMemo(() => photos.map((p) => ({ src: p.src, alt: p.alt, title: p.title })), [photos]);
  const span = (n - 1) * step + DWELL;              // svh of the whole track (minus the one pinned screen)
  const edge = 50 + cardHeight * 50;                // % of stage height where the photo row's top / bottom edge sits

  const onChange = useCallback((i) => {
    setActive(i);
    const c = photos[i]?.chapter ?? 0;
    if (c === lastChapter.current) return;
    setDir(c > lastChapter.current ? 1 : -1);
    lastChapter.current = c;
    setChapter(c);
  }, [photos]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* scroll progress → continuous carousel position, written straight into the carousel (no React render per scroll) */
      if (pinned) {
        const push = (self) => {
          const v = Math.min(n - 1, (self.progress * span) / step);          // photo position, 0 … n-1
          const row = stripRef.current;
          if (row) {                                                          // phones: slide the row so photo v is centred
            const card = row.firstElementChild;
            const cw = card ? card.offsetWidth : 0;
            gsap.set(row, { x: row.parentElement.clientWidth / 2 - (v * (cw + gap) + cw / 2) });
            onChange(Math.round(v));
          } else {
            ctl.current?.scrub(v);
          }
        };
        trigger.current = ScrollTrigger.create({
          trigger: section.current, start: 'top top', end: 'bottom bottom',
          onUpdate: push, onRefresh: push,
        });
        push(trigger.current);
      }
      if (prefersReducedMotion()) return;

      gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: section.current, start: 'top 60%', once: true } })
        .from('.as-line > span', { yPercent: 110, duration: 0.9, stagger: 0.12 })
        .from('.as-intro', { y: 18, opacity: 0, duration: 0.7 }, '-=0.5')
        .from('.as-story-card', { y: 28, opacity: 0, duration: 0.8, stagger: 0.15 }, '-=0.2');
    }, section);
    return () => ctx.revert();
  }, [pinned, n, span, step, strip, gap, onChange]);

  /* the dots scroll to the spot where their photo is centred */
  const jump = (i) => {
    const st = trigger.current;
    if (!st) return;
    window.scrollTo({ top: st.start + ((i * step) / span) * (st.end - st.start), behavior: 'smooth' });
  };

  const head = (
    <header className="as-head grid items-end gap-3 lg:grid-cols-[1.5fr_.7fr] lg:gap-14">
      <h2
        id="as-title"
        className="font-display text-[clamp(26px,min(4.6vw,7.2svh),68px)] font-normal leading-[1.04] tracking-[-.02em] text-p9"
      >
        <span className="as-line block overflow-hidden pb-[.12em] -mb-[.12em]"><span className="block">Care that sees</span></span>
        <span className="as-line block overflow-hidden pb-[.12em] -mb-[.12em]"><span className="block">the whole person</span></span>
      </h2>
      <p className="as-intro max-w-[400px] text-[15px] leading-[1.6] text-p9 max-sm:hidden [@media(max-height:700px)]:hidden lg:pb-2">
        Dr. Thaj Homoeo Clinic in Minjur, Chennai, pairs homoeopathic medicine with time to listen.
      </p>
    </header>
  );

  return (
    <section
      id="about" ref={section} aria-labelledby="as-title"
      className="relative text-p9"
      style={pinned ? { height: `${100 + span}svh` } : undefined}
    >
      <style>{STYLE}</style>

      {pinned ? (
        <div className="sticky top-0 flex h-[100svh] flex-col pb-[max(.75rem,env(safe-area-inset-bottom))] pt-[76px] sm:pb-5 sm:pt-24">
          <div className="mx-auto w-full max-w-[1240px] shrink-0 px-4 sm:px-8 lg:px-12">{head}</div>

          {/* stage: the full width of the page. Carousel behind, cards on its centre line. */}
          <div className="as-stage relative mt-2 min-h-0 flex-1 sm:mt-3">
            {/* pointer-events-none: the carousel never eats wheel / touch, so the page scrolls from anywhere on it */}
            <div className="pointer-events-none absolute inset-0">
              {strip ? (
                /* phones: one row of photos; the scroll slides it sideways (see push above) */
                <div className="absolute inset-0 overflow-hidden">
                  <div ref={stripRef} className="flex h-full items-center will-change-transform" style={{ gap }}>
                    {photos.map((ph, i) => (
                      <img
                        key={`${ph.src}-${i}`} src={ph.src} alt={ph.alt} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" draggable="false"
                        style={{ height: `${cardHeight * 100}%` }}
                        className={`aspect-[3/4] flex-none rounded-[18px] object-cover shadow-[0_24px_44px_-26px_rgba(33,37,41,.5)] [transition:opacity_.4s_ease] ${i === active ? 'opacity-100' : 'opacity-60'}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
              <FlexCarousel
                items={items}
                controlRef={ctl}
                interactive={false}
                preset="liquid"
                fit="portrait"
                cardHeight={cardHeight}
                gap={gap}
                radius={0}
                captions={false}
                captureWheel={false}
                focusOnClick={false}
                autoplay={false}
                onChange={onChange}
                className="!cursor-default"
              />
            
              )}
            </div>

            {/* TOP card: chapter heading, sitting right on top of the centred photo */}
            <StoryCard
              active={chapter} dir={dir} count={chapters.length}
              tab={TABS[chapter % TABS.length]}
              className="w-[min(500px,calc(100%-3rem))] sm:w-[min(500px,calc(100%-3.5rem))]"
              style={{ bottom: `calc(${edge}% + ${phone ? 8 : 12}px)` }}
            >
              {(c) => (
                <h3 className="font-display text-[clamp(17px,min(2.3vw,3.7svh),32px)] font-normal leading-[1.15] text-white">
                  {chapters[c].title}
                </h3>
              )}
            </StoryCard>

            {/* BOTTOM card: chapter description, hanging right under the centred photo */}
            <StoryCard
              active={chapter} dir={dir} delay={90} count={chapters.length}
              tab={TABS[(chapter + 2) % TABS.length]}
              className="w-[min(540px,calc(100%-3rem))] sm:w-[min(540px,calc(100%-3.5rem))]"
              style={{ top: `calc(${edge}% + ${phone ? 8 : 12}px)` }}
            >
              {(c) => (
                <>
                  <p className="text-[clamp(13px,min(1.35vw,2.1svh),17px)] leading-[1.5] text-white sm:leading-[1.55]">{chapters[c].text}</p>
                  {chapters[c].cta && (
                    <a
                      href="#booking"
                      className="pointer-events-auto mt-2.5 inline-flex min-h-[44px] items-center rounded-full bg-white px-5 text-sm font-semibold text-[#14211a] no-underline transition-colors duration-200 active:bg-accent-light [@media(hover:hover)]:hover:bg-accent-light sm:mt-3
                                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Book appointment
                    </a>
                  )}
                </>
              )}
            </StoryCard>

            {/* photo counter + dots in a dark pill, readable over any photo. Each dot has a 24px tap area. */}
            <div className="absolute right-1 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-full bg-black/50 px-1.5 py-2.5 max-sm:inset-x-auto max-sm:bottom-2 max-sm:left-1/2 max-sm:right-auto max-sm:top-auto max-sm:-translate-x-1/2 max-sm:translate-y-0 max-sm:flex-row max-sm:gap-2 max-sm:px-3 max-sm:py-1.5 sm:right-5 sm:gap-1.5 sm:px-2 sm:py-3">
              <span className="text-[11px] tabular-nums text-white/80" aria-hidden="true">{active + 1}/{n}</span>
              {photos.map((p, i) => (
                <button
                  key={`${p.src}-${i}`} type="button" onClick={() => jump(i)} aria-label={`Go to photo ${i + 1}: ${p.title}`}
                  aria-current={i === active ? 'true' : undefined}
                  className="relative grid h-4 w-4 cursor-pointer place-items-center border-0 bg-transparent p-0 before:absolute before:-inset-2.5 before:content-[''] sm:h-3 sm:w-3
                             focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  <span aria-hidden="true" className={`block rounded-full transition-[height,width,background-color] duration-300 ${i === active ? 'h-4 w-2 bg-white max-sm:h-2 max-sm:w-4' : 'h-2 w-2 bg-white/40'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-[1240px]">
            {head}
            <ol className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {chapters.map((c, i) => (
                <li key={c.title} className="overflow-hidden rounded-[22px] text-white sm:rounded-[26px]" style={{ backgroundColor: DEEP }}>
                  <div className="aspect-[4/3] bg-[#1d3328] sm:aspect-[3/4]">
                    <img src={photos.find((p) => p.chapter === i)?.src} alt={c.title} loading="lazy" decoding="async" draggable="false" className="h-full w-full object-cover" />
                  </div>
                  <div className="border-t-4 p-5" style={{ borderColor: TABS[i % TABS.length] }}>
                    <h3 className="mb-2 font-display text-[22px] font-normal leading-[1.15]">{c.title}</h3>
                    <p className="text-[15px] leading-[1.65]">{c.text}</p>
                    {c.cta && (
                      <a href="#booking" className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-white px-6 text-sm font-semibold text-[#14211a] no-underline">
                        Book appointment
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}