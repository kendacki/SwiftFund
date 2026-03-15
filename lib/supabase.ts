import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceRoleKey) {
  console.warn('Supabase URL or service role key missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

/** Server-side Supabase client with service role. Use in API routes only. */
export function getSupabase() {
  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
