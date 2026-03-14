import { NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';
import { getPrivyClient } from '@/lib/privy';

const AVATAR_PREFIX = 'avatars/';
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
    const { blobs } = await list({ prefix: AVATAR_PREFIX, limit: 500 });
    const pathname = `${AVATAR_PREFIX}${userId}.jpg`;
    const blob = blobs.find((b) => b.pathname === pathname);
    if (!blob?.url) {
      return NextResponse.json({ url: null }, { status: 200 });
    }
    return NextResponse.json({ url: blob.url });
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
    const pathname = `${AVATAR_PREFIX}${userId}.jpg`;
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type || 'image/jpeg',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upload avatar';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
