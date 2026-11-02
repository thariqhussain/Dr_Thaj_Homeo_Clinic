'use client';

/* React Bits AccordionGallery (JS + Tailwind), copied from github.com/DavidHDev/react-bits.
   Local changes, each marked "local change":
     1. gsap is imported from ../lib/gsap, so the site keeps a single gsap instance
     2. `height`   also accepts a CSS string such as 'clamp(380px,58svh,500px)' (upstream: number of px)
     3. `fit`      'cover' (upstream) | 'contain': contain shows the whole photo instead of cropping it
     4. `onOpen`   called when the already-open panel is clicked (or Enter / Space): used to open a full view
     5. keyboard   arrows step from the open panel and move focus with it (upstream: from the focused one, so → twice got stuck)
     6. flat       no resting shadow, no glow on the label bar, no caption gradient without captions, and a visible focus ring
     7. touch      a tap that opens a panel no longer also opens the full view (focus used to open it, then the click opened the viewer) */

import { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from '../lib/gsap';   // local change 1

const DEFAULT_ITEMS = [
  { image: 'https://picsum.photos/id/1015/900/1200', label: 'Canyon', link: '#' },
  { image: 'https://picsum.photos/id/1018/900/1200', label: 'Ridgeline', link: '#' },
  { image: 'https://picsum.photos/id/1039/900/1200', label: 'Falls', link: '#' },
  { image: 'https://picsum.photos/id/1043/900/1200', label: 'Harbour', link: '#' },
  { image: 'https://picsum.photos/id/1044/900/1200', label: 'Skyline', link: '#' }
];

const AccordionGallery = ({
  items = DEFAULT_ITEMS,
  defaultIndex = 2,
  accentColor = '#ffffff',
  overlayColor = '#060010',
  textColor = '#ffffff',
  height = 460,
  gap = 10,
  radius = 16,
  expandRatio = 0.52,
  orientation = 'horizontal',
  duration = 0.6,
  ease = 'power3.out',
  parallax = 0.5,
  tilt = 8,
  stagger = 0.06,
  trigger = 'hover',
  showLabels = true,
  grayscale = true,
  fit = 'cover',          // local change 3
  onOpen,                 // local change 4
  className = ''
}) => {
  const rootRef = useRef(null);
  const panelRefs = useRef([]);
  const mediaRefs = useRef([]);
  const barRefs = useRef([]);
  const textRefs = useRef([]);
  const tlRef = useRef(null);
  const firstRunRef = useRef(true);
  const mediaSizeRef = useRef(320);

  const vertical = orientation === 'vertical';
  const count = items.length;
  const [active, setActive] = useState(Math.min(Math.max(defaultIndex, 0), count - 1));
  const activeRef = useRef(active);   // local change 5: always-current copy, so quick key presses never read a stale value
  activeRef.current = active;
  const focusActivated = useRef(0);   // local change 7: when the last focus opened a panel, so the click that follows doesn't also open the full view

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // local change 6: the dark caption gradient is only drawn when there are captions to sit on it
  const overlayBg = `${showLabels ? `linear-gradient(180deg, transparent 45%, color-mix(in srgb, ${overlayColor} 78%, transparent) 100%), ` : ''}color-mix(in srgb, ${overlayColor} calc(var(--ag-dim, 0.35) * 100%), transparent)`;

  const applyLayout = useCallback(
    animate => {
      const panels = panelRefs.current;
      if (!panels.length) return;

      const r = Math.min(Math.max(expandRatio, 0.2), 0.9);
      const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
      const mediaSize = mediaSizeRef.current;

      tlRef.current?.kill();
      const dur = animate && !prefersReduced ? duration : 0;
      const tl = gsap.timeline();

      panels.forEach((panel, i) => {
        if (!panel) return;
        const isActive = i === active;
        const media = mediaRefs.current[i];
        const bar = barRefs.current[i];
        const text = textRefs.current[i];

        const rot = isActive ? 0 : i < active ? tilt : -tilt;
        const rotProp = vertical ? { rotateX: -rot } : { rotateY: rot };

        tl.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease }, 0);

        if (media) {
          const drift = Math.max(-1.5, Math.min(1.5, active - i));
          const shift = drift * parallax * mediaSize * 0.06;
          const gray = grayscale ? (isActive ? 0 : 1) : 0;
          tl.to(
            media,
            {
              xPercent: -50,
              yPercent: -50,
              x: vertical ? 0 : isActive ? 0 : shift,
              y: vertical ? (isActive ? 0 : shift) : 0,
              '--ag-gray': gray,
              '--ag-dim': isActive ? 0 : 0.35,
              duration: dur,
              ease
            },
            0
          );
        }

        if (showLabels && bar && text) {
          if (isActive) {
            tl.to([bar, text], { opacity: 1, x: 0, duration: dur, ease, stagger: prefersReduced ? 0 : stagger }, 0);
          } else {
            tl.to([bar, text], { opacity: 0, x: -14, duration: dur * 0.6, ease }, 0);
          }
        }
      });

      tlRef.current = tl;
    },
    [
      active,
      count,
      expandRatio,
      duration,
      ease,
      vertical,
      tilt,
      parallax,
      grayscale,
      showLabels,
      stagger,
      prefersReduced
    ]
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const total = vertical ? rect.height : rect.width;
      const usable = Math.max(total - gap * (count - 1), 120);
      const size = Math.max(140, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22);
      mediaSizeRef.current = size;
      el.style.setProperty('--ag-media-size', `${size}px`);
      applyLayout(!firstRunRef.current);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyLayout, gap, count, expandRatio, vertical]);

  useEffect(() => {
    applyLayout(!firstRunRef.current);
    firstRunRef.current = false;
  }, [applyLayout]);

  useEffect(
    () => () => {
      tlRef.current?.kill();
    },
    []
  );

  const handleEnter = i => {
    if (trigger === 'hover') setActive(i);
  };

  const handleClick = (i, e) => {
    if (focusActivated.current && performance.now() - focusActivated.current < 700) {
      focusActivated.current = 0;   // local change 7: this tap already opened the panel (focus did it); the next one opens the full view
      e.preventDefault();
      return;
    }
    if (i !== active) {
      e.preventDefault();
      setActive(i);
    } else if (onOpen) {
      e.preventDefault();
      onOpen(i, e);   // local change 4
    }
  };

  const handleKeyDown = (i, e) => {
    // local changes 4 + 5: step from the open panel, and carry focus along with it
    const move = next => {
      e.preventDefault();
      activeRef.current = next;
      setActive(next);
      panelRefs.current[next]?.focus();
    };
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move((activeRef.current + 1) % count);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move((activeRef.current - 1 + count) % count);
    else if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (i === activeRef.current) onOpen(i, e);
      else setActive(i);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`flex ${vertical ? 'flex-col' : 'flex-row'} w-full max-w-full [perspective:1400px] max-[520px]:!flex-col max-[520px]:[perspective:none] ${className}`}
      style={{ gap: `${gap}px`, height: typeof height === 'string' ? height : vertical ? `${Math.round(height * 1.6)}px` : `${height}px` }}
      role={onOpen ? 'group' : 'list'}
      aria-label="Image accordion gallery"
    >
      {items.map((item, i) => {
        const isActive = i === active;
        const Tag = item.link ? 'a' : 'div';
        return (
          <Tag
            key={i}
            ref={el => (panelRefs.current[i] = el)}
            className="group relative block min-w-0 min-h-0 flex-[1_1_0] cursor-pointer overflow-hidden bg-[#0a0713] no-underline outline-none [transform-style:preserve-3d] [transform-origin:center] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent max-[520px]:min-h-[84px] max-[520px]:!transform-none"
            style={{ borderRadius: `${radius}px`, '--ag-accent': accentColor, willChange: 'flex-grow, transform' }}
            href={item.link || undefined}
            onClick={e => handleClick(i, e)}
            onMouseEnter={() => handleEnter(i)}
            onFocus={() => {
              if (i !== activeRef.current) { focusActivated.current = performance.now(); activeRef.current = i; }   // local change 7
              setActive(i);
            }}
            onKeyDown={e => handleKeyDown(i, e)}
            role={onOpen ? 'button' : 'listitem'}
            tabIndex={0}
            aria-current={isActive ? 'true' : undefined}
            aria-label={item.label}
          >
            <span className="absolute inset-0 overflow-hidden [border-radius:inherit]">
              <span
                ref={el => (mediaRefs.current[i] = el)}
                className="absolute top-1/2 left-1/2 [filter:grayscale(var(--ag-gray,1))]"
                style={{
                  width: vertical ? '100%' : 'var(--ag-media-size, 320px)',
                  height: vertical ? 'var(--ag-media-size, 320px)' : '100%',
                  willChange: 'transform, filter'
                }}
              >
                <img
                  src={item.image}
                  alt={item.alt || item.label || ''}
                  draggable="false"
                  className={`block h-full w-full select-none ${fit === 'contain' ? 'object-contain' : 'object-cover'} [-webkit-user-drag:none]`}
                />
              </span>
              <span
                className="pointer-events-none absolute inset-0"
                style={{ background: overlayBg }}
                aria-hidden="true"
              />
            </span>
            {showLabels && (
              <span
                className="pointer-events-none absolute bottom-5 left-5 right-5 z-[2] flex items-center gap-3"
                aria-hidden="true"
              >
                <span
                  ref={el => (barRefs.current[i] = el)}
                  className="h-[26px] w-[3px] flex-none rounded-[3px] opacity-0"
                  style={{ background: accentColor }}
                />
                <span
                  ref={el => (textRefs.current[i] = el)}
                  className="overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1rem,1.4vw,1.4rem)] font-semibold tracking-[0.01em] opacity-0 [text-shadow:0_2px_14px_rgba(0,0,0,0.55)]"
                  style={{ color: textColor }}
                >
                  {item.label}
                </span>
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
};

export default AccordionGallery;