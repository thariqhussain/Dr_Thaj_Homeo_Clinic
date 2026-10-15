import { useEffect, useRef, useState } from 'react';
import { PHONES, WA_NUMBER } from '../data/content';
import { useIntroReveal } from '../hooks/useIntroReveal';

/* Bottom-right quick-contact bar: the same glass pill as the top navbar (it reuses the .site-nav / .nav-bar styles
   from index.css, including the wet-glass highlight and the cursor-following glare), holding the WhatsApp and
   phone icons. WhatsApp opens a chat with a ready message; the phone icon dials the first number in PHONES. */

const MESSAGE = 'Hello, I would like to know more about Dr. Thaj Homoeo Clinic.';

const item =
  'relative z-[2] grid h-11 w-11 place-items-center rounded-full text-[var(--nav-text-strong)] no-underline ' +
  '[transition:background_.25s,color_.25s,transform_.35s_cubic-bezier(.34,1.4,.64,1)] ' +
  'hover:-translate-y-0.5 hover:bg-[var(--nav-pill-bg)] hover:text-[var(--nav-accent)] active:scale-95 motion-reduce:transition-none ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nav-accent)] max-sm:h-10 max-sm:w-10';

export default function ContactDock() {
  const wrap = useRef(null);
  const barRef = useRef(null);
  const glareRef = useRef(null);
  useIntroReveal(wrap, { y: 24, delay: 0.2, duration: 0.7 });   // rises in once the hero sequence has played

  /* The booking form now fills the screen, so the dock would sit on top of its buttons. While the booking section is
     on screen the dock slides away (the clinic details with the phone number are right there); it comes back after. */
  const [hide, setHide] = useState(false);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const el = document.getElementById('booking');
      if (!el) return setHide(false);
      const r = el.getBoundingClientRect();
      setHide(r.top < window.innerHeight - 90 && r.bottom > 90);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    check();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);

  /* cursor-following glare across the glass (same as the top navbar) */
  useEffect(() => {
    const bar = barRef.current, glare = glareRef.current;
    if (!bar || !glare) return;
    let rect = null, raf = 0, gx = 0, gy = 0;
    const enter = () => { rect = bar.getBoundingClientRect(); };
    const move = (e) => {
      if (!rect) rect = bar.getBoundingClientRect();
      gx = e.clientX - rect.left; gy = e.clientY - rect.top;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        glare.style.setProperty('--x', `${gx}px`);
        glare.style.setProperty('--y', `${gy}px`);
      });
    };
    bar.addEventListener('mouseenter', enter);
    bar.addEventListener('mousemove', move);
    return () => { bar.removeEventListener('mouseenter', enter); bar.removeEventListener('mousemove', move); cancelAnimationFrame(raf); };
  }, []);

  const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <nav
      ref={wrap} data-theme="light" aria-label="Quick contact"
      className={`site-nav fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-[90] max-sm:right-3
                  [transition:transform_.45s_cubic-bezier(.22,.61,.36,1),opacity_.3s_ease] motion-reduce:transition-none
                  ${hide ? 'pointer-events-none translate-y-[140%] opacity-0' : ''}`}
    >
      <div
        ref={barRef}
        className="nav-bar relative flex h-14 items-center gap-1 overflow-hidden rounded-full px-2 max-sm:h-[52px] max-sm:px-1.5"
      >
        <span ref={glareRef} aria-hidden="true" className="nav-glare pointer-events-none absolute inset-0 block opacity-0 transition-opacity duration-300" />

        <a href={wa} target="_blank" rel="noopener" aria-label="Chat on WhatsApp" title="Chat on WhatsApp" className={item}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 21l1.65-4.86A8.5 8.5 0 1 1 8 19.4L3 21z" />
            <path d="M9 8.6c0 3.4 2.9 6.3 6.3 6.3l1.2-1.3-2-1-.9.7a4 4 0 0 1-1.9-1.9l.7-.9-1-2L9 8.6z" fill="currentColor" stroke="none" />
          </svg>
        </a>

        <span aria-hidden="true" className="relative z-[2] h-6 w-px bg-[var(--nav-glass-border)]" />

        <a href={`tel:${PHONES[0].tel}`} aria-label={`Call ${PHONES[0].display}`} title={`Call ${PHONES[0].display}`} className={item}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.4 2 2 0 0 1 3.05 1.22h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.07a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </a>
      </div>
    </nav>
  );
}