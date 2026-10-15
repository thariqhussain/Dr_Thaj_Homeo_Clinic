import { useState } from 'react';
import { FAQS, PHONES, WA_NUMBER } from '../data/content';

/* Frequently asked questions: one question open at a time.
   Copy lives in content.js → FAQS. The same questions are also published as FAQPage structured data,
   which lets Google show them under the clinic's search result. */

export default function FAQ() {
  const [open, setOpen] = useState(0);
  const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hello, I have a question about Dr. Thaj Homoeo Clinic.')}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <section
      id="faq" aria-labelledby="faq-title"
      className="relative px-12 py-[72px] max-lg:px-8 max-lg:py-14 max-sm:px-4 max-sm:py-10 max-[375px]:px-3"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="mx-auto grid max-w-[1120px] grid-cols-[.8fr_1.2fr] gap-16 max-lg:grid-cols-1 max-lg:gap-8">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="faq-title" className="mb-3 font-display text-[clamp(28px,3.4vw,44px)] font-normal leading-[1.1] text-p9">Frequently asked questions</h2>
          <p className="mb-6 max-w-[380px] text-[15px] leading-[1.7] text-p7">
            Can't find what you are looking for? Ask us directly and our team will reply.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <a
              href={wa} target="_blank" rel="noopener"
              className="rounded-full bg-p9 px-5 py-2.5 text-sm font-medium text-p1 no-underline transition-colors duration-200 hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Ask on WhatsApp
            </a>
            <a
              href={`tel:${PHONES[0].tel}`} aria-label={`Call us on ${PHONES[0].display}`}
              className="rounded-full border-[1.5px] border-p9 px-5 py-2 text-sm font-medium text-p9 no-underline transition-colors duration-200 hover:bg-p9 hover:text-p1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Call us
            </a>
          </div>
        </div>

        <ul className="m-0 list-none border-t border-line p-0">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className="border-b border-line">
                <h3 className="m-0">
                  <button
                    type="button" id={`faq-q${i}`} aria-expanded={isOpen} aria-controls={`faq-a${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full cursor-pointer items-center justify-between gap-6 border-0 bg-transparent py-5 text-left font-display text-[clamp(18px,1.6vw,21px)] font-normal leading-[1.3] text-p9
                               focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-sm:py-4"
                  >
                    <span>{f.q}</span>
                    {/* plus → minus */}
                    <span aria-hidden="true" className="relative h-[18px] w-[18px] flex-none">
                      <span className="absolute left-0 top-2 h-0.5 w-[18px] rounded-sm bg-p7" />
                      <span className={`absolute left-0 top-2 h-0.5 w-[18px] rounded-sm bg-p7 transition-transform duration-[350ms] motion-reduce:transition-none ${isOpen ? 'rotate-0' : 'rotate-90'}`} />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-a${i}`} role="region" aria-labelledby={`faq-q${i}`}
                  className={`grid transition-[grid-template-rows] duration-[400ms] motion-reduce:transition-none ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[640px] pb-5 text-[15px] leading-[1.75] text-p7">{f.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}