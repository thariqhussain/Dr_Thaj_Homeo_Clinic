import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { ADDRESS, EMAIL, GALLERY, MAPS_URL, PHARMACY, PHONES, SCHEDULE, SERVICES, TIME_SLOTS, WA_NUMBER } from '../data/content';
import MapCard from './MapCard';
import { getStatus } from './OpenStatus';
import { prefersReducedMotion, todayISO } from '../lib/utils';

/* Left panel photo (blurred, behind the clinic details). Swap for the real clinic photo —
   an exterior or entrance shot works best for highlighting the location. */
const BOOKING_PHOTO = GALLERY[1];

/* consultation days + both sessions, read from content.js → PHARMACY.hours so there is one place to edit */
const CONSULT = PHARMACY.hours.find((h) => h.key === 'consultation');

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

/* short date for the WhatsApp message: "18 Oct 2026" */
const fmtShort = (iso) => {
  if (!iso) return '';
  const d = fromISO(iso);
  return `${d.getDate()} ${MONTH[d.getMonth()]} ${d.getFullYear()}`;
};

/* ── validation ──
   Each validator returns '' when the value is fine, otherwise the message shown under the field. */
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;      // letters (any language), spaces, . ' - ; must start with a letter
const PHONE_RE = /^(?:\+91|91|0)?[6-9]\d{9}$/;               // Indian mobile: 10 digits starting 6-9, optional +91 / 91 / 0
const validateName = (v) => {
  const s = v.trim().replace(/\s+/g, ' ');
  if (!s) return 'Please enter your name.';
  if ((s.match(/\p{L}/gu) || []).length < 2) return 'Please enter your full name (at least 2 letters).';
  if (s.length > 60) return 'Name is too long (60 characters max).';
  if (!NAME_RE.test(s)) return 'Name can only contain letters, spaces, . \' and -';
  return '';
};
const validatePhone = (v) => {
  const s = v.trim();
  if (!s) return 'Please enter your phone number.';
  if (/[^\d\s+\-().]/.test(s)) return 'Phone number can only contain digits.';
  if (!PHONE_RE.test(s.replace(/[\s\-().]/g, ''))) return 'Enter a valid 10-digit mobile number, e.g. 97910 23254.';
  return '';
};
const VALIDATORS = { name: validateName, phone: validatePhone };
/* "+91 97910 23254" — whatever way the number was typed */
const prettyPhone = (v) => {
  const d = v.replace(/\D/g, '').slice(-10);
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
};

/* ── draft saving ──
   What the patient has typed so far is kept in sessionStorage, so a normal or hard reload (or an accidental
   refresh) brings the form back exactly where it was. It is cleared once the request is sent. sessionStorage is
   used on purpose: it survives reloads but is dropped when the tab is closed, so health details don't linger on a
   shared computer. To keep drafts even after the browser is closed, change `sessionStorage` to `localStorage`
   in the three places below. */
/* ── automatic sending ──
   OFF by default. Until VITE_BOOKING_API is set (at build time), Confirm simply opens WhatsApp with the message filled in,
   exactly as before — nothing else is needed and api/book.js can be left out of the project.
   To turn automatic sending on: deploy api/book.js, set VITE_BOOKING_API=/api/book, and rebuild (see WHATSAPP_SETUP.md).
   Confirm then posts the request there and the server sends the WhatsApp message to the clinic by itself.
   If that request fails (no internet, WhatsApp rejects it…), the patient gets a "Send on WhatsApp" button with the same
   message ready to send, so a booking is never lost. */
const BOOKING_API = import.meta.env?.VITE_BOOKING_API || '';

const DRAFT_KEY = 'drthaj:booking-draft';
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');

