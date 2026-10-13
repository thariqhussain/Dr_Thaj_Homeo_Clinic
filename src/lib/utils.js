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
