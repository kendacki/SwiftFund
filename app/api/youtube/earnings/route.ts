import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { google } from 'googleapis';
import { getPrivyClient } from '@/lib/privy';
import { updateYoutubeMetricsForCreator } from '@/lib/projectsDb';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function getAuthUserId(req: Request): Promise<string | null> {
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!authToken) return null;
  return getPrivyClient()
    .verifyAuthToken(authToken)
    .then((claims) => (claims as { userId?: string }).userId ?? null)
    .catch(() => null);
}

export async function GET(req: Request) {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Google OAuth env vars missing');
      return NextResponse.json(
        { error: 'Google OAuth is not configured.' },
        { status: 500 }
      );
    }

    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenCookie = cookies().get('yt_tokens');
    if (!tokenCookie?.value) {
      return NextResponse.json(
        { error: 'YouTube account not linked.' },
        { status: 401 }
      );
    }

    let parsed: {
      access_token: string | null;
      refresh_token: string | null;
      expiry_date: number | null;
    };

    try {
      parsed = JSON.parse(tokenCookie.value);
    } catch {
      return NextResponse.json(
        { error: 'Invalid YouTube token data.' },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    oauth2Client.setCredentials({
      access_token: parsed.access_token ?? undefined,
      refresh_token: parsed.refresh_token ?? undefined,
      expiry_date: parsed.expiry_date ?? undefined,
    });

    const youtubeAnalytics = google.youtubeAnalytics('v2');

    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const res = await youtubeAnalytics.reports.query({
      auth: oauth2Client,
      ids: 'channel==MINE',
      startDate: formatDate(start),
      endDate: formatDate(end),
      metrics: 'estimatedRevenue,views',
    });

    const rows = res.data.rows ?? [];
    let revenue = 0;
    let views = 0;

    if (rows.length > 0) {
      const [rev, v] = rows[0];
      revenue = typeof rev === 'number' ? rev : Number(rev) || 0;
      views = typeof v === 'number' ? v : Number(v) || 0;
    }

    // Persist metrics for all projects owned by this creator.
    await updateYoutubeMetricsForCreator(userId, {
      revenue,
      views,
      linked: true,
    });

    return NextResponse.json({ revenue, views });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to load YouTube earnings.';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

