import { describe, expect, it } from 'vitest';
import { MEMBERSHIP_DRIVE_OPEN, primaryJoinCta } from '@/config/membership';

describe('membership drive gating', () => {
  it('exposes the drive flag as a boolean', () => {
    expect(typeof MEMBERSHIP_DRIVE_OPEN).toBe('boolean');
  });

  it('returns the membership CTA when the drive is open', () => {
    expect(primaryJoinCta(true)).toEqual({ label: 'Become a member', href: '/membership/register' });
  });

  it('returns the IEEEXtreme CTA when the drive is closed', () => {
    expect(primaryJoinCta(false)).toEqual({ label: 'IEEEXtreme 20.0', href: '/ieeextreme' });
  });

  it('defaults to the configured drive flag', () => {
    expect(primaryJoinCta()).toEqual(primaryJoinCta(MEMBERSHIP_DRIVE_OPEN));
  });
});
