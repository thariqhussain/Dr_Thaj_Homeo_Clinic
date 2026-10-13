import { SOCIALS } from '../data/content';

/* Round social icons. Only entries in SOCIALS with a url are shown, so an unfilled link never appears.
   Made for the dark footer / booking panel. */

const ICONS = {
  instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" fill="currentColor" /></>,
  facebook: <path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.4l.6-3.5H14V8.9c0-.2.2-.4.4-.4z" />,
  youtube: <><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9.5v5l4.5-2.5-4.5-2.5z" fill="currentColor" /></>,
  linkedin: <><path d="M6.5 10v8M6.5 6.5v.01M11 18v-8M11 13a3 3 0 0 1 6 0v5" /></>,
  x: <path d="M5 5l14 14M19 5L5 19" />,
  whatsapp: <><path d="M3 21l1.65-4.86A8.5 8.5 0 1 1 8 19.4L3 21z" /><path d="M9 8.6c0 3.4 2.9 6.3 6.3 6.3l1.2-1.3-2-1-.9.7a4 4 0 0 1-1.9-1.9l.7-.9-1-2L9 8.6z" fill="currentColor" stroke="none" /></>,
};

export default function SocialLinks({ className = '' }) {
  const items = SOCIALS.filter((s) => s.url);
  if (!items.length) return null;
  return (
    <ul aria-label="Social media" className={`m-0 flex list-none flex-wrap gap-2.5 p-0 ${className}`}>
      {items.map((s) => (
        <li key={s.name}>
          <a
            href={s.url} target="_blank" rel="noopener" aria-label={s.name}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/[.08] text-white
                       [transition:background_.3s,color_.3s,transform_.4s_cubic-bezier(.34,1.4,.64,1)] hover:-translate-y-[3px] hover:bg-accent-light hover:text-p9 motion-reduce:transition-none
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[s.icon]}</svg>
          </a>
        </li>
      ))}
    </ul>
  );
}