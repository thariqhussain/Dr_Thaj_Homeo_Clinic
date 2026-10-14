/* Tiny "page-load sequence" coordinator.
   Order on a fresh load / hard reload:
     1. hero dot grid fades in            (CSS, see .dots-intro in index.css)
     2. navbar intro (droplet + ripple)   (Navbar.jsx)   → fires 'nav' once the bar has opened
     3. doctor photo                      (DoctorCard.jsx) → fires 'doctor' as the portrait finishes rising
     4. everything else on the hero       (headline, buttons, doctor text, stats, sprigs) → wait for 'doctor'

   introDone(name)            marks a step as finished.
   onIntro(name, cb, maxMs)   runs cb when that step is finished (immediately if it already is).
                              If the step never fires, cb still runs after maxMs so nothing stays hidden.
                              Returns an unsubscribe function (use it as an effect cleanup). */

const done = new Set();
const waiting = {};

export function introDone(name) {
  done.add(name);
  const list = waiting[name] || [];
  waiting[name] = [];
  list.forEach((fn) => fn());
}

export function onIntro(name, cb, maxMs = 8000) {
  if (done.has(name)) { cb(); return () => {}; }
  let called = false;
  const run = () => { if (called) return; called = true; clearTimeout(timer); cb(); };
  const timer = setTimeout(run, maxMs);
  (waiting[name] = waiting[name] || []).push(run);
  return () => {
    called = true;
    clearTimeout(timer);
    waiting[name] = (waiting[name] || []).filter((f) => f !== run);
  };
}

/* After a reload mid-page the hero is off-screen, so its load sequence is skipped (everything it gates just shows up). */
export function skipIntro() {
  introDone('nav');
  introDone('doctor');
}