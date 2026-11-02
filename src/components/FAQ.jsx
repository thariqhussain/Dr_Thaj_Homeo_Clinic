import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { FAQS, PHONES, WA_NUMBER } from '../data/content';
import { prefersReducedMotion } from '../lib/utils';

/* Frequently asked questions, told by scrolling.
   - A huge grey "Questions" slides sideways behind the heading as the section passes.
   - The questions are big numbered rows. The row nearest the middle of the screen is "in focus" (the others dim) and the
     left-hand counter follows it. Tapping a row opens its answer (one at a time).
   - On hover the question's ink floods in from the left (needs the .fq-* rules added to index.css).
   Copy lives in content.js → FAQS. The same questions are also published as FAQPage structured data, which lets Google show
   them under the clinic's search result. Reduced motion: no sliding, no dimming. */

const pad2 = (v) => String(v).padStart(2, '0');

export default function FAQ() {
  const root = useRef(null);
  const count = useRef(null);
  const [open, setOpen] = useState(0);
  const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hello, I have a question about Dr. Thaj Homoeo Clinic.')}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.to('.fq-ghost', { xPercent: -28, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from('.fq-intro > *', { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: root.current, start: 'top 75%', once: true } });
      gsap.utils.toArray('.fq-row').forEach((row, i) => {
        gsap.from(row, { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: row, start: 'top 92%', once: true } });
        ScrollTrigger.create({
          trigger: row, start: 'top 62%', end: 'bottom 38%',
          onToggle: (self) => {
            row.classList.toggle('is-focus', self.isActive);
            if (self.isActive && count.current) count.current.textContent = pad2(i + 1);
          },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="faq" ref={root} aria-labelledby="faq-title"
      className="relative isolate overflow-x-clip px-12 py-28 max-lg:px-8 max-lg:py-20 max-sm:px-4 max-sm:py-14 max-[375px]:px-3"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* the big grey word that drifts behind everything */}
      <div aria-hidden="true" className="pointer-events-none absolute left-0 top-10 -z-10 w-max select-none whitespace-nowrap font-display text-[clamp(160px,26vw,420px)] leading-[.9]">
        <span className="fq-ghost block pl-[8vw] text-[#6c757d] opacity-40">Questions &nbsp;Questions</span>
      </div>

      <div className="mx-auto grid max-w-[1180px] grid-cols-[.78fr_1.22fr] gap-16 max-lg:grid-cols-1 max-lg:gap-10">
        <div className="fq-intro lg:sticky lg:top-28 lg:self-start">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[.16em] text-accent">FAQ</p>
          <h2 id="faq-title" className="mb-5 font-display text-[clamp(34px,4.2vw,60px)] font-normal leading-[1.04] tracking-[-.02em] text-p9">
            Frequently asked questions
          </h2>
          <p className="mb-8 max-w-[380px] text-[16px] leading-[1.7] text-p7">
            Can't find what you are looking for? Ask us directly and our team will reply.
          </p>

          <p aria-hidden="true" className="mb-8 font-display leading-[.85] text-p9 max-lg:hidden">
            <span ref={count} className="text-[clamp(72px,9vw,140px)] tabular-nums">01</span>
            <span className="ml-2 text-[28px] text-p5">/ {pad2(FAQS.length)}</span>
          </p>

          <div className="flex flex-wrap gap-2.5">
            <a
              href={wa} target="_blank" rel="noopener"
              className="rounded-full bg-p9 px-6 py-3 text-sm font-medium text-p1 no-underline transition-colors duration-200 hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Ask on WhatsApp
            </a>
            <a
              href={`tel:${PHONES[0].tel}`} aria-label={`Call us on ${PHONES[0].display}`}
              className="rounded-full border-[1.5px] border-p9 px-6 py-[11px] text-sm font-medium text-p9 no-underline transition-colors duration-200 hover:bg-p9 hover:text-p1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Call us
            </a>
          </div>
        </div>

        <ul className="m-0 list-none p-0">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} data-open={isOpen || undefined} className="fq-row border-t border-line last:border-b">
                <h3 className="m-0">
                  <button
                    type="button" id={`faq-q${i}`} aria-expanded={isOpen} aria-controls={`faq-a${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="group flex w-full cursor-pointer items-start gap-5 border-0 bg-transparent py-7 text-left max-sm:gap-3 max-sm:py-5
                               focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <span aria-hidden="true" className="mt-1.5 w-9 flex-none font-display text-[18px] tabular-nums text-accent">{pad2(i + 1)}</span>
                    <span className="fq-q flex-1 font-display text-[clamp(22px,2.3vw,34px)] font-normal leading-[1.2]">{f.q}</span>
                    {/* plus turns into a cross, in a circle that fills on hover / when open */}
                    <span
                      aria-hidden="true"
                      className={`relative mt-1 grid h-10 w-10 flex-none place-items-center rounded-full border border-accent/50 transition-[background,transform] duration-300 group-hover:bg-accent/15 max-sm:h-9 max-sm:w-9 ${isOpen ? 'rotate-45 bg-accent/15' : ''}`}
                    >
                      <span className="absolute h-0.5 w-4 rounded-sm bg-p9" />
                      <span className="absolute h-4 w-0.5 rounded-sm bg-p9" />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-a${i}`} role="region" aria-labelledby={`faq-q${i}`}
                  className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[640px] pb-8 pl-14 text-[16px] leading-[1.8] text-p7 max-sm:pl-12 max-sm:text-[15px]">{f.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}