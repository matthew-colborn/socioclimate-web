/**
 * Non-prose configuration. Words live in src/content/; addresses, routes and
 * identifiers live here so they are changed in exactly one place.
 */
export const SITE = {
  name: 'SocioClimate',
  domain: 'socioclimate.io',
  origin: 'https://socioclimate.io',
  tagline: 'The data moat company.',
  /** There is no form on this site and no backend to receive one. Contact is mailto. */
  email: 'matthew@socioclimate.io',
  legalName: 'SocioClimate',
} as const;

/** Prefilled subject lines keep the two doors separable in one inbox. */
export const MAILTO = {
  partner: `mailto:${SITE.email}?subject=${encodeURIComponent('Partner — data we already generate')}`,
  acquire: `mailto:${SITE.email}?subject=${encodeURIComponent('Sell — a company for sale')}`,
  plain: `mailto:${SITE.email}`,
} as const;

export const NAV = [
  { href: '/thesis', label: 'Thesis' },
  { href: '/method', label: 'Method' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/writing', label: 'Writing' },
  { href: '/partner', label: 'Partner' },
] as const;
