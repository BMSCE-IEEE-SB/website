import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials in environment.');
  process.exit(1);
}

const client = createClient(url, key, { auth: { persistSession: false } });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve(process.cwd(), `backups/backup_${timestamp}`);
fs.mkdirSync(backupDir, { recursive: true });

const tables = [
  'profiles',
  'orders',
  'order_items',
  'chapters',
  'membership_config',
  'admins',
  'admin_whitelist',
  'admin_audit_log',
  'issued_receipts',
  'receipt_counters',
  'announcement',
  'events',
  'checkout_intents',
  'xtreme_teams',
  'xtreme_members',
  'xtreme_proctors',
  'ieee_member_2026',
];

async function runBackup() {
  console.log(`Starting full database export to: ${backupDir}`);
  const summary = {};

  for (const table of tables) {
    try {
      const { data, count, error } = await client
        .from(table)
        .select('*', { count: 'exact' });

      if (error) {
        console.warn(`[SKIP] Table "${table}" error:`, error.message);
        summary[table] = { status: 'error', error: error.message };
        continue;
      }

      const filePath = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data || [], null, 2), 'utf8');
      console.log(`[OK] Exported "${table}": ${(data || []).length} rows`);
      summary[table] = { status: 'ok', count: (data || []).length };
    } catch (err) {
      console.warn(`[FAIL] Table "${table}":`, err.message);
      summary[table] = { status: 'fail', error: err.message };
    }
  }

  // Backup auth users
  try {
    const { data: userData, error: userError } = await client.auth.admin.listUsers();
    if (userError) {
      console.warn('[SKIP] Auth users error:', userError.message);
      summary['auth_users'] = { status: 'error', error: userError.message };
    } else {
      const sanitizedUsers = (userData?.users || []).map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        user_metadata: u.user_metadata,
        app_metadata: u.app_metadata,
      }));
      fs.writeFileSync(
        path.join(backupDir, 'auth_users.json'),
        JSON.stringify(sanitizedUsers, null, 2),
        'utf8'
      );
      console.log(`[OK] Exported "auth.users": ${sanitizedUsers.length} accounts`);
      summary['auth_users'] = { status: 'ok', count: sanitizedUsers.length };
    }
  } catch (err) {
    console.warn('[FAIL] Auth users:', err.message);
  }

  fs.writeFileSync(
    path.join(backupDir, 'summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  console.log('\nBackup completed successfully!');
  console.log(`Summary written to: ${path.join(backupDir, 'summary.json')}`);
}

runBackup();
