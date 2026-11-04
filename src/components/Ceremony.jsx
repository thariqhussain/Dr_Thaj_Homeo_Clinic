import { useCallback, useEffect, useRef, useState } from 'react';
import DriftWall from './DriftWall';

/* "On the day of the ceremony": a slowly drifting, tilted wall of the ceremony photos, shown right below
   Highlights & updates. The columns glide past in alternating directions; the pointer tilts the wall a little and
   lifts the tile under it. Clicking a tile opens that photo full size, uncropped (the wall itself crops to fit its tiles).
   The viewer: Esc closes, ← → move, swipe on touch.
   The wall is decorative for keyboards and screen readers: the "View all photos" button opens the same viewer.

   Images live in  public/assets/ceremony/ceremony1.webp … ceremony10.webp
   To add, remove or reorder photos, edit FILES (the file numbers, in display order). To change the wording, edit TITLE / INTRO.
   The opening-date line under the intro comes from OPENED_ISO (machine-readable date) / OPENED_LABEL (what is shown). */

const FILES = [1, 2, 3, 4, 5, 6, 7, 10];   // ceremony<N>.webp, in display order (10 is last)
const COUNT = FILES.length;
const TITLE = 'On the day of the ceremony';
const INTRO = 'A look back at the day, with family, friends and well-wishers.';

const OPENED_ISO = '2025-11-02';
const OPENED_LABEL = '2 November 2025';

const PHOTOS = FILES.map((n, i) => ({
  src: `/assets/ceremony/ceremony${n}.webp`,
  alt: `Ceremony photo ${i + 1} of ${COUNT}`,
}));
const BASE = PHOTOS.map((p, i) => ({ image: p.src, title: p.alt, index: i }));
/* The columns glide up and down (no looping), so each column needs more height than the wall. Tiles are dealt to the columns one by one,
   left to right, so a column holds every COLUMNS-th tile; each list below is built so no column ever shows the same photo twice.
   Clicking any tile opens its real photo.
   4 columns (desktop): the photos listed twice, the second round shifted by 2 (16 tiles, 4 per column).
   3 columns (phones, tablets): 15 tiles, 5 per column, photo number = tile number mod COUNT. */
const ITEMS_4 = [...BASE, ...BASE.map((_, i) => BASE[(i + 2) % COUNT])];
const ITEMS_3 = Array.from({ length: 15 }, (_, i) => BASE[i % COUNT]);

/* The wall is sized from the page width so its columns span the whole width, centred, whatever the screen:
   tile width = page width / (columns × how much the 3D view enlarges the wall) - gap.
   Columns: 4 on desktop (1024px and up), 3 on phones and tablets.
   Phones held upright get portrait tiles; a phone on its side is short, so its wall is shorter too. */
const VIEW_SCALE = 1.14;   // measured: the wall's 3D scale and depth together make the columns about 14% wider than their layout width
function wallFor(w, h) {
  const columns = w >= 1024 ? 4 : 3;   // 3 columns on phones and tablets, 4 on desktop: each column glides up and down over its own length
  const gap = w >= 1024 ? 18 : w >= 640 ? 16 : 8;
  const tileWidth = Math.min(430, Math.round(w / (columns * VIEW_SCALE) - gap));
  const portrait = w < 640 && h >= w;
  const tileHeight = Math.round(tileWidth * (portrait ? 1.25 : w >= 1024 ? 0.82 : w >= 640 ? 0.78 : 0.68));
  const height =
    h < 520 ? 'clamp(260px,74svh,440px)'            // phone on its side
    : w >= 1024 ? 'clamp(440px,68svh,620px)'
    : w >= 640 ? 'clamp(400px,60svh,560px)'
    : 'clamp(360px,62svh,520px)';
  return { columns, gap, tileWidth, tileHeight, height };
}

/* Soft edges for the wall: two plain masks on two plain wrapper elements (they multiply), instead of one combined mask on
   the 3D element itself, which some browsers draw as an empty box. The wall fades out at both sides only (no fade at the top or bottom). */
const FADE_SIDES = 'linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%)';
const mask = (img) => ({ WebkitMaskImage: img, maskImage: img });

/* page size, kept up to date on resize and when a phone or tablet is rotated */
function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [v, setV] = useState(read);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setV((o) => { const n = read(); return n.w === o.w && n.h === o.h ? o : n; }));
    };
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on); cancelAnimationFrame(raf); };
  }, []);
  return v;
}

