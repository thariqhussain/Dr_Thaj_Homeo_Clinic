import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { ADDRESS, EMAIL, GALLERY, MAPS_URL, PHONES, SERVICES, TIME_SLOTS, WA_NUMBER } from '../data/content';
import MapCard from './MapCard';
import OpenStatus from './OpenStatus';
import { prefersReducedMotion, todayISO } from '../lib/utils';

/* Left panel photo (blurred, behind the clinic details). Swap for the real clinic photo —
   an exterior or entrance shot works best for highlighting the location. */
const BOOKING_PHOTO = GALLERY[1];

const LEAD_TIME_MIN = 30;   // can't book a slot starting sooner than this
const DAYS_AHEAD = 21;      // length of the date strip
const EMPTY = { name: '', phone: '', dob: '', service: '', prefDate: '', reason: '' };
const STEPS = ['You', 'Visit', 'Confirm'];
const REQUIRED_BY_STEP = [['name', 'phone'], ['service', 'prefDate']];
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromISO = (s) => new Date(`${s}T00:00:00`);
const fmtDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};
const longDate = (iso) => {
  const d = fromISO(iso);
  return `${WEEKDAY[d.getDay()]}, ${d.getDate()} ${MONTH[d.getMonth()]} ${d.getFullYear()}`;
};

const label = 'text-[11px] font-semibold uppercase tracking-[.1em] text-p5';
const optional = <span className="text-[11px] font-normal normal-case tracking-normal text-p6">(optional)</span>;
const required = <span className="font-bold text-[#ff6b6b]">*</span>;
const fieldCls = (invalid) =>
  `appearance-none rounded-lg border-[1.5px] px-3.5 py-[11px] font-body text-sm text-p1 outline-none transition-[border-color,background] duration-200 placeholder:text-p6 focus:border-accent ` +
  (invalid ? 'border-[#ff6b6b] bg-field-invalid' : 'border-p7 bg-p7 focus:bg-field-focus');
const chipCls = (active) =>
  `cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 font-body text-[13px] transition-[border-color,background,color] duration-150 ` +
  (active ? 'border-accent bg-slot-active text-p1' : 'border-p7 bg-p7 text-p3 hover:border-accent hover:text-p1');
const groupOutline = (invalid) =>
  `rounded-[10px] [outline-offset:4px] [transition:outline-color_.2s] ${invalid ? '[outline:1.5px_solid_#ff6b6b]' : '[outline:1.5px_solid_transparent]'}`;

function Field({ id, labelNode, error, invalid, children }) {
  return (
    <div className="flex flex-col gap-[7px]">
      <label htmlFor={id} className={label}>{labelNode}</label>
      {children}
      {invalid && <span className="mt-0.5 text-[11.5px] text-[#ff6b6b]">{error}</span>}
    </div>
  );
}

const infoIcons = {
  pin: <><path d="M12 21C12 21 5 13.5 5 8.5a7 7 0 0 1 14 0c0 5-7 12.5-7 12.5z" /><circle cx="12" cy="8.5" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14.5" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.4 2 2 0 0 1 3.05 1.22h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.07a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />,
};

function InfoItem({ icon, title, children }) {
  return (
    <div className="group flex items-start gap-[18px] border-t border-white/[.14] py-5 first:border-t-0 first:pt-0 last:pb-0">
      <div className="grid h-[46px] w-[46px] flex-none place-items-center rounded-full border border-accent-light/25 bg-accent-light/10 text-accent-light
                      [transition:background_.3s,color_.3s,transform_.4s_cubic-bezier(.34,1.4,.64,1)] group-hover:rotate-[-6deg] group-hover:scale-[1.08] group-hover:bg-accent group-hover:text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{infoIcons[icon]}</svg>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.14em] text-mint">{title}</p>
        <p className="text-[15.5px] leading-[1.65] text-p1">{children}</p>
      </div>
    </div>
  );
}

