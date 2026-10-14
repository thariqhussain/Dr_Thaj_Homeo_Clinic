import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import { ScrollTrigger } from './lib/gsap';
import { skipIntro } from './lib/intro';
import { readSavedScroll, startScrollMemory } from './lib/scrollRestore';

/* where the visitor was before a reload / hard reload (null on a normal visit). Read once, at startup.
   SAVED.slots = the remembered real size of each section, used so unloaded sections reserve exactly the right space. */
const SAVED = readSavedScroll();
const SLOTS = SAVED?.slots || null;
if (SAVED) skipIntro();   // the hero is off-screen after a reload mid-page: no point playing its load sequence

/* Only the navbar + hero are in the first download. Every section below is its own chunk,
   fetched and mounted AFTER the hero has painted (see <Deferred /> below). */
const AboutStory = lazy(() => import('./components/AboutStory'));
const Treatments = lazy(() => import('./components/Treatments'));
const DoctorProfile = lazy(() => import('./components/DoctorProfile'));
const Connect = lazy(() => import('./components/Connect'));
const PatientResults = lazy(() => import('./components/PatientResults'));
const Testimonials = lazy(() => import('./components/Testimonials'));
const Gallery = lazy(() => import('./components/Gallery'));
const Ceremony = lazy(() => import('./components/Ceremony'));
const Pharmacy = lazy(() => import('./components/Pharmacy'));
const FAQ = lazy(() => import('./components/FAQ'));
const Booking = lazy(() => import('./components/Booking'));
const Footer = lazy(() => import('./components/Footer'));
const FloatingContact = lazy(() => import('./components/FloatingContact'));

/* page order, top to bottom: [component, placeholder height while it is not loaded yet, the section's element id] */
const MAIN_SECTIONS = [
  [AboutStory, '80svh', 'about'],
  [Treatments, '100svh', 'treatments'],
  [DoctorProfile, '75svh', 'doctors'],
  [Connect, '80svh', 'testimonials'],
  [PatientResults, '70svh', 'results'],
  [Testimonials, '60svh', 'patient-voices'],
  [Gallery, '70svh', 'gallery'],
  [Ceremony, '70svh', 'ceremony'],
  [Pharmacy, '60svh', 'pharmacy'],
  [FAQ, '60svh', 'faq'],
  [Booking, '80svh', 'booking'],
];
const FOOTER_INDEX = MAIN_SECTIONS.length;
const FLOAT_INDEX = FOOTER_INDEX + 1;
const TOTAL = FLOAT_INDEX + 1;

const idle = (cb, timeout = 1500) =>
  'requestIdleCallback' in window ? window.requestIdleCallback(cb, { timeout }) : window.setTimeout(cb, 150);

/* After the page has fully loaded (hero images included), mount the remaining sections one at a time
   whenever the browser is idle. `ready` = how many sections are allowed to mount so far.
   A section also mounts earlier if the visitor scrolls close to it (see <Deferred />). */
function useStagger(total) {
  const [ready, setReady] = useState(0);
  useEffect(() => {
    let n = 0;
    let off = false;
    const next = () => {
      if (off || n >= total) return;
      n += 1;
      setReady(n);
      idle(next);
    };
    const start = () => idle(next, 2500);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => { off = true; window.removeEventListener('load', start); };
  }, [total]);
  return ready;
}

/* Renders an empty, fixed-height placeholder until it is this section's turn OR the visitor is within
   ~800px of it, then loads the section's chunk. Images inside stay `loading="lazy"`. */
function Deferred({ index, ready, minHeight, slot, children }) {
  const [near, setNear] = useState(false);
  const [node, setNode] = useState(null);
  const show = near || ready > index;

  useEffect(() => {
    if (show || !node) return;
    if (!('IntersectionObserver' in window)) { setNear(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setNear(true); },
      { rootMargin: '800px 0px' }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [show, node]);

  /* after a reload the placeholder copies the section's remembered real height + margins, so the page is the right
     length (and the saved scroll position lands in the right place) before any section has loaded */
  const box = slot ? { minHeight: slot.h, marginTop: slot.mt, marginBottom: slot.mb } : { minHeight };
  if (!show) return <div ref={setNode} aria-hidden="true" style={box} />;
  return <Suspense fallback={<div aria-hidden="true" style={box} />}>{children}</Suspense>;
}

/* Pause decorative infinite animations while they're off-screen
   (any element carrying the `pause-offscreen` marker class).
   Sections now mount late, so a MutationObserver picks up the ones added after first render. */
function usePauseOffscreen() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('is-paused', !e.isIntersecting)),
      { rootMargin: '100px' }
    );
    const watch = (el) => {
      if (el.nodeType !== 1) return;
      if (el.matches('.pause-offscreen')) io.observe(el);
      el.querySelectorAll('.pause-offscreen').forEach((x) => io.observe(x));
    };
    watch(document.body);
    const mo = new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach(watch)));
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
}

export default function App() {
  usePauseOffscreen();
  useLayoutEffect(() => startScrollMemory(SAVED), []);   // remember the scroll position; jump back to it after a reload (before first paint)
  const ready = useStagger(TOTAL);

  /* sections mounted late change the page height, so tell ScrollTrigger to re-measure once they're all in */
  useEffect(() => {
    if (ready < TOTAL) return;
    const t = setTimeout(() => ScrollTrigger.refresh(), 500);
    return () => clearTimeout(t);
  }, [ready]);

  return (
    <>
      <div className="page-bg" aria-hidden="true" />
      <Navbar />
      <main>
        <Hero />
        {MAIN_SECTIONS.map(([Section, minHeight, id], i) => (
          <Deferred key={i} index={i} ready={ready} minHeight={minHeight} slot={SLOTS?.[id]}>
            <Section />
          </Deferred>
        ))}
      </main>
      <Deferred index={FOOTER_INDEX} ready={ready} minHeight="300px" slot={SLOTS?.siteFooter}><Footer /></Deferred>
      <Deferred index={FLOAT_INDEX} ready={ready} minHeight="0px"><FloatingContact /></Deferred>
    </>
  );
}