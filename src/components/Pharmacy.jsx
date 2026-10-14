import { PHARMACY, WA_NUMBER } from '../data/content';
import OpenStatus from './OpenStatus';

/* Pharmacy + free delivery + the two sets of opening hours.
   All copy and timings live in content.js → PHARMACY.
   Photo: public/assets/hero-images/delivery_backdrop.webp (shown at its own proportions, rounded, above the text). */

const POINTS = [
  { title: 'Homoeopathic medicines in stock', text: 'Your prescription can be filled at our own pharmacy.', icon: 'M12 3c3.5 4 6 7 6 10.5a6 6 0 0 1-12 0C6 10 8.5 7 12 3z' },
  { title: 'Door Step Delivery', text: PHARMACY.deliveryNote, icon: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19.5a1.5 1.5 0 1 0 0-.01M17 19.5a1.5 1.5 0 1 0 0-.01' },
];

export default function Pharmacy() {
  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hello, I would like to order medicines for home delivery.')}`;

  return (
    <section
      id="pharmacy" aria-labelledby="ph-title"
      className="relative mx-2.5 my-2.5 overflow-hidden rounded-[18px] border border-accent/20 bg-[linear-gradient(200deg,#f7f9f5_0%,#e7efe5_100%)] px-12 py-[88px]
                 max-lg:px-8 max-lg:py-16 max-sm:px-4 max-sm:py-12 max-[375px]:px-3"
    >
      <span aria-hidden="true" className="orb z-0 -right-20 -top-24 h-[320px] w-[320px] bg-accent/[.24]" />

      <div className="relative z-[1] mx-auto grid max-w-[1080px] grid-cols-[1.1fr_.9fr] items-center gap-14 max-lg:grid-cols-1 max-lg:gap-10">
        <div>
          {/* free-form photo: keeps its own proportions (no cropping, no fixed height), just rounded corners */}
          <img
            src="/assets/hero-images/delivery_backdrop.webp" alt="Homoeopathic pellets in glass bottles on a wooden tray"
            width="1024" height="491" loading="lazy" decoding="async" draggable="false"
            className="mb-8 block h-auto w-full max-w-[1024px] rounded-[22px] shadow-[0_30px_60px_-28px_rgba(33,37,41,.4),0_0_0_6px_rgba(255,255,255,.7)] max-sm:mb-6 max-sm:rounded-2xl"
          />
          <h2 id="ph-title" className="mb-4 font-display text-[clamp(30px,3.6vw,46px)] font-normal leading-[1.1] text-p9">
            Medicines from our own pharmacy, will be delivered at your Door.
          </h2>
          <p className="mb-8 max-w-[480px] text-[15.5px] leading-[1.75] text-p7">
            Every homoeopathic medicine you are prescribed is available at the clinic pharmacy, and we will bring it to your door.
          </p>

          <ul className="flex flex-col gap-5">
            {POINTS.filter((p) => p.text).map((p) => (
              <li key={p.title} className="flex items-start gap-4">
                <span aria-hidden="true" className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-accent-light text-accent">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={p.icon} /></svg>
                </span>
                <div>
                  <h3 className="text-[16.5px] font-semibold text-p9">{p.title}</h3>
                  <p className="mt-0.5 text-[14px] leading-[1.6] text-p7">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* hours panel */}
        <div className="rounded-3xl bg-[radial-gradient(120%_90%_at_50%_0%,#254033_0%,#14211a_70%)] p-8 text-white shadow-[0_34px_60px_-32px_rgba(10,20,14,.75)] max-sm:p-6">
          <h3 className="mb-6 font-display text-[26px] font-normal leading-[1.1]">Opening hours</h3>
          <dl className="flex flex-col">
            {PHARMACY.hours.filter((h) => h.time).map((h) => (
              <div key={h.label} className="border-t border-white/[.14] py-4 first:border-t-0 first:pt-0">
                <dt className="mb-1 text-[13px] text-accent-light">{h.label}</dt>
                <dd className="text-[16px] leading-[1.6] text-p1">
                  {h.days}<br />{h.time}
                  {h.key && <OpenStatus which={h.key} className="mt-1.5 !flex" />}
                </dd>
              </div>
            ))}
          </dl>
          <a
            href={waHref} target="_blank" rel="noopener"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-p9 no-underline transition-colors duration-200 hover:bg-accent-light
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            Order on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}