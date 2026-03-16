import { NextResponse } from 'next/server';
import { getPrivyClient } from '@/lib/privy';
import { getProjects } from '@/lib/projectsDb';

const ADMIN_EMAIL = 'brodymatthewa@gmail.com';

async function getAuthEmail(req: Request): Promise<string | null> {
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!authToken) return null;
  return getPrivyClient()
    .verifyAuthToken(authToken)
    .then((claims) => (claims as { email?: string }).email ?? null)
    .catch(() => null);
}

export async function GET(req: Request) {
  try {
    const email = await getAuthEmail(req);
    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const projects = await getProjects();
    return NextResponse.json({ projects });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to load admin projects';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

