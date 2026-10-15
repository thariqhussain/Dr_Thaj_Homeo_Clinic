import ContactDock from './ContactDock';

/* Quick-contact for every screen size: the glass ContactDock pill (WhatsApp + phone), bottom-right.
   The separate round floating buttons that used to sit on the right on desktop have been removed.
   (App.jsx still lazy-loads this file, so nothing else needs to change.) */

export default function FloatingContact() {
  return <ContactDock />;
}