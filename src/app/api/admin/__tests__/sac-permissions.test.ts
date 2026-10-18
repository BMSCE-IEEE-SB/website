/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canModifyMembership } from '@/lib/server/supabase-admin';
import * as teamRoute from '../team/route';
import * as orderStatusRoute from '../orders/[id]/status/route';
import * as orderNoteRoute from '../orders/[id]/note/route';
import * as orderCredentialsRoute from '../orders/credentials/route';
import * as orderIeeeIdRoute from '../orders/[id]/ieee-id/route';
import * as manualReceiptRoute from '../manual-receipt/route';
import * as settingsRoute from '../settings/route';
import * as proctorsRoute from '../../xtreme/admin/proctors/route';

vi.mock('@/lib/server/supabase-admin', async () => {
  const actual = await vi.importActual<any>('@/lib/server/supabase-admin');
  return {
    ...actual,
    requireAdmin: vi.fn(),
    getAdminServiceClient: vi.fn(),
    recordAdminAudit: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  isDemoMode: () => false,
}));

import { requireAdmin, getAdminServiceClient } from '@/lib/server/supabase-admin';

describe('SAC Role & Membership Permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('canModifyMembership helper', () => {
    it('returns false for null admin', () => {
      expect(canModifyMembership(null)).toBe(false);
    });

    it('returns false for role "sac" (case-insensitive)', () => {
      expect(canModifyMembership({ id: 'sac-1', email: 'sac@bmsce.ac.in', role: 'sac' })).toBe(false);
      expect(canModifyMembership({ id: 'sac-1', email: 'sac@bmsce.ac.in', role: 'SAC' })).toBe(false);
    });

    it('returns true for other roles (admin, chair, treasurer, secretary, etc.)', () => {
      expect(canModifyMembership({ id: 'admin-1', email: 'admin@bmsce.ac.in', role: 'admin' })).toBe(true);
      expect(canModifyMembership({ id: 'chair-1', email: 'chair@bmsce.ac.in', role: 'chair' })).toBe(true);
      expect(canModifyMembership({ id: 'treasurer-1', email: 'treasurer@bmsce.ac.in', role: 'treasurer' })).toBe(true);
      expect(canModifyMembership({ id: 'admin-1', email: 'admin@bmsce.ac.in' })).toBe(true);
    });
  });

  describe('Team Whitelist Route (/api/admin/team)', () => {
    it('allows authorizing an administrator with role "sac"', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'chair-1', email: 'chair@bmsce.ac.in', role: 'chair' });
      const mockClient = {
        from: vi.fn(() => ({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        })),
      };
      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const req = new Request('http://localhost/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new.sac@bmsce.ac.in', role: 'sac' }),
      });
      const res = await teamRoute.POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(mockClient.from).toHaveBeenCalledWith('admin_whitelist');
    });

    it('rejects adding an admin with an invalid role', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'chair-1', email: 'chair@bmsce.ac.in', role: 'chair' });

      const req = new Request('http://localhost/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@bmsce.ac.in', role: 'superhero' }),
      });
      const res = await teamRoute.POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Enter a valid email and role.');
    });

    it('forbids SAC administrators from authorizing team members', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'sac-1', email: 'sac@bmsce.ac.in', role: 'sac' });

      const req = new Request('http://localhost/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'another@bmsce.ac.in', role: 'admin' }),
      });
      const res = await teamRoute.POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('SAC role does not have permission');
    });

    it('forbids SAC administrators from revoking team members', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'sac-1', email: 'sac@bmsce.ac.in', role: 'sac' });

      const req = new Request('http://localhost/api/admin/team?email=someone@bmsce.ac.in', {
        method: 'DELETE',
      });
      const res = await teamRoute.DELETE(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('SAC role does not have permission');
    });
  });

  describe('Order Verification & Membership Mutations Restricted for SAC', () => {
    it('blocks SAC from verifying or rejecting applications (/api/admin/orders/[id]/status)', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'sac-1', email: 'sac@bmsce.ac.in', role: 'sac' });

      const req = new Request('http://localhost/api/admin/orders/11111111-1111-1111-1111-111111111111/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'verified' }),
      });
      const res = await orderStatusRoute.POST(req, {
        params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('SAC role does not have permission');
    });

    it('blocks SAC from modifying application notes (/api/admin/orders/[id]/note)', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'sac-1', email: 'sac@bmsce.ac.in', role: 'sac' });

      const req = new Request('http://localhost/api/admin/orders/11111111-1111-1111-1111-111111111111/note', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Checked' }),
      });
      const res = await orderNoteRoute.PATCH(req, {
        params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('SAC role does not have permission');
    });

    it('blocks SAC from updating member credentials status (/api/admin/orders/credentials)', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'sac-1', email: 'sac@bmsce.ac.in', role: 'sac' });

      const req = new Request('http://localhost/api/admin/orders/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: ['11111111-1111-1111-1111-111111111111'], sent: true }),
      });
      const res = await orderCredentialsRoute.POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('SAC role does not have permission');
    });

    it('blocks SAC from modifying member credentials / IEEE ID (/api/admin/orders/[id]/ieee-id)', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'sac-1', email: 'sac@bmsce.ac.in', role: 'sac' });

      const req = new Request('http://localhost/api/admin/orders/11111111-1111-1111-1111-111111111111/ieee-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ieeeId: '12345678' }),
      });
      const res = await orderIeeeIdRoute.PATCH(req, {
        params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('SAC role does not have permission');
    });

    it('blocks SAC from issuing manual receipts (/api/admin/manual-receipt)', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'sac-1', email: 'sac@bmsce.ac.in', role: 'sac' });

      const req = new Request('http://localhost/api/admin/manual-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student@bmsce.ac.in',
          name: 'Student Name',
          amount: 500,
          reason: 'Manual registration test',
          chapters: ['Computer Society'],
        }),
      });
      const res = await manualReceiptRoute.POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('SAC role does not have permission');
    });

    it('blocks SAC from changing membership fees & settings (/api/admin/settings)', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'sac-1', email: 'sac@bmsce.ac.in', role: 'sac' });

      const req = new Request('http://localhost/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            base_fee: 500,
            pg_base_fee: 600,
            payee_vpa: 'bmsce@upi',
            payee_name: 'BMSCE',
            drive_year: 2026,
            is_drive_open: true,
            treasurer_name: 'Treasurer',
            treasurer_role: 'Treasurer',
            treasurer_phone: '+919999999999',
          },
        }),
      });
      const res = await settingsRoute.PUT(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('SAC role does not have permission');
    });
  });

  describe('Full Admin Privileges for SAC on IEEEXtreme', () => {
    it('allows SAC admin full access to proctors list and creation', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ id: 'sac-1', email: 'sac@bmsce.ac.in', role: 'sac' });

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'xtreme_proctors') {
            return {
              select: () => ({
                order: () => Promise.resolve({ data: [{ id: 'p1', name: 'Dr. Proctor', ieee_id: '99999999' }], error: null }),
              }),
            };
          }
          if (table === 'xtreme_teams') {
            return {
              select: () => Promise.resolve({ data: [], error: null }),
            };
          }
          return {} as any;
        }),
      };
      vi.mocked(getAdminServiceClient).mockReturnValue(mockClient as any);

      const res = await proctorsRoute.GET(new Request('http://localhost/api/xtreme/admin/proctors'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.proctors).toHaveLength(1);
      expect(data.proctors[0].name).toBe('Dr. Proctor');
    });
  });
});
