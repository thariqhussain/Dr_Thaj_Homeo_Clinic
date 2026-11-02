import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { isLowPower, prefersReducedMotion } from '../lib/utils';

/* Clinic admin — pinned full-width photo + bento cards that rise in one by one.
   The photo is pinned with CSS `position: sticky` (same approach as AboutStory: no GSAP pin,
   no `overflow-hidden` on <section>).

   Two separate pieces of motion:
   A) ONE-TIME INTRO (plays once, the first time the section scrolls into view, never again):
      the photo is revealed with a clip-path wipe + a slow settle from a slight zoom,
      then the heading "Our Clinic Admin" rises word by word out of a mask.
   B) SCROLL SEQUENCE (scrubbed, short): the cards rise one after another, hold briefly, then the
      grid and heading move up and fade, and the section scrolls away.
      Each card needs only a small scroll (about a fifth of a screen) — change SCROLL_LENGTH to tune it.

   The doctor's description sits bottom-left on the photo (under the heading on tablets and phones, where the cards
   take the bottom). It starts with the first half of the text; "Show more" opens the rest, "Show less" folds it again.
   Edit the text in BIO below (**word** = bold).

   Performance: everything animates transform / opacity / clip-path only (GPU-friendly, no layout work),
   there is no backdrop-filter on the cards, and the intro uses a `once` trigger so it costs nothing afterwards.
   The photo holds a GPU layer (will-change) only while the intro plays. Low-power devices skip the intro's wipe and zoom
   (the photo is simply there) and keep the lighter card sequence. */

const SCROLL_LENGTH = '220svh';        // total section height. Smaller = faster card sequence (extra scroll = this minus 100svh)
/* the photo's focus point is set on the <img> (object-position): 30% on desktop, 70% on tablets / phones, where the doctor would otherwise be cropped at the right edge */
const TITLE = ['Our', 'Clinic', 'Admin'];

/* the doctor's text. **double stars** = bold. PREVIEW_SHARE = how much of the text shows before "Show more". */
const BIO_TITLE = 'Homoeopathic Physician | Acupuncture & Cupping Therapy Practitioner';
const BIO_ROLE = 'Associate Consultant & Medical Administrator';
const PREVIEW_SHARE = 0.5;
const BIO = [
  '**Dr. Aneesha Parveen** is a qualified healthcare professional with an academic background in Bachelor of Homoeopathic Medicine and Surgery (BHMS) and **MD (Acupuncture)**.',
  'She is associated with **Dr. Thaj Homoeo Clinic**, contributing to patient care through an integrated approach to healthcare, with an emphasis on individual assessment, therapeutic support and overall well-being.',
  'With knowledge of homoeopathic medicine and acupuncture-based therapeutic approaches, she focuses on understanding individual patient needs and providing appropriate treatment guidance.',
  'Her areas of practice include **acupuncture-based therapies, cupping therapy and supportive wellness care**. She believes in compassionate communication, personalized care and helping patients make informed decisions about their health.',
];

/* split each paragraph into plain / bold pieces, then cut the whole text at PREVIEW_SHARE (at a word boundary) */
const PARAS = BIO.map((s) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((t) => (t.startsWith('**') ? { t: t.slice(2, -2), b: true } : { t })));
const TOTAL = PARAS.flat().reduce((n, x) => n + x.t.length, 0);
function firstPart(paras, limit) {
  let left = limit;
  const out = [];
  for (const para of paras) {
    if (left <= 0) break;
    const segs = [];
    for (const seg of para) {
      if (left <= 0) break;
      if (seg.t.length <= left) { segs.push(seg); left -= seg.t.length; continue; }
      let t = seg.t.slice(0, left);
      const sp = t.lastIndexOf(' ');
      if (sp > 0) t = t.slice(0, sp);
      segs.push({ ...seg, t: `${t.replace(/[\s,.;:]+$/, '')}…` });
      left = 0;
    }
    out.push(segs);
  }
  return out;
}
const PREVIEW = firstPart(PARAS, Math.round(TOTAL * PREVIEW_SHARE));
const renderParas = (paras) => paras.map((segs, i) => (
  <p key={i}>{segs.map((x, j) => (x.b ? <b key={j} className="font-semibold text-white">{x.t}</b> : x.t))}</p>
));

/* `bar` = the thin colour line along the top of each card (the site's department colours) */
const CARDS = [
  { kind: 'name', label: 'Clinic Admin', value: 'Dr. Aneesha Parveen', sub: BIO_ROLE, bar: '#f2c14e' },
  { kind: 'light', label: 'Qualification 01', value: 'BHMS', sub: 'Homoeopathic Medicine & Surgery', bar: '#9fd59a' },
  { kind: 'accent', label: 'Qualification 02', value: 'M.D', sub: 'Acupuncture', bar: '#f6a6c9' },
];

