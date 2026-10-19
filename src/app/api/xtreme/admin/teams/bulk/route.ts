import { getAdminServiceClient, jsonError, requireAdmin } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getLocalXtremeProctors, getLocalXtremeTeams, saveLocalXtremeTeam, type XtremeMember, type XtremeTeam } from '@/lib/xtreme';

export const runtime = 'nodejs';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin access required.', 403);
  }

  let csvContent = '';
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData().catch(() => null);
    const file = formData?.get('file');
    if (file && typeof file === 'object' && 'text' in file) {
      csvContent = await file.text();
    }
  } else {
    const body = await request.json().catch(() => null);
    csvContent = typeof body?.csv === 'string' ? body.csv : '';
  }

  if (!csvContent.trim()) {
    return jsonError('No CSV content provided.', 400);
  }

  const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return jsonError('Empty CSV content.', 400);
  }

  // Detect header row
  const firstLineCols = parseCSVLine(lines[0]);
  const hasHeader = firstLineCols.some((col) => /team|lead|member|ieee/i.test(col));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  if (dataLines.length === 0) {
    return jsonError('No data rows found in CSV.', 400);
  }

  const results: { teamName: string; status: 'created' | 'error'; error?: string }[] = [];
  let successCount = 0;

  // Handle demo mode
  if (!isSupabaseConfigured()) {
    const localTeams = getLocalXtremeTeams();
    const localProctors = getLocalXtremeProctors();

    for (let i = 0; i < dataLines.length; i++) {
      const rowIdx = hasHeader ? i + 2 : i + 1;
      const cols = parseCSVLine(dataLines[i]);
      if (cols.length < 5) {
        results.push({ teamName: cols[0] || `Row ${rowIdx}`, status: 'error', error: `Row ${rowIdx}: Insufficient columns.` });
        continue;
      }

      const [teamName, leadName, leadPhone, leadEmail, leadIeeeId, proctorIeeeId, mate1Name, mate1Phone, mate1Email, mate1IeeeId, mate2Name, mate2Phone, mate2Email, mate2IeeeId] = cols;

      if (!/^[a-zA-Z0-9]{3,20}$/.test(teamName || '')) {
        results.push({ teamName: teamName || `Row ${rowIdx}`, status: 'error', error: `Row ${rowIdx}: Invalid team name "${teamName}". Must be 3-20 alphanumeric characters.` });
        continue;
      }

      if (localTeams.some((t) => t.team_name.toLowerCase() === teamName.toLowerCase())) {
        results.push({ teamName, status: 'error', error: `Row ${rowIdx}: Team "${teamName}" already exists.` });
        continue;
      }

      // Proctor lookup
      let procId: string | null = null;
      let procName = '';
      let procIeee = '';
      if (proctorIeeeId?.trim()) {
        const found = localProctors.find((p) => p.ieee_id === proctorIeeeId.trim());
        if (found) {
          procId = found.id;
          procName = found.name;
          procIeee = found.ieee_id;
        }
      }

      const teamId = `team-bulk-demo-${Date.now()}-${i}`;
      const members: XtremeMember[] = [
        {
          id: `mem-${teamId}-lead`,
          team_id: teamId,
          is_lead: true,
          ieee_member_id: leadIeeeId?.trim() || '',
          first_name: leadName?.split(' ')[0] || leadName || '',
          last_name: leadName?.split(' ').slice(1).join(' ') || '',
          email: leadEmail?.trim().toLowerCase() || '',
          phone: leadPhone?.trim() || '',
        },
      ];

      if (mate1Name?.trim() && mate1IeeeId?.trim()) {
        members.push({
          id: `mem-${teamId}-1`,
          team_id: teamId,
          is_lead: false,
          ieee_member_id: mate1IeeeId.trim(),
          first_name: mate1Name.split(' ')[0] || mate1Name,
          last_name: mate1Name.split(' ').slice(1).join(' '),
          email: mate1Email?.trim().toLowerCase() || '',
          phone: mate1Phone?.trim() || '',
        });
      }

      if (mate2Name?.trim() && mate2IeeeId?.trim()) {
        members.push({
          id: `mem-${teamId}-2`,
          team_id: teamId,
          is_lead: false,
          ieee_member_id: mate2IeeeId.trim(),
          first_name: mate2Name.split(' ')[0] || mate2Name,
          last_name: mate2Name.split(' ').slice(1).join(' '),
          email: mate2Email?.trim().toLowerCase() || '',
          phone: mate2Phone?.trim() || '',
        });
      }

      const newTeam: XtremeTeam = {
        id: teamId,
        team_name: teamName,
        lead_user_id: null,
        leader_email: leadEmail?.trim().toLowerCase(),
        proctor_id: procId,
        proctor_name: procName,
        proctor_ieee_id: procIeee,
        vtools_verified: false,
        created_at: new Date().toISOString(),
        members,
      };

      saveLocalXtremeTeam(newTeam);
      successCount++;
      results.push({ teamName, status: 'created' });
    }

    return Response.json({
      success: true,
      count: successCount,
      total: dataLines.length,
      results,
      demo: true,
    });
  }

  // Supabase implementation
  try {
    const client = getAdminServiceClient();

    // Cache existing proctors
    const { data: allProctors } = await client
      .from('xtreme_proctors')
      .select('id, name, ieee_id');

    const proctorsByIeee = new Map<string, { id: string; name: string; ieee_id: string }>();
    for (const p of allProctors || []) {
      proctorsByIeee.set(p.ieee_id, p);
    }

    for (let i = 0; i < dataLines.length; i++) {
      const rowIdx = hasHeader ? i + 2 : i + 1;
      const cols = parseCSVLine(dataLines[i]);
      if (cols.length < 5) {
        results.push({
          teamName: cols[0] || `Row ${rowIdx}`,
          status: 'error',
          error: `Row ${rowIdx}: Insufficient columns (must have at least team_name, lead_name, lead_phone, lead_email, lead_ieee_id).`,
        });
        continue;
      }

      const [
        teamName,
        leadName,
        leadPhone,
        leadEmail,
        leadIeeeId,
        proctorIeeeId,
        mate1Name,
        mate1Phone,
        mate1Email,
        mate1IeeeId,
        mate2Name,
        mate2Phone,
        mate2Email,
        mate2IeeeId,
      ] = cols.map((c) => c?.trim() || '');

      // Validations
      if (!teamName || !/^[a-zA-Z0-9]{3,20}$/.test(teamName)) {
        results.push({ teamName: teamName || `Row ${rowIdx}`, status: 'error', error: `Row ${rowIdx}: Invalid team name "${teamName}". Must be 3-20 alphanumeric characters.` });
        continue;
      }

      if (!leadName || !leadEmail || !leadEmail.includes('@') || !leadIeeeId) {
        results.push({ teamName, status: 'error', error: `Row ${rowIdx}: Incomplete lead details for team "${teamName}".` });
        continue;
      }

      // Check team name in DB
      const { data: existingTeam } = await client
        .from('xtreme_teams')
        .select('id')
        .ilike('team_name', teamName)
        .maybeSingle();

      if (existingTeam) {
        results.push({ teamName, status: 'error', error: `Row ${rowIdx}: Team "${teamName}" already exists.` });
        continue;
      }

      // Check if lead IEEE ID already in another team
      const { data: existingLeadMem } = await client
        .from('xtreme_members')
        .select('team_id')
        .eq('ieee_member_id', leadIeeeId)
        .maybeSingle();

      if (existingLeadMem) {
        results.push({ teamName, status: 'error', error: `Row ${rowIdx}: Leader IEEE ID "${leadIeeeId}" already registered in another team.` });
        continue;
      }

      // Insert team
      const { data: createdTeam, error: teamErr } = await client
        .from('xtreme_teams')
        .insert({
          team_name: teamName,
          lead_user_id: null,
          leader_email: leadEmail.toLowerCase(),
          vtools_verified: false,
        })
        .select('id')
        .single();

      if (teamErr || !createdTeam) {
        results.push({ teamName, status: 'error', error: `Row ${rowIdx}: Failed to create team row.` });
        continue;
      }

      // Members to insert
      const membersToInsert = [
        {
          team_id: createdTeam.id,
          is_lead: true,
          ieee_member_id: leadIeeeId,
          first_name: leadName.split(' ')[0] || leadName,
          last_name: leadName.split(' ').slice(1).join(' '),
          email: leadEmail.toLowerCase(),
          phone: leadPhone,
        },
      ];

      if (mate1Name && mate1IeeeId) {
        membersToInsert.push({
          team_id: createdTeam.id,
          is_lead: false,
          ieee_member_id: mate1IeeeId,
          first_name: mate1Name.split(' ')[0] || mate1Name,
          last_name: mate1Name.split(' ').slice(1).join(' '),
          email: mate1Email ? mate1Email.toLowerCase() : '',
          phone: mate1Phone,
        });
      }

      if (mate2Name && mate2IeeeId) {
        membersToInsert.push({
          team_id: createdTeam.id,
          is_lead: false,
          ieee_member_id: mate2IeeeId,
          first_name: mate2Name.split(' ')[0] || mate2Name,
          last_name: mate2Name.split(' ').slice(1).join(' '),
          email: mate2Email ? mate2Email.toLowerCase() : '',
          phone: mate2Phone,
        });
      }

      const { error: memErr } = await client
        .from('xtreme_members')
        .insert(membersToInsert);

      if (memErr) {
        await client.from('xtreme_teams').delete().eq('id', createdTeam.id);
        results.push({ teamName, status: 'error', error: `Row ${rowIdx}: Failed to create members: ${memErr.message}` });
        continue;
      }

      // Proctor assignment
      if (proctorIeeeId) {
        const proc = proctorsByIeee.get(proctorIeeeId);
        if (proc) {
          const { error: pErr } = await client.rpc('assign_proctor_to_team', {
            p_team_id: createdTeam.id,
            p_proctor_id: proc.id,
          });
          if (pErr) {
            console.warn(`Bulk import: proctor assign warning for ${teamName}:`, pErr.message);
          }
        }
      }

      successCount++;
      results.push({ teamName, status: 'created' });
    }

    return Response.json({
      success: true,
      count: successCount,
      total: dataLines.length,
      results,
    });
  } catch (err) {
    console.error('Bulk import error:', err);
    return jsonError('Internal server error during bulk import.', 500);
  }
}

