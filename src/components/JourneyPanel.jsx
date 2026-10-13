import { useEffect, useState } from 'react';
import { JOURNEY } from '../data/content';
import { useInView } from '../hooks/useInView';

/* Auto-rotating 3D ring of cards. One `active` index drives the ring, the
   "STEP 01 / 05" counter and the progress rail — which replaces the
   MutationObserver the vanilla version needed to keep them in sync. */

const COUNT = JOURNEY.length;
const STEP = 360 / COUNT;
const RADIUS = Math.round(130 / Math.tan(Math.PI / COUNT));

export default function JourneyPanel({ panelRef }) {
  const [active, setActive] = useState(0);
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  /* auto-advance, paused while off-screen */
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setActive((a) => (a + 1) % COUNT), 2600);
    return () => clearInterval(t);
  }, [inView]);

  const setRefs = (el) => {
    sectionRef.current = el;
    if (panelRef) panelRef.current = el;
  };

  return (
    <div
      id="journey" ref={setRefs}
      className="cn-right relative flex flex-col overflow-hidden rounded-3xl bg-[radial-gradient(120%_90%_at_50%_0%,#254033_0%,#14211a_70%)] px-6 pb-4 pt-5 text-center
                 shadow-[0_34px_60px_-32px_rgba(10,20,14,.75)] max-[560px]:px-3.5 max-[560px]:py-[22px]"
    >
      <div className="relative z-[2] flex items-end justify-between text-left">
        <div>
          <p className="eyebrow eyebrow-dark !mb-0.5">Journey</p>
          <h3 className="mt-1 font-display text-[22px] font-normal leading-[1.1] text-white max-[560px]:text-[22px]">Your care journey</h3>
        </div>
        <span className="whitespace-nowrap text-[13px] tracking-[.1em] text-white/55" aria-hidden="true">
          STEP <b className="font-display text-[22px] font-normal tracking-normal text-accent-light">{String(active + 1).padStart(2, '0')}</b> / {String(COUNT).padStart(2, '0')}
        </span>
      </div>

      {/* 3D ring — from sm up it is drawn at 55% size; the outer box reserves only the scaled height */}
      <div className="mt-[22px] sm:mt-3 sm:h-[212px]">
       <div className="sm:origin-top sm:scale-[.55]">
      <div className="journey-carousel relative mx-auto h-[380px] w-full max-w-[500px] flex-none [perspective:1400px] max-sm:h-80 max-sm:[perspective:1000px] max-[375px]:h-[280px] max-[320px]:h-60 max-[320px]:[perspective:800px]">
        <div
          className="absolute inset-0 [transform-style:preserve-3d] [transition:transform_.9s_cubic-bezier(.65,0,.35,1)]"
          style={{ transform: `rotateY(${-active * STEP}deg)` }}
        >
          {JOURNEY.map((s, i) => {
            const on = i === active;
            return (
              <div
                key={s.title}
                style={{ transform: `rotateY(${i * STEP}deg) translateZ(${RADIUS}px)` }}
                className={`absolute left-1/2 top-1/2 -ml-[95px] -mt-[130px] h-[260px] w-[190px] [transform-style:preserve-3d]
                            [transition:transform_.9s_cubic-bezier(.65,0,.35,1),opacity_.9s_ease,filter_.9s_ease]
                            max-sm:-ml-20 max-sm:-mt-[110px] max-sm:h-[220px] max-sm:w-40
                            max-[375px]:-ml-[70px] max-[375px]:-mt-[95px] max-[375px]:h-[190px] max-[375px]:w-[140px]
                            max-[320px]:-ml-[60px] max-[320px]:-mt-[83px] max-[320px]:h-[165px] max-[320px]:w-[120px]
                            ${on ? '' : 'opacity-[.45] [filter:saturate(.6)]'}`}
              >
                <div
                  className={`relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-accent to-accent-light transition-shadow duration-[400ms]
                              ${on ? 'shadow-[0_0_0_1.5px_rgba(223,240,230,.6),0_30px_60px_-20px_rgba(0,0,0,.75)]' : 'shadow-[0_20px_36px_-14px_rgba(33,37,41,.28),0_8px_16px_-6px_rgba(33,37,41,.18)]'}`}
                >
                  <img
                    src={`/assets/journey/${s.img}`} alt={s.title} width="280" height="360" loading="lazy" decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-p9/0 from-45% to-p9/75" />
                  <span className="absolute left-[18px] top-[18px] z-[2] rounded-[20px] bg-p9/55 px-[9px] py-[3px] font-display text-[15px] tracking-[.5px] text-p1 sm:px-3 sm:py-1 sm:text-[24px] max-[375px]:px-[7px] max-[375px]:py-0.5 max-[375px]:text-xs">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h4 className="absolute inset-x-5 bottom-[18px] z-[2] m-0 font-display text-[28px] font-normal text-p1 max-sm:text-[17px] max-[375px]:text-[15px]">{s.title}</h4>
                </div>
              </div>
            );
          })}
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-1.5 left-1/2 h-9 w-[62%] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(90,138,106,.55),transparent_70%)]" />
      </div>
       </div>
      </div>

      {/* step rail */}
      <div className="relative mx-1 mt-3 max-[560px]:mt-6">
        <span aria-hidden="true" className="absolute left-[10%] right-[10%] top-[7px] h-0.5 rounded-sm bg-white/15" />
        <span
          aria-hidden="true"
          style={{ width: `${80 * (active / (COUNT - 1))}%` }}
          className="absolute left-[10%] top-[7px] h-0.5 rounded-sm bg-accent [transition:width_.8s_cubic-bezier(.65,0,.35,1)]"
        />
        <ol className="cn-rail relative flex">
          {JOURNEY.map((s, i) => {
            const done = i < active, on = i === active;
            return (
              <li key={s.title} className="flex flex-1 flex-col items-center gap-[9px]">
                <span
                  aria-hidden="true"
                  className={`h-4 w-4 rounded-full border-2 [transition:background_.4s,border-color_.4s,transform_.5s_cubic-bezier(.34,1.56,.64,1),box-shadow_.4s]
                              ${on ? 'scale-[1.3] border-accent-light bg-accent-light shadow-[0_0_0_6px_rgba(223,240,230,.16)]' : done ? 'border-accent bg-accent' : 'border-white/30 bg-deep'}`}
                />
                <span className={`text-[12.5px] transition-colors duration-[400ms] max-[560px]:text-[10.5px] ${on ? 'font-semibold text-white' : done ? 'text-white/70' : 'text-white/45'}`}>
                  {s.title}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}