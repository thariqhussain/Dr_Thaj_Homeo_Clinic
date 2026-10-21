import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { introDone } from '../lib/intro';
import { NAV_LINKS } from '../data/content';
import { prefersReducedMotion, scrollToId } from '../lib/utils';

/* seconds to wait before the navbar intro starts, so the hero dot grid is already fading in */
const INTRO_DELAY = 0.45;

const SunIcon = () => (
  <svg className="nav-sun absolute left-0 top-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const MoonIcon = () => (
  <svg className="nav-moon absolute left-0 top-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function Navbar() {
  const [dark, setDark] = useState(false);
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });
  const linkRefs = useRef([]);
  const hoveredIdx = useRef(-1);
  const barRef = useRef(null);
  const glareRef = useRef(null);
  const shimmerRef = useRef(null);

  /* Load / reload intro (glass shimmer sweep): the bar comes into focus (blur → sharp) while fading in,
     one diagonal glare sweeps across it, then the logo, buttons and link labels rise in one after another.
     The whole thing takes ~1.3s and tells the doctor photo to start at ~0.7s (see lib/intro.js). */
  useLayoutEffect(() => {
    const bar = barRef.current, shimmer = shimmerRef.current;
    if (!bar || !shimmer || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const items = bar.querySelectorAll('[data-nav-item]');
      const labels = bar.querySelectorAll('.nav-link-label');

      gsap.set(bar, { opacity: 0, scale: 0.94, filter: 'blur(12px)' });
      gsap.set(items, { opacity: 0, y: -8 });
      gsap.set(labels, { yPercent: 115 });
      gsap.set(shimmer, { xPercent: -130, skewX: -20, opacity: 0 });

      gsap.timeline({ delay: INTRO_DELAY })
        /* 1 — focus pull: soft + small → sharp + full size */
        .to(bar, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power2.out' }, 0)
        /* 2 — one glare sweeps diagonally across the glass (the band is ~38% of the bar wide, so 340% clears it) */
        .to(shimmer, { opacity: 1, duration: 0.15, ease: 'none' }, 0.3)
        .to(shimmer, { xPercent: 340, duration: 0.85, ease: 'power2.inOut' }, 0.3)
        .to(shimmer, { opacity: 0, duration: 0.2, ease: 'none' }, 0.95)
        .add(() => introDone('nav'), 0.7)                                 // bar is in → the doctor photo may start
        /* 3 — content: logo + buttons fade down into place, link labels rise out of a mask one by one */
        .to(items, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out' }, 0.45)
        .to(labels, { yPercent: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out' }, 0.55)
        .set(bar, { clearProps: 'filter,transform,opacity' });            // restore shadow + normal styling
    }, bar);
    return () => ctx.revert();
  }, []);

  /* sliding pill behind the hovered link */
  const movePillTo = (i) => {
    const link = linkRefs.current[i];
    if (!link) return;
    hoveredIdx.current = i;
    setPill({ left: link.offsetLeft, width: link.offsetWidth, visible: true });
  };
  const hidePill = () => {
    hoveredIdx.current = -1;
    setPill((p) => ({ ...p, visible: false }));
  };
  useEffect(() => {
    const onResize = () => { if (hoveredIdx.current >= 0) movePillTo(hoveredIdx.current); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* cursor-following glare across the glass bar */
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
    return () => {
      bar.removeEventListener('mouseenter', enter);
      bar.removeEventListener('mousemove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <nav
      id="siteNav"
      data-theme={dark ? 'dark' : 'light'}
      className="site-nav pointer-events-none fixed inset-x-0 top-[14px] z-[100] flex items-center justify-center max-sm:top-2.5 max-[375px]:top-2"
    >
      <div
        ref={barRef}
        className="nav-bar pointer-events-auto relative flex h-[60px] w-3/4 max-w-[1400px] items-center justify-between gap-3 overflow-hidden rounded-full pl-[7px] pr-2
                   max-lg:w-[calc(100%-48px)] max-[760px]:backdrop-blur-[12px]
                   max-sm:h-[52px] max-sm:w-[calc(100%-24px)] max-sm:pl-1 max-sm:pr-1.5
                   max-[375px]:h-12 max-[375px]:w-[calc(100%-20px)] max-[320px]:w-[calc(100%-16px)]"
      >
        <span ref={glareRef} className="nav-glare pointer-events-none absolute inset-0 block opacity-0 transition-opacity duration-300" />
        {/* intro-only: the diagonal glass glare that sweeps across the bar once on load */}
        <span
          ref={shimmerRef} aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-[3] block w-[38%] opacity-0"
          style={{ background: 'linear-gradient(100deg, transparent 0%, rgba(255,255,255,.75) 50%, transparent 100%)' }}
        />

        <a href="#" data-nav-item aria-label="Dr. Thaj Homoeo Clinic — home" className="relative z-[2] flex items-center rounded-full px-[11px] py-[3px] font-logo text-[26px] text-p9 no-underline
                   bg-[linear-gradient(to_top_right,#241b17_0%,#2f2623_50%,#6f696d_100%)]
                   shadow-[inset_0_1px_1px_rgba(255,255,255,.22),0_8px_16px_-8px_rgba(20,12,10,.6)]
                   max-sm:px-2 max-sm:py-0.5">
          <img
            src="/assets/doctors/clinic_logo_og_nav.webp" alt="Dr. Thaj Homoeo Clinic logo" width="618" height="404"
            className="relative z-[2] -mx-[26px] -my-[14px] block h-[74px] w-auto max-sm:-mx-[22px] max-sm:-my-3 max-sm:h-[64px] max-[375px]:h-[58px] max-[320px]:h-[52px]"
          />
        </a>

        <div
          data-nav-item
          className="relative z-[2] flex h-full items-center gap-0.5 max-sm:hidden"
          onMouseLeave={hidePill}
        >
          <div
            aria-hidden="true"
            style={{ width: pill.width, transform: `translateX(${pill.left}px)` }}
            className={`pointer-events-none absolute left-0 top-[6px] z-0 h-[46px] rounded-full bg-[var(--nav-pill-bg)] shadow-[0_2px_10px_rgba(0,0,0,.06),inset_0_1px_1px_rgba(255,255,255,.5)]
              [transition:transform_.45s_cubic-bezier(.34,1.2,.64,1),width_.45s_cubic-bezier(.34,1.2,.64,1),opacity_.25s_ease,background_.5s_ease]
              ${pill.visible ? 'opacity-100' : 'opacity-0'}`}
          />
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              ref={(el) => (linkRefs.current[i] = el)}
              onMouseEnter={() => movePillTo(i)}
              className="relative z-[1] flex h-[46px] items-center rounded-full px-5 text-sm font-medium text-[var(--nav-text)] no-underline transition-colors duration-200 hover:text-[var(--nav-accent)]"
            >
              <span className="block overflow-hidden py-0.5"><span className="nav-link-label block">{l.label}</span></span>
            </a>
          ))}
        </div>

        <div data-nav-item className="relative z-[2] flex items-center gap-2 max-sm:gap-1.5">
          <button
            type="button"
            aria-label="Toggle nav appearance"
            onClick={() => setDark((d) => !d)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[var(--nav-text)] transition-colors duration-300 hover:text-[var(--nav-accent)] max-sm:hidden"
          >
            <div className="relative h-[18px] w-[18px]"><SunIcon /><MoonIcon /></div>
          </button>
          <button
            type="button"
            onClick={() => scrollToId('contact')}
            className="h-11 rounded-full border-[1.5px] border-[var(--nav-text-strong)] bg-transparent px-[22px] font-body text-sm text-[var(--nav-text-strong)]
                       [transition:background_.2s,color_.2s,border-color_.5s] hover:bg-[var(--nav-btn-bg)] hover:text-[var(--nav-btn-fg)] max-sm:hidden"
          >
            Contact
          </button>
          <button
            type="button"
            onClick={() => scrollToId('booking')}
            className="h-11 rounded-full bg-[var(--nav-btn-bg)] px-[22px] font-body text-sm text-[var(--nav-btn-fg)] transition-opacity duration-200 hover:opacity-85
                       max-sm:h-10 max-sm:px-4 max-sm:text-[13px] max-[375px]:h-9 max-[375px]:px-3.5 max-[375px]:text-xs"
          >
            Book Appointment
          </button>
        </div>
      </div>
    </nav>
  );
}