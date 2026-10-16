'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Download,
  Edit2,
  RefreshCw,
  Search,
  Trash2,
  Trophy,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import { Alert, Field, FileDrop, Input, Modal, PageLoader, Spinner } from '@/components/ui/form';
import { isDemoMode, supabase } from '@/lib/supabase';
import {
  addLocalKnownMembers,
  deleteLocalXtremeTeam,
  getLocalXtremeTeams,
  updateLocalXtremeTeam,
  type KnownMember,
  type XtremeTeam,
} from '@/lib/xtreme';

interface TeamStats {
  totalTeams: number;
  totalMembers: number;
  vtoolsDone: number;
  proctorAssigned: number;
}

export default function AdminXtremePage() {
  const [teams, setTeams] = useState<XtremeTeam[]>([]);
  const [stats, setStats] = useState<TeamStats>({
    totalTeams: 0,
    totalMembers: 0,
    vtoolsDone: 0,
    proctorAssigned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending_vtools' | 'verified_vtools' | 'unassigned_proctor'>('all');

  // Modals
  const [editingTeam, setEditingTeam] = useState<XtremeTeam | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadText, setUploadText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      if (isDemoMode()) {
        const local = getLocalXtremeTeams();
        setTeams(local);
        const totalMembers = local.reduce((acc, t) => acc + (t.members?.length || 0), 0);
        const vtoolsDone = local.filter((t) => t.vtools_verified).length;
        const proctorAssigned = local.filter((t) => t.proctor_name?.trim()).length;
        setStats({
          totalTeams: local.length,
          totalMembers,
          vtoolsDone,
          proctorAssigned,
        });
      } else {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        const res = await fetch('/api/xtreme/admin/teams', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => null);
        if (data?.teams) {
          setTeams(data.teams);
          if (data.stats) setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load xtreme teams:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    async function init() {
      try {
        if (isDemoMode()) {
          const local = getLocalXtremeTeams();
          if (!alive) return;
          setTeams(local);
          const totalMembers = local.reduce((acc, t) => acc + (t.members?.length || 0), 0);
          const vtoolsDone = local.filter((t) => t.vtools_verified).length;
          const proctorAssigned = local.filter((t) => t.proctor_name?.trim()).length;
          setStats({
            totalTeams: local.length,
            totalMembers,
            vtoolsDone,
            proctorAssigned,
          });
        } else {
          const { data: session } = await supabase.auth.getSession();
          const token = session.session?.access_token;
          const res = await fetch('/api/xtreme/admin/teams', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json().catch(() => null);
          if (data?.teams && alive) {
            setTeams(data.teams);
            if (data.stats) setStats(data.stats);
          }
        }
      } catch (err) {
        console.error('Failed to load xtreme teams:', err);
      } finally {
        if (alive) setLoading(false);
      }
    }
    init();
    return () => {
      alive = false;
    };
  }, []);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    let result = teams;

    if (filter === 'pending_vtools') {
      result = result.filter((t) => !t.vtools_verified);
    } else if (filter === 'verified_vtools') {
      result = result.filter((t) => t.vtools_verified);
    } else if (filter === 'unassigned_proctor') {
      result = result.filter((t) => !t.proctor_name?.trim());
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.team_name.toLowerCase().includes(q) ||
          t.proctor_name?.toLowerCase().includes(q) ||
          t.members.some(
            (m) =>
              m.first_name.toLowerCase().includes(q) ||
              m.last_name?.toLowerCase().includes(q) ||
              m.email.toLowerCase().includes(q) ||
              m.usn?.toLowerCase().includes(q) ||
              m.ieee_member_id.includes(q)
          )
      );
    }

    return result;
  }, [teams, filter, search]);

  // Save Edit Handler
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTeam) return;

    setSavingEdit(true);
    setEditError('');

    try {
      if (isDemoMode()) {
        updateLocalXtremeTeam(editingTeam.id, editingTeam);
        setTeams((prev) => prev.map((t) => (t.id === editingTeam.id ? editingTeam : t)));
        setEditingTeam(null);
      } else {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        const res = await fetch(`/api/xtreme/admin/teams/${editingTeam.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            team_name: editingTeam.team_name,
            proctor_name: editingTeam.proctor_name,
            proctor_ieee_id: editingTeam.proctor_ieee_id,
            admin_note: editingTeam.admin_note,
            vtools_verified: editingTeam.vtools_verified,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || 'Failed to update team.');
        }

        await loadData();
        setEditingTeam(null);
      }
    } catch (err: unknown) {
      setEditError((err as Error).message || 'Failed to save changes.');
    } finally {
      setSavingEdit(false);
    }
  }

  // Delete Team Handler
  async function handleDeleteTeam(teamId: string, teamName: string) {
    if (!window.confirm(`Are you sure you want to delete team "${teamName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      if (isDemoMode()) {
        deleteLocalXtremeTeam(teamId);
        setTeams((prev) => prev.filter((t) => t.id !== teamId));
      } else {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        const res = await fetch(`/api/xtreme/admin/teams/${teamId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || 'Failed to delete team.');
        }

        await loadData();
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Delete failed.');
    }
  }

  // CSV Export Trigger
  async function handleExportCSV() {
    try {
      if (isDemoMode()) {
        const localTeams = getLocalXtremeTeams();
        const headers = [
          'Team Name',
          'Official vTools Status',
          'Proctor Name',
          'Proctor IEEE ID',
          'Admin Notes',
          'Role',
          'First Name',
          'Last Name',
          'IEEE Member ID',
          'Email Address',
          'Phone',
          'USN',
          'Department',
          'Year of Study',
          'Registered At',
        ];

        const rows: string[] = [headers.join(',')];
        for (const t of localTeams) {
          const membersList = t.members || [];
          if (membersList.length === 0) {
            rows.push([
              `"${t.team_name}"`,
              `"${t.vtools_verified ? 'Verified on vTools' : 'Pending vTools'}"`,
              `"${t.proctor_name || ''}"`,
              `"${t.proctor_ieee_id || ''}"`,
              `"${t.admin_note || ''}"`,
              `"None"`, `""`, `""`, `""`, `""`, `""`, `""`, `""`, `""`,
              `"${t.created_at}"`,
            ].join(','));
          } else {
            for (const m of membersList) {
              rows.push([
                `"${t.team_name}"`,
                `"${t.vtools_verified ? 'Verified on vTools' : 'Pending vTools'}"`,
                `"${t.proctor_name || ''}"`,
                `"${t.proctor_ieee_id || ''}"`,
                `"${t.admin_note || ''}"`,
                `"${m.is_lead ? 'Team Lead' : 'Teammate'}"`,
                `"${m.first_name}"`,
                `"${m.last_name || ''}"`,
                `"${m.ieee_member_id}"`,
                `"${m.email}"`,
                `"${m.phone || ''}"`,
                `"${m.usn || ''}"`,
                `"${m.department || ''}"`,
                `"${m.year_of_study || ''}"`,
                `"${t.created_at}"`,
              ].join(','));
            }
          }
        }

        const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ieeextreme-teams-demo-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch('/api/xtreme/admin/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export request failed.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ieeextreme-teams-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not export CSV: ' + (err as Error).message);
    }
  }

  // Upload Member CSV Handler
  async function handleUploadLegacyMembers(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setUploadMessage(null);

    try {
      let textContent = '';
      if (uploadFile) {
        textContent = await uploadFile.text();
      } else if (uploadText.trim()) {
        textContent = uploadText.trim();
      } else {
        throw new Error('Please select a CSV file or paste CSV text.');
      }

      if (isDemoMode()) {
        const lines = textContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const results: KnownMember[] = [];
        const hasHeader = lines.length > 0 && /member|ieee|id|name/i.test(lines[0]);
        const start = hasHeader ? 1 : 0;
        for (let i = start; i < lines.length; i++) {
          const parts = lines[i].split(/[,;\t]/).map((p) => p.replace(/^["']|["']$/g, '').trim());
          if (parts[0] && /^\d{5,15}$/.test(parts[0])) {
            results.push({
              ieee_member_id: parts[0],
              name: parts[1] || undefined,
              email: parts[2] || undefined,
              source: 'legacy_upload',
            });
          }
        }

        if (results.length === 0) {
          throw new Error('No valid IEEE member records found in CSV.');
        }

        addLocalKnownMembers(results);
        setUploadMessage({
          tone: 'success',
          text: `[Demo] Successfully stored ${results.length} member records in browser data.`,
        });
        setUploadFile(null);
        setUploadText('');
        return;
      }

      let bodyData: FormData | string;
      const headers: Record<string, string> = {};

      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.access_token) {
        headers['Authorization'] = `Bearer ${session.session.access_token}`;
      }

      if (uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);
        bodyData = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        bodyData = JSON.stringify({ csv: uploadText });
      }

      const res = await fetch('/api/xtreme/admin/upload-members', {
        method: 'POST',
        headers,
        body: bodyData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Upload failed.');
      }

      setUploadMessage({
        tone: 'success',
        text: `Successfully imported ${data.count} member records into directory.`,
      });
      setUploadFile(null);
      setUploadText('');
    } catch (err: unknown) {
      setUploadMessage({
        tone: 'error',
        text: (err as Error).message || 'Failed to process member data.',
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-brand-orange/15 text-brand-orange">IEEEXtreme 20.0</span>
            <span className="text-xs text-muted">24-Hour Programming Competition</span>
          </div>
          <h1 className="display mt-1 text-3xl text-ink">Team Management & Proctors</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Review registered squads, assign local proctors, upload legacy member data, and reconcile official vTools records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="btn btn-ghost bg-white border border-line text-xs font-semibold"
          >
            <Upload className="h-4 w-4" /> Import Members CSV
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn btn-ghost bg-white border border-line text-xs font-semibold"
          >
            <Download className="h-4 w-4" /> Export Teams CSV
          </button>
          <button
            type="button"
            onClick={loadData}
            className="btn btn-ghost bg-white p-2.5 text-muted hover:text-ink"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase">Total Teams</span>
            <Trophy className="h-4 w-4 text-brand-orange" />
          </div>
          <p className="display mt-2 text-3xl text-ink">{stats.totalTeams}</p>
          <p className="mt-1 text-xs text-muted">Registered squads</p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase">Total Students</span>
            <Users className="h-4 w-4 text-brand-navy" />
          </div>
          <p className="display mt-2 text-3xl text-ink">{stats.totalMembers}</p>
          <p className="mt-1 text-xs text-muted">Active BMSCE IEEE participants</p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase">Proctors Assigned</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="display mt-2 text-3xl text-ink">{stats.proctorAssigned}</p>
          <p className="mt-1 text-xs text-muted">
            {stats.totalTeams - stats.proctorAssigned} teams pending proctor
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase">vTools Confirmed</span>
            <CheckCircle2 className="h-4 w-4 text-brand-sky" />
          </div>
          <p className="display mt-2 text-3xl text-ink">{stats.vtoolsDone}</p>
          <p className="mt-1 text-xs text-muted">
            {stats.totalTeams - stats.vtoolsDone} pending official confirmation
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Search team, member, USN, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-xs py-2 h-10"
          />
        </div>

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Teams' },
            { id: 'unassigned_proctor', label: 'Needs Proctor' },
            { id: 'pending_vtools', label: 'Pending vTools' },
            { id: 'verified_vtools', label: 'vTools Verified' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id as typeof filter)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === f.id ? 'bg-ink text-white' : 'bg-white text-ink-soft hover:bg-paper border border-line'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Table */}
      {loading ? (
        <PageLoader />
      ) : filteredTeams.length === 0 ? (
        <div className="panel p-12 text-center text-muted">
          <Trophy className="mx-auto h-8 w-8 text-muted/60" />
          <p className="mt-3 text-sm font-semibold text-ink">No teams found</p>
          <p className="text-xs text-muted mt-1">Try adjusting your search or filter options.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-paper/60 text-muted uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Team Name</th>
                  <th className="px-5 py-3.5">Members ({stats.totalMembers})</th>
                  <th className="px-5 py-3.5">Assigned Proctor</th>
                  <th className="px-5 py-3.5">Official vTools</th>
                  <th className="px-5 py-3.5">Registered</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredTeams.map((team) => {
                  const leadMember = team.members.find((m) => m.is_lead);
                  const otherMembers = team.members.filter((m) => !m.is_lead);

                  return (
                    <tr key={team.id} className="hover:bg-paper/40 transition">
                      {/* Team Name */}
                      <td className="px-5 py-4 font-bold text-ink">
                        <div className="text-sm">{team.team_name}</div>
                        {team.admin_note && (
                          <p className="text-[11px] text-muted font-normal mt-0.5 line-clamp-1 italic">
                            Note: {team.admin_note}
                          </p>
                        )}
                      </td>

                      {/* Members */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {leadMember && (
                            <div className="text-ink font-semibold flex items-center gap-1.5">
                              <span className="badge bg-brand-navy text-white text-[10px] py-0 px-1.5">
                                Lead
                              </span>
                              <span>
                                {leadMember.first_name} {leadMember.last_name}
                              </span>
                              <span className="text-muted font-normal">
                                ({leadMember.ieee_member_id}) · {leadMember.usn}
                              </span>
                            </div>
                          )}
                          {otherMembers.map((m, idx) => (
                            <div key={idx} className="text-ink-soft text-[11px] pl-1">
                              • {m.first_name} {m.last_name} ({m.ieee_member_id}) · {m.department}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Proctor */}
                      <td className="px-5 py-4">
                        {team.proctor_name ? (
                          <div>
                            <span className="font-semibold text-emerald-800">
                              {team.proctor_name}
                            </span>
                            {team.proctor_ieee_id && (
                              <p className="text-[11px] text-muted">ID: {team.proctor_ieee_id}</p>
                            )}
                          </div>
                        ) : (
                          <span className="badge bg-amber-50 text-amber-800 text-[11px]">
                            Pending Proctor
                          </span>
                        )}
                      </td>

                      {/* vTools Status */}
                      <td className="px-5 py-4">
                        {team.vtools_verified ? (
                          <span className="badge bg-emerald-50 text-emerald-800 text-[11px]">
                            <Check className="h-3 w-3" strokeWidth={3} /> Confirmed on vTools
                          </span>
                        ) : (
                          <span className="badge bg-paper text-muted text-[11px]">
                            Pending vTools
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-muted whitespace-nowrap">
                        {new Date(team.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingTeam(team)}
                            className="btn btn-ghost bg-paper py-1 px-2.5 text-xs font-semibold"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Edit / Proctor
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeam(team.id, team.team_name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Team"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT & PROCTOR ASSIGNMENT MODAL */}
      {editingTeam && (
        <Modal
          title={`Manage Team: ${editingTeam.team_name}`}
          onClose={() => setEditingTeam(null)}
          wide
        >
          <form onSubmit={handleSaveEdit} className="space-y-5 text-xs">
            {editError && <Alert tone="error">{editError}</Alert>}

            {/* Team details */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Team Name" htmlFor="modal_team_name" required>
                <Input
                  id="modal_team_name"
                  value={editingTeam.team_name}
                  onChange={(e) =>
                    setEditingTeam({
                      ...editingTeam,
                      team_name: e.target.value.replace(/[^a-zA-Z0-9]/g, ''),
                    })
                  }
                />
              </Field>

              <Field label="Official vTools Registration Status" htmlFor="modal_vtools">
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-ink">
                    <input
                      id="modal_vtools"
                      type="checkbox"
                      checked={editingTeam.vtools_verified}
                      onChange={(e) =>
                        setEditingTeam({
                          ...editingTeam,
                          vtools_verified: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded text-brand-orange focus:ring-brand-orange"
                    />
                    <span>Mark as Verified on IEEE vTools (Locks Team)</span>
                  </label>
                </div>
              </Field>
            </div>

            {/* Proctor Assignment */}
            <div className="rounded-2xl border border-brand-sky/40 bg-sky-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-brand-navy">
                <UserCheck className="h-4 w-4" />
                <span>Proctor Assignment</span>
              </div>
              <p className="text-[11px] text-ink-soft">
                Input the certified faculty proctor information. Team leads will see these details to complete their vTools registration.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Proctor Name" htmlFor="modal_proc_name">
                  <Input
                    id="modal_proc_name"
                    placeholder="e.g. Dr. B. Kanmani"
                    value={editingTeam.proctor_name || ''}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        proctor_name: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Proctor IEEE Member ID" htmlFor="modal_proc_id">
                  <Input
                    id="modal_proc_id"
                    placeholder="e.g. 90451234"
                    value={editingTeam.proctor_ieee_id || ''}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        proctor_ieee_id: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            {/* Admin notes */}
            <Field label="Admin Notes (Internal)" htmlFor="modal_notes">
              <textarea
                id="modal_notes"
                rows={2}
                placeholder="Internal notes about campus lab seating, attendance, etc."
                value={editingTeam.admin_note || ''}
                onChange={(e) =>
                  setEditingTeam({
                    ...editingTeam,
                    admin_note: e.target.value,
                  })
                }
                className="input text-xs py-2 w-full"
              />
            </Field>

            {/* Team Members List */}
            <div className="rounded-2xl border border-line bg-paper/40 p-4">
              <span className="font-semibold text-ink uppercase text-[11px] tracking-wider block mb-2">
                Registered Participants ({editingTeam.members.length})
              </span>
              <div className="space-y-2">
                {editingTeam.members.map((m, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-line"
                  >
                    <div>
                      <p className="font-bold text-ink">
                        {m.first_name} {m.last_name}{' '}
                        {m.is_lead && (
                          <span className="badge bg-brand-navy text-white text-[10px] py-0 px-1 ml-1">
                            Lead
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted">
                        IEEE ID: {m.ieee_member_id} · USN: {m.usn} · {m.department} ({m.year_of_study})
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-ink-soft">
                      <p>{m.email}</p>
                      <p>{m.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="btn btn-primary text-xs font-bold"
              >
                {savingEdit ? <Spinner className="h-3.5 w-3.5" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* UPLOAD LEGACY MEMBER CSV MODAL */}
      {showUploadModal && (
        <Modal
          title="Import BMSCE IEEE Members (CSV)"
          onClose={() => {
            setShowUploadModal(false);
            setUploadMessage(null);
          }}
        >
          <form onSubmit={handleUploadLegacyMembers} className="space-y-4 text-xs">
            {uploadMessage && (
              <Alert tone={uploadMessage.tone}>{uploadMessage.text}</Alert>
            )}

            <p className="text-muted leading-relaxed">
              Upload a CSV of existing or past BMSCE IEEE members so their Member Numbers pass the prerequisite check during registration.
            </p>

            <div className="rounded-xl bg-paper p-3 text-[11px] text-ink-soft space-y-1">
              <p className="font-semibold text-ink">Expected format:</p>
              <code className="block bg-white p-2 rounded border border-line font-mono text-[10px]">
                ieee_member_id, name, email<br />
                98451201, Rohan Sharma, rohan.cs23@bmsce.ac.in<br />
                100650078, Ratik Agrawal, ratikagrawal.ec24@bmsce.ac.in
              </code>
            </div>

            <FileDrop
              id="csv_file_drop"
              file={uploadFile}
              onChange={(f) => setUploadFile(f)}
              label="Choose CSV file"
            />

            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1">
                Or paste CSV text directly:
              </label>
              <textarea
                rows={4}
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                placeholder="98451201, Rohan Sharma, rohan@bmsce.ac.in..."
                className="input font-mono text-[11px] py-2 w-full"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadMessage(null);
                }}
                className="btn btn-ghost text-xs"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={uploading || (!uploadFile && !uploadText.trim())}
                className="btn btn-primary text-xs font-bold"
              >
                {uploading ? <Spinner className="h-3.5 w-3.5" /> : 'Import Records'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

