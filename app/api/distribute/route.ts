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
    const raw = error instanceof Error ? error.message : 'Smart contract execution or verification failed';
    const isContractRevert =
      raw.includes('CONTRACT_REVERT_EXECUTED') ||
      raw.includes('contained error status') ||
      raw.includes('REVERT');
    const userMessage = isContractRevert
      ? 'The distribution was reverted by the contract. The treasury may have insufficient balance, or the contract conditions were not met. Please check your treasury balance and try again.'
      : raw.includes('Unauthorized') || raw.includes('verification failed')
        ? 'Please log in again and try again.'
        : raw.includes('TREASURY_CONTRACT_ID') || raw.includes('not set')
          ? 'Service is not fully configured. Please try again later.'
          : raw;
    console.error(raw);
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}