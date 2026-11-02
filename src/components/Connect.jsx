import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import Journey from './Journey';
import { MAPS_URL, REVIEWS_URL, SOCIALS } from '../data/content';
import { prefersReducedMotion } from '../lib/utils';

/* Connect — proof + links on the left, the care journey carousel (Journey.jsx, embedded) on the right: one section.

   The four channels (Justdial, Google Maps, Instagram, Facebook) are a still row of logos (no text, no looping): they pop in
   once as the section arrives, then stay put. Each link carries its name for screen readers.
   Instagram / Facebook links come from SOCIALS in content.js, so a logo only appears when that account has a url. */

const DEEP = '#2f5a3f';   // the star marks

/* One logo per channel, drawn to match what it is. */
const JustdialLogo = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <rect width="48" height="48" rx="12" fill="#0b6fd6" />
    <path d="M24 9l4.4 9.2 10.1 1.3-7.4 7 1.9 10L24 31.6 15 36.5l1.9-10-7.4-7 10.1-1.3L24 9z" fill="#ffd23f" />
  </svg>
);
const MapsLogo = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <rect width="48" height="48" rx="12" fill="#e8f0fe" />
    <path d="M24 6c-7 0-12.5 5.4-12.5 12.3 0 8.6 9.6 17.6 11.6 23.3.3.8 1.5.8 1.8 0 2-5.7 11.6-14.7 11.6-23.3C36.5 11.4 31 6 24 6z" fill="#ea4335" />
    <path d="M24 6c-3.3 0-6.2 1.5-8.2 3.8L24 20V6z" fill="#fbbc04" />
    <path d="M36.5 18.3c0-2.8-.9-5.3-2.4-7.4L24 20l12.5 7.2c0-3 0-6.8 0-8.9z" fill="#4285f4" opacity=".9" />
    <circle cx="24" cy="18.5" r="5" fill="#fff" />
  </svg>
);
const InstagramLogo = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <defs>
      <linearGradient id="ig-g" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#feda75" /><stop offset=".35" stopColor="#fa7e1e" /><stop offset=".6" stopColor="#d62976" /><stop offset=".8" stopColor="#962fbf" /><stop offset="1" stopColor="#4f5bd5" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#ig-g)" />
    <rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" strokeWidth="3" />
    <circle cx="24" cy="24" r="6.5" fill="none" stroke="#fff" strokeWidth="3" />
    <circle cx="32" cy="16" r="2" fill="#fff" />
  </svg>
);
const FacebookLogo = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <rect width="48" height="48" rx="12" fill="#1877f2" />
    <path d="M26.5 40V26.5h4.5l.7-5.3h-5.2v-3.4c0-1.5.4-2.6 2.6-2.6h2.8V10.5c-.5-.1-2.1-.2-4-.2-4 0-6.7 2.4-6.7 6.9v4H16.5v5.3h4.7V40h5.3z" fill="#fff" />
  </svg>
);

