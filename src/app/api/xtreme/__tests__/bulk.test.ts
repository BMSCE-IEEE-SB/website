/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bulkRoute from '../admin/teams/bulk/route';

vi.mock('@/lib/server/supabase-admin', () => ({
  requireAdmin: vi.fn(),
  requireUser: vi.fn(),
  getAdminServiceClient: vi.fn(),
  jsonError: (msg: string, status = 400) =>
    new Response(JSON.stringify({ error: msg }), { status, headers: { 'content-type': 'application/json' } }),
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  isDemoMode: () => false,
}));

import { requireAdmin, getAdminServiceClient } from '@/lib/server/supabase-admin';

describe('Admin Bulk Squads Import API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests', async () => {
    vi.mocked(requireAdmin).mockResolvedValue(null);

    const res = await bulkRoute.POST(
      new Request('http://localhost/api/xtreme/admin/teams/bulk', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv: 'team,lead,phone,email,id' }),
      })
    );

    expect(res.status).toBe(403);
  });

  it('parses wide-format CSV and creates teams matching proctor IEEE ID', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

    const csvData = [
      'team_name, lead_name, lead_phone, lead_email, lead_ieee_id, proctor_ieee_id, mate1_name, mate1_phone, mate1_email, mate1_ieee_id',
      'BitShifters, Rohan Sharma, 9845012345, rohan@bmsce.ac.in, 98451201, 90451234, Diya Iyer, 9845012346, diya@bmsce.ac.in, 98451202',
    ].join('\n');

    const mockProctors = [{ id: 'proc-1', name: 'Dr. Kumar', ieee_id: '90451234' }];

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'xtreme_proctors') {
          return {
            select: () => Promise.resolve({ data: mockProctors, error: null }),
          };
        }
        if (table === 'xtreme_teams') {
          return {
            select: () => ({
              ilike: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: 'team-created-1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'xtreme_members') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            insert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      }),
      rpc: vi.fn((fnName: string) => {
        if (fnName === 'assign_proctor_to_team') {
          return Promise.resolve({ data: { success: true }, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

    const res = await bulkRoute.POST(
      new Request('http://localhost/api/xtreme/admin/teams/bulk', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv: csvData }),
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);
    expect(data.total).toBe(1);
    expect(data.results[0].status).toBe('created');
    expect(mockClient.rpc).toHaveBeenCalledWith('assign_proctor_to_team', {
      p_team_id: 'team-created-1',
      p_proctor_id: 'proc-1',
    });
  });
});

