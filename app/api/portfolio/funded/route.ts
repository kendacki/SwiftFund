import { NextResponse } from 'next/server';
import { getPrivyClient } from '@/lib/privy';

/**
 * Returns the list of creators/projects the authenticated user has funded
 * (for the "Claim yield" list on the portfolio page).
 * TODO: Populate from CreatorFunded events or DB when tracking is implemented.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ projects: [] });
    }
    const privy = getPrivyClient();
    await privy.verifyAuthToken(token);
    // Return empty list until we track fundings (e.g. from CreatorFunded events or API).
    return NextResponse.json({ projects: [] });
  } catch {
    return NextResponse.json({ projects: [] });
  }
}