export default function Connect() {
  const section = useRef(null);
  const scoreEl = useRef(null);

  const social = (icon) => SOCIALS.find((s) => s.icon === icon)?.url;
  const channels = [
    { key: 'justdial', href: REVIEWS_URL, title: 'Justdial Reviews', caption: 'Read our patient reviews', logo: JustdialLogo },
    { key: 'maps', href: MAPS_URL, title: 'Maps', caption: 'Get directions to the clinic', logo: MapsLogo },
    { key: 'instagram', href: social('instagram'), title: 'Instagram', caption: 'Follow us', logo: InstagramLogo },
    { key: 'facebook', href: social('facebook'), title: 'Facebook', caption: 'Follow us', logo: FacebookLogo },
  ].filter((c) => c.href);

  /* entrance (layout effect so the 0.0 start never flashes as 5.0 first). The number is written straight into the DOM,
     not through React state, so the counter doesn't re-render the section on every frame. */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const el = scoreEl.current;
    if (el) el.textContent = '0.0';
    const counter = { v: 0 };
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: section.current, start: 'top 70%', once: true } });
      tl
        .from('.cn-head', { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 })
        .from('.cn-proof', { y: 24, opacity: 0, duration: 0.7 }, '-=0.4')
        .to(counter, { v: 5, duration: 1.4, ease: 'power2.out', onUpdate: () => { if (el) el.textContent = counter.v.toFixed(1); }, onComplete: () => { if (el) el.textContent = '5.0'; } }, '<0.15')
        .from('.cn-star', { opacity: 0, scale: 0.2, rotation: -60, duration: 0.5, stagger: 0.09, ease: 'back.out(2)' }, '<0.3')
        .from('.cn-logo', { y: 20, opacity: 0, scale: 0.8, duration: 0.5, stagger: 0.08, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }, '-=0.9');
    }, section);
    return () => { ctx.revert(); if (el) el.textContent = '5.0'; };
  }, []);

  return (
    <section
      id="testimonials" ref={section} aria-labelledby="cn-title"
      className="relative mx-2.5 my-2.5 rounded-[18px] bg-[#e4ece1] px-12 py-24 text-p9
                 max-lg:px-8 max-lg:py-16 max-sm:px-4 max-sm:py-12 max-[375px]:px-3 max-[320px]:px-2.5"
    >
      <div className="mx-auto grid w-full max-w-[1240px] gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center">

        {/* LEFT: heading, proof, channels */}
        <div className="flex min-w-0 flex-col gap-10">
          <h2 id="cn-title" className="cn-head font-display text-[clamp(34px,4.6vw,64px)] font-normal leading-[1.04] tracking-[-.02em]">
            Connect with us
          </h2>
          <p className="cn-head -mt-6 max-w-[460px] text-[17px] leading-[1.6] text-p8">
            Read what patients say, find us on the map, or follow the clinic for updates.
          </p>

          <div className="cn-proof flex w-fit items-center gap-5 rounded-[24px] bg-paper px-7 py-5 shadow-[0_24px_48px_-30px_rgba(33,37,41,.45)] ring-1 ring-p9/5 max-sm:gap-4 max-sm:px-5 max-sm:py-4">
            <span ref={scoreEl} aria-hidden="true" className="font-display text-[clamp(64px,7vw,96px)] font-normal leading-[.9] tabular-nums">5.0</span>
            <span className="flex flex-col gap-2">
              <span className="flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg key={i} className="cn-star" width="22" height="22" viewBox="0 0 24 24" fill={DEEP}>
                    <path d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 18.1 5.6 21.6 7 14.5 1.7 9.5l7.2-.9L12 2z" />
                  </svg>
                ))}
              </span>
              <span className="text-[18px] leading-[1.5]"><span className="sr-only">Rated 5.0 out of 5. </span>35 ratings on Justdial</span>
            </span>
          </div>

          {/* the channels: just the logos, in one still row */}
          <div className="flex flex-col gap-3">
            <p className="m-0 text-[12px] font-semibold uppercase tracking-[.14em] text-accent">Find us on</p>
            <ul className="cn-row m-0 flex list-none flex-wrap items-center gap-4 p-0">
              {channels.map((c) => (
                <li key={c.key}>
                  <a
                    href={c.href} target="_blank" rel="noopener" aria-label={`${c.title}: ${c.caption}`} title={c.title}
                    className="cn-logo block h-[76px] w-[76px] rounded-[20px] bg-paper p-2 shadow-[0_14px_28px_-16px_rgba(33,37,41,.45)] ring-1 ring-p9/5 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_34px_-16px_rgba(33,37,41,.5)]
                               focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5a3f] max-sm:h-[68px] max-sm:w-[68px] [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                  >
                    {c.logo}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT: the care journey (below lg it stacks under the left side) */}
        <Journey embedded />
      </div>
    </section>
  );
}