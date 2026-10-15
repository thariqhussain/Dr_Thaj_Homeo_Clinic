import { useRef } from 'react';
import { useIntroReveal } from '../hooks/useIntroReveal';
import HeroBackdrop from './HeroBackdrop';
import HeroHeading from './HeroHeading';
import HeroStats from './HeroStats';
import DoctorCard from './DoctorCard';
import { scrollToId } from '../lib/utils';

/* shared responsive sizing for the three hero buttons */
const heroBtn =
  'px-7 py-3 text-[15px] max-lg:px-[22px] max-lg:py-[11px] max-lg:text-sm ' +
  'max-sm:px-[18px] max-sm:py-2.5 max-sm:text-[13px] ' +
  'max-[375px]:px-3.5 max-[375px]:py-[9px] max-[375px]:text-xs max-[320px]:px-3 max-[320px]:py-2 max-[320px]:text-[11px]';

export default function Hero() {
  const btns = useRef(null);
  useIntroReveal(btns, { y: 18, delay: 0.3, duration: 0.6 });   // buttons come in after the headline starts
  return (
    <section
      id="home"
      className="relative flex min-h-svh flex-col overflow-hidden sm:max-lg:min-h-0 px-12 pb-12 pt-[120px]
                 max-lg:px-6 max-lg:pb-8 max-lg:pt-[104px]
                 max-sm:px-4 max-sm:pb-5 max-sm:pt-[84px]
                 max-[375px]:px-3 max-[375px]:pb-4 max-[375px]:pt-[76px]
                 max-[320px]:px-2.5 max-[320px]:pb-3.5 max-[320px]:pt-[70px]"
    >
      <HeroBackdrop />
      <div className="relative z-[1] mx-auto mb-10 grid w-full max-w-[1180px] flex-1 grid-cols-2 items-center gap-10 max-lg:mb-8 max-lg:grid-cols-1 max-lg:gap-8 max-sm:mb-6">
        {/* LEFT — the quote, left-aligned (centred again below lg) */}
        <div className="flex flex-col items-start text-left max-lg:items-center max-lg:text-center">
        <HeroHeading
          className="mb-6 font-display text-[clamp(34px,4vw,56px)] font-normal leading-[1.08] text-p9
                     max-lg:mb-[18px] max-lg:text-[clamp(34px,6.4vw,56px)]
                     max-sm:mb-3.5 max-sm:text-[clamp(30px,9.5vw,42px)] max-sm:leading-[1.12]
                     max-[375px]:mb-3 max-[375px]:text-[clamp(28px,9.5vw,36px)]
                     max-[320px]:mb-2.5 max-[320px]:text-[26px]"
        />

        <div ref={btns} className="flex flex-wrap justify-start gap-4 max-lg:justify-center max-lg:gap-2.5 max-sm:flex-row max-sm:gap-2 max-[375px]:gap-1.5">
          <button type="button" onClick={() => scrollToId('booking')} className={`btn-solid-light ${heroBtn} max-sm:hidden`}>
            Book appointment
          </button>
          {/* phones: Contact stands in for the two buttons above/below */}
          <button type="button" onClick={() => scrollToId('contact')} className={`btn-outline-light ${heroBtn} hidden max-sm:inline-block`}>
            Contact
          </button>
          <button type="button" onClick={() => scrollToId('treatments')} className={`btn-outline-light ${heroBtn} max-sm:hidden`}>
            Explore treatments
          </button>
        </div>
        </div>

        {/* RIGHT — doctor card */}
        <DoctorCard />
      </div>

      <HeroStats />
    </section>
  );
}