function loadDraft() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return null;
    const today = todayISO();
    const f = raw.form || {};
    const form = {
      name: str(f.name, 60), phone: str(f.phone, 18),
      dob: ISO_RE.test(f.dob) && f.dob <= today ? f.dob : '',
      service: SERVICES.includes(f.service) ? f.service : '',
      prefDate: ISO_RE.test(f.prefDate) && f.prefDate >= today ? f.prefDate : '',   // a date that has passed is dropped
      reason: str(f.reason, 1000),
    };
    let slot = TIME_SLOTS.some((s) => s.time === raw.slot) && form.prefDate ? raw.slot : '';
    let step = [0, 1, 2].includes(raw.step) ? raw.step : 0;
    if (step >= 1 && (validateName(form.name) || validatePhone(form.phone))) step = 0;
    if (step === 2 && !(form.service && form.prefDate && slot)) step = 1;
    return { form, slot, step };
  } catch { return null; }
}

const label = 'text-[11px] font-semibold uppercase tracking-[.1em] text-p5';
const optional = <span className="text-[11px] font-normal normal-case tracking-normal text-p6">(optional)</span>;
const required = <span className="font-bold text-[#ff6b6b]">*</span>;
const fieldCls = (invalid) =>
  `appearance-none rounded-lg border-[1.5px] px-3.5 py-[11px] font-body text-sm text-p1 outline-none transition-[border-color,background] duration-200 placeholder:text-p6 focus:border-accent ` +
  (invalid ? 'border-[#ff6b6b] bg-field-invalid' : 'border-p7 bg-p7 focus:bg-field-focus');
const chipCls = (active) =>
  `cursor-pointer rounded-full border-[1.5px] px-3 py-1.5 font-body text-[12.5px] transition-[border-color,background,color] duration-150 ` +
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
    <div className="group flex items-start gap-4 border-t border-white/[.14] py-3.5 first:border-t-0 first:pt-0 last:pb-0">
      <div className="grid h-10 w-10 flex-none place-items-center rounded-full border border-accent-light/25 bg-accent-light/10 text-accent-light
                      [transition:background_.3s,color_.3s,transform_.4s_cubic-bezier(.34,1.4,.64,1)] group-hover:rotate-[-6deg] group-hover:scale-[1.08] group-hover:bg-accent group-hover:text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{infoIcons[icon]}</svg>
      </div>
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-mint">{title}</p>
        <p className="text-[14.5px] leading-[1.6] text-p1">{children}</p>
      </div>
    </div>
  );
}

