import { useEffect, useState } from 'react';
import { SCHEDULE, TIMEZONE } from '../data/content';

/* Live "Open now / Closes in 29m / Opens today at 6:00 PM" status.
   Works from SCHEDULE in content.js and always uses the clinic's own time zone (TIMEZONE),
   so a visitor abroad sees the same answer as someone in Chennai.
   A schedule can have several sessions per day: slots: [{ open: '10:00', close: '13:00' }, { open: '18:00', close: '22:00' }].
   (The older single open/close fields still work.) No sessions → renders nothing. */

const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAY_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fmt = (m) => `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')} ${Math.floor(m / 60) < 12 ? 'AM' : 'PM'}`;

function clinicNow() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return { day: DAY_INDEX[get('weekday')], mins: Number(get('hour')) * 60 + Number(get('minute')) };
}

/* sessions for a day, in minutes and sorted by opening time */
function sessionsOf(s) {
  if (!s) return [];
  const raw = Array.isArray(s.slots) ? s.slots : [{ open: s.open, close: s.close }];
  return raw
    .filter((x) => x && x.open && x.close)
    .map((x) => ({ open: toMin(x.open), close: toMin(x.close) }))
    .sort((a, b) => a.open - b.open);
}

export function getStatus(s) {
  const sessions = sessionsOf(s);
  if (!sessions.length) return null;
  const { day, mins } = clinicNow();
  const openToday = s.days.includes(day);

  if (openToday) {
    const current = sessions.find((x) => mins >= x.open && mins < x.close);
    if (current) {
      const left = current.close - mins;
      return { open: true, text: left <= 60 ? `Closes in ${left}m` : `Open now · closes at ${fmt(current.close)}` };
    }
    const next = sessions.find((x) => mins < x.open);
    if (next) return { open: false, text: `Closed · opens today at ${fmt(next.open)}` };
  }

  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    if (s.days.includes(d)) return { open: false, text: `Closed · opens ${i === 1 ? 'tomorrow' : DAY_NAME[d]} at ${fmt(sessions[0].open)}` };
  }
  return null;
}

/* which = key of SCHEDULE ('consultation' | 'pharmacy'); showLabel prefixes "Consultation:" */
export default function OpenStatus({ which = 'consultation', showLabel = false, className = '' }) {
  const sched = SCHEDULE[which];
  const [status, setStatus] = useState(() => getStatus(sched));

  useEffect(() => {
    setStatus(getStatus(sched));
    const t = setInterval(() => setStatus(getStatus(sched)), 30 * 1000);
    return () => clearInterval(t);
  }, [sched]);

  if (!status) return null;
  return (
    <span role="status" className={`inline-flex items-center gap-2 text-[13px] font-medium text-p3 ${className}`}>
      <span aria-hidden="true" className={`h-2 w-2 flex-none rounded-full ${status.open ? 'bg-[#3ddc76] shadow-[0_0_0_3px_rgba(61,220,118,.2)]' : 'bg-[#ff6b6b] shadow-[0_0_0_3px_rgba(255,107,107,.18)]'}`} />
      <span>{showLabel && `${sched.label}: `}{status.text}</span>
    </span>
  );
}