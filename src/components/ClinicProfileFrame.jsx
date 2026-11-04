import { useEffect, useRef, useState } from 'react';

/* Full-screen iframe section (below the navbar, with spacing on the edges) that shows the clinic profile page.
   Change NAV_H if your navbar is taller / shorter than 80px (also update the placeholder height in App.jsx).

   The profile page scrolls inside its own window, and on a phone or tablet a finger that starts on it keeps scrolling it, so a
   visitor can feel stuck here. Three cues keep them oriented:
     1. a bar above the window: "scroll inside" + a "Skip to next section" button (always there, one tap leaves the section)
     2. a bouncing arrow with "more below" at the bottom of the window, which turns into "You've reached the end" once the profile
        has been scrolled to its bottom (the profile page is on the same origin, so its scroll can be read; if that ever fails,
        the first message just stays)
     3. a short fade at the bottom edge of the window so it reads as "continues" */
const NAV_H = '80px';
const NAV_PX = 80;        // same number as NAV_H, in px, for the scroll-to-next-section button
const MAX_W = '1120px';   // the profile page's own content is 1120px wide, so the frame is capped to match (no empty side space)
const BAR_H = 44;         // height of the bar above the window, px

const ArrowDown = ({ className = '' }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

const STYLE = `
@keyframes cpf-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
@media (prefers-reduced-motion: reduce) { .cpf-bob { animation: none !important; } }
`;

export default function ClinicProfileFrame() {
  const section = useRef(null);
  const frame = useRef(null);
  const [atEnd, setAtEnd] = useState(false);

  /* watch the profile page's own scroll (same origin only) to know when its bottom has been reached */
  useEffect(() => {
    const el = frame.current;
    if (!el) return undefined;
    let win = null;
    let off = () => {};
    const attach = () => {
      off();
      try {
        win = el.contentWindow;
        const doc = el.contentDocument;
        if (!win || !doc) return;
        const root = doc.scrollingElement || doc.documentElement;
        const check = () => setAtEnd(root.scrollTop + root.clientHeight >= root.scrollHeight - 24);
        win.addEventListener('scroll', check, { passive: true });
        check();
        off = () => { try { win.removeEventListener('scroll', check); } catch { /* frame is gone */ } };
      } catch {
        /* cross-origin or not ready: keep the default message */
      }
    };
    el.addEventListener('load', attach);
    attach();
    return () => { el.removeEventListener('load', attach); off(); };
  }, []);

  /* leave the section: put the bottom of the frame just under the navbar, so the next section starts right there */
  const skip = () => {
    const r = section.current?.getBoundingClientRect();
    if (!r) return;
    window.scrollTo({ top: window.scrollY + r.bottom - NAV_PX, behavior: 'smooth' });
  };

  return (
    <section
      id="clinic-profile"
      ref={section}
      style={{
        height: `calc(100svh - ${NAV_H})`,
        width: '100%',
        maxWidth: `calc(${MAX_W} + 2 * clamp(12px, 3vw, 40px))`,
        margin: '0 auto',
        padding: '0 clamp(12px, 3vw, 40px) clamp(12px, 3vw, 40px)',
        boxSizing: 'border-box',
        scrollMarginTop: NAV_H,
      }}
    >
      <style>{STYLE}</style>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* 1. the bar above the window */}
        <div
          style={{
            flex: `0 0 ${BAR_H}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '0 8px 0 14px',
            background: '#2f5a3f',
            color: '#fff',
            fontSize: '13px',
            lineHeight: 1.2,
          }}
        >
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Clinic profile · scroll inside this window
          </span>
          <button
            type="button"
            onClick={skip}
            style={{
              flex: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '32px',
              padding: '0 12px',
              border: 0,
              borderRadius: '999px',
              background: '#fff',
              color: '#14211a',
              font: 'inherit',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Skip to next section <ArrowDown />
          </button>
        </div>

        <iframe
          ref={frame}
          src="/clinic-profile.html"
          title="Dr. Thaj Homoeo Clinic Profile"
          loading="lazy"
          style={{ flex: '1 1 auto', minHeight: 0, width: '100%', border: 0, background: '#fff' }}
        />

        {/* 2 + 3. fade and "more below" cue over the bottom edge of the window (it never blocks touches except on its button) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            padding: '36px 12px 10px',
            background: 'linear-gradient(to top, rgba(255,255,255,.96) 35%, rgba(255,255,255,0))',
            pointerEvents: 'none',
          }}
        >
          <button
            type="button"
            onClick={skip}
            style={{
              pointerEvents: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '36px',
              padding: '0 14px',
              border: 0,
              borderRadius: '999px',
              background: 'rgba(20,33,26,.88)',
              color: '#fff',
              font: 'inherit',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(0,0,0,.25)',
            }}
          >
            {atEnd ? 'You’ve reached the end · continue below' : 'More below this section · keep scrolling'}
            <span className="cpf-bob" style={{ display: "inline-flex", animation: "cpf-bob 1.4s ease-in-out infinite" }}><ArrowDown /></span>
          </button>
        </div>
      </div>
    </section>
  );
}