import { GOOGLE_REVIEW_URL, MAPS_URL, MAP_EMBED_URL, MAP_QUERY } from '../data/content';

/* Embedded Google Map + "Get directions" and (when a link is set) "Review us on Google".
   Styled for the dark clinic-details panel in Booking. */

export default function MapCard({ className = '' }) {
  const src = MAP_EMBED_URL || `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;
  const btn = 'inline-flex items-center rounded-full px-4 py-2 text-[13.5px] font-semibold no-underline transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light';
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10">
        <iframe
          title="Dr. Thaj Homoeo Clinic on Google Maps" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen className="block h-[220px] w-full border-0 max-sm:h-[190px]"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <a href={MAPS_URL} target="_blank" rel="noopener" className={`${btn} bg-white text-p9 hover:bg-accent-light`}>Get directions</a>
        {GOOGLE_REVIEW_URL && (
          <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener" className={`${btn} border border-white/30 text-white hover:bg-white/15`}>Review us on Google</a>
        )}
      </div>
    </div>
  );
}