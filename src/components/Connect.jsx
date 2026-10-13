import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import JourneyPanel from './JourneyPanel';
import { MAPS_URL, REVIEWS_URL } from '../data/content';
import { useSpotlight } from '../hooks/useSpotlight';
import { prefersReducedMotion } from '../lib/utils';

function SocialItem({ href, label, sub, acc, iconWrap, children }) {
  const ref = useRef(null);
  useSpotlight(ref);
  return (
    <li>
      <a
        ref={ref} href={href} target="_blank" rel="noopener" aria-label={label} style={{ '--acc': acc }}
        className="social-item spotlight relative flex items-center gap-3 overflow-hidden rounded-[18px] border border-line bg-white/[.78] px-4 py-3 text-p7 no-underline
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent"
      >
        <span className={`social-item-icon grid h-10 w-10 flex-shrink-0 place-items-center rounded-full shadow-[0_8px_18px_-8px_rgba(33,37,41,.4)] [transition:transform_.4s_cubic-bezier(.34,1.4,.64,1)] ${iconWrap}`}>
          {children}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-p9">{label}</span>
          <span className="text-[12px] leading-snug text-p6">{sub}</span>
        </span>
        <span
          aria-hidden="true"
          className="social-item-arrow ml-auto grid h-7 w-7 flex-none -rotate-45 place-items-center rounded-full border border-line text-[13px] text-p7
                     [transition:transform_.35s_ease,background_.3s,color_.3s,border-color_.3s]"
        >
          →
        </span>
      </a>
    </li>
  );
}

export default function Connect() {
  const section = useRef(null);
  const ratingRef = useRef(null);
  const [score, setScore] = useState('5.0');
  useSpotlight(ratingRef);

  /* entrance timeline (layout effect so there's no flash before it starts) */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    setScore('0.0');
    const counter = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: section.current, start: 'top 70%', once: true } })
        .from('.cn-head .eyebrow', { y: 14, opacity: 0, duration: 0.5 })
        .from('.cn-line > span', { yPercent: 115, duration: 0.9 }, '-=0.25')
        .from('.cn-sub', { y: 18, opacity: 0, duration: 0.7 }, '-=0.5')
        .from('.rating-card', { y: 40, opacity: 0, scale: 0.96, duration: 0.8 }, '-=0.4')
        .to(counter, { v: 5.0, duration: 1.4, ease: 'power2.out', onUpdate: () => setScore(counter.v.toFixed(1)), onComplete: () => setScore('5.0') }, '<0.15')
        .from('.cn-star', { opacity: 0, scale: 0.2, rotation: -60, duration: 0.5, stagger: 0.09, ease: 'back.out(2)' }, '<0.3')
        .from('.social-item', { y: 36, opacity: 0, duration: 0.7, stagger: 0.12, clearProps: 'transform,opacity' }, '-=0.9')
        .from('.cn-right', { y: 50, opacity: 0, duration: 0.9 }, '-=1.1')
        .from('.journey-carousel', { scale: 0.82, opacity: 0, duration: 1 }, '-=0.5')
        .from('.cn-rail li', { y: 14, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.5');
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="testimonials" ref={section}
      className="relative m-2.5 block overflow-hidden rounded-[18px] border border-accent/20 bg-[linear-gradient(200deg,#f7f9f5_0%,#e7efe5_100%)] px-12 py-6
                 max-[900px]:px-6 max-[900px]:py-8 max-[560px]:px-3 max-[560px]:py-6"
    >
      <span aria-hidden="true" className="orb pause-offscreen z-0 -right-20 -top-[120px] h-[360px] w-[360px] animate-cn-float bg-accent/[.26] motion-reduce:animate-none" />
      <span aria-hidden="true" className="orb pause-offscreen z-0 -bottom-[100px] -left-[90px] h-[320px] w-[320px] animate-cn-float-rev bg-accent-light/95 motion-reduce:animate-none" />

      {/* two columns: [heading + rating + links] | [care journey] — the heading moved into the left column to save a whole row of height */}
      <div className="relative z-[1] mx-auto grid max-w-[1120px] grid-cols-[1fr_1.15fr] items-stretch gap-4 max-[900px]:grid-cols-1">
        <div className="flex flex-col gap-3 text-left">
          <header className="cn-head">
            <p className="eyebrow eyebrow-light !mb-1">Find us online</p>
            <h2 className="mb-2 mt-1 font-display text-[clamp(28px,3vw,40px)] font-normal leading-[1.08] tracking-[-.01em] text-p9">
              <span className="cn-line block overflow-hidden pb-[.12em]"><span className="block">Connect with <em className="italic text-accent">us</em></span></span>
            </h2>
            <p className="cn-sub max-w-[460px] text-[14px] leading-[1.6] text-p7">
              Read our patient reviews, follow our wellness tips, and reach us on the platform you prefer.
            </p>
          </header>

          <div
            ref={ratingRef}
            className="rating-card spotlight relative flex flex-1 items-center gap-5 overflow-hidden rounded-[20px] border border-line bg-paper p-5
                       shadow-[0_24px_50px_-28px_rgba(33,37,41,.35)]"
          >
            <span className="relative font-display text-[clamp(52px,5vw,72px)] font-normal leading-[.9] text-p9 tabular-nums">{score}</span>
            <span className="relative flex flex-col gap-1.5">
              <span className="flex gap-[3px] text-xl text-[#f4b942]" role="img" aria-label="5 out of 5 stars">
                {[0, 1, 2, 3, 4].map((i) => <span key={i} className="cn-star inline-block">★</span>)}
              </span>
              <span className="text-sm text-p6">35 ratings on Justdial</span>
            </span>
          </div>

          <ul className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
            <SocialItem href={REVIEWS_URL} label="Justdial Reviews" sub="Read our patient reviews" acc="#1e6fdc" iconWrap="bg-white text-[#f26b21]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 18.1 5.6 21.6 7 14.5 1.7 9.5l7.2-.9L12 2z" />
              </svg>
            </SocialItem>
            <SocialItem href={MAPS_URL} label="Maps" sub="Get directions to the clinic" acc="#34a853" iconWrap="bg-[#34a853] text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.8" r="2.4" />
              </svg>
            </SocialItem>
          </ul>
        </div>

        {/* RIGHT — journey */}
        <JourneyPanel />
      </div>
    </section>
  );
}