import { PHONES, WA_NUMBER } from '../data/content';

/* Floating quick-contact buttons, bottom-right on every screen size.
   WhatsApp opens a chat with a ready message; the call button dials the first number in PHONES.
   On desktop the buttons widen on hover/focus to show their label. */

const MESSAGE = 'Hello, I would like to know more about Dr. Thaj Homoeo Clinic.';

function Btn({ href, label, text, bg, external, children }) {
  return (
    <a
      href={href} aria-label={label} {...(external ? { target: '_blank', rel: 'noopener' } : {})}
      className={`group flex h-14 flex-row-reverse items-center overflow-hidden rounded-full text-white no-underline shadow-[0_14px_30px_-10px_rgba(10,20,14,.6)]
                  [transition:transform_.3s_cubic-bezier(.34,1.4,.64,1)] hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none
                  focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white max-sm:h-[52px] ${bg}`}
    >
      <span className="grid h-14 w-14 flex-none place-items-center max-sm:h-[52px] max-sm:w-[52px]">{children}</span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 [transition:max-width_.35s_ease,opacity_.25s_ease,padding_.35s_ease] motion-reduce:transition-none max-sm:hidden
                       group-hover:max-w-[180px] group-hover:pl-5 group-hover:opacity-100 group-focus-visible:max-w-[180px] group-focus-visible:pl-5 group-focus-visible:opacity-100">
        {text}
      </span>
    </a>
  );
}

export default function FloatingContact() {
  const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;
  return (
    <div className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-[90] flex flex-col items-end gap-3 max-sm:right-3 max-sm:gap-2.5">
      <Btn href={wa} external label="Chat on WhatsApp" text="Chat on WhatsApp" bg="bg-[#1fa855]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 21l1.65-4.86A8.5 8.5 0 1 1 8 19.4L3 21z" />
          <path d="M9 8.6c0 3.4 2.9 6.3 6.3 6.3l1.2-1.3-2-1-.9.7a4 4 0 0 1-1.9-1.9l.7-.9-1-2L9 8.6z" fill="currentColor" stroke="none" />
        </svg>
      </Btn>
      <Btn href={`tel:${PHONES[0].tel}`} label={`Call ${PHONES[0].display}`} text={`Call ${PHONES[0].display}`} bg="bg-p9">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.4 2 2 0 0 1 3.05 1.22h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.07a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </Btn>
    </div>
  );
}