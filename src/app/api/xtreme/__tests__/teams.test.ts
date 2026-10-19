/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as teamsRoute from '../admin/teams/route';
import * as myTeamRoute from '../my-team/route';
import * as teamIdRoute from '../admin/teams/[id]/route';

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

import { requireAdmin, requireUser, getAdminServiceClient } from '@/lib/server/supabase-admin';

describe('Xtreme Teams API & Ownership Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/xtreme/admin/teams (Organizer Creation)', () => {
    it('creates an unclaimed team with nullable lead_user_id and assigns proctor', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      const mockCreatedTeam = {
        id: 'team-new-1',
        team_name: 'BitShifters',
        lead_user_id: null,
        leader_email: 'rohan@bmsce.ac.in',
        vtools_verified: false,
      };

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'xtreme_teams') {
            return {
              select: () => ({
                ilike: () => ({
                  maybeSingle: () => Promise.resolve({ data: null, error: null }),
                }),
              }),
              insert: () => ({
                select: () => ({
                  single: () => Promise.resolve({ data: mockCreatedTeam, error: null }),
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
              insert: () => ({
                select: () => Promise.resolve({ data: [{ id: 'mem-1' }], error: null }),
              }),
            };
          }
          return {};
        }),
        rpc: vi.fn((fnName: string) => {
          if (fnName === 'assign_proctor_to_team') {
            return Promise.resolve({
              data: {
                success: true,
                proctor_name: 'Dr. Kumar',
                proctor_ieee_id: '90001111',
              },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };

      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await teamsRoute.POST(
        new Request('http://localhost/api/xtreme/admin/teams', {
          method: 'POST',
          body: JSON.stringify({
            team_name: 'BitShifters',
            leader_name: 'Rohan Sharma',
            leader_email: 'rohan@bmsce.ac.in',
            leader_ieee_id: '98451201',
            proctor_id: 'proc-1',
          }),
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.team.lead_user_id).toBeNull();
      expect(data.team.leader_email).toBe('rohan@bmsce.ac.in');
      expect(data.team.proctor_name).toBe('Dr. Kumar');
    });

    it('rejects team creation if proctor has reached its squad capacity', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      const mockCreatedTeam = {
        id: 'team-new-2',
        team_name: 'AlgoTitans',
        lead_user_id: null,
        leader_email: 'pooja@bmsce.ac.in',
      };

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'xtreme_teams') {
            return {
              select: () => ({
                ilike: () => ({
                  maybeSingle: () => Promise.resolve({ data: null, error: null }),
                }),
              }),
              insert: () => ({
                select: () => ({
                  single: () => Promise.resolve({ data: mockCreatedTeam, error: null }),
                }),
              }),
              delete: () => ({
                eq: () => Promise.resolve({ data: null, error: null }),
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
              insert: () => ({
                select: () => Promise.resolve({ data: [{ id: 'mem-2' }], error: null }),
              }),
              delete: () => ({
                eq: () => Promise.resolve({ data: null, error: null }),
              }),
            };
          }
          return {};
        }),
        rpc: vi.fn((fnName: string) => {
          if (fnName === 'assign_proctor_to_team') {
            return Promise.resolve({
              data: null,
              error: { message: 'Proctor "Swaroop BM" (102196859) already has 15 squads assigned.' },
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };

      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await teamsRoute.POST(
        new Request('http://localhost/api/xtreme/admin/teams', {
          method: 'POST',
          body: JSON.stringify({
            team_name: 'AlgoTitans',
            leader_name: 'Pooja Kulkarni',
            leader_email: 'pooja@bmsce.ac.in',
            leader_ieee_id: '98451204',
            proctor_id: 'proc-full',
          }),
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('already has 15 squads assigned');
    });
  });

  describe('PATCH /api/xtreme/admin/teams/[id] (Proctor Reassignment & Unassignment)', () => {
    it('supports unassigning proctor when proctor_id is null or empty', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      const mockClient = {
        rpc: vi.fn(() => Promise.resolve({ data: { success: true, unassigned: true }, error: null })),
        from: vi.fn(() => ({
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: 'team-1', team_name: 'BitShifters' }, error: null }),
              }),
            }),
          }),
        })),
      };

      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await teamIdRoute.PATCH(
        new Request('http://localhost/api/xtreme/admin/teams/team-1', {
          method: 'PATCH',
          body: JSON.stringify({ proctor_id: '' }),
        }),
        { params: Promise.resolve({ id: 'team-1' }) }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.team.proctor_id).toBeNull();
    });
  });

  describe('GET /api/xtreme/my-team (Auto-claim & Privacy)', () => {
    it('auto-claims unclaimed team when signed in user email matches leader_email', async () => {
      vi.mocked(requireUser).mockResolvedValue({ id: 'user-lead-1', email: 'rohan@bmsce.ac.in' });

      const claimedTeam = {
        id: 'team-claimed-1',
        team_name: 'BitShifters',
        lead_user_id: 'user-lead-1',
        leader_email: 'rohan@bmsce.ac.in',
        vtools_verified: false,
        proctor_name: 'Dr. Kumar',
        proctor_ieee_id: '90001111',
        created_at: '2026-10-19T00:00:00Z',
      };

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'xtreme_teams') {
            return {
              select: () => ({
                eq: (col: string) => ({
                  maybeSingle: () => {
                    if (col === 'lead_user_id') {
                      // Initially not found under lead_user_id
                      return Promise.resolve({ data: null, error: null });
                    }
                    if (col === 'id') {
                      // After claim RPC, fetched by id
                      return Promise.resolve({ data: claimedTeam, error: null });
                    }
                    return Promise.resolve({ data: null, error: null });
                  },
                }),
              }),
            };
          }
          if (table === 'xtreme_members') {
            return {
              select: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: [{ id: 'mem-1', first_name: 'Rohan', is_lead: true }], error: null }),
                }),
              }),
            };
          }
          return {};
        }),
        rpc: vi.fn((fnName: string) => {
          if (fnName === 'claim_xtreme_team') {
            return Promise.resolve({
              data: { claimed: true, team_id: 'team-claimed-1', team_name: 'BitShifters' },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };

      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await myTeamRoute.GET(new Request('http://localhost/api/xtreme/my-team'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.team).toBeDefined();
      expect(data.team.id).toBe('team-claimed-1');
      expect(data.team.team_name).toBe('BitShifters');
      expect(data.team.proctor_name).toBe('Dr. Kumar');
      // Verify internal admin notes are not leaked
      expect(data.team.admin_note).toBeUndefined();
    });
  });
});