/* bento layout: the name card spans both columns, the two qualification cards sit side by side.
   Backgrounds are nearly opaque instead of blurred glass, which keeps scrolling smooth over a full-screen photo. */
const CARD_STYLE = {
  name:   'col-span-2 bg-p9/95 text-p1 border-white/10',
  light:  'bg-paper text-p9 border-line',
  accent: 'bg-accent text-white border-white/20',
};
const LABEL_STYLE = {
  name: 'text-p5', light: 'text-p6', accent: 'text-white/75',
};
const SUB_STYLE = {
  name: 'text-white/75', light: 'text-p7', accent: 'text-white/85',
};

export default function ClinicAdmin() {
  const section = useRef(null);
  const reduced = prefersReducedMotion();
  const [more, setMore] = useState(false);
  const lite = isLowPower();

  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const frameH = () => section.current.querySelector('.ca-frame').offsetHeight;
      const cards = gsap.utils.toArray('.ca-card');

      /* ── A) one-time intro: hidden right away (before first paint), plays once when the section comes into view ── */
      gsap.set('.ca-word', { yPercent: 115 });
      const intro = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: section.current, start: 'top 75%', once: true },
      });
      if (!lite) {
        gsap.set('.ca-photo', { clipPath: 'inset(0% 0% 100% 0%)' });
        gsap.set('.ca-img', { scale: 1.12, willChange: 'transform' });
        intro
          .to('.ca-photo', { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power4.inOut', clearProps: 'clipPath' })
          .to('.ca-img', { scale: 1, duration: 1.2, clearProps: 'transform,willChange' }, 0);
      }
      intro.to('.ca-word', { yPercent: 0, duration: 0.7, stagger: 0.08, clearProps: 'transform' }, lite ? 0 : 0.45);

      /* ── B) scroll sequence: cards rise (small scroll each), hold, then everything leaves ── */
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: section.current, start: 'top top', end: 'bottom bottom',
          scrub: 0.35, invalidateOnRefresh: true,
        },
      });

      cards.forEach((card, i) => {
        tl.fromTo(card, { y: () => frameH() * 0.9, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, i * 0.35);
      });

      tl.to('.ca-grid', { y: () => -frameH() * 0.9, opacity: 0, duration: 0.7, ease: 'power2.in' }, '+=0.3')
        .to('.ca-head', { y: -30, opacity: 0, pointerEvents: 'none', duration: 0.4, ease: 'power2.in' }, '<0.2')
        .to('.ca-bio', { y: -30, opacity: 0, pointerEvents: 'none', duration: 0.4, ease: 'power2.in' }, '<')
        .to({}, { duration: 0.15 });   // short tail so the animation finishes just before the section un-pins
    }, section);
    return () => ctx.revert();
  }, [reduced, lite]);

  return (
    <section
      id="admin" ref={section} aria-labelledby="ca-title" data-nav-dark
      style={reduced ? undefined : { height: SCROLL_LENGTH }}
      className="relative mt-2.5"
    >
      {/* pinned stage: stays on screen while the section scrolls underneath */}
      <div className={`${reduced ? '' : 'sticky top-0 h-svh'} flex items-center bg-[#141517]`}>
        {/* photo frame: 16:9, full width of the page (on phones it fills the screen height and crops) */}
        <div className="ca-frame relative h-svh w-full overflow-hidden lg:h-auto lg:max-h-svh lg:aspect-video">
          {/* .ca-photo is the layer the intro wipes open; .ca-img inside it settles from a slight zoom */}
          <div className="ca-photo absolute inset-0 overflow-hidden">
            <img
              src="/assets/doctors/clinicAdmin.webp" alt="Dr. Aneesha Parveen, clinic admin"
              width="1920" height="1080" decoding="async" draggable="false"
              className="ca-img absolute inset-0 h-full w-full select-none object-cover [object-position:30%_center] max-lg:[object-position:70%_center]"
            />
            {/* legibility scrims: left/top for the heading, right for the cards */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,21,23,.55)_0%,rgba(20,21,23,0)_33%),linear-gradient(90deg,rgba(20,21,23,.5)_0%,rgba(20,21,23,0)_45%,rgba(20,21,23,.35)_100%)]" />

            {/* the doctor's description: bottom-left (under the heading on tablets / phones). Flat dark panel, no blur, to keep scrolling smooth */}
            <section
              aria-label="About Dr. Aneesha Parveen"
              className="ca-bio absolute bottom-12 left-12 z-[2] flex w-[min(520px,44%)] max-h-[calc(100%-250px)] flex-col overflow-y-auto rounded-[22px] bg-[#141517]/85 p-6 text-white/85 ring-1 ring-white/10
                         max-lg:bottom-auto max-lg:left-6 max-lg:top-[196px] max-lg:w-[min(560px,calc(100%-3rem))] max-lg:max-h-[calc(100%-394px)]
                         max-sm:left-4 max-sm:top-[160px] max-sm:w-[calc(100%-2rem)] max-sm:rounded-[18px] max-sm:p-4"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-accent-light max-sm:mb-2">{BIO_TITLE}</p>
              <div id="ca-bio-text" className={`flex flex-col gap-3 text-[15px] leading-[1.65] max-sm:gap-2 max-sm:text-[13.5px] max-sm:leading-[1.55] ${more ? '' : 'max-lg:[&>p:nth-child(n+2)]:hidden max-lg:[&>p]:line-clamp-3'}`}>
                {renderParas(more ? PARAS : PREVIEW)}
              </div>
              <button
                type="button" aria-expanded={more} aria-controls="ca-bio-text" onClick={() => setMore((m) => !m)}
                className="mt-1 inline-flex min-h-[44px] w-fit cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[14px] font-semibold text-white underline underline-offset-4 transition-colors hover:text-accent-light
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white max-sm:text-[13px]"
              >
                {more ? 'Show less' : 'Show more'} <span aria-hidden="true" className={`no-underline transition-transform duration-200 ${more ? '-rotate-90' : 'rotate-90'}`}>›</span>
              </button>
            </section>
          </div>

          {/* heading — top left, each word rises out of its own mask */}
          <header className="ca-head absolute left-12 top-[112px] z-[2] max-lg:left-6 max-lg:top-[104px] max-sm:left-4 max-sm:top-[88px]">
            <h2 id="ca-title" className="font-[Anton,Impact,'Arial_Narrow',sans-serif] text-[clamp(44px,min(7.5vw,10.5svh),112px)] font-normal uppercase leading-[1.05] tracking-[.02em] text-white [text-shadow:0_2px_28px_rgba(0,0,0,.4)] max-sm:text-[clamp(38px,10.5vw,56px)]">
              {TITLE.map((w, i) => (
                <span key={w}>
                  {/* padding gives descenders room inside the mask; the negative margin cancels it out */}
                  <span className="inline-block overflow-hidden align-top" style={{ paddingBottom: '.12em', marginBottom: '-.12em' }}>
                    <span className="ca-word inline-block">{w}</span>
                  </span>
                  {i < TITLE.length - 1 ? ' ' : null}
                </span>
              ))}
            </h2>
          </header>

          {/* bento cards — right side (bottom of the photo on phones) */}
          <div className="absolute inset-y-0 right-12 z-[3] flex w-[min(460px,40%)] items-center max-lg:inset-x-6 max-lg:w-auto max-lg:items-end max-lg:pb-6 max-sm:inset-x-3 max-sm:pb-4">
            <ul className="ca-grid grid w-full grid-cols-2 gap-3 lg:gap-4">
              {CARDS.map((c) => (
                <li
                  key={c.value}
                  className={`ca-card relative overflow-hidden rounded-[22px] border px-6 pb-5 pt-6 shadow-[0_16px_32px_-20px_rgba(0,0,0,.55)] max-sm:rounded-[18px] max-sm:px-4 max-sm:pb-3.5 max-sm:pt-4 lg:rounded-[26px] lg:px-7 lg:pb-6 lg:pt-7 ${CARD_STYLE[c.kind]}`}
                >
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5" style={{ background: c.bar }} />
                  <span className={`mb-2 block text-xs font-semibold uppercase tracking-[.14em] max-sm:mb-1 ${LABEL_STYLE[c.kind]}`}>{c.label}</span>
                  <span className={`block font-display font-normal leading-[1.1] ${c.kind === 'name'
                    ? 'text-[clamp(24px,2.6vw,38px)] max-sm:text-[22px]'
                    : 'text-[clamp(22px,2.2vw,32px)] max-sm:text-xl'}`}>
                    {c.value}
                  </span>
                  <span className={`mt-1.5 block font-body text-[13px] leading-[1.35] max-sm:mt-1 max-sm:text-[12px] ${SUB_STYLE[c.kind]}`}>{c.sub}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}