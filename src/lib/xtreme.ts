export interface XtremeMember {
  id?: string;
  team_id?: string;
  is_lead: boolean;
  ieee_member_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  usn?: string;
  department?: string;
  year_of_study?: string;
  created_at?: string;
}

export interface XtremeProctor {
  id: string;
  name: string;
  ieee_id: string;
  created_at: string;
  assigned_count?: number;
}

export interface XtremeTeam {
  id: string;
  team_name: string;
  lead_user_id: string | null;
  leader_email?: string;
  proctor_id?: string | null;
  vtools_verified: boolean;
  proctor_name?: string;
  proctor_ieee_id?: string;
  admin_note?: string;
  created_at: string;
  updated_at?: string;
  members: XtremeMember[];
}

export interface KnownMember {
  ieee_member_id: string;
  name?: string;
  email?: string;
  source: 'legacy_upload' | 'active_member';
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Demo Mode / LocalStorage Storage
// ---------------------------------------------------------------------------

const DUMMY_TEAMS_KEY = 'bmsce_dummy_xtreme_teams_v1';
const DUMMY_KNOWN_MEMBERS_KEY = 'bmsce_dummy_xtreme_known_v1';
const DUMMY_PROCTORS_KEY = 'bmsce_dummy_xtreme_proctors_v1';

const isBrowser = () => typeof window !== 'undefined';

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage write error', err);
  }
}

export const SAMPLE_XTREME_PROCTORS: XtremeProctor[] = [
  {
    id: 'proc-demo-1',
    name: 'Dr. Ramesh Kumar',
    ieee_id: '90451234',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'proc-demo-2',
    name: 'Prof. Anitha Rao',
    ieee_id: '90455678',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export const SAMPLE_XTREME_TEAMS: XtremeTeam[] = [
  {
    id: 'xtreme-team-demo-1',
    team_name: 'BitShiftBMSCE',
    lead_user_id: 'demo-usr-lead1',
    leader_email: 'rohan.cs23@bmsce.ac.in',
    proctor_id: 'proc-demo-1',
    vtools_verified: true,
    proctor_name: 'Dr. Ramesh Kumar',
    proctor_ieee_id: '90451234',
    admin_note: 'Proctor verified and venue assigned.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    members: [
      {
        id: 'mem-1-1',
        is_lead: true,
        ieee_member_id: '98451201',
        first_name: 'Rohan',
        last_name: 'Sharma',
        email: 'rohan.cs23@bmsce.ac.in',
        phone: '+91 9845012345',
        usn: '1BM23CS140',
        department: 'CSE',
        year_of_study: '3',
      },
      {
        id: 'mem-1-2',
        is_lead: false,
        ieee_member_id: '98451202',
        first_name: 'Diya',
        last_name: 'Iyer',
        email: 'diya.is23@bmsce.ac.in',
        phone: '+91 9845012346',
        usn: '1BM23IS045',
        department: 'ISE',
        year_of_study: '3',
      },
      {
        id: 'mem-1-3',
        is_lead: false,
        ieee_member_id: '98451203',
        first_name: 'Aditya',
        last_name: 'Rao',
        email: 'aditya.ai24@bmsce.ac.in',
        phone: '+91 9845012347',
        usn: '1BM24AI012',
        department: 'AIML',
        year_of_study: '2',
      },
    ],
  },
  {
    id: 'xtreme-team-demo-2',
    team_name: 'AlgoTitans',
    lead_user_id: 'demo-usr-lead2',
    leader_email: 'pooja.ec24@bmsce.ac.in',
    proctor_id: '',
    vtools_verified: false,
    proctor_name: '',
    proctor_ieee_id: '',
    admin_note: 'Pending vTools verification confirmation from participants.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    members: [
      {
        id: 'mem-2-1',
        is_lead: true,
        ieee_member_id: '98451204',
        first_name: 'Pooja',
        last_name: 'Kulkarni',
        email: 'pooja.ec24@bmsce.ac.in',
        phone: '+91 9741023456',
        usn: '1BM24EC098',
        department: 'ECE',
        year_of_study: '2',
      },
      {
        id: 'mem-2-2',
        is_lead: false,
        ieee_member_id: '98451205',
        first_name: 'Varun',
        last_name: 'Shetty',
        email: 'varun.ec24@bmsce.ac.in',
        phone: '+91 9741023457',
        usn: '1BM24EC120',
        department: 'ECE',
        year_of_study: '2',
      },
    ],
  },
];

export function getLocalXtremeProctors(): XtremeProctor[] {
  if (!isBrowser()) return [];
  if (localStorage.getItem(DUMMY_PROCTORS_KEY) === null) {
    writeJson(DUMMY_PROCTORS_KEY, SAMPLE_XTREME_PROCTORS);
  }
  const proctors = readJson<XtremeProctor[]>(DUMMY_PROCTORS_KEY, []);
  const teams = getLocalXtremeTeams();
  return proctors.map((p) => {
    const assigned_count = teams.filter(
      (t) => (t.proctor_id === p.id || t.proctor_ieee_id === p.ieee_id)
    ).length;
    return { ...p, assigned_count };
  });
}

