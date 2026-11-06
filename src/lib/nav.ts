/**
 * The nav, now that the site is several pages rather than one.
 *
 *   1. Old anchors. The live site was a single page and its anchors are shared
 *      (#01-what-we-do, #deed-restricted-db ...). A fragment never reaches the
 *      server, so a cold load of /#02-portfolio is resolved here, on arrival.
 *   2. The phone menu. A 44px button opens the nav as a glass sheet. Focus is
 *      trapped inside it while open, Escape closes it and returns focus to the
 *      button, and following a link closes it.
 *
 * Without script there is no button and the nav simply wraps, so every
 * destination stays reachable.
 */
import { LEGACY_ANCHORS } from '../config/site';

function legacyAnchor(): void {
  if (location.pathname !== '/') return;
  const id = decodeURIComponent(location.hash.slice(1));
  const to = LEGACY_ANCHORS[id];
  if (to) location.replace(to);
}

let onKey: ((e: KeyboardEvent) => void) | null = null;

function menu(): void {
  const head = document.querySelector<HTMLElement>('[data-head]');
  const btn = head?.querySelector<HTMLButtonElement>('[data-menu-btn]');
  const nav = head?.querySelector<HTMLElement>('[data-nav]');
  if (!head || !btn || !nav) return;
  btn.hidden = false;
  head.classList.add('has-menu');

  const openLabel = btn.querySelector<HTMLElement>('[data-menu-open]');
  const closeLabel = btn.querySelector<HTMLElement>('[data-menu-close]');
  const links = (): HTMLElement[] => [btn, ...Array.from(nav.querySelectorAll<HTMLElement>('a'))];

  const set = (open: boolean, focusBack = false): void => {
    head.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (openLabel) openLabel.hidden = open;
    if (closeLabel) closeLabel.hidden = !open;
    document.documentElement.classList.toggle('menu-open', open);
    if (open) links()[1]?.focus();
    else if (focusBack) btn.focus();
  };

  btn.onclick = () => set(btn.getAttribute('aria-expanded') !== 'true');
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));

  if (onKey) document.removeEventListener('keydown', onKey);
  onKey = (e: KeyboardEvent) => {
    if (btn.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') { e.preventDefault(); set(false, true); return; }
    if (e.key !== 'Tab') return;
    const f = links();
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey);

  // A resize to desktop width while open must not leave the page locked.
  matchMedia('(min-width: 48rem)').addEventListener('change', (m) => { if (m.matches) set(false); });
  set(false);
}

export function initNav(): void {
  legacyAnchor();
  menu();
}
