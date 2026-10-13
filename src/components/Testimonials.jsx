import { PATIENT_TAGS, REVIEWS, REVIEWS_URL } from '../data/content';
import './Testimonials.css';

/* Patient feedback strip (Justdial). Plain CSS — see Testimonials.css */
export default function Testimonials() {
  return (
    <section className="tm" id="patient-voices" aria-labelledby="tm-title">
      <div className="tm-head">
        <p className="tm-eyebrow">Patient feedback</p>
        <h2 id="tm-title" className="tm-title">What our patients <em>say</em></h2>
      </div>

      <ul className="tm-tags" aria-label="What patients appreciate">
        {PATIENT_TAGS.map((t) => <li key={t}>{t}</li>)}
      </ul>

      <div className="tm-grid">
        {REVIEWS.map((r) => (
          <figure key={r.name} className="tm-card">
            <div className="tm-stars" role="img" aria-label="5 out of 5 stars">★★★★★</div>
            <blockquote className="tm-quote">“{r.text}”</blockquote>
            <figcaption className="tm-by">
              <strong>{r.name}</strong>
              <span>via Justdial</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <a className="tm-link" href={REVIEWS_URL} target="_blank" rel="noopener">Read all reviews on Justdial →</a>
    </section>
  );
}