import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { EMAIL, MAPS_URL, PHONES } from '../data/content';
import { useMagnetic } from '../hooks/useMagnetic';
import OpenStatus from './OpenStatus';
import SocialLinks from './SocialLinks';
import { prefersReducedMotion } from '../lib/utils';

const MARQUEE = ['Thyroid', 'Asthma', 'Migraine', 'Joint Pain', 'Eczema', 'Digestive Care', "Women's Health", 'Child Health'];
const WORD = 'Dr. Thaj';

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
      gsap.from('.ft-letter', {
        yPercent: 100, opacity: 0, duration: 1.1, ease: 'power4.out', stagger: 0.06,
        scrollTrigger: { trigger: '.ft-word', start: 'top 95%', once: true },
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
      <div className="ft-grid relative z-[1] mx-auto grid w-full max-w-[1120px] grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-12 max-[900px]:grid-cols-3 max-[900px]:gap-x-7 max-[900px]:gap-y-8 max-[640px]:grid-cols-2">
        <div className="max-[900px]:col-span-full">
          <img src="/assets/doctors/clinic_logo.png" alt="Dr. Thaj Homoeo Clinic" width="140" height="80" loading="lazy" decoding="async" className="mb-4 h-14 w-auto" />
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
          <ul className="flex flex-col gap-[9px] text-[15px]">
            {['Asthma & respiratory', 'Skin disorders', 'Migraine', 'Joint pain', 'Thyroid care'].map((l) => (
              <li key={l}><a href="#treatments" className="ft-link">{l}</a></li>
            ))}
          </ul>
        </nav>

        <div className="max-[640px]:col-span-full">
          <h4 className={colHead}>Visit &amp; contact</h4>
          <ul className="flex flex-col gap-[9px] text-[15px]">
            {PHONES.map((p) => <li key={p.tel}><a href={`tel:${p.tel}`} className="ft-link">{p.display}</a></li>)}
            {EMAIL && <li><a href={`mailto:${EMAIL}`} className="ft-link">{EMAIL}</a></li>}
            <li><a href="#booking" className="ft-link">Book appointment</a></li>
            <li><a href="#contact" className="ft-link">Clinic details</a></li>
            <li><a href={MAPS_URL} target="_blank" rel="noopener" className="ft-link">Get directions</a></li>
            <li className="text-[13.5px] text-p5">Consultation Mon – Sat · 6 – 10 PM</li>
            <li><OpenStatus which="consultation" /></li>
          </ul>
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