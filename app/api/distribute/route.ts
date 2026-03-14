import { NextResponse } from 'next/server';
import { getPrivyClient } from '@/lib/privy';
import { executeDistribution } from '@/lib/hedera';

export async function POST(req: Request) {
  try {
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const privy = getPrivyClient();
    const verifiedClaims = await privy.verifyAuthToken(authToken);
    console.log('Verified user ID:', verifiedClaims.userId);

    // For now, use a fixed per-fan amount as in the prototype.
    const { status, transactionId } = await executeDistribution(136880);

    return NextResponse.json({
      success: true,
      status,
      transactionId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Smart contract execution or verification failed';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}