export function saveLocalXtremeProctor(proctor: XtremeProctor) {
  const proctors = getLocalXtremeProctors();
  const idx = proctors.findIndex((p) => p.id === proctor.id || p.ieee_id === proctor.ieee_id);
  if (idx >= 0) {
    proctors[idx] = { ...proctors[idx], ...proctor };
  } else {
    proctors.push(proctor);
  }
  writeJson(DUMMY_PROCTORS_KEY, proctors);
}

export function deleteLocalXtremeProctor(id: string) {
  const proctors = getLocalXtremeProctors();
  const filtered = proctors.filter((p) => p.id !== id);
  writeJson(DUMMY_PROCTORS_KEY, filtered);

  // Clear proctor on assigned teams
  const teams = getLocalXtremeTeams();
  let changed = false;
  for (const t of teams) {
    if (t.proctor_id === id) {
      t.proctor_id = null;
      t.proctor_name = '';
      t.proctor_ieee_id = '';
      changed = true;
    }
  }
  if (changed) {
    writeJson(DUMMY_TEAMS_KEY, teams);
  }
}

export function getLocalXtremeTeams(): XtremeTeam[] {
  if (!isBrowser()) return [];
  if (localStorage.getItem(DUMMY_TEAMS_KEY) === null) {
    writeJson(DUMMY_TEAMS_KEY, SAMPLE_XTREME_TEAMS);
  }
  return readJson<XtremeTeam[]>(DUMMY_TEAMS_KEY, []);
}

export function getLocalTeamForUser(userId: string, userEmail?: string): XtremeTeam | null {
  const teams = getLocalXtremeTeams();
  // 1. Direct match by lead_user_id
  const directMatch = teams.find((t) => t.lead_user_id === userId);
  if (directMatch) return directMatch;

  // 2. If email is provided, auto-claim unclaimed team
  if (userEmail) {
    const cleanEmail = userEmail.trim().toLowerCase();
    const unclaimed = teams.find(
      (t) => !t.lead_user_id && t.leader_email && t.leader_email.toLowerCase() === cleanEmail
    );
    if (unclaimed) {
      unclaimed.lead_user_id = userId;
      unclaimed.updated_at = new Date().toISOString();
      writeJson(DUMMY_TEAMS_KEY, teams);
      return unclaimed;
    }
  }

  return null;
}

export function saveLocalXtremeTeam(team: XtremeTeam) {
  const teams = getLocalXtremeTeams();
  const idx = teams.findIndex((t) => t.id === team.id || (team.lead_user_id && t.lead_user_id === team.lead_user_id));
  if (idx >= 0) {
    teams[idx] = team;
  } else {
    teams.unshift(team);
  }
  writeJson(DUMMY_TEAMS_KEY, teams);
}

export function updateLocalXtremeTeam(id: string, patch: Partial<XtremeTeam>) {
  const teams = getLocalXtremeTeams();
  const updated = teams.map((t) => (t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t));
  writeJson(DUMMY_TEAMS_KEY, updated);
  return updated.find((t) => t.id === id) ?? null;
}

export function deleteLocalXtremeTeam(id: string) {
  const teams = getLocalXtremeTeams();
  const filtered = teams.filter((t) => t.id !== id);
  writeJson(DUMMY_TEAMS_KEY, filtered);
}

export function getLocalKnownMembers(): KnownMember[] {
  return readJson<KnownMember[]>(DUMMY_KNOWN_MEMBERS_KEY, [
    { ieee_member_id: '100650078', name: 'Ratik Agrawal', email: 'ratikagrawal.ec24@bmsce.ac.in', source: 'active_member' },
    { ieee_member_id: '98451201', name: 'Rohan Sharma', email: 'rohan.cs23@bmsce.ac.in', source: 'legacy_upload' },
    { ieee_member_id: '98451202', name: 'Diya Iyer', email: 'diya.is23@bmsce.ac.in', source: 'legacy_upload' },
    { ieee_member_id: '98451203', name: 'Aditya Rao', email: 'aditya.ai24@bmsce.ac.in', source: 'legacy_upload' },
    { ieee_member_id: '98451204', name: 'Pooja Kulkarni', email: 'pooja.ec24@bmsce.ac.in', source: 'legacy_upload' },
    { ieee_member_id: '98451205', name: 'Varun Shetty', email: 'varun.ec24@bmsce.ac.in', source: 'legacy_upload' },
  ]);
}

export function addLocalKnownMembers(members: KnownMember[]) {
  const existing = getLocalKnownMembers();
  const map = new Map<string, KnownMember>();
  for (const m of existing) map.set(m.ieee_member_id.trim(), m);
  for (const m of members) map.set(m.ieee_member_id.trim(), m);
  writeJson(DUMMY_KNOWN_MEMBERS_KEY, Array.from(map.values()));
}
