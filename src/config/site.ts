/**
 * Non-prose configuration. Words live in src/content/; addresses, routes and
 * identifiers live here so they change in exactly one place.
 */
export const SITE = {
  name: 'SocioClimate',
  domain: 'socioclimate.io',
  origin: 'https://socioclimate.io',
  /** Customer-facing. What we do for the business reading the page. */
  tagline: 'We find the valuable data inside your business and point it at revenue.',
  /** Asset-side. What SocioClimate accumulates across every partnership. */
  mission: 'Building and compounding data moats.',
  /** The compressed form, for places with one line of room. */
  compressed: 'Dormant data in, decisions and revenue out.',
  email: 'matthew@socioclimate.io',
  legalName: 'SocioClimate',
} as const;

export const MAILTO = `mailto:${SITE.email}`;

/**
 * Numbered because the site is a sequence rather than a set of destinations:
 * what we do, then how, then the proof, then the way in. The numbers are part
 * of the label and are rendered in mono beside it.
 */
export const NAV = [
  { n: '00', href: '/', label: 'Home' },
  { n: '01', href: '/what-we-do', label: 'What we do' },
  { n: '02', href: '/portfolio', label: 'Portfolio' },
  { n: '03', href: '/contact', label: 'Contact' },
] as const;

/**
 * Clients whose name is not ours to publish yet.
 *
 * Flipping `usePublicName` to true is the ONLY change needed to reveal a name —
 * every surface resolves through `clientName()`, and no MDX body hardcodes it.
 */
export const CLIENTS = {
  branshe: {
    /** Used once permission is given. */
    publicName: 'Branshe',
    /** Used until then. Must read naturally in running prose. */
    anonymised: 'a regional cleaning company',
    /** Sentence-initial form of the anonymised label. */
    anonymisedCap: 'A regional cleaning company',
    usePublicName: false,
  },
} as const;

export type ClientKey = keyof typeof CLIENTS | 'none';

export function clientName(key: ClientKey, opts: { cap?: boolean } = {}): string | null {
  if (key === 'none') return null;
  const c = CLIENTS[key];
  if (c.usePublicName) return c.publicName;
  return opts.cap ? c.anonymisedCap : c.anonymised;
}

/**
 * Web3Forms. Both values come from the environment; neither is ever committed.
 * With the key absent the diagnostic still scores and still shows its verdict —
 * only the send is disabled, and it says so.
 */
export const FORM = {
  // No fallback on either value. Both come from the environment or the send is
  // disabled and says so — a default endpoint baked into the source is exactly
  // the hardcoding this is meant to avoid.
  //
  // The hostname does appear once more, pinned in firebase.json's connect-src.
  // That is unavoidable: a Content-Security-Policy cannot read an env var, and
  // an unpinned connect-src would defeat the point of having one.
  endpoint: import.meta.env.PUBLIC_FORM_ENDPOINT ?? '',
  key: import.meta.env.PUBLIC_FORM_KEY ?? '',
} as const;
