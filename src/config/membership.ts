/**
 * =========================================================================
 * MEMBERSHIP DRIVE STATUS CONFIG
 * =========================================================================
 *
 * Single switch for the annual membership drive. When the drive ends, set
 * `MEMBERSHIP_DRIVE_OPEN = false`:
 * - Front-page, header, footer, 404, chapter and login CTAs swap from
 *   "Become a member" to the IEEEXtreme 20.0 spotlight.
 * - The member portal stays live (status tracking, resubmission, profile),
 *   but new-intake upsells ("Add chapters", "Continue registration") are
 *   replaced with IEEEXtreme links.
 * - All membership UI stays in the codebase behind this flag — nothing is
 *   deleted, so reopening is a one-line change.
 *
 * TO REOPEN THE DRIVE:
 * Simply set `MEMBERSHIP_DRIVE_OPEN = true;` below.
 */
export const MEMBERSHIP_DRIVE_OPEN = false;

/** Drive year shown in "drive has ended" messaging. */
export const MEMBERSHIP_DRIVE_YEAR = '2026';

export interface JoinCta {
  label: string;
  href: string;
}

/**
 * Primary join CTA for the current drive state. Accepts an explicit override
 * so both branches stay testable; defaults to the configured flag.
 */
export function primaryJoinCta(driveOpen: boolean = MEMBERSHIP_DRIVE_OPEN): JoinCta {
  return driveOpen
    ? { label: 'Become a member', href: '/membership/register' }
    : { label: 'IEEEXtreme 20.0', href: '/ieeextreme' };
}
