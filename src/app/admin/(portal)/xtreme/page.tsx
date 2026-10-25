'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Crown,
  Download,
  Edit2,
  FileSpreadsheet,
  Info,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Trophy,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import { Alert, Field, FileDrop, Input, Modal, PageLoader, Select, Spinner } from '@/components/ui/form';
import { isDemoMode, supabase } from '@/lib/supabase';
import {
  addLocalKnownMembers,
  deleteLocalXtremeProctor,
  deleteLocalXtremeTeam,
  getLocalXtremeProctors,
  getLocalXtremeTeams,
  proctorCapacity,
  saveLocalXtremeProctor,
  saveLocalXtremeTeam,
  sortProctorsByQueue,
  updateLocalXtremeTeam,
  type KnownMember,
  type XtremeMember,
  type XtremeProctor,
  type XtremeTeam,
} from '@/lib/xtreme';

interface TeamStats {
  totalTeams: number;
  totalMembers: number;
  vtoolsDone: number;
  proctorAssigned: number;
}

const DEPARTMENTS = ['CSE', 'ISE', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'ETE', 'BioTech', 'Other'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

export default function AdminXtremePage() {
  const [teams, setTeams] = useState<XtremeTeam[]>([]);
  const [proctors, setProctors] = useState<XtremeProctor[]>([]);
  const [stats, setStats] = useState<TeamStats>({
    totalTeams: 0,
    totalMembers: 0,
    vtoolsDone: 0,
    proctorAssigned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending_vtools' | 'verified_vtools' | 'unassigned_proctor'>('all');

  // Collapsible Proctors Section
  const [showProctorsSection, setShowProctorsSection] = useState(false);
  const [newProctorName, setNewProctorName] = useState('');
  const [newProctorIeee, setNewProctorIeee] = useState('');
  const [newProctorCapacity, setNewProctorCapacity] = useState('20');
  const [editingCapId, setEditingCapId] = useState<string | null>(null);
  const [editingCapValue, setEditingCapValue] = useState('');
  const [savingCap, setSavingCap] = useState(false);
  const [addingProctor, setAddingProctor] = useState(false);
  const [proctorActionMsg, setProctorActionMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  // Edit Team Modal
  const [editingTeam, setEditingTeam] = useState<XtremeTeam | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  function handleCopyEmails(emails: (string | undefined)[]) {
    const list = emails.map((e) => e?.trim()).filter(Boolean);
    if (list.length === 0) return;
    navigator.clipboard.writeText(list.join(', '));
    setCopiedEmails(true);
    setTimeout(() => setCopiedEmails(false), 2000);
  }

  function handleMemberChange(index: number, field: keyof XtremeMember, value: unknown) {
    if (!editingTeam) return;
    const updated = [...editingTeam.members];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setEditingTeam({
      ...editingTeam,
      members: updated,
    });
  }

  function handleSetLead(index: number) {
    if (!editingTeam) return;
    const updated = editingTeam.members.map((m, i) => ({
      ...m,
      is_lead: i === index,
    }));
    setEditingTeam({
      ...editingTeam,
      members: updated,
    });
  }

  function handleAddMember() {
    if (!editingTeam || editingTeam.members.length >= 3) return;
    const newMember: XtremeMember = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      ieee_member_id: '',
      usn: '',
      department: 'CSE',
      year_of_study: '3rd Year',
      is_lead: editingTeam.members.length === 0,
    };
    setEditingTeam({
      ...editingTeam,
      members: [...editingTeam.members, newMember],
    });
  }

  function handleRemoveMember(index: number) {
    if (!editingTeam || editingTeam.members.length <= 1) return;
    const isRemovingLead = editingTeam.members[index]?.is_lead;
    const updated = editingTeam.members.filter((_, i) => i !== index);
    if (isRemovingLead && updated.length > 0) {
      updated[0] = { ...updated[0], is_lead: true };
    }
    setEditingTeam({
      ...editingTeam,
      members: updated,
    });
  }

  // Add Team Modal
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [savingAddTeam, setSavingAddTeam] = useState(false);
  const [addTeamError, setAddTeamError] = useState('');
  const [addTeamName, setAddTeamName] = useState('');
  const [addLeadName, setAddLeadName] = useState('');
  const [addLeadPhone, setAddLeadPhone] = useState('');
  const [addLeadEmail, setAddLeadEmail] = useState('');
  const [addLeadIeeeId, setAddLeadIeeeId] = useState('');
  const [addLeadUsn, setAddLeadUsn] = useState('');
  const [addLeadDept, setAddLeadDept] = useState('CSE');
  const [addLeadYear, setAddLeadYear] = useState('3rd Year');
  const [addProctorId, setAddProctorId] = useState('');
  const [addAdminNote, setAddAdminNote] = useState('');
  const [addTeammates, setAddTeammates] = useState<
    { name: string; phone: string; email: string; ieee_id: string; usn: string; department: string; year_of_study: string }[]
  >([]);

  // Bulk Teams Import Modal
  const [showBulkTeamsModal, setShowBulkTeamsModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{ tone: 'success' | 'error'; text: string; details?: string[] } | null>(null);

  // Upload Member CSV Modal
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
        const localProcs = getLocalXtremeProctors();
        setTeams(local);
        setProctors(localProcs);
        const totalMembers = local.reduce((acc, t) => acc + (t.members?.length || 0), 0);
        const vtoolsDone = local.filter((t) => t.vtools_verified).length;
        const proctorAssigned = local.filter((t) => t.proctor_name?.trim() || t.proctor_id).length;
        setStats({
          totalTeams: local.length,
          totalMembers,
          vtoolsDone,
          proctorAssigned,
        });
      } else {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        const [teamsRes, procsRes] = await Promise.all([
          fetch('/api/xtreme/admin/teams', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/xtreme/admin/proctors', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const data = await teamsRes.json().catch(() => null);
        if (data?.teams) {
          setTeams(data.teams);
          if (data.stats) setStats(data.stats);
        }

        const procsData = await procsRes.json().catch(() => null);
        if (procsData?.proctors) {
          setProctors(procsData.proctors);
        }
      }
    } catch (err) {
      console.error('Failed to load xtreme admin data:', err);
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
          const localProcs = getLocalXtremeProctors();
          if (!alive) return;
          setTeams(local);
          setProctors(localProcs);
          const totalMembers = local.reduce((acc, t) => acc + (t.members?.length || 0), 0);
          const vtoolsDone = local.filter((t) => t.vtools_verified).length;
          const proctorAssigned = local.filter((t) => t.proctor_name?.trim() || t.proctor_id).length;
          setStats({
            totalTeams: local.length,
            totalMembers,
            vtoolsDone,
            proctorAssigned,
          });
        } else {
          const { data: session } = await supabase.auth.getSession();
          const token = session.session?.access_token;
          const [teamsRes, procsRes] = await Promise.all([
            fetch('/api/xtreme/admin/teams', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/xtreme/admin/proctors', { headers: { Authorization: `Bearer ${token}` } }),
          ]);

          const data = await teamsRes.json().catch(() => null);
          if (data?.teams && alive) {
            setTeams(data.teams);
            if (data.stats) setStats(data.stats);
          }

          const procsData = await procsRes.json().catch(() => null);
          if (procsData?.proctors && alive) {
            setProctors(procsData.proctors);
          }
        }
      } catch (err) {
        console.error('Failed to initialize xtreme admin:', err);
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
      result = result.filter((t) => !t.proctor_name?.trim() && !t.proctor_id);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.team_name.toLowerCase().includes(q) ||
          t.proctor_name?.toLowerCase().includes(q) ||
          t.leader_email?.toLowerCase().includes(q) ||
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

  // Proctor Management Handlers
  async function handleAddProctor(e: React.FormEvent) {
    e.preventDefault();
    if (!newProctorName.trim() || !newProctorIeee.trim()) return;
    const capacity = Number(newProctorCapacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) {
      setProctorActionMsg({ tone: 'error', text: 'Squad capacity must be a whole number between 1 and 500.' });
      return;
    }

    setAddingProctor(true);
    setProctorActionMsg(null);

    try {
      if (isDemoMode()) {
        const nextOrder = proctors.reduce((m, p) => Math.max(m, p.sort_order ?? 0), 0) + 1;
        const proc: XtremeProctor = {
          id: `proc-demo-${Date.now()}`,
          name: newProctorName.trim(),
          ieee_id: newProctorIeee.trim(),
          capacity,
          sort_order: nextOrder,
          created_at: new Date().toISOString(),
          assigned_count: 0,
        };
        saveLocalXtremeProctor(proc);
        setProctors((prev) => sortProctorsByQueue([...prev, proc]));
        setNewProctorName('');
        setNewProctorIeee('');
        setNewProctorCapacity('20');
        setProctorActionMsg({ tone: 'success', text: `Proctor "${proc.name}" added successfully (takes ${capacity} squads).` });
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch('/api/xtreme/admin/proctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProctorName.trim(),
          ieee_id: newProctorIeee.trim(),
          capacity,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to add proctor.');
      }

      setProctors((prev) => sortProctorsByQueue([...prev, data.proctor]));
      setNewProctorName('');
      setNewProctorIeee('');
      setNewProctorCapacity('20');
      setProctorActionMsg({ tone: 'success', text: `Proctor "${data.proctor.name}" added successfully (takes ${capacity} squads).` });
    } catch (err: unknown) {
      setProctorActionMsg({ tone: 'error', text: (err as Error).message || 'Failed to add proctor.' });
    } finally {
      setAddingProctor(false);
    }
  }

  async function handleUpdateCapacity(id: string) {
    const capacity = Number(editingCapValue);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) {
      setProctorActionMsg({ tone: 'error', text: 'Squad capacity must be a whole number between 1 and 500.' });
      return;
    }

    setSavingCap(true);
    setProctorActionMsg(null);

    try {
      if (isDemoMode()) {
        const target = getLocalXtremeProctors().find((p) => p.id === id);
        if (!target) throw new Error('Proctor not found.');
        target.capacity = capacity;
        saveLocalXtremeProctor(target);
        setProctors((prev) => prev.map((p) => (p.id === id ? { ...p, capacity } : p)));
      } else {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        const res = await fetch(`/api/xtreme/admin/proctors/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ capacity }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Failed to update capacity.');
        setProctors((prev) => prev.map((p) => (p.id === id ? { ...p, capacity: data.proctor.capacity } : p)));
      }
      setEditingCapId(null);
      setProctorActionMsg({ tone: 'success', text: 'Squad limit updated. Existing assignments are kept.' });
    } catch (err: unknown) {
      setProctorActionMsg({ tone: 'error', text: (err as Error).message || 'Failed to update capacity.' });
    } finally {
      setSavingCap(false);
    }
  }

  async function handleDeleteProctor(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove proctor "${name}"? Teams assigned to this proctor will be unassigned.`)) {
      return;
    }

    try {
      if (isDemoMode()) {
        deleteLocalXtremeProctor(id);
        setProctors((prev) => prev.filter((p) => p.id !== id));
        await loadData();
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch(`/api/xtreme/admin/proctors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to delete proctor.');
      }

      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Delete failed.');
    }
  }

  // Save Edit Handler
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTeam) return;

    const cleanName = editingTeam.team_name.trim();
    if (!cleanName || !/^[a-zA-Z0-9]{3,20}$/.test(cleanName)) {
      setEditError('Team name must be 3-20 characters and contain only letters and numbers (no spaces).');
      return;
    }

    if (!editingTeam.members || editingTeam.members.length < 1 || editingTeam.members.length > 3) {
      setEditError('Squad must have between 1 and 3 members.');
      return;
    }

    const leadCount = editingTeam.members.filter((m) => m.is_lead).length;
    if (leadCount !== 1) {
      setEditError('Exactly one member must be designated as the team lead.');
      return;
    }

    const seenIeee = new Set<string>();
    for (let i = 0; i < editingTeam.members.length; i++) {
      const m = editingTeam.members[i];
      const fn = (m.first_name || '').trim();
      const em = (m.email || '').trim().toLowerCase();
      const id = (m.ieee_member_id || '').trim();

      if (!fn) {
        setEditError(`Member #${i + 1}: First name is required.`);
        return;
      }
      if (!em || !em.includes('@')) {
        setEditError(`Member #${i + 1} (${fn}): A valid email address is required.`);
        return;
      }
      if (!id || (!/^\d{5,15}$/.test(id) && id !== '999')) {
        setEditError(`Member #${i + 1} (${fn}): A valid IEEE Member ID (5-15 digits) is required.`);
        return;
      }
      if (seenIeee.has(id)) {
        setEditError(`Duplicate IEEE Member ID "${id}" in squad roster.`);
        return;
      }
      seenIeee.add(id);
    }

    setSavingEdit(true);
    setEditError('');

    try {
      if (isDemoMode()) {
        let proctorName = '';
        let proctorIeee = '';
        if (editingTeam.proctor_id) {
          const proc = proctors.find((p) => p.id === editingTeam.proctor_id);
          if (proc) {
            proctorName = proc.name;
            proctorIeee = proc.ieee_id;
          }
        }
        const updated: XtremeTeam = {
          ...editingTeam,
          team_name: cleanName,
          proctor_name: proctorName,
          proctor_ieee_id: proctorIeee,
          updated_at: new Date().toISOString(),
        };
        updateLocalXtremeTeam(editingTeam.id, updated);
        setTeams((prev) => prev.map((t) => (t.id === editingTeam.id ? updated : t)));
        setEditingTeam(null);
        await loadData();
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
            team_name: cleanName,
            proctor_id: editingTeam.proctor_id || null,
            admin_note: editingTeam.admin_note,
            vtools_verified: editingTeam.vtools_verified,
            members: editingTeam.members,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || 'Failed to update team.');
        }

        setEditingTeam(null);
        await loadData();
      }
    } catch (err: unknown) {
      setEditError((err as Error).message || 'Failed to save changes.');
    } finally {
      setSavingEdit(false);
    }
  }

  // Delete Team Handler
  async function handleDeleteTeam(teamId: string, teamName: string) {
    if (!confirm(`Are you sure you want to permanently delete team "${teamName}"? This cannot be undone.`)) {
      return;
    }

    setDeletingTeamId(teamId);
    try {
      if (isDemoMode()) {
        deleteLocalXtremeTeam(teamId);
        setTeams((prev) => prev.filter((t) => t.id !== teamId));
        if (editingTeam?.id === teamId) {
          setEditingTeam(null);
        }
        await loadData();
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

        if (editingTeam?.id === teamId) {
          setEditingTeam(null);
        }
        await loadData();
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Delete failed.');
    } finally {
      setDeletingTeamId(null);
    }
  }

  // Add Squad Handler
  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setSavingAddTeam(true);
    setAddTeamError('');

    try {
      const payload = {
        team_name: addTeamName.trim(),
        leader_name: addLeadName.trim(),
        leader_phone: addLeadPhone.trim(),
        leader_email: addLeadEmail.trim().toLowerCase(),
        leader_ieee_id: addLeadIeeeId.trim(),
        leader_usn: addLeadUsn.trim().toUpperCase(),
        leader_department: addLeadDept,
        leader_year_of_study: addLeadYear,
        proctor_id: addProctorId || null,
        admin_note: addAdminNote.trim(),
        teammates: addTeammates.filter((m) => m.name.trim() && m.ieee_id.trim()),
      };

      if (isDemoMode()) {
        let proctorName = '';
        let proctorIeee = '';
        if (payload.proctor_id) {
          const proc = proctors.find((p) => p.id === payload.proctor_id);
          if (proc) {
            proctorName = proc.name;
            proctorIeee = proc.ieee_id;
          }
        }

        const teamId = `team-demo-${Date.now()}`;
        const membersList: XtremeMember[] = [
          {
            id: `mem-${teamId}-lead`,
            team_id: teamId,
            is_lead: true,
            ieee_member_id: payload.leader_ieee_id,
            first_name: payload.leader_name.split(' ')[0] || payload.leader_name,
            last_name: payload.leader_name.split(' ').slice(1).join(' '),
            email: payload.leader_email,
            phone: payload.leader_phone,
            usn: payload.leader_usn,
            department: payload.leader_department,
            year_of_study: payload.leader_year_of_study,
          },
          ...payload.teammates.map((m, idx) => ({
            id: `mem-${teamId}-${idx}`,
            team_id: teamId,
            is_lead: false,
            ieee_member_id: m.ieee_id.trim(),
            first_name: m.name.split(' ')[0] || m.name,
            last_name: m.name.split(' ').slice(1).join(' '),
            email: m.email.trim().toLowerCase(),
            phone: m.phone.trim(),
            usn: m.usn.trim().toUpperCase(),
            department: m.department,
            year_of_study: m.year_of_study,
          })),
        ];

        const newTeam: XtremeTeam = {
          id: teamId,
          team_name: payload.team_name,
          lead_user_id: null,
          leader_email: payload.leader_email,
          proctor_id: payload.proctor_id,
          vtools_verified: false,
          proctor_name: proctorName,
          proctor_ieee_id: proctorIeee,
          admin_note: payload.admin_note,
          created_at: new Date().toISOString(),
          members: membersList,
        };

        saveLocalXtremeTeam(newTeam);
        setShowAddTeamModal(false);
        resetAddTeamForm();
        await loadData();
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch('/api/xtreme/admin/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create squad.');
      }

      setShowAddTeamModal(false);
      resetAddTeamForm();
      await loadData();
    } catch (err: unknown) {
      setAddTeamError((err as Error).message || 'Failed to create squad.');
    } finally {
      setSavingAddTeam(false);
    }
  }

  function resetAddTeamForm() {
    setAddTeamName('');
    setAddLeadName('');
    setAddLeadPhone('');
    setAddLeadEmail('');
    setAddLeadIeeeId('');
    setAddLeadUsn('');
    setAddLeadDept('CSE');
    setAddLeadYear('3rd Year');
    setAddProctorId('');
    setAddAdminNote('');
    setAddTeammates([]);
    setAddTeamError('');
  }

  // Bulk Teams Import Handler
  async function handleBulkImportTeams(e: React.FormEvent) {
    e.preventDefault();
    setBulkUploading(true);
    setBulkMessage(null);

    try {
      let content = '';
      if (bulkFile) {
        content = await bulkFile.text();
      } else if (bulkText.trim()) {
        content = bulkText.trim();
      } else {
        throw new Error('Please choose a CSV file or paste CSV content.');
      }

      let bodyData: FormData | string;
      const headers: Record<string, string> = {};

      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.access_token) {
        headers['Authorization'] = `Bearer ${session.session.access_token}`;
      }

      if (bulkFile) {
        const formData = new FormData();
        formData.append('file', bulkFile);
        bodyData = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        bodyData = JSON.stringify({ csv: content });
      }

      const res = await fetch('/api/xtreme/admin/teams/bulk', {
        method: 'POST',
        headers,
        body: bodyData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Bulk squad import failed.');
      }

      const errors = (data.results || [])
        .filter((r: { status: string; error?: string }) => r.status === 'error' && r.error)
        .map((r: { error: string }) => r.error);

      setBulkMessage({
        tone: data.count > 0 ? 'success' : 'error',
        text: `Imported ${data.count} of ${data.total} squads successfully.`,
        details: errors.length > 0 ? errors : undefined,
      });

      setBulkFile(null);
      setBulkText('');
      await loadData();
    } catch (err: unknown) {
      setBulkMessage({
        tone: 'error',
        text: (err as Error).message || 'Failed to process bulk import.',
      });
    } finally {
      setBulkUploading(false);
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

        const cell = (v: unknown) => {
          let s = String(v ?? '');
          if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formulas
          return `"${s.replace(/"/g, '""')}"`;
        };
        const rows: string[] = [headers.join(',')];
        for (const t of localTeams) {
          const membersList = t.members || [];
          if (membersList.length === 0) {
            rows.push(
              [
                cell(t.team_name),
                cell(t.vtools_verified ? 'Verified on vTools' : 'Pending vTools'),
                cell(t.proctor_name || ''),
                cell(t.proctor_ieee_id || ''),
                cell(t.admin_note || ''),
                cell('None'), cell(''), cell(''), cell(''), cell(''), cell(''), cell(''), cell(''), cell(''),
                cell(t.created_at),
              ].join(',')
            );
          } else {
            for (const m of membersList) {
              rows.push(
                [
                  cell(t.team_name),
                  cell(t.vtools_verified ? 'Verified on vTools' : 'Pending vTools'),
                  cell(t.proctor_name || ''),
                  cell(t.proctor_ieee_id || ''),
                  cell(t.admin_note || ''),
                  cell(m.is_lead ? 'Team Lead' : 'Teammate'),
                  cell(m.first_name),
                  cell(m.last_name || ''),
                  cell(m.ieee_member_id),
                  cell(m.email),
                  cell(m.phone || ''),
                  cell(m.usn || ''),
                  cell(m.department || ''),
                  cell(m.year_of_study || ''),
                  cell(t.created_at),
                ].join(',')
              );
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
            onClick={() => setShowAddTeamModal(true)}
            className="btn btn-primary text-xs font-bold"
          >
            <Plus className="h-4 w-4" /> Add Squad
          </button>
          <button
            type="button"
            onClick={() => setShowBulkTeamsModal(true)}
            className="btn btn-ghost bg-white border border-line text-xs font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4" /> Bulk Import Squads
          </button>
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
          <p className="mt-1 text-xs text-muted">Squads matched to faculty</p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase">vTools Confirmed</span>
            <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} />
          </div>
          <p className="display mt-2 text-3xl text-ink">{stats.vtoolsDone}</p>
          <p className="mt-1 text-xs text-muted">Official registration locked</p>
        </div>
      </div>

      {/* COLLAPSIBLE PROCTOR DIRECTORY & CAPACITY MANAGEMENT */}
      <div className="rounded-3xl border border-line bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowProctorsSection(!showProctorsSection)}
          className="w-full flex items-center justify-between p-5 text-left bg-paper/40 hover:bg-paper/70 transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy font-bold text-xs">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">
                Managed Faculty Proctors ({proctors.length})
              </h2>
              <p className="text-xs text-muted">
                New squads fill proctors in queue order (#1 first). Set how many squads each proctor takes — new proctors join the end of the queue.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <span>{showProctorsSection ? 'Collapse' : 'Expand'}</span>
            {showProctorsSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {showProctorsSection && (
          <div className="p-5 sm:p-6 space-y-6 border-t border-line">
            {proctorActionMsg && (
              <Alert tone={proctorActionMsg.tone}>{proctorActionMsg.text}</Alert>
            )}

            {/* Add Proctor Inline Form */}
            <form onSubmit={handleAddProctor} className="rounded-2xl border border-line bg-paper/40 p-4">
              <span className="block text-xs font-bold text-ink mb-2">Register New Faculty Proctor (joins the end of the queue)</span>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_140px_auto]">
                <Input
                  placeholder="Proctor Full Name (e.g. Dr. B. Kanmani)"
                  value={newProctorName}
                  onChange={(e) => setNewProctorName(e.target.value)}
                  className="text-xs py-2 bg-white"
                  required
                />
                <Input
                  placeholder="IEEE Member Number (e.g. 102196859)"
                  value={newProctorIeee}
                  onChange={(e) => setNewProctorIeee(e.target.value.replace(/\D/g, ''))}
                  className="text-xs py-2 bg-white"
                  required
                />
                <Input
                  type="number"
                  min={1}
                  max={500}
                  title="How many squads this proctor takes"
                  placeholder="Squads (e.g. 20)"
                  value={newProctorCapacity}
                  onChange={(e) => setNewProctorCapacity(e.target.value.replace(/\D/g, ''))}
                  className="text-xs py-2 bg-white"
                  required
                />
                <button
                  type="submit"
                  disabled={addingProctor || !newProctorName.trim() || !newProctorIeee.trim()}
                  className="btn btn-primary text-xs font-bold whitespace-nowrap"
                >
                  {addingProctor ? <Spinner className="h-3.5 w-3.5" /> : <><Plus className="h-3.5 w-3.5" /> Add Proctor</>}
                </button>
              </div>
            </form>

            {/* Proctors Table */}
            {proctors.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">
                No faculty proctors registered yet. Add proctors above to enable auto-assignment and dropdown selection.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-paper border-b border-line text-muted uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Queue</th>
                      <th className="px-4 py-3">Proctor Name</th>
                      <th className="px-4 py-3">IEEE Member ID</th>
                      <th className="px-4 py-3">Assigned Squads</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-white">
                    {sortProctorsByQueue(proctors).map((proc, qi) => {
                      const count = proc.assigned_count ?? 0;
                      const cap = proctorCapacity(proc);
                      const isFull = count >= cap;
                      const isEditing = editingCapId === proc.id;
                      return (
                        <tr key={proc.id} className="hover:bg-paper/40">
                          <td className="px-4 py-3">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy/10 text-[11px] font-bold text-brand-navy">
                              {qi + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-ink">{proc.name}</td>
                          <td className="px-4 py-3 font-mono text-muted">{proc.ieee_id}</td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="font-semibold text-ink">{count} /</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={500}
                                  value={editingCapValue}
                                  onChange={(e) => setEditingCapValue(e.target.value.replace(/\D/g, ''))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateCapacity(proc.id);
                                    if (e.key === 'Escape') setEditingCapId(null);
                                  }}
                                  className="input w-16 px-2 py-1 text-xs"
                                  aria-label={`Squad limit for ${proc.name}`}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCapacity(proc.id)}
                                  disabled={savingCap}
                                  className="p-1 text-emerald-700 hover:bg-emerald-50 rounded transition"
                                  title="Save squad limit"
                                >
                                  {savingCap ? <Spinner className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCapId(null)}
                                  className="p-1 text-muted hover:bg-paper rounded transition"
                                  title="Cancel"
                                >
                                  ✕
                                </button>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className={`badge text-xs font-semibold ${
                                    isFull
                                      ? 'bg-red-50 text-red-700'
                                      : count >= cap - 5
                                      ? 'bg-amber-50 text-amber-800'
                                      : 'bg-emerald-50 text-emerald-800'
                                  }`}
                                >
                                  {count} / {cap} squads {isFull ? '(FULL)' : ''}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCapId(proc.id);
                                    setEditingCapValue(String(cap));
                                  }}
                                  className="p-1 text-muted hover:bg-paper rounded transition"
                                  title="Edit squad limit"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteProctor(proc.id, proc.name)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete Proctor"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search team, leader email, student, proctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 text-xs py-2 w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Squads' },
            { id: 'unassigned_proctor', label: 'Pending Proctor' },
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
          <p className="text-xs text-muted mt-1">Try adjusting your search or filter options, or add a new squad above.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-paper/60 text-muted uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Team Name & Ownership</th>
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
                    <tr
                      key={team.id}
                      onClick={() => setEditingTeam(team)}
                      className="hover:bg-paper/60 transition cursor-pointer group"
                    >
                      {/* Team Name & Claim Status */}
                      <td className="px-5 py-4 font-bold text-ink">
                        <div className="text-sm group-hover:text-brand-navy transition underline-offset-2 group-hover:underline">
                          {team.team_name}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          {team.lead_user_id ? (
                            <span className="badge bg-emerald-50 text-emerald-800 text-[10px] py-0 px-1.5">
                              Claimed
                            </span>
                          ) : (
                            <span className="badge bg-amber-50 text-amber-800 text-[10px] py-0 px-1.5">
                              Unclaimed {team.leader_email ? `(${team.leader_email})` : ''}
                            </span>
                          )}
                        </div>
                        {team.admin_note && (
                          <p className="text-[11px] text-muted font-normal mt-1 line-clamp-1 italic">
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
                                ({leadMember.ieee_member_id}) {leadMember.usn ? `· ${leadMember.usn}` : ''}
                              </span>
                            </div>
                          )}
                          {otherMembers.map((m, idx) => (
                            <div key={idx} className="text-ink-soft text-[11px] pl-1">
                              • {m.first_name} {m.last_name} ({m.ieee_member_id}) {m.department ? `· ${m.department}` : ''}
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
                              <p className="text-[11px] text-muted font-mono">ID: {team.proctor_ieee_id}</p>
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
                      <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingTeam(team)}
                            className="btn btn-ghost bg-paper py-1 px-2.5 text-xs font-semibold hover:border-brand-navy"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Manage Squad
                          </button>
                          <button
                            type="button"
                            disabled={deletingTeamId === team.id}
                            onClick={() => handleDeleteTeam(team.id, team.team_name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Delete Team"
                          >
                            {deletingTeamId === team.id ? (
                              <Spinner className="h-3.5 w-3.5" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
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
          title={`Manage Squad: ${editingTeam.team_name}`}
          onClose={() => setEditingTeam(null)}
          wide
        >
          <form onSubmit={handleSaveEdit} className="space-y-6 text-xs">
            {editError && <Alert tone="error">{editError}</Alert>}

            {/* Quick Status & Utility Banner */}
            <div className="rounded-2xl border border-line bg-paper/60 p-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Account Claim:</span>
                    {editingTeam.lead_user_id ? (
                      <span className="badge bg-emerald-50 text-emerald-800 text-[11px] font-medium py-0.5 px-2 flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-600" />
                        Claimed (User ID: {editingTeam.lead_user_id.slice(0, 8)}...)
                      </span>
                    ) : (
                      <span className="badge bg-amber-50 text-amber-800 text-[11px] font-medium py-0.5 px-2 flex items-center gap-1">
                        <Info className="h-3 w-3 text-amber-600" />
                        Unclaimed — will link to {editingTeam.leader_email || editingTeam.members.find((m) => m.is_lead)?.email || 'leader'} upon sign-in
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted">
                    Squad registered on {new Date(editingTeam.created_at).toLocaleDateString()}
                    {editingTeam.updated_at ? ` · Last updated ${new Date(editingTeam.updated_at).toLocaleDateString()}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyEmails(editingTeam.members.map((m) => m.email))}
                    className="btn btn-ghost bg-white border border-line py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 hover:bg-paper"
                    title="Copy all squad member emails to clipboard"
                  >
                    {copiedEmails ? (
                      <>
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied Emails!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-muted" />
                        <span>Copy Member Emails</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {editingTeam.vtools_verified && (
                <div className="rounded-xl bg-amber-50/80 border border-amber-200/60 p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                  <span>
                    <strong>vTools Verified:</strong> This squad is verified and locked on the student portal. As an organizer/admin, you can still modify details below.
                  </span>
                </div>
              )}
            </div>

            {/* Team Attributes */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Team Name" htmlFor="modal_team_name" required hint="3-20 characters, alphanumeric only">
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
                    <span>Mark as Verified on IEEE vTools (Locks Squad)</span>
                  </label>
                </div>
              </Field>
            </div>

            {/* Managed Proctor Selection */}
            <div className="rounded-2xl border border-brand-sky/40 bg-sky-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-brand-navy">
                <UserCheck className="h-4 w-4" />
                <span>Assign Faculty Proctor</span>
              </div>
              <p className="text-[11px] text-ink-soft">
                Select an authorized faculty proctor from the directory. Proctors at their squad limit are disabled.
              </p>

              <Field label="Selected Proctor" htmlFor="modal_proc_select">
                <select
                  id="modal_proc_select"
                  value={editingTeam.proctor_id || ''}
                  onChange={(e) =>
                    setEditingTeam({
                      ...editingTeam,
                      proctor_id: e.target.value || null,
                    })
                  }
                  className="input text-xs py-2 w-full bg-white"
                >
                  <option value="">(No Proctor Assigned)</option>
                  {sortProctorsByQueue(proctors).map((proc, qi) => {
                    const count = proc.assigned_count ?? 0;
                    const cap = proctorCapacity(proc);
                    const isFull = count >= cap && proc.id !== editingTeam.proctor_id;
                    return (
                      <option key={proc.id} value={proc.id} disabled={isFull}>
                        #{qi + 1} {proc.name} (IEEE ID: {proc.ieee_id}) — {count}/{cap} squads {isFull ? '[CAPACITY FULL]' : ''}
                      </option>
                    );
                  })}
                </select>
              </Field>
            </div>

            {/* Admin notes */}
            <Field label="Admin Notes (Internal Organizer Notes)" htmlFor="modal_notes">
              <textarea
                id="modal_notes"
                rows={2}
                placeholder="Internal notes about campus lab seating, attendance, offline registration, etc."
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

            {/* Team Members List (Fully Editable) */}
            <div className="rounded-2xl border border-line bg-paper/30 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink uppercase text-[11px] tracking-wider block">
                    Squad Members ({editingTeam.members.length} / 3 max)
                  </span>
                  <p className="text-[11px] text-muted mt-0.5">
                    Every squad must have between 1 and 3 participants with exactly one leader.
                  </p>
                </div>
                {editingTeam.members.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="btn btn-ghost bg-white border border-line text-xs font-semibold py-1 px-3 flex items-center gap-1.5 hover:bg-paper"
                  >
                    <Plus className="h-3.5 w-3.5 text-brand-orange" />
                    <span>Add Teammate</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {editingTeam.members.map((m, i) => (
                  <div
                    key={m.id || i}
                    className="bg-white p-3.5 rounded-2xl border border-line shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-xs">
                          Participant #{i + 1}
                        </span>
                        {m.is_lead ? (
                          <span className="badge bg-brand-navy text-white text-[10px] font-semibold py-0.5 px-2 flex items-center gap-1">
                            <Crown className="h-3 w-3 text-brand-orange" />
                            Team Leader
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetLead(i)}
                            className="btn btn-ghost py-0.5 px-2 text-[10px] font-semibold text-brand-navy hover:bg-brand-navy/5 border border-brand-navy/20"
                          >
                            Designate as Leader
                          </button>
                        )}
                      </div>

                      {editingTeam.members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(i)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remove teammate"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <Field label="First Name" htmlFor={`m_${i}_fn`} required>
                        <Input
                          id={`m_${i}_fn`}
                          value={m.first_name}
                          onChange={(e) => handleMemberChange(i, 'first_name', e.target.value)}
                          placeholder="First Name"
                          className="text-xs py-1.5"
                        />
                      </Field>

                      <Field label="Last Name" htmlFor={`m_${i}_ln`}>
                        <Input
                          id={`m_${i}_ln`}
                          value={m.last_name || ''}
                          onChange={(e) => handleMemberChange(i, 'last_name', e.target.value)}
                          placeholder="Last Name"
                          className="text-xs py-1.5"
                        />
                      </Field>

                      <Field label="Email Address" htmlFor={`m_${i}_email`} required>
                        <Input
                          id={`m_${i}_email`}
                          type="email"
                          value={m.email}
                          onChange={(e) => handleMemberChange(i, 'email', e.target.value)}
                          placeholder="student.dept@bmsce.ac.in"
                          className="text-xs py-1.5"
                        />
                      </Field>

                      <Field label="Phone Number" htmlFor={`m_${i}_phone`}>
                        <Input
                          id={`m_${i}_phone`}
                          value={m.phone || ''}
                          onChange={(e) => handleMemberChange(i, 'phone', e.target.value)}
                          placeholder="+91 9876543210"
                          className="text-xs py-1.5"
                        />
                      </Field>

                      <Field label="IEEE Member ID" htmlFor={`m_${i}_ieee`} required hint="5-15 digits">
                        <Input
                          id={`m_${i}_ieee`}
                          value={m.ieee_member_id}
                          onChange={(e) =>
                            handleMemberChange(i, 'ieee_member_id', e.target.value.replace(/[^0-9]/g, ''))
                          }
                          placeholder="98451234"
                          className="text-xs py-1.5 font-mono"
                        />
                      </Field>

                      <Field label="College USN" htmlFor={`m_${i}_usn`}>
                        <Input
                          id={`m_${i}_usn`}
                          value={m.usn || ''}
                          onChange={(e) =>
                            handleMemberChange(i, 'usn', e.target.value.toUpperCase())
                          }
                          placeholder="1BM23CS001"
                          className="text-xs py-1.5 uppercase font-mono"
                        />
                      </Field>

                      <Field label="Department" htmlFor={`m_${i}_dept`}>
                        <Select
                          id={`m_${i}_dept`}
                          value={m.department || 'CSE'}
                          onChange={(e) => handleMemberChange(i, 'department', e.target.value)}
                          className="text-xs py-1.5"
                        >
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field label="Year of Study" htmlFor={`m_${i}_year`}>
                        <Select
                          id={`m_${i}_year`}
                          value={m.year_of_study || '3rd Year'}
                          onChange={(e) => handleMemberChange(i, 'year_of_study', e.target.value)}
                          className="text-xs py-1.5"
                        >
                          {YEARS.map((yr) => (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-line">
              <button
                type="button"
                disabled={deletingTeamId === editingTeam.id || savingEdit}
                onClick={() => handleDeleteTeam(editingTeam.id, editingTeam.team_name)}
                className="btn btn-ghost text-red-600 hover:bg-red-50 text-xs flex items-center gap-1.5"
              >
                {deletingTeamId === editingTeam.id ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Delete Squad</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || deletingTeamId === editingTeam.id}
                  className="btn btn-primary text-xs font-bold"
                >
                  {savingEdit ? <Spinner className="h-3.5 w-3.5" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* CREATE NEW SQUAD MODAL */}
      {showAddTeamModal && (
        <Modal
          title="Create New IEEEXtreme Squad"
          onClose={() => {
            setShowAddTeamModal(false);
            resetAddTeamForm();
          }}
          wide
        >
          <form onSubmit={handleCreateTeam} className="space-y-5 text-xs">
            {addTeamError && <Alert tone="error">{addTeamError}</Alert>}

            <p className="text-muted leading-relaxed">
              Create a team on behalf of students. The team begins unlinked and will be automatically claimed when the leader signs in with the matching verified email address.
            </p>

            {/* Team Name & Proctor */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Team Name" htmlFor="add_team_name" required>
                <Input
                  id="add_team_name"
                  placeholder="e.g. BitShifters"
                  value={addTeamName}
                  onChange={(e) => setAddTeamName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  required
                />
              </Field>

              <Field label="Assign Proctor" htmlFor="add_team_proc">
                <select
                  id="add_team_proc"
                  value={addProctorId}
                  onChange={(e) => setAddProctorId(e.target.value)}
                  className="input text-xs py-2 w-full bg-white"
                >
                  <option value="">(No Proctor Assigned)</option>
                  {sortProctorsByQueue(proctors).map((proc, qi) => {
                    const count = proc.assigned_count ?? 0;
                    const cap = proctorCapacity(proc);
                    const isFull = count >= cap;
                    return (
                      <option key={proc.id} value={proc.id} disabled={isFull}>
                        #{qi + 1} {proc.name} (IEEE ID: {proc.ieee_id}) — {count}/{cap} {isFull ? '[FULL]' : ''}
                      </option>
                    );
                  })}
                </select>
              </Field>
            </div>

            {/* Team Leader Details */}
            <div className="rounded-2xl border border-brand-navy/30 bg-brand-navy/[0.02] p-4 space-y-3">
              <span className="font-bold text-xs text-brand-navy uppercase tracking-wider block">
                Team Leader (Mandatory)
              </span>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Leader Full Name" htmlFor="add_lead_name" required>
                  <Input
                    id="add_lead_name"
                    placeholder="e.g. Rohan Sharma"
                    value={addLeadName}
                    onChange={(e) => setAddLeadName(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Leader Verified Email" htmlFor="add_lead_email" required>
                  <Input
                    id="add_lead_email"
                    type="email"
                    placeholder="rohan.cs23@bmsce.ac.in"
                    value={addLeadEmail}
                    onChange={(e) => setAddLeadEmail(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Leader IEEE Member ID" htmlFor="add_lead_ieee" required>
                  <Input
                    id="add_lead_ieee"
                    placeholder="e.g. 98451201"
                    value={addLeadIeeeId}
                    onChange={(e) => setAddLeadIeeeId(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </Field>

                <Field label="Leader Phone Number" htmlFor="add_lead_phone">
                  <Input
                    id="add_lead_phone"
                    placeholder="+91 9845012345"
                    value={addLeadPhone}
                    onChange={(e) => setAddLeadPhone(e.target.value)}
                  />
                </Field>

                <Field label="USN" htmlFor="add_lead_usn">
                  <Input
                    id="add_lead_usn"
                    placeholder="1BM23CS140"
                    value={addLeadUsn}
                    onChange={(e) => setAddLeadUsn(e.target.value)}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Dept" htmlFor="add_lead_dept">
                    <select
                      id="add_lead_dept"
                      value={addLeadDept}
                      onChange={(e) => setAddLeadDept(e.target.value)}
                      className="input text-xs py-2 w-full bg-white"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Year" htmlFor="add_lead_year">
                    <select
                      id="add_lead_year"
                      value={addLeadYear}
                      onChange={(e) => setAddLeadYear(e.target.value)}
                      className="input text-xs py-2 w-full bg-white"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </div>

            {/* Optional Teammates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-ink uppercase tracking-wider">
                  Teammates ({addTeammates.length} / 2)
                </span>
                {addTeammates.length < 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setAddTeammates([
                        ...addTeammates,
                        { name: '', phone: '', email: '', ieee_id: '', usn: '', department: 'CSE', year_of_study: '3rd Year' },
                      ])
                    }
                    className="btn btn-ghost py-1 px-2.5 text-xs font-semibold text-brand-orange"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Teammate
                  </button>
                )}
              </div>

              {addTeammates.map((mate, idx) => (
                <div key={idx} className="rounded-2xl border border-line bg-paper/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink text-[11px]">Teammate {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setAddTeammates(addTeammates.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:text-red-700 text-[11px] font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-4">
                    <Input
                      placeholder="Full Name"
                      value={mate.name}
                      onChange={(e) => {
                        const copy = [...addTeammates];
                        copy[idx].name = e.target.value;
                        setAddTeammates(copy);
                      }}
                      className="text-xs py-1.5 bg-white"
                    />
                    <Input
                      placeholder="IEEE Member ID"
                      value={mate.ieee_id}
                      onChange={(e) => {
                        const copy = [...addTeammates];
                        copy[idx].ieee_id = e.target.value.replace(/\D/g, '');
                        setAddTeammates(copy);
                      }}
                      className="text-xs py-1.5 bg-white"
                    />
                    <Input
                      placeholder="Email Address"
                      value={mate.email}
                      onChange={(e) => {
                        const copy = [...addTeammates];
                        copy[idx].email = e.target.value;
                        setAddTeammates(copy);
                      }}
                      className="text-xs py-1.5 bg-white"
                    />
                    <Input
                      placeholder="Phone"
                      value={mate.phone}
                      onChange={(e) => {
                        const copy = [...addTeammates];
                        copy[idx].phone = e.target.value;
                        setAddTeammates(copy);
                      }}
                      className="text-xs py-1.5 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Admin notes */}
            <Field label="Admin Notes (Internal)" htmlFor="add_notes">
              <textarea
                id="add_notes"
                rows={2}
                placeholder="Lab allocation notes, hardware requests..."
                value={addAdminNote}
                onChange={(e) => setAddAdminNote(e.target.value)}
                className="input text-xs py-2 w-full"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  setShowAddTeamModal(false);
                  resetAddTeamForm();
                }}
                className="btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingAddTeam || !addTeamName.trim() || !addLeadName.trim() || !addLeadEmail.trim() || !addLeadIeeeId.trim()}
                className="btn btn-primary text-xs font-bold"
              >
                {savingAddTeam ? <Spinner className="h-3.5 w-3.5" /> : 'Create Squad'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* BULK IMPORT SQUADS MODAL */}
      {showBulkTeamsModal && (
        <Modal
          title="Bulk Import Squads (CSV)"
          onClose={() => {
            setShowBulkTeamsModal(false);
            setBulkMessage(null);
          }}
          wide
        >
          <form onSubmit={handleBulkImportTeams} className="space-y-4 text-xs">
            {bulkMessage && (
              <div className="space-y-2">
                <Alert tone={bulkMessage.tone}>{bulkMessage.text}</Alert>
                {bulkMessage.details && (
                  <div className="max-h-32 overflow-y-auto rounded-xl bg-red-50 p-3 text-[11px] text-red-800 space-y-1">
                    {bulkMessage.details.map((d, i) => (
                      <p key={i}>• {d}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-muted leading-relaxed">
              Upload a wide-format CSV file to bulk-create squads. Unclaimed squads will be linked automatically when each team lead signs in.
            </p>

            <div className="rounded-xl bg-paper p-3 text-[11px] text-ink-soft space-y-1">
              <p className="font-semibold text-ink">Expected format (header row optional):</p>
              <code className="block bg-white p-2 rounded border border-line font-mono text-[10px] overflow-x-auto whitespace-pre">
                team_name, lead_name, lead_phone, lead_email, lead_ieee_id, proctor_ieee_id, mate1_name, mate1_phone, mate1_email, mate1_ieee_id, mate2_name, mate2_phone, mate2_email, mate2_ieee_id{'\n'}
                BitShifters, Rohan Sharma, +919845012345, rohan@bmsce.ac.in, 98451201, 102196859, Diya Iyer, +919845012346, diya@bmsce.ac.in, 98451202, , , ,
              </code>
            </div>

            <FileDrop
              id="bulk_teams_file_drop"
              file={bulkFile}
              onChange={(f) => setBulkFile(f)}
              label="Choose CSV file"
            />

            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1">
                Or paste CSV text directly:
              </label>
              <textarea
                rows={4}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="BitShifters, Rohan Sharma, 9845012345, rohan@bmsce.ac.in, 98451201, 102196859..."
                className="input font-mono text-[11px] py-2 w-full"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  setShowBulkTeamsModal(false);
                  setBulkMessage(null);
                }}
                className="btn btn-ghost text-xs"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={bulkUploading || (!bulkFile && !bulkText.trim())}
                className="btn btn-primary text-xs font-bold"
              >
                {bulkUploading ? <Spinner className="h-3.5 w-3.5" /> : 'Import Squads'}
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
