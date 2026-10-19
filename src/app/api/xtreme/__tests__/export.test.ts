import { describe, expect, it } from 'vitest';
import { escapeCSV } from '@/app/api/xtreme/admin/export/route';

describe('Xtreme CSV export escaping', () => {
  it('quotes plain values', () => {
    expect(escapeCSV('BitShifters')).toBe('"BitShifters"');
    expect(escapeCSV(null)).toBe('""');
    expect(escapeCSV(undefined)).toBe('""');
  });

  it('doubles embedded quotes', () => {
    expect(escapeCSV('Say "hi"')).toBe('"Say ""hi"""');
  });

  it('neutralises spreadsheet formula prefixes', () => {
    expect(escapeCSV('=1+1')).toBe('"\'=1+1"');
    expect(escapeCSV('+cmd')).toBe("\"'+cmd\"");
    expect(escapeCSV('-2+3')).toBe('"\'-2+3"');
    expect(escapeCSV('@mention')).toBe('"\'@mention"');
  });

  it('leaves safe leading characters alone', () => {
    expect(escapeCSV('Rohan Sharma')).toBe('"Rohan Sharma"');
    expect(escapeCSV('1BM23CS140')).toBe('"1BM23CS140"');
  });
});
