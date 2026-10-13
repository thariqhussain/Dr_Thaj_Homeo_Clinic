import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { CARE_AREAS, QUALIFICATIONS } from '../data/content';
import { prefersReducedMotion } from '../lib/utils';

/* Qualifications + areas of care. The doctor's portrait/bio card now lives in
   DoctorCard.jsx (hero, right side). The `dp-*` class names that aren't styled
   are GSAP selector hooks, scoped to this section by gsap.context(). */

export default function DoctorProfile() {
  const section = useRef(null);
  const [open, setOpen] = useState(0);              // accordion: index of the open card (or -1)
  const [animated, setAnimated] = useState(false);  // true once GSAP takes over the timeline dots
  const [lit, setLit] = useState([]);               // timeline items the scroll has reached

  useEffect(() => {
    if (prefersReducedMotion()) return;
    setAnimated(true);

    const ctx = gsap.context(() => {
      const q = (s) => section.current.querySelector(s);

      /* 2 — bottom block */
      gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: '.dp-bottom', start: 'top 80%', once: true } })
        .from('.dp-h3', { y: 18, opacity: 0, duration: 0.6, stagger: 0.1 })
        .from('.dp-tl-item', { x: -22, opacity: 0, duration: 0.7, stagger: 0.14 }, '-=0.3')
        .from('.dp-card', { y: 30, opacity: 0, duration: 0.7, stagger: 0.12, clearProps: 'transform,opacity' }, '<0.1');

      /* 3 — timeline line fills with scroll, dots light up as it passes */
      gsap.fromTo('.dp-tl-fill', { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.dp-timeline', start: 'top 70%', end: 'bottom 60%', scrub: true },
      });
      section.current.querySelectorAll('.dp-tl-item').forEach((item, i) => {
        ScrollTrigger.create({
          trigger: item, start: 'top 70%',
          onEnter: () => setLit((l) => (l.includes(i) ? l : [...l, i])),
          onLeaveBack: () => setLit((l) => l.filter((x) => x !== i)),
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="doctors" ref={section} aria-label="Qualifications and areas of care"
      className="relative mx-2.5 mb-2.5 mt-2.5 flex min-h-[75svh] items-center overflow-hidden rounded-[18px] border border-accent/20 bg-[linear-gradient(160deg,#f7f9f5_0%,#e7efe5_100%)] px-12 py-10
                 max-lg:px-8 max-lg:py-10 max-sm:px-4 max-sm:py-10 max-[375px]:px-3 max-[375px]:py-8 max-[320px]:px-2.5 max-[320px]:py-8"
    >
      <span aria-hidden="true" className="orb pause-offscreen z-0 -left-20 -top-[90px] h-[340px] w-[340px] animate-dp-float bg-accent/[.28] motion-reduce:animate-none" />
      <span aria-hidden="true" className="orb pause-offscreen z-0 -bottom-20 -right-[60px] h-[300px] w-[300px] animate-dp-float-rev bg-accent-light/90 motion-reduce:animate-none" />

      <div className="relative z-[1] mx-auto w-full max-w-[1120px]">
        {/* BOTTOM: credentials + areas of care */}
        <div className="dp-bottom grid grid-cols-[.85fr_1.15fr] gap-14 max-[960px]:grid-cols-1 max-[960px]:gap-11">
          <div>
            <h3 className="dp-h3 mb-[26px] font-display text-[26px] font-normal text-p9">Qualifications</h3>
            <div className="dp-timeline relative pl-[34px]">
              <span aria-hidden="true" className="absolute bottom-2 left-[7px] top-2 w-0.5 rounded-sm bg-line" />
              <span aria-hidden="true" className="dp-tl-fill absolute bottom-2 left-[7px] top-2 w-0.5 origin-top rounded-sm bg-accent" />
              <ol className="flex flex-col gap-[30px]">
                {QUALIFICATIONS.map((q, i) => {
                  const dim = animated && !lit.includes(i);
                  return (
                    <li key={q.title} className="dp-tl-item relative block">
                      <span
                        aria-hidden="true"
                        className={`absolute -left-[34px] top-[5px] h-4 w-4 rounded-full border-[3px] border-paper
                                    [transition:transform_.4s_cubic-bezier(.34,1.56,.64,1),background_.3s,box-shadow_.3s] motion-reduce:transition-none
                                    ${dim ? 'scale-75 bg-paper shadow-[0_0_0_1.5px_rgba(90,138,106,.28)]' : 'bg-accent shadow-[0_0_0_1.5px_#5a8a6a]'} ${animated && !dim ? 'scale-110' : ''}`}
                      />
                      <div>
                        <strong className="block text-[17px] font-semibold text-p9">{q.title}</strong>
                        <span className="mt-[3px] block text-[13.5px] text-p6">{q.desc}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          <div>
            <h3 className="dp-h3 mb-[26px] font-display text-[26px] font-normal text-p9">Areas of care</h3>
            <div className="flex flex-col gap-3.5">
              {CARE_AREAS.map((a, i) => {
                const isOpen = open === i;
                return (
                  <article
                    key={a.title}
                    className={`dp-card rounded-2xl border bg-paper transition-[box-shadow,transform,border-color] duration-300 motion-reduce:transition-none
                                ${isOpen ? 'border-accent shadow-[0_16px_34px_-20px_rgba(90,138,106,.6)]' : 'border-line hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-18px_rgba(33,37,41,.35)]'}`}
                  >
                    <button
                      type="button" id={`dp-h${i + 1}`} aria-expanded={isOpen} aria-controls={`dp-p${i + 1}`}
                      onClick={() => setOpen(isOpen ? -1 : i)}
                      className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border-0 bg-transparent px-5 py-4 text-left font-body text-inherit
                                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                                 max-[480px]:gap-3 max-[480px]:p-3.5"
                    >
                      <span aria-hidden="true" className={`grid h-11 w-11 flex-none place-items-center rounded-xl transition-colors duration-300 ${isOpen ? 'bg-accent text-white' : 'bg-accent-light text-accent'}`}>
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          {a.icon.map((d) => <path key={d} d={d} />)}
                        </svg>
                      </span>
                      <span className="flex-1 text-[16.5px] font-semibold text-p9">
                        {a.title}
                        <small className="mt-0.5 block text-[12.5px] font-normal text-p6">{a.chips.length} areas</small>
                      </span>
                      {/* plus → minus */}
                      <span aria-hidden="true" className="relative h-[18px] w-[18px] flex-none">
                        <span className="absolute left-0 top-2 h-0.5 w-[18px] rounded-sm bg-p7" />
                        <span className={`absolute left-0 top-2 h-0.5 w-[18px] rounded-sm bg-p7 transition-transform duration-[350ms] motion-reduce:transition-none ${isOpen ? 'rotate-0' : 'rotate-90'}`} />
                      </span>
                    </button>
                    <div
                      id={`dp-p${i + 1}`} role="region" aria-labelledby={`dp-h${i + 1}`}
                      className={`grid transition-[grid-template-rows] duration-[450ms] motion-reduce:transition-none ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                    >
                      <div className={`overflow-hidden px-5 max-[480px]:px-3.5 ${isOpen ? 'pb-5 max-[480px]:pb-4' : ''}`}>
                        <ul className="mb-3.5 flex flex-wrap gap-2">
                          {a.chips.map((c) => (
                            <li key={c} className="rounded-full bg-accent-light px-3.5 py-[7px] text-[13px] text-[#2f5a3f]">{c}</li>
                          ))}
                        </ul>
                        <a href="#treatments" className="link-arrow-light !text-[13.5px]">Related treatments →</a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}