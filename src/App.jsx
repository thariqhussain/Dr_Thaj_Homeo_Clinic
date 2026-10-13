import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutStory from './components/AboutStory';
import Treatments from './components/Treatments';
import DoctorProfile from './components/DoctorProfile';
import Connect from './components/Connect';
import PatientResults from './components/PatientResults';
import Testimonials from './components/Testimonials';
import Gallery from './components/Gallery';
import Pharmacy from './components/Pharmacy';
import FAQ from './components/FAQ';
import Booking from './components/Booking';
import Footer from './components/Footer';
import FloatingContact from './components/FloatingContact';

/* Pause decorative infinite animations while they're off-screen
   (any element carrying the `pause-offscreen` marker class). */
function usePauseOffscreen() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('is-paused', !e.isIntersecting)),
      { rootMargin: '100px' }
    );
    document.querySelectorAll('.pause-offscreen').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function App() {
  usePauseOffscreen();
  return (
    <>
      <div className="page-bg" aria-hidden="true" />
      <Navbar />
      <main>
        <Hero />
        <AboutStory />
        <Treatments />
        <DoctorProfile />
        <Connect />
        <PatientResults />
        <Testimonials />
        <Gallery />
        <Pharmacy />
        <FAQ />
        <Booking />
      </main>
      <Footer />
      <FloatingContact />
    </>
  );
}