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

    it('rejects squad update if members roster has fewer than 1 or more than 3 members', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      const resEmpty = await teamIdRoute.PATCH(
        new Request('http://localhost/api/xtreme/admin/teams/team-1', {
          method: 'PATCH',
          body: JSON.stringify({ members: [] }),
        }),
        { params: Promise.resolve({ id: 'team-1' }) }
      );
      expect(resEmpty.status).toBe(400);
      const errEmpty = await resEmpty.json();
      expect(errEmpty.error).toContain('between 1 and 3 members');

      const resTooMany = await teamIdRoute.PATCH(
        new Request('http://localhost/api/xtreme/admin/teams/team-1', {
          method: 'PATCH',
          body: JSON.stringify({
            members: [
              { first_name: 'A', email: 'a@bmsce.ac.in', ieee_member_id: '10001', is_lead: true },
              { first_name: 'B', email: 'b@bmsce.ac.in', ieee_member_id: '10002', is_lead: false },
              { first_name: 'C', email: 'c@bmsce.ac.in', ieee_member_id: '10003', is_lead: false },
              { first_name: 'D', email: 'd@bmsce.ac.in', ieee_member_id: '10004', is_lead: false },
            ],
          }),
        }),
        { params: Promise.resolve({ id: 'team-1' }) }
      );
      expect(resTooMany.status).toBe(400);
      const errTooMany = await resTooMany.json();
      expect(errTooMany.error).toContain('between 1 and 3 members');
    });

    it('rejects squad update if no member is marked as lead', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      const res = await teamIdRoute.PATCH(
        new Request('http://localhost/api/xtreme/admin/teams/team-1', {
          method: 'PATCH',
          body: JSON.stringify({
            members: [
              { first_name: 'A', email: 'a@bmsce.ac.in', ieee_member_id: '10001', is_lead: false },
            ],
          }),
        }),
        { params: Promise.resolve({ id: 'team-1' }) }
      );
      expect(res.status).toBe(400);
      const err = await res.json();
      expect(err.error).toContain('Exactly one member must be designated as the team lead');
    });

    it('successfully updates team name, members, and resets lead_user_id when lead email changes', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      let capturedUpdate: any = null;
      let insertedMembers: any = null;

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'xtreme_teams') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        id: 'team-1',
                        team_name: 'OldName',
                        leader_email: 'oldleader@bmsce.ac.in',
                        lead_user_id: 'old-user-uuid',
                      },
                      error: null,
                    }),
                }),
                ilike: () => ({
                  neq: () => ({
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                  }),
                }),
              }),
              update: (val: any) => {
                capturedUpdate = val;
                return {
                  eq: () => ({
                    select: () => ({
                      single: () =>
                        Promise.resolve({
                          data: { id: 'team-1', ...val },
                          error: null,
                        }),
                    }),
                  }),
                };
              },
            };
          }
          if (table === 'xtreme_members') {
            return {
              select: () => ({
                in: () => ({
                  neq: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
              delete: () => ({
                eq: () => Promise.resolve({ error: null }),
              }),
              insert: (rows: any) => {
                insertedMembers = rows;
                return {
                  select: () => Promise.resolve({ data: rows, error: null }),
                };
              },
            };
          }
          return {};
        }),
      };

      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await teamIdRoute.PATCH(
        new Request('http://localhost/api/xtreme/admin/teams/team-1', {
          method: 'PATCH',
          body: JSON.stringify({
            team_name: 'NewSquadName',
            members: [
              {
                first_name: 'NewLead',
                last_name: 'Person',
                email: 'newlead@bmsce.ac.in',
                ieee_member_id: '99887766',
                is_lead: true,
                usn: '1BM23CS001',
                department: 'CSE',
                year_of_study: '3rd Year',
              },
              {
                first_name: 'Teammate',
                last_name: 'Two',
                email: 'mate2@bmsce.ac.in',
                ieee_member_id: '99887767',
                is_lead: false,
                usn: '1BM23CS002',
                department: 'ISE',
                year_of_study: '3rd Year',
              },
            ],
          }),
        }),
        { params: Promise.resolve({ id: 'team-1' }) }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(capturedUpdate.team_name).toBe('NewSquadName');
      expect(capturedUpdate.leader_email).toBe('newlead@bmsce.ac.in');
      expect(capturedUpdate.lead_user_id).toBeNull();
      expect(insertedMembers).toHaveLength(2);
      expect(insertedMembers[0].first_name).toBe('NewLead');
      expect(insertedMembers[0].is_lead).toBe(true);
      expect(data.team.members).toHaveLength(2);
    });
  });

  describe('DELETE /api/xtreme/admin/teams/[id] (Delete Squad)', () => {
    it('deletes team successfully when admin is authenticated in Supabase mode', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      let deletedId: string | null = null;
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'xtreme_teams') {
            return {
              delete: () => ({
                eq: (col: string, val: string) => {
                  if (col === 'id') deletedId = val;
                  return Promise.resolve({ error: null });
                },
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await teamIdRoute.DELETE(
        new Request('http://localhost/api/xtreme/admin/teams/team-delete-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: 'team-delete-123' }) }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(deletedId).toBe('team-delete-123');
    });

    it('rejects delete team when user is not an admin', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(null);

      const res = await teamIdRoute.DELETE(
        new Request('http://localhost/api/xtreme/admin/teams/team-delete-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: 'team-delete-123' }) }
      );

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Admin sign-in required');
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

