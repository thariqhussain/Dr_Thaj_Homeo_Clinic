/* Soft focus pull (plain CSS transitions, no WebGL).
   The second photo is stacked on the first. On hover the first blurs and fades out while the second sharpens
   into focus, like a camera pulling focus; on leave it runs backwards. Touch: tap toggles it.
   The look lives in DoctorCard.css (.dc-photo / .dc-photo-alt / .is-alt). */

export function createFocusPull({ host, revealSrc }) {
  const alt = new Image();
  alt.className = 'dc-photo-alt';
  alt.alt = '';
  alt.decoding = 'async';
  alt.draggable = false;
  alt.setAttribute('aria-hidden', 'true');

  let destroyed = false, listening = false;
  const set = (on) => host.classList.toggle('is-alt', on);
  const onEnter = (e) => { if (e.pointerType !== 'touch') set(true); };
  const onLeave = (e) => { if (e.pointerType !== 'touch') set(false); };
  const onDown = (e) => { if (e.pointerType === 'touch') set(!host.classList.contains('is-alt')); };

  /* only wire it up once the second photo has loaded, so a missing file leaves the plain portrait untouched */
  alt.onload = () => {
    if (destroyed) return;
    host.appendChild(alt);
    host.addEventListener('pointerenter', onEnter);
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('pointerdown', onDown);
    listening = true;
  };
  alt.src = revealSrc;

  return {
    destroy() {
      destroyed = true;
      if (listening) {
        host.removeEventListener('pointerenter', onEnter);
        host.removeEventListener('pointerleave', onLeave);
        host.removeEventListener('pointerdown', onDown);
      }
      host.classList.remove('is-alt');
      alt.remove();
    },
  };
}