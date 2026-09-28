/**
 * =========================================================================
 * TEMPORARY LAUNCH RESTRICTION CONFIG
 * =========================================================================
 * 
 * When `REGISTRATION_ONLY_MODE = true`:
 * 1. On production (e.g. bmsceieee.com), the root '/' and off-limits pages
 *    automatically redirect directly to '/membership/register'.
 * 2. Everything needed to complete membership works completely:
 *    - /membership/register
 *    - /membership/profile
 *    - /membership/chapters
 *    - /membership/checkout
 *    - /login & /account (for member verification & portal)
 *    - /admin/* (for executives to verify payments & receipts)
 *    - /terms, /privacy, /refund (policy compliance)
 * 3. The Navbar & Footer:
 *    - Clicking 'About', 'Team', or 'Contact' shows an animated 'Coming soon!' notification.
 *    - 'Chapters' displays all chapters in the dropdown, but not as hyperlinks to click on.
 * 4. On localhost (127.0.0.1, localhost:3000, development):
 *    - All restrictions are automatically bypassed, and the entire website works normally.
 * 
 * TO REVERT BACK TO THE FULL SITE:
 * Simply set `REGISTRATION_ONLY_MODE = false;` below.
 */
export const REGISTRATION_ONLY_MODE = true;

/**
 * Determines whether a host string is a local development environment.
 */
export function isLocalhostHost(host?: string | null): boolean {
  if (!host) return false;
  const clean = host.toLowerCase().split(':')[0];
  return clean === 'localhost' || clean === '127.0.0.1' || clean === '::1' || clean.endsWith('.local');
}
