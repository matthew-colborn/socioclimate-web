/**
 * Non-prose configuration. Words live in src/content/; addresses, routes and
 * identifiers live here so they change in exactly one place.
 */
export const SITE = {
  name: 'SocioClimate',
  domain: 'socioclimate.io',
  origin: 'https://socioclimate.io',
  /** The company line (brand/socioclimate-rebrand/docs/01-positioning.md). */
  tagline: 'SocioClimate builds the system of record for fragmented markets.',
  /** Mission, carried over from the live footer. */
  mission: 'Building and compounding data moats.',
  email: 'matthew@socioclimate.io',
  legalName: 'SocioClimate',
  place: 'San Diego, California',
} as const;

export const MAILTO = `mailto:${SITE.email}`;

/**
 * Numbered because the site is a sequence: the claim, how it is funded, what
 * clients get, the records, the thesis, the way in.
 */
export const NAV = [
  { n: '00', href: '/', label: 'Home' },
  { n: '01', href: '/services', label: 'Services' },
  { n: '02', href: '/access', label: 'Access' },
  { n: '03', href: '/databases', label: 'Databases' },
  { n: '04', href: '/research', label: 'Research' },
  { n: '05', href: '/contact', label: 'Contact' },
] as const;

/**
 * The live site was one page with anchors, and those anchors are shared. Hash
 * fragments never reach the server, so this map runs client side on / (see
 * src/lib/nav.ts). Route-level redirects are in firebase.json.
 */
export const LEGACY_ANCHORS: Record<string, string> = {
  '01-what-we-do': '/services',
  '02-portfolio': '/databases',
  'deed-restricted-db': '/databases/deed-restricted',
  'alfred-basil': '/services#alfred-basil',
  'porchlight-website': '/services#porchlight-website',
  branshe: '/services#branshe',
  '03-contact': '/contact',
};

/**
 * The roster. `spots` is the number of client seats open right now; null
 * renders a visible [MATTHEW] placeholder rather than an invented number.
 * `open: false` switches the call to action to the waitlist.
 */
export const ROSTER = {
  open: true,
  spots: null as number | null,
  showPricing: false,
} as const;

/** A database whose asOf is older than this renders as Stale. */
export const STALE_AFTER_DAYS = 120;

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
