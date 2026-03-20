'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Initialize the Master Key Client (Bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateProjectStatus(
  projectId: string,
  newStatus: 'approved' | 'rejected'
) {
  // Execute the database update
  const { data, error } = await supabaseAdmin
    .from('projects')
    .update({ status: newStatus })
    .eq('id', projectId)
    .select();

  if (error) {
    console.error('🚨 SUPABASE ADMIN ERROR:', error.message);
    return { success: false, error: error.message };
  }

  // 🔴 CRITICAL: The Cache Clearer
  // Next.js heavily caches pages. If we don't do this, the Discover page won't show the new project.
  revalidatePath('/discover');
  revalidatePath('/admin'); // Assuming your admin queue is here

  return { success: true, data };
}
