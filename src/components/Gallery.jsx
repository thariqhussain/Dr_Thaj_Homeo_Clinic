import { useCallback, useEffect, useRef, useState } from 'react';
import AccordionGallery from './AccordionGallery';
import { CLINIC_PHOTOS } from '../data/content';

/* Highlights & updates: an accordion of photos. Hover (or tap / focus) a photo and it opens up while the others
   narrow and fade to grey. Clicking the open photo shows it full size, uncropped: Esc closes, ← → move,
   focus returns to the photo.
   Data lives in content.js → CLINIC_PHOTOS: { src, alt }. Add an optional `caption` to any photo and its text appears
   on the photo while it is open (until then no text is printed on the photos, since `alt` is only a description).

   MANY PHOTOS: the accordion shows PER photos at a time (4 on phones, 5 elsewhere) so every panel stays wide enough to read.
   When there are more than that, arrows (and a "1–5 of 9" readout) page through them; the accordion itself is unchanged.
   With PER photos or fewer there are no arrows. The arrows sit at the left and right ends of the accordion (below it on phones). */

const N = CLINIC_PHOTOS.length;

const ITEMS = CLINIC_PHOTOS.map((p) => ({ image: p.src, alt: p.alt, label: p.caption || p.alt }));
const HAS_CAPTIONS = CLINIC_PHOTOS.some((p) => p.caption);

const PER_PHONE = 4, PER_WIDE = 5;   // photos in the accordion at once
const NARROW = '(max-width: 520px)';   // the accordion stacks vertically at this width (same breakpoint as inside AccordionGallery)
const CAN_HOVER = '(hover: hover)';   // touch screens fire a fake hover on tap, so they use tap-to-open instead

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

/* page arrow: sits at the left / right end of the accordion (below it on phones) */
const PageBtn = ({ label, path, can, onClick }) => (
  <button
    type="button" aria-label={label} aria-disabled={!can || undefined} onClick={() => can && onClick()}
    className={`grid h-12 w-12 flex-none cursor-pointer place-items-center rounded-full border border-p9/15 bg-white text-p9 shadow-[0_8px_20px_-12px_rgba(33,37,41,.5)] transition-[opacity,background,color] duration-200 hover:bg-p9 hover:text-white max-sm:order-2
                focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent ${can ? '' : 'opacity-35'}`}
  >
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
  </button>
);

export default function Gallery() {
  const [open, setOpen] = useState(-1);                 // photo in the full view, -1 = closed
  const opener = useRef(null);                          // panel to give focus back to
  const closeBtn = useRef(null);
  const narrow = useMedia(NARROW);
  const canHover = useMedia(CAN_HOVER);
  const per = narrow ? PER_PHONE : PER_WIDE;
  const [start, setStart] = useState(0);                // index of the first photo in the accordion
  const first = Math.min(start, Math.max(0, N - per));  // (re-clamped if the screen size changes)
  const shown = ITEMS.slice(first, first + per);
  const paged = N > per;
  const page = (d) => setStart(Math.min(Math.max(0, N - per), Math.max(0, first + d * per)));

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

  /* the next page of photos is fetched in idle time, so paging with the arrows never waits on the network */
  useEffect(() => {
    if (navigator.connection?.saveData) return undefined;
    const idle = 'requestIdleCallback' in window;
    const srcs = ITEMS.slice(first + per, first + 2 * per).map((it) => it.image);
    const imgs = [];
    const h = idle
      ? window.requestIdleCallback(() => srcs.forEach((s) => { const im = new Image(); im.decoding = 'async'; im.src = s; im.decode?.().catch(() => {}); imgs.push(im); }), { timeout: 3000 })
      : window.setTimeout(() => srcs.forEach((s) => { const im = new Image(); im.src = s; imgs.push(im); }), 1200);
    return () => { if (idle) window.cancelIdleCallback(h); else clearTimeout(h); };
  }, [first, per]);

  if (!N) return null;
  const cur = CLINIC_PHOTOS[open];

  return (
    <section id="gallery" aria-labelledby="gl-title" className="relative px-12 py-[72px] max-lg:px-8 max-lg:py-14 max-sm:px-4 max-sm:py-10 max-[375px]:px-3">
      <div className="mx-auto max-w-[1120px]">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 max-sm:mb-6">
          <div className="max-w-[560px]">
          <h2 id="gl-title" className="mb-2 font-display text-[clamp(28px,3.4vw,44px)] font-normal leading-[1.1] text-p9">Highlights &amp; updates</h2>
          <p className="text-[15px] leading-[1.7] text-p7">
            Moments and updates from Dr. Thaj Homoeo Clinic. Hover or tap a photo to open it up, then click or tap it again to see it full size.
          </p>
          </div>
          {paged && !narrow && (
            <p className="m-0 text-[13.5px] tabular-nums text-p7" aria-live="polite">{first + 1}–{first + shown.length} of {N}</p>
          )}
        </header>

        {/* phones: a row of full photo cards you swipe (a tap opens the full-size view); the accordion is for wider screens */}
        {narrow && (
          <ul className="m-0 -mx-4 flex snap-x snap-mandatory list-none gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ITEMS.map((it, i) => (
              <li key={it.image} className="w-[82%] flex-none snap-center">
                <button
                  type="button" onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }} aria-label={`Open photo ${i + 1} of ${N}`}
                  className="block aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-2xl border-0 bg-p2 p-0 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <img src={it.image} alt={it.alt} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" draggable="false" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={`flex items-center gap-3 max-sm:flex-wrap max-sm:justify-center max-sm:gap-4 ${narrow ? 'hidden' : ''}`}>
          {paged && <PageBtn label="Previous photos" path="M15 5l-7 7 7 7" can={first > 0} onClick={() => page(-1)} />}
          <div className="min-w-0 flex-1 max-sm:order-1 max-sm:basis-full">
            <AccordionGallery
              key={`${first}-${per}`}
              items={shown}
              defaultIndex={Math.floor(shown.length / 2)}
              onOpen={(i, e) => { opener.current = e.currentTarget; setOpen(first + i); }}
              trigger={canHover ? 'hover' : 'click'}
              orientation={narrow ? 'vertical' : 'horizontal'}
              height={narrow ? '560px' : 'clamp(380px,58svh,500px)'}
              gap={12} radius={16} expandRatio={0.52} fit="cover" dimInactive={0}
              overlayColor="#0d1511" accentColor="#ffffff" textColor="#ffffff"
              showLabels={HAS_CAPTIONS} grayscale={false} tilt={6} parallax={0.4}
            />
          </div>
          {paged && <PageBtn label="Next photos" path="M9 5l7 7-7 7" can={first + per < N} onClick={() => page(1)} />}
        </div>
      </div>

      {open >= 0 && (
        <div
          role="dialog" aria-modal="true" aria-label={cur.caption || cur.alt}
          onClick={close}
          className="fixed inset-0 z-[200] grid place-items-center bg-[#0d1511]/90 p-4"
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