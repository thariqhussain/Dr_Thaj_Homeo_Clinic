import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { introDone } from '../lib/intro';
import { NAV_LINKS } from '../data/content';
import StaggeredMenu from './StaggeredMenu';
import { prefersReducedMotion, scrollToId } from '../lib/utils';

/* Pill navigation: the logo and every link are separate pills, centred, with space between them.
   Styling lives in index.css (.pn-*): on hover a translucent circle swells up from the bottom of the pill and the
   label rolls over. Below 640px only the logo, Book Appointment and a Menu pill are shown.

   Cheap by design: no backdrop blur, no cursor tracking, only transform / opacity animations.

   Load intro (kept short): the logo fades in, then the pills drop in with a quick stagger. When it is under way the
   doctor photo is told to start (see lib/intro.js). */

const INTRO_DELAY = 0.1;    // seconds; kept short so the hero is not held back

/* social links shown at the bottom of the phone menu. Leave empty to hide them, or fill in like:
   { label: 'Instagram', href: 'https://instagram.com/…' } */
const SOCIALS = [];

/* phone menu: every section once (links that NAV_LINKS already has are not repeated) */
const MENU_ITEMS = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  ...NAV_LINKS,
  { href: '#results', label: 'Results' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
].filter((it, i, all) => all.findIndex((x) => x.href === it.href) === i);

/* two stacked copies of the label: the second rolls in from below on hover */
const Label = ({ children }) => (
  <span className="pn-label"><span>{children}</span><span aria-hidden="true">{children}</span></span>
);

export default function Navbar() {
  const rowRef = useRef(null);
  const navRef = useRef(null);

  /* over a dark section (marked data-nav-dark) the pills switch to light ink.
     Reads the position of those few elements once per scroll frame — no hit-testing, no layout work. */
  useEffect(() => {
    const nav = navRef.current;
    let raf = 0;
    const check = () => {
      raf = 0;
      let dark = false;
      document.querySelectorAll('[data-nav-dark]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= 40 && r.bottom >= 40) dark = true;
      });
      nav.classList.toggle('is-dark', dark);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(check); };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    window.addEventListener('load', on);
    on();
    return () => {
      window.removeEventListener('scroll', on); window.removeEventListener('resize', on); window.removeEventListener('load', on);
      cancelAnimationFrame(raf);
    };
  }, []);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      const logo = row.querySelector('.pn-logo');
      const pills = row.querySelectorAll('.pn-pill');
      gsap.set(logo, { scale: 0.6, opacity: 0 });
      gsap.set(pills, { opacity: 0, y: -14 });
      gsap.timeline({ delay: INTRO_DELAY })
        .to(logo, { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' }, 0)
        .to(pills, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.1)
        .add(() => introDone('nav'), 0.05)                      // the nav is under way → the doctor photo may start
        .set(logo, { clearProps: 'transform,opacity' });
    }, row);
    return () => ctx.revert();
  }, []);

  return (
    <nav id="siteNav" ref={navRef} className="site-nav pointer-events-none fixed inset-x-0 top-[14px] z-[100] flex justify-center max-sm:top-2.5 max-[375px]:top-2">
      <div ref={rowRef} className="pointer-events-auto flex items-center gap-3 max-lg:gap-2 max-sm:gap-2.5">
        <a href="#" aria-label="Dr. Thaj Homoeo Clinic — home" className="pn-logo">
          <img
            src="/assets/doctors/clinic_logo_400.webp" alt="Dr. Thaj Homoeo Clinic logo" width="400" height="314"
            className="block h-[68px] w-auto max-lg:h-[56px] max-sm:h-[42px]"
          />
        </a>

        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} className="pn-pill max-sm:hidden"><Label>{l.label}</Label></a>
        ))}

        <button type="button" onClick={() => scrollToId('contact')} className="pn-pill max-lg:hidden"><Label>Contact</Label></button>
        <button type="button" onClick={() => scrollToId('booking')} className="pn-pill pn-pill--strong max-sm:px-4 max-sm:text-[13px]"><Label>Book Appointment</Label></button>
        <StaggeredMenu
          items={MENU_ITEMS} socials={SOCIALS} footer={{ href: '#booking', label: 'Book an appointment' }}
          className="sm:hidden"
        />
      </div>
    </nav>
  );
}