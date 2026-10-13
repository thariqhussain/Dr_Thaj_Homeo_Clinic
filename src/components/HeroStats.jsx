import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { STATS } from '../data/content';
import { computeStat } from '../lib/utils';

function Counter({ config, play }) {
  const target = computeStat(config);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!play) return;
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: target, duration: 2, ease: 'power2.out',
      onUpdate: () => setValue(Math.floor(obj.v)),
      onComplete: () => setValue(target),
    });
    return () => tween.kill();
  }, [play, target]);

  return (
    <div className="flex items-baseline gap-1 font-display text-[clamp(36px,3.8vw,56px)] font-normal leading-none text-p1 max-sm:text-[28px] max-[375px]:text-[26px] max-[320px]:text-[22px]">
      <span>{value.toLocaleString()}</span>
      <small className="text-[.42em] font-medium text-p5">{config.suffix}</small>
    </div>
  );
}

export default function HeroStats() {
  const ref = useRef(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: ref.current, start: 'top 95%', once: true,
      onEnter: () => setPlay(true),
    });
    return () => st.kill();
  }, []);

  return (
    <div
      ref={ref}
      className="hero-stats relative z-[1] mx-auto grid w-full max-w-[1180px] animate-hero-stats-in grid-cols-[1.4fr_1fr_1fr_1fr] items-end gap-9 overflow-hidden rounded-[28px] bg-p9/90 px-[52px] py-9 text-p3
                 max-lg:grid-cols-3 max-lg:gap-6 max-lg:rounded-3xl max-lg:px-8 max-lg:py-8
                 max-sm:grid-cols-3 max-sm:items-start max-sm:gap-3 max-sm:rounded-[22px] max-sm:px-5 max-sm:py-6
                 max-[375px]:gap-2.5 max-[375px]:rounded-[18px] max-[375px]:px-4 max-[375px]:py-5
                 max-[320px]:px-3 max-[320px]:py-4"
    >
      <h3 className="relative z-[1] font-display text-[clamp(22px,2.4vw,32px)] font-normal leading-[1.15] text-p1 max-lg:col-span-full max-sm:text-xl max-[375px]:text-lg">
        Treat the person<br />as{' '}
        <em className="bg-gradient-to-br from-accent to-accent-light bg-clip-text italic text-transparent">whole</em>.
      </h3>
      {STATS.map((s) => (
        <div key={s.label} className="relative z-[1]">
          <Counter config={s} play={play} />
          <div className="mt-3 border-t border-white/[.12] pt-3 text-xs uppercase tracking-[.16em] text-p5 max-sm:text-[10.5px] max-sm:tracking-[.1em] max-[375px]:mt-2.5 max-[375px]:pt-2.5 max-[375px]:text-[10px] max-[375px]:tracking-[.08em] max-[320px]:text-[9px]">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}