/* true on a laptop or desktop with a mouse; false on phones and tablets (touch has no hover) */
function useCanHover() {
  const q = '(hover: hover) and (pointer: fine)';
  const [on, setOn] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setOn(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return on;
}

const focusRing = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent';

const lightboxBtn =
  'grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/25 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export default function Ceremony() {
  const [open, setOpen] = useState(-1);                 // photo in the larger view, -1 = closed
  const opener = useRef(null);                          // the "View all photos" button, to give focus back to
  const closeBtn = useRef(null);
  const touchX = useRef(null);

  const { w: vw, h: vh } = useViewport();
  const wall = wallFor(vw, vh);
  const items = wall.columns === 3 ? ITEMS_3 : ITEMS_4;
  const canHover = useCanHover();

  /* ── the larger view ── */
  const close = useCallback(() => { setOpen(-1); opener.current?.focus(); opener.current = null; }, []);
  const go = useCallback((d) => setOpen((i) => (i < 0 ? i : (i + d + COUNT) % COUNT)), []);

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

  /* swipe left / right in the larger view */
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  const cur = PHOTOS[open];

  return (
    <section id="ceremony" aria-labelledby="cm-title" className="relative px-12 py-[72px] max-lg:px-8 max-lg:py-14 max-sm:px-4 max-sm:py-10 max-[375px]:px-3">
      <div className="mx-auto max-w-[1120px]">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-5 max-sm:mb-2">
          <div className="max-w-[560px]">
            <h2 id="cm-title" className="mb-2 font-display text-[clamp(28px,3.4vw,44px)] font-normal leading-[1.1] text-p9">{TITLE}</h2>
            <p className="text-[15px] leading-[1.7] text-p7">{INTRO}</p>
            <p className="mt-3 text-[15px] leading-[1.7] text-p7">
              Clinic opened on <time dateTime={OPENED_ISO} className="font-semibold text-p9">{OPENED_LABEL}</time>
            </p>
          </div>
          <button
            type="button" onClick={(e) => { opener.current = e.currentTarget; setOpen(0); }}
            className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border-0 bg-p9 px-6 py-3 font-body text-sm font-medium text-p1 transition-colors duration-200 hover:bg-p8 max-sm:w-full ${focusRing}`}
          >
            View all {COUNT} photos <span aria-hidden="true">→</span>
          </button>
        </header>

        {/* the wall is decorative (hidden from screen readers, out of the tab order); the button above does the same job */}
        <div className="relative left-1/2 w-screen -translate-x-1/2 [touch-action:pan-y_pinch-zoom]" style={{ height: wall.height }}>   {/* full width of the page, so the wall bleeds off both sides */}
          <div className="h-full" style={mask(FADE_SIDES)}>
            <DriftWall
                key={wall.columns} items={items} mask={false}
                columns={wall.columns} tileWidth={wall.tileWidth} tileHeight={wall.tileHeight} gap={wall.gap} radius={14}
                loop={false} tilt={16} turn={0} depth={120} speed={canHover ? 26 : 20} direction="up" variance={0.45}
                parallax={canHover ? 0.5 : 0} pauseOnHover lift={56} overlayColor="#0d1511"
                dim={canHover ? 0.95 : 0.99} idleOverlay={canHover ? 0.1 : 0.03}   /* touch never hovers a tile, so rest photos at full colour */
                onSelect={(item) => { opener.current = null; setOpen(item.index); }}
                tabbable={false}
              />
          </div>
        </div>
      </div>

      {open >= 0 && (
        <div
          role="dialog" aria-modal="true" aria-label={cur.alt}
          onClick={close} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          className="fixed inset-0 z-[200] grid place-items-center bg-[#0d1511]/90 p-4 overscroll-contain"
        >
          <img
            src={cur.src} alt={cur.alt} onClick={(e) => e.stopPropagation()}
            className="max-h-[86svh] max-w-full rounded-2xl object-contain shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)]"
          />

          <span className="absolute left-[max(1rem,env(safe-area-inset-left))] top-[max(1rem,env(safe-area-inset-top))] rounded-full bg-white/20 px-3.5 py-1.5 text-[13px] font-medium tabular-nums text-white" aria-hidden="true">
            {open + 1} / {COUNT}
          </span>

          <button
            ref={closeBtn} type="button" aria-label="Close photo" onClick={(e) => { e.stopPropagation(); close(); }}
            className={`${lightboxBtn} absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))]`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>

          <button type="button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(-1); }} className={`${lightboxBtn} absolute left-[max(.75rem,env(safe-area-inset-left))] top-1/2 -translate-y-1/2`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(1); }} className={`${lightboxBtn} absolute right-[max(.75rem,env(safe-area-inset-right))] top-1/2 -translate-y-1/2`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </section>
  );
}