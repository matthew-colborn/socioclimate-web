/**
 * Build-time helpers that turn content strings into markup. No copy lives here.
 */
import { STALE_AFTER_DAYS } from '../config/site';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** True for the [VERIFY ...] and [MATTHEW ...] flags. */
export const isPlaceholder = (s: string | null | undefined): boolean =>
  !s || /^\[(VERIFY|MATTHEW)/.test(s.trim());

/**
 * One *lit* word per heading becomes <em>, which the stylesheet lights cyan.
 * Placeholders inside copy become a visible dashed marker.
 */
export function lit(s: string): string {
  return esc(s)
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[(VERIFY|MATTHEW)([^\]]*)\]/g, '<span class="sc-flag">[$1$2]</span>');
}

/** Stage labels, matching the live site's pills. */
export const STATUS_LABEL = {
  live: 'Live',
  building: 'Building',
  staging: 'In staging',
  operating: 'Operating',
  private: 'Private',
  stale: 'Stale',
  open: 'Selecting',
} as const;
export type Status = keyof typeof STATUS_LABEL;

/** Operating partnerships run like live work, so they share its pill. */
export const statusClass = (s: Status): string => `sc-status--${s === 'operating' ? 'live' : s}`;

/**
 * Stale is never set by hand. A record not checked within STALE_AFTER_DAYS of
 * the build renders as Stale, whatever its stage says. An open slot has no
 * facts to go stale.
 */
export function effectiveStatus(status: Status, asOf: string, now = new Date()): Status {
  if (status === 'open') return status;
  const age = (now.getTime() - new Date(asOf).getTime()) / 86_400_000;
  return age > STALE_AFTER_DAYS ? 'stale' : status;
}

/**
 * "23,440" -> count 23440 comma; "~4,200" -> prefix ~; "317 days" -> suffix.
 * Returns null for anything that is not a plain number, which then renders
 * static. The visible text is always the real value.
 */
export function countAttrs(v: string): Record<string, string> | null {
  const m = v.match(/^(\D*?)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const n = m[2].replace(/,/g, '');
  return {
    'data-count': n,
    ...(m[2].includes(',') ? { 'data-format': 'comma' } : {}),
    ...(m[1] ? { 'data-prefix': m[1] } : {}),
    ...(m[3] ? { 'data-suffix': m[3] } : {}),
  };
}

export const KIND_LABEL = {
  'working-paper': 'Working paper',
  'operating-paper': 'Operating paper',
  note: 'Note',
  log: 'Log',
} as const;

/** "03 · Databases" -> { n: "03", rest: "Databases" }. */
export function splitEyebrow(s: string): { n: string; rest: string } {
  const m = s.match(/^(\S+)\s*·\s*(.*)$/);
  return m ? { n: m[1], rest: m[2] } : { n: '', rest: s };
}

export const RS_STATUS_LABEL = {
  draft: 'Draft',
  working: 'Working',
  published: 'Published',
  opening: 'Opening',
} as const;
