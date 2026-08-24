/**
 * Non-prose configuration. Words live in src/content/; addresses, routes and
 * identifiers live here so they change in exactly one place.
 */
export const SITE = {
  name: 'SocioClimate',
  domain: 'socioclimate.io',
  origin: 'https://socioclimate.io',
  tagline: 'The data moat company.',
  email: 'matthew@socioclimate.io',
  legalName: 'SocioClimate',
} as const;

export const MAILTO = `mailto:${SITE.email}`;

export const NAV = [
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/contact', label: 'Contact' },
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
