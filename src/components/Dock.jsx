import { useEffect, useState } from 'react';
import { DOCK_LINKS } from '../data/content';

/* Sticky pill of shortcuts: appears after the hero, hides when the footer is on screen. */
export default function Dock() {
  const [pastTop, setPastTop] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastTop(window.scrollY > 320);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const footer = document.getElementById('siteFooter');
    let io;
    if (footer && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(([e]) => setFooterVisible(e.isIntersecting), { threshold: 0.15 });
      io.observe(footer);
    }
    return () => { window.removeEventListener('scroll', onScroll); io?.disconnect(); };
  }, []);

  const show = pastTop && !footerVisible;

  return (
    <nav
      id="ftDock" aria-label="Page shortcuts"
      className={`fixed bottom-[18px] left-1/2 z-[90] flex max-w-[calc(100%-24px)] items-center gap-0.5 rounded-full border border-p5/40 bg-white/[.94] p-1.5
                  shadow-[0_14px_34px_-14px_rgba(33,37,41,.35),inset_0_1px_1px_rgba(255,255,255,.9)]
                  [transition:transform_.55s_cubic-bezier(.34,1.2,.64,1),opacity_.35s_ease] motion-reduce:transition-none
                  max-sm:bottom-2.5 max-sm:overflow-x-auto max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden
                  ${show ? 'pointer-events-auto -translate-x-1/2 translate-y-0 opacity-100' : 'pointer-events-none -translate-x-1/2 translate-y-[140%] opacity-0'}`}
    >
      {DOCK_LINKS.map((l) => (
        <a key={l.href} href={l.href} className="whitespace-nowrap rounded-full px-4 py-[9px] text-[13.5px] font-medium text-p7 no-underline transition-[background,color] duration-[250ms] hover:bg-p9/[.08] hover:text-p9 max-sm:px-3 max-sm:py-2 max-sm:text-[12.5px]">
          {l.label}
        </a>
      ))}
      <a href="#booking" className="whitespace-nowrap rounded-full bg-p9 px-4 py-[9px] text-[13.5px] font-medium text-p1 no-underline transition-[background,color] duration-[250ms] hover:bg-accent hover:text-white max-sm:px-3 max-sm:py-2 max-sm:text-[12.5px]">
        Book
      </a>
    </nav>
  );
}
