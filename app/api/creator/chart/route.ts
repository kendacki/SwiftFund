import { NextResponse } from 'next/server';
import { getPrivyClient } from '@/lib/privy';
import { getChartData } from '@/lib/creatorActivityDb';
import { getProjects } from '@/lib/projectsDb';

async function getAuthUserId(req: Request): Promise<string | null> {
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!authToken) return null;
  return getPrivyClient()
    .verifyAuthToken(authToken)
    .then((claims) => (claims as { userId?: string }).userId ?? null)
    .catch(() => null);
}

/** GET: Chart data (cumulative funded / disbursed by date) for the authenticated creator. */
export async function GET(req: Request) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let points = await getChartData(userId);
    if (points.length === 0) {
      const projects = await getProjects({ creatorId: userId });
      const totalRaised = projects.reduce((sum, p) => sum + (p.amountRaised ?? 0), 0);
      if (totalRaised > 0) {
        const today = new Date().toISOString().slice(0, 10);
        points = [{ date: today, funded: totalRaised, disbursed: 0 }];
      }
    }
    return NextResponse.json({ points });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load chart data';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
