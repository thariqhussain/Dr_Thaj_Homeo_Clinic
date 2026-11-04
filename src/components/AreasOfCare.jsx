import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { CARE_AREAS } from '../data/content';
import { prefersReducedMotion } from '../lib/utils';

/* "Areas of care": the heading, a sentence and the one action on the left; every area and its conditions on the right.
   (Moved out of DoctorProfile.jsx into its own section, shown right below ClinicAdmin.)
   Content: CARE_AREAS in content.js. */

const DEEP = '#2f5a3f';   // the one deep accent field: the action

export default function AreasOfCare() {
  const section = useRef(null);

  /* plain entrance: the copy and the rows rise in one after another */
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.dp-areas-copy > *, .dp-row', {
        y: 16, opacity: 0, duration: 0.4, ease: 'power3.out', stagger: 0.045, clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.dp-areas', start: 'top 92%', once: true },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="areas-of-care" ref={section} aria-label="Areas of care"
      className="relative z-[2] my-2.5 overflow-x-clip px-[58px] py-24 text-p9
                 max-lg:px-[42px] max-lg:py-16 max-sm:px-[26px] max-sm:py-12 max-[375px]:px-[22px] max-[320px]:px-5"
    >
      <div aria-hidden="true" className="absolute inset-x-2.5 inset-y-0 rounded-[18px] bg-[#e4ece1]" />

      <div className="relative">
        <div className="dp-areas grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-14">
          <div className="dp-areas-copy self-start">
            <h2 className="font-display text-[clamp(34px,4.6vw,64px)] font-normal leading-[1.04] tracking-[-.02em]">Areas of care</h2>
            <p className="mt-6 max-w-[420px] text-[18px] leading-[1.6]">
              Personalised homoeopathic care for thyroid, respiratory, digestive, joint, women’s and children’s health.
            </p>
            <a
              href="#treatments"
              className="mt-8 inline-flex items-center rounded-full px-6 py-3 text-[15px] font-semibold text-white no-underline transition-colors duration-200 hover:!bg-p9
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5a3f]"
              style={{ backgroundColor: DEEP }}
            >
              See all treatments
            </a>
          </div>

          {/* one panel, rows told apart by a step in tone */}
          <div className="overflow-hidden rounded-[18px] bg-paper">
            {CARE_AREAS.map((a) => (
              <article
                key={a.title}
                className="dp-row grid gap-3 px-8 py-7 even:bg-[#eef4ec] sm:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] sm:gap-8 max-sm:px-6 max-sm:py-6"
              >
                <h3 className="font-display text-[28px] font-normal leading-[1.15]">{a.title}</h3>
                <ul className="flex flex-col gap-1 text-[18px] leading-[1.5]">
                  {a.chips.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}