import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPrivyClient } from '@/lib/privy';

const AVATAR_PREFIX = 'avatars/';
// Your Supabase project cover images bucket is already `project-images`.
// If the separate `avatars` bucket doesn't exist, this prevents "Bucket not found".
const AVATAR_BUCKET = 'project-images';
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel serverless limit)

function getAuthUserId(req: Request): Promise<string | null> {
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!authToken) return Promise.resolve(null);
  return getPrivyClient()
    .verifyAuthToken(authToken)
    .then((claims) => (claims as { userId?: string }).userId ?? null)
    .catch(() => null);
}

export async function GET(req: Request) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const filePath = `${AVATAR_PREFIX}${userId}.jpg`;

    // Ensure the file exists (download will 404 if missing).
    const { error: downloadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .download(filePath);

    if (downloadError) {
      return NextResponse.json({ url: null }, { status: 200 });
    }

    const { data: publicUrlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrlData?.publicUrl ?? null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get avatar';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const formData = await req.formData();
    const file = formData.get('file') ?? formData.get('avatar');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 4 MB)' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Keep a deterministic file name so the avatar URL stays stable.
    const filePath = `${AVATAR_PREFIX}${userId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      console.error('🚨 SUPABASE AVATAR UPLOAD FAILED.');
      console.error('Error Message:', uploadError?.message);
      console.error('Error Name:', (uploadError as any)?.name);
      console.error(`Target Bucket: '${AVATAR_BUCKET}' (Verify this exists in Supabase)`);
      throw new Error(`Avatar upload failed: ${uploadError?.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrlData?.publicUrl ?? null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upload avatar';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