/* 1 — 2 — 3 progress indicator */
function Stepper({ step }) {
  return (
    <ol className="mb-5 flex items-center" aria-label="Booking steps">
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

/* Consultation status for the form header: an icon tile + two lines of text (no dot, no "live" badge).
   Open → a green clock tile, "Open now" / "Closing soon"; closed → a dim moon tile, "Closed now" with the next opening.
   Text comes from getStatus() in OpenStatus.jsx, so it always uses the clinic's time zone. Booking re-renders every
   minute (see `now` below), which keeps it current. */
function ClinicStatus() {
  const st = getStatus(SCHEDULE.consultation);
  if (!st) return null;
  const [head, tail] = st.text.split(' · ');
  const title = st.open ? (head.startsWith('Closes in') ? 'Closing soon' : 'Open now') : 'Closed now';
  const sub = tail ? tail.charAt(0).toUpperCase() + tail.slice(1) : head;
  return (
    <div role="status" className="inline-flex items-center gap-3 rounded-xl border border-white/[.1] bg-white/[.04] py-1.5 pl-1.5 pr-4">
      <span aria-hidden="true" className={`grid h-9 w-9 flex-none place-items-center rounded-lg ${st.open ? 'bg-accent text-white' : 'bg-white/10 text-p4'}`}>
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {st.open
            ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>
            : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />}
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[13px] font-semibold text-p1">{title}</span>
        <span className="text-xs text-p5">{sub}</span>
      </span>
    </div>
  );
}

export default function Booking() {
  const [draft] = useState(loadDraft);                 // saved draft from before a reload (or null), read once
  const [form, setForm] = useState(draft?.form ?? EMPTY);
  const [step, setStep] = useState(draft?.step ?? 0);
  const [slot, setSlot] = useState(draft?.slot ?? '');  // selected time ("HH:MM") or ''
  const [invalid, setInvalid] = useState({});           // { fieldName: true | 'error message' }
  const [slotInvalid, setSlotInvalid] = useState(false);
  const [warning, setWarning] = useState('');           // '' = hidden
  const [done, setDone] = useState(false);              // success screen after the request has been sent
  const [sentMode, setSentMode] = useState('auto');      // 'auto' = sent by the server, 'manual' = patient sends it on WhatsApp
  const [sending, setSending] = useState(false);         // request in flight
  const [waLink, setWaLink] = useState('');              // fallback wa.me link, shown only if automatic sending failed
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

  /* save the draft after every change (removed again when the form is empty or has been sent) */
  useEffect(() => {
    if (done) return;
    try {
      const empty = !Object.values(form).some(Boolean) && !slot && step === 0;
      if (empty) sessionStorage.removeItem(DRAFT_KEY);
      else sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, slot, step }));
    } catch { /* private mode / storage full: the form still works, it just won't survive a reload */ }
  }, [form, slot, step, done]);

  /* each step fades in */
  useEffect(() => {
    if (prefersReducedMotion() || !panel.current) return;
    const t = gsap.fromTo(panel.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity' });
    return () => t.kill();
  }, [step, done]);

  const stepReady =
    step === 0 ? !validateName(form.name) && !validatePhone(form.phone)
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
  /* check a text field when the patient leaves it (an empty field is only flagged on Continue) */
  const check = (key) => {
    if (!form[key].trim()) return;
    const err = VALIDATORS[key](form[key]);
    setInvalid((v) => ({ ...v, [key]: err || false }));
  };
  const errOf = (key, fallback) => (typeof invalid[key] === 'string' ? invalid[key] : fallback);
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
    (REQUIRED_BY_STEP[step] || []).forEach((k) => {
      const err = VALIDATORS[k] ? VALIDATORS[k](form[k]) : (form[k].trim() ? '' : true);
      if (err) bad[k] = err;
    });
    const firstBad = (REQUIRED_BY_STEP[step] || []).find((k) => bad[k]);
    const slotMissing = step === 1 && !slot;
    setInvalid(bad);
    setSlotInvalid(slotMissing);
    if (firstBad || slotMissing) {
      setWarning(firstBad
        ? 'Please correct the highlighted fields to continue.'
        : 'Please select a preferred time slot to continue.');
      if (firstBad) document.getElementById(`bk-${firstBad}`)?.focus();
      return;
    }
    goTo(step + 1);
  };

  /* request sent (or handed to WhatsApp): forget the saved draft, clear the form and show the confirmation screen */
  const finish = (mode) => {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setForm(EMPTY); setSlot(''); setInvalid({}); setSlotInvalid(false); setWarning(''); setWaLink('');
    setSentMode(mode); setDone(true);
  };

  const submit = async () => {
    if (sending) return;
    /* safety net: never send a request with an invalid name / phone */
    const nameErr = validateName(form.name), phoneErr = validatePhone(form.phone);
    if (nameErr || phoneErr) {
      setInvalid({ name: nameErr || false, phone: phoneErr || false });
      setStep(0);
      setWarning('Please correct the highlighted fields to continue.');
      return;
    }

    const details = {
      name: form.name.trim().replace(/\s+/g, ' '),
      phone: prettyPhone(form.phone),
      dob: form.dob ? fmtShort(form.dob) : '',
      service: form.service,
      date: fmtShort(form.prefDate),
      time: slotLabel,
      problem: form.reason.trim(),
    };
    /* optional lines (date of birth, problem) are left out when empty */
    const text = [
      'Hello Doctor, I would like to book an appointment. My details:', '',
      `Name: ${details.name}`,
      `Phone: ${details.phone}`,
      details.dob ? `Date of Birth: ${details.dob}` : null,
      `Treatment: ${details.service}`,
      `Preferred Date: ${details.date}`,
      `Preferred Time: ${details.time}`,
      details.problem ? `Problem: ${details.problem}` : null,
      '', 'Thank you 🙏',
    ].filter((l) => l !== null).join('\n');

    const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

    /* automatic sending not switched on: open WhatsApp with the message filled in (the patient presses send) */
    if (!BOOKING_API) {
      window.open(waUrl, '_blank');
      finish('manual');
      return;
    }

    setSending(true); setWarning(''); setWaLink('');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(BOOKING_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details), signal: ctrl.signal,
      });
      /* count it as sent only if the server really answered { ok: true } (a missing /api/book can return the homepage with status 200) */
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok !== true) throw new Error(`status ${res.status}`);
      finish('auto');
    } catch {
      /* could not send by itself: offer the ready-made WhatsApp message (a tap, so browsers allow it to open) */
      setWaLink(waUrl);
      setWarning("We couldn't send your request automatically. Please send it on WhatsApp instead — your details are filled in.");
    } finally {
      clearTimeout(timer);
      setSending(false);
    }
  };

  const restart = () => { setDone(false); setStep(0); };
  const slotLabel = TIME_SLOTS.find((s) => s.time === slot)?.label ?? slot;

  return (
    <section
      id="booking"
      className="m-12 grid grid-cols-[.85fr_1.15fr] overflow-hidden rounded-[28px] lg:h-[calc(100svh-112px)] lg:min-h-[560px] lg:grid-rows-[minmax(0,1fr)] bg-p6 shadow-[0_40px_80px_-30px_rgba(20,20,20,.35),0_16px_32px_-12px_rgba(20,20,20,.2),inset_0_1px_0_rgba(255,255,255,.06)]
                 max-lg:m-8 max-lg:grid-cols-1 max-lg:rounded-[22px] max-sm:m-4 max-sm:rounded-[18px] max-[375px]:m-3 max-[375px]:rounded-[14px] max-[320px]:m-2 max-[320px]:rounded-xl"
    >
      {/* LEFT — clinic details over a blurred clinic photo */}
      <div id="contact" className="relative scroll-mt-24 overflow-hidden bg-[#14211a] max-lg:order-2 lg:min-h-0">
        <img src={BOOKING_PHOTO} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-110 object-cover blur-[6px]" />
        <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(160deg,rgba(20,33,26,.7)_0%,rgba(20,33,26,.9)_100%)]" />
        <span aria-hidden="true" className="orb -bottom-[120px] -right-[120px] h-80 w-80 bg-accent/35" />
        <div className="relative flex h-full flex-col overflow-y-auto px-9 py-6 [scrollbar-width:thin] max-lg:px-8 max-lg:py-10 max-sm:px-[18px] max-sm:py-8 max-[375px]:px-3.5 max-[375px]:py-7">
        <div className="relative my-auto rounded-3xl border border-white/20 bg-white/[.07] p-6 backdrop-blur-md max-sm:rounded-2xl max-sm:p-5">
          <p className="eyebrow eyebrow-dark !mb-2">Visit us</p>
          <h3 className="mb-5 mt-0.5 font-display text-[clamp(26px,2.6vw,34px)] font-normal leading-[1.1] text-white">Clinic details</h3>
          <div className="flex flex-col">
            <InfoItem icon="pin" title="Location">
              {ADDRESS}
              <br />
              <a href={MAPS_URL} target="_blank" rel="noopener" className="mt-1.5 inline-block text-[13.5px] text-accent-light underline-offset-4 hover:underline">Get directions →</a>
            </InfoItem>
            <InfoItem icon="clock" title="Consultation hours">
              {CONSULT?.days}
              {CONSULT?.time.split(', ').map((t) => <span key={t}><br />{t}</span>)}
            </InfoItem>
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
          <MapCard className="mt-5 lg:[&_iframe]:h-[140px]" />
        </div>
        </div>
      </div>

      {/* RIGHT — appointment wizard */}
      <div className="flex min-h-0 flex-col bg-p8 px-10 py-6 max-lg:order-1 max-lg:px-8 max-lg:py-10 max-sm:px-4 max-sm:py-8 max-[375px]:px-3 max-[375px]:py-7 max-[320px]:px-2.5 max-[320px]:py-6 lg:overflow-y-auto [scrollbar-width:thin]">
        <div className="my-auto">
        <h2 className="mb-1 font-display text-[clamp(22px,2.4vw,32px)] font-normal text-p1 max-[375px]:text-[22px] max-[320px]:text-xl">Schedule your Appointment</h2>
        <p className="mb-3 text-sm leading-relaxed text-p5 max-[375px]:text-[13px]">
          Fill in the details below and our team will confirm your slot shortly.
        </p>
        <div className="mb-5"><ClinicStatus /></div>

        {done ? (
          <div ref={panel} role="status" className="rounded-2xl border border-accent/40 bg-accent/10 p-7 text-center">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent text-xl text-white" aria-hidden="true">✓</span>
            <h3 className="mb-2 font-display text-2xl font-normal text-p1">{sentMode === 'auto' ? 'Request sent' : 'Your request is ready'}</h3>
            <p className="mx-auto mb-6 max-w-[360px] text-sm leading-relaxed text-p3">
              {sentMode === 'auto'
                ? 'Your appointment request has been sent to the clinic. Our team will contact you shortly to confirm your slot.'
                : 'WhatsApp opened with your details. Send the message to complete your request — our team will confirm your slot shortly.'}
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
                    <Field id="bk-name" labelNode={<>Full Name {required}</>} invalid={invalid.name} error={errOf('name', 'Please enter your name.')}>
                      <input
                        id="bk-name" type="text" autoComplete="name" placeholder="Your name" maxLength={60}
                        value={form.name} onChange={set('name')} onBlur={() => check('name')}
                        aria-invalid={!!invalid.name} className={fieldCls(invalid.name)}
                      />
                    </Field>
                    <Field id="bk-phone" labelNode={<>Phone Number {required}</>} invalid={invalid.phone} error={errOf('phone', 'Please enter your phone number.')}>
                      <input
                        id="bk-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 97910 23254" maxLength={18}
                        value={form.phone} onChange={(e) => pick('phone', e.target.value.replace(/[^\d\s+\-()]/g, ''))} onBlur={() => check('phone')}
                        aria-invalid={!!invalid.phone} className={fieldCls(invalid.phone)}
                      />
                    </Field>
                  </div>
                  <div className="mb-2 grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                    <Field id="bk-dob" labelNode={<>Date of Birth {optional}</>}>
                      <input id="bk-dob" type="date" max={today} value={form.dob} onChange={set('dob')} className={fieldCls(false)} />
                    </Field>
                  </div>
                </>
              )}

              {/* STEP 2 — visit: service chips, date strip, time slots */}
              {step === 1 && (
                <>
                  <div className="mb-4">
                    <p className={`${label} mb-2`}>Service Needed {required}</p>
                    <div id="bk-service" tabIndex={-1} role="group" aria-label="Service needed" className={`flex flex-wrap gap-2 outline-none ${groupOutline(invalid.service)}`}>
                      {SERVICES.map((s) => (
                        <button key={s} type="button" aria-pressed={form.service === s} onClick={() => pick('service', s)} className={chipCls(form.service === s)}>{s}</button>
                      ))}
                    </div>
                    {invalid.service && <span className="mt-1.5 block text-[11.5px] text-[#ff6b6b]">Please select a service.</span>}
                  </div>

                  <div className="mb-3">
                    <p className={`${label} mb-2`}>Preferred Date {required}</p>
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
                            className={`flex h-[62px] w-[54px] flex-none snap-start flex-col items-center justify-center gap-0.5 rounded-xl border-[1.5px] font-body transition-[border-color,background,color] duration-150
                                        ${closed ? 'cursor-not-allowed border-p7 bg-p7 text-p3 opacity-[.38]'
                                          : active ? 'cursor-pointer border-accent bg-slot-active text-p1'
                                          : 'cursor-pointer border-p7 bg-p7 text-p3 hover:border-accent hover:text-p1'}`}
                          >
                            <span className="text-[10.5px] uppercase tracking-[.08em]">{i === 0 ? 'Today' : WEEKDAY[d.getDay()]}</span>
                            <span className="font-display text-[20px] leading-none">{d.getDate()}</span>
                            <span className="text-[10.5px]">{closed ? 'Closed' : MONTH[d.getMonth()]}</span>
                          </button>
                        );
                      })}
                    </div>
                    {invalid.prefDate && <span className="mt-1 block text-[11.5px] text-[#ff6b6b]">Please choose a preferred date.</span>}
                  </div>

                  <div className="mb-1.5 flex items-center justify-between">
                    <p className={label}>Preferred Time Slot {required}</p>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[.04em] text-mint">
                      <svg aria-hidden="true" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>
                      Updated live
                    </span>
                  </div>
                  <p className="mb-2 text-xs text-p5">{hint}</p>
                  <div className={`mb-1 grid grid-cols-4 gap-1.5 min-[1280px]:grid-cols-7 ${groupOutline(slotInvalid)}`}>
                    {TIME_SLOTS.map((s) => {
                      const frozen = slotFrozen(form.prefDate, s.time);
                      const active = slot === s.time;
                      return (
                        <button
                          key={s.time} type="button" disabled={frozen} onClick={() => pickSlot(s.time)}
                          className={`rounded-lg border-[1.5px] px-1 py-2 text-center font-body text-[12.5px] transition-[border-color,background,color] duration-150 max-[375px]:text-xs
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
              <div role="alert" className="mt-3.5 mb-0 rounded-lg border border-[#ff6b6b]/40 bg-warn-bg px-3.5 py-2.5 text-[13px] text-[#ff6b6b]">
                <p className="m-0">{warning}</p>
                {waLink && (
                  <a
                    href={waLink} target="_blank" rel="noopener" onClick={() => finish('manual')}
                    className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-p9 no-underline transition-colors duration-200 hover:bg-accent-light"
                  >
                    Send on WhatsApp
                  </a>
                )}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              {step > 0 && (
                <button
                  type="button" onClick={() => goTo(step - 1)}
                  className="cursor-pointer rounded-[10px] border-[1.5px] border-p7 bg-transparent px-5 py-3 font-body text-[15px] text-p3 transition-[border-color,color] duration-200 hover:border-p5 hover:text-p1"
                >
                  Back
                </button>
              )}
              <button
                type="button" onClick={step === STEPS.length - 1 ? submit : next} disabled={sending} aria-busy={sending}
                className={`flex-1 cursor-pointer disabled:cursor-wait disabled:opacity-70 rounded-[10px] border-none p-3 font-body text-[15px] font-semibold tracking-[.02em] text-p9 transition-[background,transform] duration-200 active:scale-[.99]
                            ${stepReady ? 'bg-p1 hover:bg-p3' : 'bg-p5 opacity-[.45]'}`}
              >
                {step === STEPS.length - 1 ? (sending ? 'Sending…' : 'Confirm Appointment') : 'Continue'}
              </button>
            </div>
            {step === STEPS.length - 1 && (
              <p className="mt-3 text-center text-xs text-p5">
                {BOOKING_API
                  ? 'Your request is sent straight to the clinic — there is nothing to send yourself.'
                  : 'This opens WhatsApp with your details — send the message to complete your request.'}
              </p>
            )}
          </>
        )}
        </div>
      </div>
    </section>
  );
}