/* 1 — 2 — 3 progress indicator */
function Stepper({ step }) {
  return (
    <ol className="mb-7 flex items-center" aria-label="Booking steps">
      {STEPS.map((s, i) => {
        const done = i < step, on = i === step;
        return (
          <li key={s} aria-current={on ? 'step' : undefined} className="flex flex-1 items-center last:flex-none">
            <span className="flex items-center gap-2.5">
              <span
                className={`grid h-7 w-7 flex-none place-items-center rounded-full border-[1.5px] text-xs font-semibold transition-[background,border-color,color] duration-300
                            ${on ? 'border-accent bg-accent text-white' : done ? 'border-accent bg-accent/25 text-accent-light' : 'border-p7 bg-transparent text-p5'}`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className={`text-[13px] font-medium transition-colors duration-300 ${on ? 'text-p1' : done ? 'text-p3' : 'text-p5'}`}>{s}</span>
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="mx-3 h-[1.5px] flex-1 overflow-hidden rounded-full bg-p7 max-[375px]:mx-1.5">
                <span className={`block h-full origin-left bg-accent [transition:transform_.5s_ease] ${done ? 'scale-x-100' : 'scale-x-0'}`} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function SummaryRow({ title, value, onEdit }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-white/[.08] py-2.5 first:border-t-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[.1em] text-p5">{title}</dt>
      <dd className="flex items-baseline gap-3 text-right text-sm text-p1">
        <span>{value}</span>
        <button type="button" onClick={onEdit} className="cursor-pointer border-0 bg-transparent p-0 font-body text-xs text-accent-light underline-offset-4 hover:underline">Edit</button>
      </dd>
    </div>
  );
}

export default function Booking() {
  const [form, setForm] = useState(EMPTY);
  const [step, setStep] = useState(0);
  const [slot, setSlot] = useState('');                 // selected time ("HH:MM") or ''
  const [invalid, setInvalid] = useState({});           // { fieldName: true }
  const [slotInvalid, setSlotInvalid] = useState(false);
  const [warning, setWarning] = useState('');           // '' = hidden
  const [done, setDone] = useState(false);              // success screen after WhatsApp opens
  const [now, setNow] = useState(() => new Date());     // ticks every minute → "live" availability
  const panel = useRef(null);

  const today = todayISO();
  const isToday = !!form.prefDate && form.prefDate === today;
  const isSunday = !!form.prefDate && fromISO(form.prefDate).getDay() === 0;   // clinic is closed on Sundays

  /* keep availability live: re-check every minute */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const slotFrozen = (date, time) => {
    if (!date) return false;
    if (fromISO(date).getDay() === 0) return true;
    if (date !== today) return false;
    const [h, m] = time.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0);
    return d.getTime() <= now.getTime() + LEAD_TIME_MIN * 60000;
  };
  const dayClosed = (date) => fromISO(date).getDay() === 0 || (date === today && TIME_SLOTS.every((s) => slotFrozen(date, s.time)));
  const anyFrozen = TIME_SLOTS.some((s) => slotFrozen(form.prefDate, s.time));

  /* the next DAYS_AHEAD days, for the date strip */
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i);
    return d;
  });

  /* a chosen slot / date that has since closed is deselected */
  useEffect(() => { if (slot && slotFrozen(form.prefDate, slot)) setSlot(''); }, [now, form.prefDate, slot]); // eslint-disable-line
  useEffect(() => { if (form.prefDate && dayClosed(form.prefDate)) setForm((f) => ({ ...f, prefDate: '' })); }, [now]); // eslint-disable-line

  /* each step fades in */
  useEffect(() => {
    if (prefersReducedMotion() || !panel.current) return;
    const t = gsap.fromTo(panel.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity' });
    return () => t.kill();
  }, [step, done]);

  const stepReady =
    step === 0 ? !!(form.name.trim() && form.phone.trim())
    : step === 1 ? !!(form.service && form.prefDate && slot)
    : true;

  const hint = !form.prefDate
    ? 'Pick a date above to see live slot availability.'
    : isSunday
      ? 'The clinic is closed on Sundays — please pick another date.'
      : isToday && anyFrozen
        ? 'Slots already passed for today are grayed out.'
        : 'All slots are open for the selected date.';

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (invalid[key]) setInvalid((v) => ({ ...v, [key]: false }));
  };
  const pick = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (invalid[key]) setInvalid((v) => ({ ...v, [key]: false }));
  };
  const pickSlot = (time) => {
    if (slotFrozen(form.prefDate, time)) return;
    setSlot(time);
    setSlotInvalid(false);
    setWarning('');
  };

  const goTo = (i) => { setWarning(''); setStep(i); };

  const next = () => {
    const bad = {};
    (REQUIRED_BY_STEP[step] || []).forEach((k) => { if (!form[k].trim()) bad[k] = true; });
    const firstBad = (REQUIRED_BY_STEP[step] || []).find((k) => bad[k]);
    const slotMissing = step === 1 && !slot;
    setInvalid(bad);
    setSlotInvalid(slotMissing);
    if (firstBad || slotMissing) {
      setWarning(firstBad
        ? 'Please fill in the highlighted fields to continue.'
        : 'Please select a preferred time slot to continue.');
      if (firstBad) document.getElementById(`bk-${firstBad}`)?.focus();
      return;
    }
    goTo(step + 1);
  };

  const submit = () => {
    const slotLabel = TIME_SLOTS.find((s) => s.time === slot)?.label ?? slot;
    const lines = [
      'New Appointment Request', '',
      `Name: ${form.name.trim()}`,
      `Phone: ${form.phone.trim()}`,
      form.dob ? `Date of Birth: ${fmtDate(form.dob)}` : null,
      `Service: ${form.service}`,
      `Preferred Date: ${fmtDate(form.prefDate)}`,
      `Preferred Time: ${slotLabel}`,
      form.reason.trim() ? `Reason: ${form.reason.trim()}` : null,
    ].filter((l) => l !== null).join('\n');

    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines)}`, '_blank');

    /* clear the form and show the confirmation screen */
    setForm(EMPTY); setSlot(''); setInvalid({}); setSlotInvalid(false); setWarning('');
    setDone(true);
  };

  const restart = () => { setDone(false); setStep(0); };
  const slotLabel = TIME_SLOTS.find((s) => s.time === slot)?.label ?? slot;

  return (
    <section
      id="booking"
      className="m-12 grid min-h-[600px] grid-cols-2 overflow-hidden rounded-[28px] bg-p6 shadow-[0_40px_80px_-30px_rgba(20,20,20,.35),0_16px_32px_-12px_rgba(20,20,20,.2),inset_0_1px_0_rgba(255,255,255,.06)]
                 max-lg:m-8 max-lg:grid-cols-1 max-lg:rounded-[22px] max-sm:m-4 max-sm:rounded-[18px] max-[375px]:m-3 max-[375px]:rounded-[14px] max-[320px]:m-2 max-[320px]:rounded-xl"
    >
      {/* LEFT — clinic details over a blurred clinic photo */}
      <div
        id="contact"
        className="relative flex scroll-mt-24 flex-col justify-center overflow-hidden bg-[#14211a] px-[52px] py-16
                   max-lg:px-8 max-lg:py-12 max-sm:px-[18px] max-sm:py-10 max-[375px]:px-3.5 max-[375px]:py-8"
      >
        <img src={BOOKING_PHOTO} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-110 object-cover blur-[6px]" />
        <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(160deg,rgba(20,33,26,.7)_0%,rgba(20,33,26,.9)_100%)]" />
        <span aria-hidden="true" className="orb -bottom-[120px] -right-[120px] h-80 w-80 bg-accent/35" />
        <div className="relative rounded-3xl border border-white/20 bg-white/[.07] p-8 backdrop-blur-md max-sm:rounded-2xl max-sm:p-5">
          <p className="eyebrow eyebrow-dark">Visit us</p>
          <h3 className="mb-8 mt-1.5 font-display text-[clamp(28px,3.2vw,40px)] font-normal leading-[1.1] text-white">Clinic details</h3>
          <div className="flex flex-col">
            <InfoItem icon="pin" title="Location">
              {ADDRESS}
              <br />
              <a href={MAPS_URL} target="_blank" rel="noopener" className="mt-1.5 inline-block text-[13.5px] text-accent-light underline-offset-4 hover:underline">Get directions →</a>
            </InfoItem>
            <InfoItem icon="clock" title="Consultation hours">Monday – Saturday<br />6:00 PM – 10:00 PM</InfoItem>
            <InfoItem icon="phone" title="Phone">
              {PHONES.map((p, i) => (
                <span key={p.tel}>
                  {i > 0 && <br />}
                  <a href={`tel:${p.tel}`} className="border-b border-white/30 text-inherit no-underline transition-[border-color] duration-200 hover:border-accent-light">{p.display}</a>
                </span>
              ))}
            </InfoItem>
            {EMAIL && (
              <InfoItem icon="mail" title="Email">
                <a href={`mailto:${EMAIL}`} className="border-b border-white/30 text-inherit no-underline transition-[border-color] duration-200 hover:border-accent-light">{EMAIL}</a>
              </InfoItem>
            )}
          </div>
          <MapCard className="mt-8" />
        </div>
      </div>

      {/* RIGHT — appointment wizard */}
      <div className="flex flex-col justify-center bg-p8 px-[52px] py-16 max-lg:px-8 max-lg:py-12 max-sm:px-4 max-sm:py-10 max-[375px]:px-3 max-[375px]:py-8 max-[320px]:px-2.5 max-[320px]:py-7">
        <h2 className="mb-2 font-display text-[clamp(22px,2.8vw,36px)] font-normal text-p1 max-[375px]:text-[22px] max-[320px]:text-xl">Schedule your Appointment</h2>
        <p className="mb-3 text-sm leading-relaxed text-p5 max-[375px]:text-[13px]">
          Fill in the details below and our team will confirm your slot shortly.
        </p>
        <OpenStatus which="consultation" className="mb-6" />

        {done ? (
          <div ref={panel} role="status" className="rounded-2xl border border-accent/40 bg-accent/10 p-7 text-center">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent text-xl text-white" aria-hidden="true">✓</span>
            <h3 className="mb-2 font-display text-2xl font-normal text-p1">Your request is ready</h3>
            <p className="mx-auto mb-6 max-w-[360px] text-sm leading-relaxed text-p3">
              WhatsApp opened with your details. Send the message to complete your request — our team will confirm your slot shortly.
            </p>
            <button type="button" onClick={restart} className="cursor-pointer rounded-[10px] border-[1.5px] border-p7 bg-transparent px-5 py-2.5 font-body text-sm text-p1 transition-[border-color] duration-200 hover:border-accent">
              Book another appointment
            </button>
          </div>
        ) : (
          <>
            <Stepper step={step} />

            <div ref={panel}>
              {/* STEP 1 — you */}
              {step === 0 && (
                <>
                  <div className="mb-5 grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                    <Field id="bk-name" labelNode={<>Full Name {required}</>} invalid={invalid.name} error="Please enter your name.">
                      <input id="bk-name" type="text" autoComplete="name" placeholder="Your name" value={form.name} onChange={set('name')} className={fieldCls(invalid.name)} />
                    </Field>
                    <Field id="bk-phone" labelNode={<>Phone Number {required}</>} invalid={invalid.phone} error="Please enter your phone number.">
                      <input id="bk-phone" type="tel" autoComplete="tel" placeholder="+91 …" value={form.phone} onChange={set('phone')} className={fieldCls(invalid.phone)} />
                    </Field>
                  </div>
                  <div className="mb-2 grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                    <Field id="bk-dob" labelNode={<>Date of Birth {optional}</>}>
                      <input id="bk-dob" type="date" value={form.dob} onChange={set('dob')} className={fieldCls(false)} />
                    </Field>
                  </div>
                </>
              )}

              {/* STEP 2 — visit: service chips, date strip, time slots */}
              {step === 1 && (
                <>
                  <div className="mb-5">
                    <p className={`${label} mb-2.5`}>Service Needed {required}</p>
                    <div id="bk-service" tabIndex={-1} role="group" aria-label="Service needed" className={`flex flex-wrap gap-2 outline-none ${groupOutline(invalid.service)}`}>
                      {SERVICES.map((s) => (
                        <button key={s} type="button" aria-pressed={form.service === s} onClick={() => pick('service', s)} className={chipCls(form.service === s)}>{s}</button>
                      ))}
                    </div>
                    {invalid.service && <span className="mt-1.5 block text-[11.5px] text-[#ff6b6b]">Please select a service.</span>}
                  </div>

                  <div className="mb-5">
                    <p className={`${label} mb-2.5`}>Preferred Date {required}</p>
                    <div
                      id="bk-prefDate" tabIndex={-1} role="group" aria-label="Preferred date"
                      className={`flex snap-x gap-2 overflow-x-auto pb-2 outline-none [scrollbar-width:thin] ${groupOutline(invalid.prefDate)}`}
                    >
                      {days.map((d, i) => {
                        const iso = isoOf(d);
                        const closed = dayClosed(iso);
                        const active = form.prefDate === iso;
                        return (
                          <button
                            key={iso} type="button" disabled={closed} aria-pressed={active}
                            aria-label={`${longDate(iso)}${closed ? ', closed' : ''}`}
                            onClick={() => pick('prefDate', iso)}
                            className={`flex h-[70px] w-[58px] flex-none snap-start flex-col items-center justify-center gap-0.5 rounded-xl border-[1.5px] font-body transition-[border-color,background,color] duration-150
                                        ${closed ? 'cursor-not-allowed border-p7 bg-p7 text-p3 opacity-[.38]'
                                          : active ? 'cursor-pointer border-accent bg-slot-active text-p1'
                                          : 'cursor-pointer border-p7 bg-p7 text-p3 hover:border-accent hover:text-p1'}`}
                          >
                            <span className="text-[10.5px] uppercase tracking-[.08em]">{i === 0 ? 'Today' : WEEKDAY[d.getDay()]}</span>
                            <span className="font-display text-[22px] leading-none">{d.getDate()}</span>
                            <span className="text-[10.5px]">{closed ? 'Closed' : MONTH[d.getMonth()]}</span>
                          </button>
                        );
                      })}
                    </div>
                    {invalid.prefDate && <span className="mt-1 block text-[11.5px] text-[#ff6b6b]">Please choose a preferred date.</span>}
                  </div>

                  <div className="mb-1.5 flex items-center justify-between">
                    <p className={label}>Preferred Time Slot {required}</p>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[.04em] text-[#6bda8f]">
                      <span className="pause-offscreen h-[7px] w-[7px] animate-bk-live-pulse rounded-full bg-[#3ddc76] shadow-[0_0_0_0_rgba(61,220,118,.6)]" />Live availability
                    </span>
                  </div>
                  <p className="mb-2.5 text-xs text-p5">{hint}</p>
                  <div className={`mb-2 grid grid-cols-4 gap-2 max-sm:grid-cols-2 ${groupOutline(slotInvalid)}`}>
                    {TIME_SLOTS.map((s) => {
                      const frozen = slotFrozen(form.prefDate, s.time);
                      const active = slot === s.time;
                      return (
                        <button
                          key={s.time} type="button" disabled={frozen} onClick={() => pickSlot(s.time)}
                          className={`rounded-lg border-[1.5px] px-1 py-[9px] text-center font-body text-[13px] transition-[border-color,background,color] duration-150
                                      ${frozen ? 'pointer-events-none cursor-not-allowed border-p7 bg-p7 text-p3 line-through opacity-[.38]'
                                        : active ? 'cursor-pointer border-accent bg-slot-active text-p1'
                                        : 'cursor-pointer border-p7 bg-p7 text-p3 hover:border-accent hover:text-p1'}`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* STEP 3 — confirm: reason + summary */}
              {step === 2 && (
                <>
                  <div className="mb-5">
                    <Field id="bk-reason" labelNode={<>Reason for Visit {optional}</>}>
                      <textarea id="bk-reason" placeholder="Tell us briefly what's going on…" value={form.reason} onChange={set('reason')} className={`${fieldCls(false)} min-h-[80px] resize-y`} />
                    </Field>
                  </div>
                  <dl className="mb-2 rounded-xl border border-white/[.1] bg-white/[.04] px-4 py-1.5">
                    <SummaryRow title="Name" value={form.name.trim()} onEdit={() => goTo(0)} />
                    <SummaryRow title="Phone" value={form.phone.trim()} onEdit={() => goTo(0)} />
                    {form.dob && <SummaryRow title="Date of birth" value={fmtDate(form.dob)} onEdit={() => goTo(0)} />}
                    <SummaryRow title="Service" value={form.service} onEdit={() => goTo(1)} />
                    <SummaryRow title="When" value={`${longDate(form.prefDate)} · ${slotLabel}`} onEdit={() => goTo(1)} />
                  </dl>
                </>
              )}
            </div>

            {warning && (
              <p role="alert" className="mt-3.5 mb-0 flex items-center gap-2 rounded-lg border border-[#ff6b6b]/40 bg-warn-bg px-3.5 py-2.5 text-[13px] text-[#ff6b6b]">
                {warning}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              {step > 0 && (
                <button
                  type="button" onClick={() => goTo(step - 1)}
                  className="cursor-pointer rounded-[10px] border-[1.5px] border-p7 bg-transparent px-5 py-3.5 font-body text-[15px] text-p3 transition-[border-color,color] duration-200 hover:border-p5 hover:text-p1"
                >
                  Back
                </button>
              )}
              <button
                type="button" onClick={step === STEPS.length - 1 ? submit : next}
                className={`flex-1 cursor-pointer rounded-[10px] border-none p-3.5 font-body text-[15px] font-semibold tracking-[.02em] text-p9 transition-[background,transform] duration-200 active:scale-[.99]
                            ${stepReady ? 'bg-p1 hover:bg-p3' : 'bg-p5 opacity-[.45]'}`}
              >
                {step === STEPS.length - 1 ? 'Confirm Appointment' : 'Continue'}
              </button>
            </div>
            {step === STEPS.length - 1 && (
              <p className="mt-3 text-center text-xs text-p5">This opens WhatsApp with your details — send the message to complete your request.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}