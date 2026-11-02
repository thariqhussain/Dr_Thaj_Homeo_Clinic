import { CLINIC_PHONE, PHARMACY, WA_NUMBER } from '../data/content';

/* Pharmacy + free delivery + the two sets of opening hours.
   All copy and timings live in content.js → PHARMACY.
   Photo: public/assets/hero-images/delivery_backdrop.webp (shown at its own proportions, rounded).

   Layout: the words and the two feature cards on the left; on the right the photo with the dark opening-hours panel
   overlapping its lower edge. Below lg everything stacks (text, then photo + hours). */

const DEEP = '#2f5a3f';

const POINTS = [
  { title: 'Medicines in stock', text: 'Your prescription can be filled at our own pharmacy.', icon: 'M12 3c3.5 4 6 7 6 10.5a6 6 0 0 1-12 0C6 10 8.5 7 12 3z' },
  { title: 'Door Step Delivery', text: PHARMACY.deliveryNote, icon: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19.5a1.5 1.5 0 1 0 0-.01M17 19.5a1.5 1.5 0 1 0 0-.01' },
];

const WhatsAppIcon = () => (   // a chat bubble (drawn with strokes, so it matches the phone icon)
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11.5A8 8 0 0 1 8.5 18.700L4 20l1.300-4.300A8 8 0 1 1 20 11.500z" />
    <path d="M9 9.500c0 3 2.500 5.500 5.500 5.500l1.200-1.300-1.800-.9-.8.6a4 4 0 0 1-1.700-1.700l.6-.8-.9-1.800L9 9.500z" />
  </svg>
);
const PhoneIcon = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </svg>
);

export default function Pharmacy() {
  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hello, I would like to order medicines for home delivery.')}`;

  return (
    <section
      id="pharmacy" aria-labelledby="ph-title"
      className="relative mx-2.5 my-2.5 overflow-hidden rounded-[18px] border border-accent/20 bg-[linear-gradient(200deg,#f7f9f5_0%,#e7efe5_100%)] px-12 py-[88px]
                 max-lg:px-8 max-lg:py-16 max-sm:px-4 max-sm:py-12 max-[375px]:px-3"
    >
      <span aria-hidden="true" className="orb z-0 -right-20 -top-24 h-[320px] w-[320px] bg-accent/[.24]" />
      <span aria-hidden="true" className="orb z-0 -bottom-28 -left-24 h-[300px] w-[300px] bg-accent-light/90" />

      <div className="relative z-[1] mx-auto grid max-w-[1120px] grid-cols-[1fr_1fr] items-center gap-16 max-lg:grid-cols-1 max-lg:gap-12">
        {/* words, feature cards, actions */}
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[.14em] text-accent shadow-[0_6px_16px_-10px_rgba(33,37,41,.4)]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
            Pharmacy &amp; delivery
          </p>
          <h2 id="ph-title" className="mb-4 font-display text-[clamp(30px,3.8vw,52px)] font-normal leading-[1.06] tracking-[-.015em] text-p9">
            Medicines from our own pharmacy, <em className="text-accent">delivered to your door.</em>
          </h2>
          <p className="mb-8 max-w-[480px] text-[16px] leading-[1.75] text-p7">
            Every homoeopathic medicine you are prescribed is available at the clinic pharmacy, and we will bring it to your door.
          </p>

          <ul className="mb-8 grid gap-4 sm:grid-cols-2">
            {POINTS.filter((p) => p.text).map((p) => (
              <li key={p.title} className="rounded-[20px] bg-paper p-5 shadow-[0_20px_40px_-28px_rgba(33,37,41,.4)] ring-1 ring-p9/5 transition-transform duration-300 hover:-translate-y-0.5">
                <span aria-hidden="true" className="mb-4 grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ backgroundColor: DEEP }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={p.icon} /></svg>
                </span>
                <h3 className="text-[17px] font-semibold leading-snug text-p9">{p.title}</h3>
                <p className="mt-1 text-[14.5px] leading-[1.6] text-p7">{p.text}</p>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <a
              href={waHref} target="_blank" rel="noopener"
              className="inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white no-underline transition-colors duration-200 hover:!bg-p9
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5a3f]"
              style={{ backgroundColor: DEEP }}
            >
              <WhatsAppIcon /> Order on WhatsApp
            </a>
            <a
              href={`tel:${CLINIC_PHONE.tel}`} aria-label={`Call the pharmacy on ${CLINIC_PHONE.display}`}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-p9 px-6 text-[15px] font-semibold text-p9 no-underline transition-colors duration-200 hover:bg-p9 hover:text-white
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5a3f]"
            >
              <PhoneIcon /> Call us
            </a>
          </div>
        </div>

        {/* photo with the hours panel overlapping its lower edge */}
        <div className="relative pb-2">
          <img
            src="/assets/hero-images/delivery_backdrop.webp" alt="Homoeopathic pellets in glass bottles on a wooden tray"
            width="1024" height="491" loading="lazy" decoding="async" draggable="false"
            className="block h-auto w-full rounded-[24px] shadow-[0_30px_60px_-28px_rgba(33,37,41,.4),0_0_0_6px_rgba(255,255,255,.7)] max-sm:rounded-2xl"
          />
          <div className="relative z-[2] -mt-12 ml-auto w-[min(100%,440px)] rounded-3xl bg-[radial-gradient(120%_90%_at_50%_0%,#254033_0%,#14211a_70%)] p-7 text-white shadow-[0_34px_60px_-30px_rgba(10,20,14,.8)] max-lg:mx-auto max-sm:-mt-8 max-sm:p-5">
            <h3 className="mb-5 font-display text-[26px] font-normal leading-[1.1]">Opening hours</h3>
            <dl className="flex flex-col">
              {PHARMACY.hours.filter((h) => h.time).map((h) => (
                <div key={h.label} className="border-t border-white/[.14] py-4 first:border-t-0 first:pt-0 last:pb-0">
                  <dt className="mb-1 text-[13px] text-accent-light">{h.label}</dt>
                  <dd className="text-[16px] leading-[1.6] text-p1">
                    {h.days}<br />{h.time}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}