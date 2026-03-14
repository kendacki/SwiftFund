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
  } catch (error: any) {
    console.error('Smart contract execution or verification failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}