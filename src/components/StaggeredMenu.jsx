import { useEffect, useState } from 'react';
import { scrollToId } from '../lib/utils';

/* Phone menu: a "Menu" pill that opens a full-screen dark panel; the links rise out of masks one after another.
   Cheap on purpose: the panel is a solid colour (no blur) and everything is CSS transform / opacity transitions
   (see .pn-menu-* in index.css), so nothing animates while the menu is closed.
   items   = [{ href: '#about', label: 'About' }, ...]
   socials = [{ label: 'Instagram', href: 'https://…' }, ...]  (optional)
   footer  = { href: '#booking', label: 'Book an appointment' }  (optional) */

export default function StaggeredMenu({ items = [], socials = [], footer, className = '' }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (href) => (e) => {
    if (!href.startsWith('#') || href.length < 2) { setOpen(false); return; }   // plain links just close the menu
    e.preventDefault();
    setOpen(false);
    scrollToId(href.slice(1));
  };

  return (
    <>
      <button
        type="button" aria-expanded={open} aria-controls="pn-menu-panel" onClick={() => setOpen((o) => !o)}
        className={`pn-pill pn-menu-btn relative z-[2] ${className}`}
      >
        {open ? 'Close' : 'Menu'}
      </button>

      <div id="pn-menu-panel" className={`pn-menu-panel ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <ul className="m-0 list-none p-0">
          {items.map((it, i) => (
            <li key={it.href} className="pn-menu-link" style={{ '--i': i }}>
              <a href={it.href} onClick={go(it.href)} tabIndex={open ? 0 : -1}>{it.label}</a>
            </li>
          ))}
        </ul>

        {(footer || socials.length > 0) && (
          <div className="pn-menu-foot">
            {footer && (
              <a href={footer.href} onClick={go(footer.href)} tabIndex={open ? 0 : -1}
                 className="inline-block rounded-full bg-[#f8f9fa] px-6 py-3 text-sm font-semibold text-[#212529] no-underline">
                {footer.label}
              </a>
            )}
            {socials.length > 0 && (
              <ul className="m-0 mt-6 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1} className="text-sm text-white/70 no-underline">{s.label}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}