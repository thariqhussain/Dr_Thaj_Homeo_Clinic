export const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const canHover = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Local "today" as YYYY-MM-DD (avoids UTC-offset issues from toISOString) */
export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/* "Years of experience" and "Patients treated" are computed from the date */
export function computeStat({ stat, startYear, baseCount, baseYear, baseMonth, monthlyIncrease, count }) {
  const now = new Date();
  if (stat === 'years') return now.getFullYear() - startYear;
  if (stat === 'patients') {
    const months = (now.getFullYear() - baseYear) * 12 + (now.getMonth() + 1 - baseMonth);
    return baseCount + Math.max(0, months) * monthlyIncrease;
  }
  return count || 0;
}

/* Smooth-scroll a horizontal strip to `left` (clamped to the strip's real range).
   Browsers can silently ignore or cancel a smooth scroll on a scroll-snap strip, which made the arrow buttons look
   frozen. So: if nothing has moved after a moment, jump straight to the target. Used by every arrow-driven strip. */
export function glideTo(el, left) {
  const max = Math.max(0, el.scrollWidth - el.clientWidth);
  const target = Math.min(max, Math.max(0, Math.round(left)));
  const from = el.scrollLeft;
  if (Math.abs(target - from) < 2) return;
  if (prefersReducedMotion()) { el.scrollLeft = target; return; }
  el.scrollTo({ left: target, behavior: 'smooth' });
  setTimeout(() => { if (Math.abs(el.scrollLeft - from) < 2) el.scrollLeft = target; }, 450);
}