import { getAdminServiceClient, jsonError, requireAdmin } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import { addLocalKnownMembers, type KnownMember } from '@/lib/xtreme';

export const runtime = 'nodejs';

function parseCSV(content: string): KnownMember[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const results: KnownMember[] = [];
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('member') || header.includes('ieee') || header.includes('id') || header.includes('name');
  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const row = lines[i];
    // Split by comma or tab, taking into account basic quoting
    const parts = row.split(/[,;\t]/).map((p) => p.replace(/^["']|["']$/g, '').trim());
    if (parts.length >= 1) {
      const ieeeId = parts[0];
      if (/^\d{5,15}$/.test(ieeeId)) {
        results.push({
          ieee_member_id: ieeeId,
          name: parts[1] || undefined,
          email: parts[2] || undefined,
          source: 'legacy_upload',
        });
      }
    }
  }

  return results;
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin sign-in required.', 401);
  }

  let textContent = '';
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return jsonError('No file provided.', 400);
    }
    textContent = await (file as File).text();
  } else {
    const body = await request.json().catch(() => null);
    textContent = typeof body?.csv === 'string' ? body.csv : '';
  }

  if (!textContent.trim()) {
    return jsonError('CSV content is empty.', 400);
  }

  const members = parseCSV(textContent);
  if (members.length === 0) {
    return jsonError('No valid IEEE member records found. Please ensure the CSV contains numeric Member Numbers in the first column.', 400);
  }

  if (!isSupabaseConfigured()) {
    addLocalKnownMembers(members);
    return Response.json({ success: true, count: members.length, demo: true });
  }

  try {
    const client = getAdminServiceClient();

    // Chunk into batches of 100 for efficient upsert
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize);
      const { error } = await client
        .from('ieee_member_2026')
        .upsert(
          batch.map((m) => ({
            ieee_member_id: m.ieee_member_id,
            name: m.name || null,
            email: m.email || null,
            source: 'legacy_upload',
            created_at: new Date().toISOString(),
          })),
          { onConflict: 'ieee_member_id' }
        );

      if (error) throw error;
      insertedCount += batch.length;
    }

    return Response.json({
      success: true,
      count: insertedCount,
      message: `Successfully processed ${insertedCount} member records.`,
    });
  } catch (err) {
    console.error('Member CSV upload failed:', err);
    return jsonError('Failed to import member records into database.', 500);
  }
}

