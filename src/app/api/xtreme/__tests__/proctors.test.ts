/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as proctorsRoute from '../admin/proctors/route';
import * as proctorIdRoute from '../admin/proctors/[id]/route';

// Mock dependencies
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

describe('Admin Proctors API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/xtreme/admin/proctors', () => {
    it('returns 403 when user is not an admin', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(null);

      const res = await proctorsRoute.GET(new Request('http://localhost/api/xtreme/admin/proctors'));
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('Admin access required.');
    });

    it('returns list of proctors with assigned_count computed', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      const mockProctors = [
        { id: 'proc-1', name: 'Dr. Kumar', ieee_id: '90001111', capacity: 15, sort_order: 1, created_at: '2026-10-01T00:00:00Z' },
        { id: 'proc-2', name: 'Prof. Rao', ieee_id: '90002222', capacity: 20, sort_order: 2, created_at: '2026-10-02T00:00:00Z' },
      ];

      const mockTeams = [
        { proctor_id: 'proc-1', proctor_ieee_id: '90001111' },
        { proctor_id: 'proc-1', proctor_ieee_id: '90001111' },
      ];

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'xtreme_proctors') {
            return {
              select: () => ({
                order: () => ({
                  order: () => Promise.resolve({ data: mockProctors, error: null }),
                }),
              }),
            };
          }
          if (table === 'xtreme_teams') {
            return {
              select: () => Promise.resolve({ data: mockTeams, error: null }),
            };
          }
          return {};
        }),
      };

      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await proctorsRoute.GET(new Request('http://localhost/api/xtreme/admin/proctors'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.proctors).toHaveLength(2);
      expect(data.proctors[0].assigned_count).toBe(2);
      expect(data.proctors[1].assigned_count).toBe(0);
    });
  });

  describe('POST /api/xtreme/admin/proctors', () => {
    it('validates proctor name and IEEE ID', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      const res = await proctorsRoute.POST(
        new Request('http://localhost/api/xtreme/admin/proctors', {
          method: 'POST',
          body: JSON.stringify({ name: '', ieee_id: '123' }),
        })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Proctor name is required');
    });

    it('rejects duplicate proctor IEEE ID', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      const mockClient = {
        from: vi.fn(() => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { id: 'proc-existing' }, error: null }),
            }),
          }),
        })),
      };

      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await proctorsRoute.POST(
        new Request('http://localhost/api/xtreme/admin/proctors', {
          method: 'POST',
          body: JSON.stringify({ name: 'Dr. Kumar', ieee_id: '90001111' }),
        })
      );
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain('already exists');
    });

    it('successfully creates proctor with default capacity', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      const newProc = { id: 'proc-new', name: 'Dr. Kumar', ieee_id: '90001111', created_at: '2026-10-19T00:00:00Z' };
      let inserted: any = null;

      const mockClient = {
        from: vi.fn(() => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: { sort_order: 20 }, error: null }),
              }),
            }),
          }),
          insert: (payload: any) => {
            inserted = payload;
            return {
              select: () => ({
                single: () => Promise.resolve({ data: { ...newProc, ...payload }, error: null }),
              }),
            };
          },
        })),
      };

      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await proctorsRoute.POST(
        new Request('http://localhost/api/xtreme/admin/proctors', {
          method: 'POST',
          body: JSON.stringify({ name: 'Dr. Kumar', ieee_id: '90001111' }),
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.proctor.id).toBe('proc-new');
      expect(inserted.capacity).toBe(20);
      expect(inserted.sort_order).toBe(30);
    });

    it('creates proctor with a custom squad capacity', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      let inserted: any = null;
      const mockClient = {
        from: vi.fn(() => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
          insert: (payload: any) => {
            inserted = payload;
            return {
              select: () => ({
                single: () => Promise.resolve({ data: { id: 'proc-new', ...payload }, error: null }),
              }),
            };
          },
        })),
      };

      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await proctorsRoute.POST(
        new Request('http://localhost/api/xtreme/admin/proctors', {
          method: 'POST',
          body: JSON.stringify({ name: 'Swaroop BM', ieee_id: '102196859', capacity: 15 }),
        })
      );
      expect(res.status).toBe(200);
      expect(inserted.capacity).toBe(15);
      expect(inserted.sort_order).toBe(10);
    });

    it('rejects an invalid squad capacity', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      for (const capacity of [0, -3, 2.5, 501, 'many']) {
        const res = await proctorsRoute.POST(
          new Request('http://localhost/api/xtreme/admin/proctors', {
            method: 'POST',
            body: JSON.stringify({ name: 'Dr. Kumar', ieee_id: '90001111', capacity }),
          })
        );
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('Squad capacity');
      }
    });
  });

  describe('PATCH /api/xtreme/admin/proctors/[id]', () => {
    it('updates the squad capacity', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      let updated: any = null;
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'xtreme_proctors') {
            return {
              update: (payload: any) => {
                updated = payload;
                return {
                  eq: () => ({
                    select: () => ({
                      single: () => Promise.resolve({
                        data: { id: 'proc-1', name: 'Dr. Kumar', ieee_id: '90001111', capacity: 25 },
                        error: null,
                      }),
                    }),
                  }),
                };
              },
            };
          }
          return { update: () => ({ eq: () => Promise.resolve({ error: null }) }) };
        }),
      };

      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await proctorIdRoute.PATCH(
        new Request('http://localhost/api/xtreme/admin/proctors/proc-1', {
          method: 'PATCH',
          body: JSON.stringify({ capacity: 25 }),
        }),
        { params: Promise.resolve({ id: 'proc-1' }) }
      );
      expect(res.status).toBe(200);
      expect(updated.capacity).toBe(25);
      const data = await res.json();
      expect(data.proctor.capacity).toBe(25);
    });

    it('rejects an invalid squad capacity', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });
      vi.mocked(getAdminServiceClient).mockReturnValue({} as any);

      const res = await proctorIdRoute.PATCH(
        new Request('http://localhost/api/xtreme/admin/proctors/proc-1', {
          method: 'PATCH',
          body: JSON.stringify({ capacity: 0 }),
        }),
        { params: Promise.resolve({ id: 'proc-1' }) }
      );
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/xtreme/admin/proctors/[id]', () => {
    it('deletes proctor and unassigns from teams', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'xtreme_proctors') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: { id: 'proc-1', ieee_id: '90001111' }, error: null }),
                }),
              }),
              delete: () => ({
                eq: () => Promise.resolve({ error: null }),
              }),
            };
          }
          if (table === 'xtreme_teams') {
            return {
              update: () => ({
                or: () => Promise.resolve({ error: null }),
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await proctorIdRoute.DELETE(
        new Request('http://localhost/api/xtreme/admin/proctors/proc-1', { method: 'DELETE' }),
        { params: Promise.resolve({ id: 'proc-1' }) }
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});

