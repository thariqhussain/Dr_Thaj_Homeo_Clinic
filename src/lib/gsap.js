import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register once, import { gsap, ScrollTrigger } from here everywhere.
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
