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
        { id: 'proc-1', name: 'Dr. Kumar', ieee_id: '90001111', created_at: '2026-10-01T00:00:00Z' },
        { id: 'proc-2', name: 'Prof. Rao', ieee_id: '90002222', created_at: '2026-10-02T00:00:00Z' },
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
                order: () => Promise.resolve({ data: mockProctors, error: null }),
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

    it('successfully creates proctor', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'admin-1', email: 'admin@bmsce.ac.in' });

      const newProc = { id: 'proc-new', name: 'Dr. Kumar', ieee_id: '90001111', created_at: '2026-10-19T00:00:00Z' };

      const mockClient = {
        from: vi.fn(() => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: newProc, error: null }),
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
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.proctor.id).toBe('proc-new');
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

