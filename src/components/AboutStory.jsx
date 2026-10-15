import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { ABOUT_STORY } from '../data/content';
import { prefersReducedMotion } from '../lib/utils';

/* Structure 1 — sticky story.
   Left: one arch-shaped photo stays pinned (CSS `position: sticky`, no GSAP pin).
   Right: heading + a stack of cards. The card crossing 60% of the viewport
   becomes `active`; that single index drives the photo, counter, caption and
   progress bars. Mobile / tablet: the photo stays pinned under the navbar at the photo's OWN
   proportions (read from the first image), so about 90% of the picture is visible (SHOWN below).
   The frame's height is capped to a share of the screen so the cards stay visible.

   NOTE: no `overflow-hidden` on <section> — it would break `position: sticky`.
   `overflow-x-clip` hides the orbs without creating a scroll container. */

const N = ABOUT_STORY.length;
const SHOWN = 0.9;   // share of the photo's height that stays visible on mobile / tablet (1 = whole photo, lower = tighter crop)
const pad = (i) => String(i + 1).padStart(2, '0');

export default function AboutStory() {
  const section = useRef(null);
  const [active, setActive] = useState(0);
  const [ratio, setRatio] = useState(4 / 3);   // width / height of the photos, measured from the first one (used below lg only)
  const measure = (img) => {
    if (img?.naturalWidth && img?.naturalHeight) setRatio(Math.min(1.8, Math.max(0.55, img.naturalWidth / img.naturalHeight)));
  };
  useEffect(() => { measure(section.current?.querySelector('img')); }, []);   // first photo may already be loaded

  useEffect(() => {
    const ctx = gsap.context(() => {
      section.current.querySelectorAll('.as-card').forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card, start: 'top 60%', end: 'bottom 60%',
          onToggle: (self) => { if (self.isActive) setActive(i); },
        });
      });
      if (!prefersReducedMotion()) {
        gsap.from('.as-head > *', {
          y: 20, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.as-head', start: 'top 85%', once: true },
        });

        /* logo card — two-layer parallax:
           1) the whole card drifts a little against the scroll, so it moves at a different speed to the text cards
           2) the photo inside slides the other way behind the card's rounded window */
        const logoScroll = { trigger: '.as-logo', start: 'top bottom', end: 'bottom top', scrub: true };
        gsap.from('.as-logo-frame', {
          y: 36, opacity: 0, scale: 0.97, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: '.as-logo', start: 'top 88%', once: true },
        });
        gsap.fromTo('.as-logo', { y: 28 }, { y: -28, ease: 'none', scrollTrigger: logoScroll });
        gsap.fromTo('.as-logo-img', { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: logoScroll });
      }
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about" ref={section} aria-labelledby="as-title"
      className="relative mx-2.5 mt-8 overflow-x-clip rounded-[18px] border border-accent/20 bg-[linear-gradient(160deg,#f7f9f5_0%,#e7efe5_100%)] px-12 py-[100px]
                 max-lg:px-8 max-lg:py-[72px] max-sm:px-4 max-sm:py-14 max-[375px]:px-3 max-[320px]:px-2.5"
    >
      <span aria-hidden="true" className="orb z-0 -left-24 top-1/3 h-[340px] w-[340px] bg-accent/[.22]" />
      <span aria-hidden="true" className="orb z-0 -bottom-24 -right-16 h-[300px] w-[300px] bg-accent-light/90" />

      <div className="relative z-[1] mx-auto flex max-w-[1240px] flex-col gap-5 lg:grid lg:grid-cols-[1.1fr_.9fr] lg:items-start lg:gap-14">
        {/* LEFT — pinned photo (on mobile this column dissolves so the strip can stick) */}
        <div className="max-lg:contents lg:relative lg:self-stretch">
          <div className="sticky top-[84px] z-10 max-lg:order-2 max-sm:top-[72px] lg:top-28 lg:h-[min(760px,calc(100svh-8rem))]">
            {/* below lg: the frame's height comes from its width (via --ar) and the width is limited so the frame is never taller
                than 48% of the screen (44% on phones). lg and up: unchanged, it fills the sticky box. */}
            <div
              style={{ '--ar': (ratio / SHOWN).toFixed(3) }}
              className="relative mx-auto h-full w-full lg:max-w-[640px]
                         max-lg:[aspect-ratio:var(--ar)] max-lg:w-[min(100%,calc(min(48svh,460px)*var(--ar)))]
                         max-sm:w-[min(100%,calc(min(44svh,400px)*var(--ar)))]"
            >
              <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-accent-light shadow-[0_30px_60px_-24px_rgba(33,37,41,.35),0_0_0_6px_rgba(255,255,255,.7)] lg:rounded-b-[24px] lg:rounded-t-[320px]">
                {ABOUT_STORY.map((s, i) => (
                  <img
                    key={s.title} src={s.img} alt={i === active ? s.caption : ''} aria-hidden={i !== active}
                    loading={i === 0 ? 'eager' : 'lazy'} decoding="async" onLoad={i === 0 ? (e) => measure(e.currentTarget) : undefined}
                    className={`absolute inset-0 h-full w-full object-cover [transition:opacity_.8s_ease,transform_1.2s_cubic-bezier(.22,.61,.36,1)] motion-reduce:transition-none
                                ${i === active ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}
                  />
                ))}
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-p9/70 to-transparent" />

                <span className="absolute left-3 top-3 z-[2] rounded-full bg-p9/55 px-3 py-1 text-[12.5px] font-semibold tabular-nums tracking-wide text-p1 backdrop-blur-sm lg:left-1/2 lg:top-7 lg:-translate-x-1/2">
                  {pad(active)} / {pad(N - 1)}
                </span>

                <span className="glass-chip absolute bottom-9 left-4 z-[2] rounded-full px-3.5 py-1.5 text-[13px] font-medium text-white max-sm:bottom-8 max-sm:left-3 max-sm:text-xs lg:bottom-11 lg:left-6">
                  {ABOUT_STORY[active].caption}
                </span>

                {/* segmented progress */}
                <div className="absolute inset-x-4 bottom-3.5 z-[2] flex gap-1.5 max-sm:inset-x-3 max-sm:bottom-3 lg:inset-x-6 lg:bottom-5" aria-hidden="true">
                  {ABOUT_STORY.map((s, i) => (
                    <span key={s.title} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
                      <span className={`block h-full origin-left rounded-full bg-white [transition:transform_.6s_ease] motion-reduce:transition-none ${i <= active ? 'scale-x-100' : 'scale-x-0'}`} />
                    </span>
                  ))}
                </div>
              </div>

              {/* flat badge overlapping the corner (replaces the 3D object) */}
              <div aria-hidden="true" className="absolute -bottom-5 -right-5 hidden h-[88px] w-[88px] place-items-center rounded-full border border-line bg-paper shadow-[0_18px_36px_-16px_rgba(33,37,41,.4)] lg:grid">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#5a8a6a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 19c0-9 5-14 14-14 0 9-5 14-14 14z" /><path d="M5 19c3-4 6-7 10-9" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — heading + cards.
            lg:pb-[20svh] keeps the photo pinned until the last card reaches the centre line,
            so the final image is settled before the photo scrolls away with the section. */}
        <div className="max-lg:contents lg:pb-[20svh]">
          <header className="as-head max-lg:order-1 lg:pb-10">
            <p className="eyebrow eyebrow-light">About the clinic</p>
            <h2 id="as-title" className="mb-4 mt-1.5 font-display text-[clamp(30px,3.6vw,48px)] font-normal leading-[1.1] text-p9">
              Care that sees the whole person
            </h2>
            <p className="max-w-[520px] text-[15.5px] leading-[1.75] text-p7 lg:text-[16.5px]">
              Dr. Thaj Homoeo Clinic in Minjur, Chennai, pairs homoeopathic medicine with time to listen.
            </p>
          </header>

          {/* clinic logo — sits in the text column, scrolls with the cards, parallax in the effect above.
              Photo: public/assets/about/clinic_logo_showcase.webp. It is taller than its window (h-[120%], -top-[10%])
              so the parallax slide never shows an empty edge. On phones it comes after the story cards. */}
          <div className="as-logo relative mb-4 max-lg:order-4 max-lg:mt-4">
            <div className="as-logo-frame relative aspect-[4/3] w-full overflow-hidden rounded-[22px] bg-[#1c1a19] shadow-[0_30px_60px_-28px_rgba(33,37,41,.45),0_0_0_6px_rgba(255,255,255,.7)] lg:rounded-[26px]">
              <img
                src="/assets/about/clinic_logo_showcase.webp" alt="Dr. Thaj Homoeo Clinic logo"
                width="1500" height="981" loading="lazy" decoding="async" draggable="false"
                className="as-logo-img absolute inset-x-0 -top-[10%] h-[120%] w-full select-none object-cover will-change-transform"
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgba(255,255,255,.12)]" />
            </div>
          </div>

          <ol className="flex flex-col gap-2 max-lg:order-3">
            {ABOUT_STORY.map((s, i) => {
              const on = i === active;
              return (
                /* the <li> is the scroll slot (taller on desktop); the card sits centred in it */
                <li key={s.title} aria-current={on ? 'true' : undefined} className="as-card lg:flex lg:min-h-[34svh] lg:items-center">
                  <div
                    className={`relative w-full rounded-[22px] border bg-paper px-6 py-5 [transition:opacity_.5s_ease,box-shadow_.5s_ease,border-color_.5s_ease] motion-reduce:transition-none max-sm:px-5 max-sm:py-5 lg:rounded-[26px] lg:px-10 lg:py-9
                                ${on ? 'border-line opacity-100 shadow-[0_20px_40px_-26px_rgba(33,37,41,.4)]' : 'border-transparent opacity-50'}`}
                  >
                    <span aria-hidden="true" className={`absolute bottom-5 left-0 top-5 w-[3px] rounded-full bg-accent [transition:transform_.5s_ease] lg:bottom-7 lg:top-7 ${on ? 'scale-y-100' : 'scale-y-0'}`} />
                    <span className="mb-2 block font-display text-[clamp(34px,3.4vw,54px)] leading-none text-accent/80">{pad(i)}</span>
                    <h3 className="mb-2 font-display text-[clamp(21px,2vw,30px)] font-normal leading-[1.2] text-p9">{s.title}</h3>
                    <p className="text-[15px] leading-[1.7] text-p7 lg:text-[16.5px]">{s.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}