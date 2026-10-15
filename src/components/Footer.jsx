import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { CLINIC_PHONE, PHARMACY } from '../data/content';
import { useMagnetic } from '../hooks/useMagnetic';
import SocialLinks from './SocialLinks';
import { prefersReducedMotion } from '../lib/utils';

const MARQUEE = ['Thyroid', 'Asthma', 'Migraine', 'Joint Pain', 'Eczema', 'Digestive Care', "Women's Health", 'Child Health'];
const WORD = 'Dr. Thaj';
/* consultation days + both sessions, read from content.js → PHARMACY.hours */
const CONSULT = PHARMACY.hours.find((h) => h.key === 'consultation');

const colHead = 'mb-3.5 text-xs font-semibold uppercase tracking-[.14em] text-mint';

export default function Footer() {
  const ft = useRef(null);
  const cta = useRef(null);
  useMagnetic(cta);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: ft.current, start: 'top 85%', once: true } })
        .from('.ft-marquee', { opacity: 0, duration: 0.8 });
      gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: '.ft-grid', start: 'top 85%', once: true } })
        .from('.ft-grid > *', { y: 30, opacity: 0, duration: 0.7, stagger: 0.1 });
      /* wordmark: plays every time the footer is reached from above, and resets when it is scrolled back out of view.
         toggleActions = onEnter | onLeave | onEnterBack | onLeaveBack */
      gsap.fromTo('.ft-letter',
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0, opacity: 1, duration: 1.1, ease: 'power4.out', stagger: 0.06,
          scrollTrigger: { trigger: '.ft-word', start: 'top 95%', toggleActions: 'restart none restart reset' },
        });
    }, ft);
    return () => ctx.revert();
  }, []);

  return (
    <footer
      id="siteFooter" ref={ft}
      className="relative m-2.5 flex min-h-[60svh] flex-col overflow-hidden rounded-[28px] bg-[radial-gradient(110%_80%_at_0%_0%,#254033_0%,#14211a_55%,#0d1511_100%)] px-12 pb-[18px] pt-11 text-p3
                 max-[900px]:rounded-[22px] max-[900px]:px-6 max-[900px]:pb-4 max-[900px]:pt-8 max-[520px]:m-2 max-[520px]:px-[18px] max-[520px]:pb-3.5 max-[520px]:pt-7"
    >
      <span aria-hidden="true" className="orb pause-offscreen -right-20 -top-[140px] h-[420px] w-[420px] animate-ft-float bg-accent/35 motion-reduce:animate-none" />
      <span aria-hidden="true" className="orb pause-offscreen -bottom-[120px] -left-20 h-[340px] w-[340px] animate-ft-float-rev bg-accent-light/[.12] motion-reduce:animate-none" />

      {/* columns */}
      <div className="ft-grid relative z-[1] mx-auto grid w-full max-w-[1120px] grid-cols-[1.4fr_.9fr_1.3fr_1.1fr] gap-12 max-[900px]:grid-cols-3 max-[900px]:gap-x-7 max-[900px]:gap-y-8 max-[640px]:grid-cols-2">
        <div className="max-[900px]:col-span-full">
          <img src="/assets/doctors/clinic_logo.webp" alt="Dr. Thaj Homoeo Clinic" width="168" height="96" loading="lazy" decoding="async" className="mb-5 h-24 w-auto max-[900px]:h-20 max-[520px]:h-[72px]" />
          <p className="max-w-[300px] text-sm leading-[1.7] text-p5 max-[900px]:max-w-[420px]">
            Personalised homoeopathic care in Minjur, Chennai — treat the person as whole.
          </p>
          <SocialLinks className="mt-5" />
          <a
            ref={cta} href="#booking"
            className="ft-cta-btn relative mt-[22px] inline-flex items-center gap-3.5 overflow-hidden rounded-full bg-white py-[5px] pl-[22px] pr-[5px] text-sm font-semibold text-p9 no-underline will-change-transform [isolation:isolate]"
          >
            <span>Book appointment</span>
            <i aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-p9 pb-0.5 text-xl not-italic leading-none text-white [transition:transform_.4s_cubic-bezier(.34,1.4,.64,1)]">&rarr;</i>
          </a>
        </div>

        <nav aria-label="Quick links">
          <h4 className={colHead}>Quick links</h4>
          <ul className="flex flex-col gap-[9px] text-[15px]">
            {[['#home', 'Home'], ['#about', 'About'], ['#doctors', 'Doctor'], ['#journey', 'Care journey'], ['#testimonials', 'Reviews & social'], ['#faq', 'FAQ']].map(([h, l]) => (
              <li key={h}><a href={h} className="ft-link">{l}</a></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Treatments">
          <h4 className={colHead}>Treatments</h4>
          <p className="max-w-[300px] text-[15px] leading-[1.7] text-p5">
            We provide personalised homoeopathic care for a wide range of acute and chronic health concerns. Please visit our Treatments section to see the conditions we commonly care for.
          </p>
          <a href="#treatments" className="ft-link mt-4 text-[15px] font-medium text-accent-light">Explore treatments &rarr;</a>
        </nav>

        <div className="max-[640px]:col-span-full">
          <h4 className={colHead}>Contact &amp; hours</h4>
          <a
            href={`tel:${CLINIC_PHONE.tel}`} aria-label={`Contact us on ${CLINIC_PHONE.display}`}
            className="inline-flex items-center gap-3.5 rounded-full border border-white/30 bg-white/[.08] py-[5px] pl-[22px] pr-[5px] text-sm font-semibold text-white no-underline
                       [transition:background_.3s,color_.3s,border-color_.3s] hover:border-accent-light hover:bg-accent-light hover:text-p9
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            <span>Contact us</span>
            <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-accent-light text-p9">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.4 2 2 0 0 1 3.05 1.22h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.07a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
          </a>
          {CONSULT && (
            <div className="mt-6 text-[15px] leading-[1.7]">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-p5">Consultation</p>
              <p className="text-p3">{CONSULT.days}</p>
              {CONSULT.time.split(', ').map((t) => <p key={t} className="text-p3">{t}</p>)}
            </div>
          )}
        </div>
      </div>

      {/* scrolling treatments strip */}
      <div className="ft-marquee group relative z-[1] -mx-12 mt-7 overflow-hidden border-y border-white/[.12] py-3 max-[900px]:-mx-6 max-[520px]:-mx-[18px]" aria-hidden="true">
        <div className="pause-offscreen flex w-max animate-ft-scroll motion-reduce:animate-none group-hover:[animation-play-state:paused]">
          {[...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i} className="flex items-center whitespace-nowrap font-display text-[clamp(18px,2.2vw,28px)] text-white/55 after:mx-8 after:text-[.5em] after:text-accent after:content-['✦']">
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* giant wordmark */}
      <div
        aria-hidden="true"
        className="ft-word relative z-[1] -mx-2.5 flex flex-[1_0_auto] select-none items-end justify-center overflow-hidden whitespace-nowrap pb-[.12em] pt-[.04em] font-display text-[min(15vw,24vh)] leading-[1.12]"
      >
        {[...WORD].map((ch, i) => <span key={i} className="ft-letter">{ch === ' ' ? '\u00A0' : ch}</span>)}
      </div>

      <div className="relative z-[1] mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 border-t border-white/[.12] pt-4 text-[12.5px] text-p5">
        <span>© {new Date().getFullYear()} Dr. Thaj Homoeo Clinic. All rights reserved.</span>
        <button
          type="button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/25 bg-white/[.08] text-white
                     [transition:background_.3s,color_.3s,transform_.4s_cubic-bezier(.34,1.4,.64,1)] hover:-translate-y-[5px] hover:bg-accent-light hover:text-p9"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
        </button>
      </div>
    </footer>
  );
}