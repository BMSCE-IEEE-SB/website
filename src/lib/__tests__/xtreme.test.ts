import { describe, expect, it } from 'vitest';
import {
  XTREME_20_EVENT_START_UTC,
  XTREME_20_REGISTRATION_END_UTC,
  XTREME_AMBASSADOR_ID,
  XTREME_SUPPORT_CONTACTS,
  XTREME_VTOOLS_URL,
} from '@/lib/xtreme';

describe('xtreme constants', () => {
  it('pins the official ambassador ID teams must enter on vTools', () => {
    expect(XTREME_AMBASSADOR_ID).toBe('IEEEXTREME20SB10123');
  });

  it('closes registration before the competition starts', () => {
    expect(XTREME_20_REGISTRATION_END_UTC).toBeLessThan(XTREME_20_EVENT_START_UTC);
    expect(new Date(XTREME_20_REGISTRATION_END_UTC).toISOString()).toBe('2026-10-25T23:59:59.000Z');
    expect(new Date(XTREME_20_EVENT_START_UTC).toISOString()).toBe('2026-10-31T00:00:00.000Z');
  });

  it('links the official vTools portal', () => {
    expect(XTREME_VTOOLS_URL).toBe('https://xtreme.vtools.ieee.org/');
  });

  it('lists reachable helpdesk contacts', () => {
    expect(XTREME_SUPPORT_CONTACTS.length).toBeGreaterThan(0);
    for (const c of XTREME_SUPPORT_CONTACTS) {
      expect(c.name.trim().length).toBeGreaterThan(0);
      expect(c.tel).toMatch(/^tel:\+\d+$/);
    }
  });
});
