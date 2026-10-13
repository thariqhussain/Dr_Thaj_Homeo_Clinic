# Sri Durga Homeo Clinic — React + Tailwind

## Run it
```bash
# 1. copy your existing  assets/  folder into  public/assets/
#    (public/assets/hero-images, treatments, doctors, journey …)
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```

## Structure
```
index.html                 minimal shell (meta tags + fonts + #root)
tailwind.config.js         palette, fonts, keyframes  (was :root variables)
src/index.css              Tailwind directives + the few effects utilities can't express
src/data/content.js        all copy, image lists, treatments, form options
src/lib/                   gsap registration, small helpers
src/hooks/                 useInView, useMagnetic, useSpotlight
src/components/            Navbar, Hero(+HeroHeading, HeroStats), Gallery, Treatments,
                           DoctorProfile, Connect(+JourneyPanel), Booking, Footer, Dock
```

## Old → new
| Vanilla                              | React                                      |
|--------------------------------------|--------------------------------------------|
| `:root { --p1 … --accent }`          | `theme.extend.colors` → `bg-p7`, `text-accent` |
| `.btn-solid-light`, `.eyebrow` …     | `@layer components` in `index.css`         |
| per-section CSS + media queries      | Tailwind classes in each component (`max-lg:`, `max-sm:`, `max-[375px]:`) |
| `document.getElementById` + listeners| `useState` / `useRef` / `useEffect`        |
| `classList.toggle('is-active')`      | state-driven conditional classes           |
| GSAP `<script>` tags                 | `npm i gsap`, `src/lib/gsap.js`            |
