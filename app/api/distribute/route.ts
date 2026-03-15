import { NextResponse } from 'next/server';
import { getPrivyClient } from '@/lib/privy';
import { executeDistribution } from '@/lib/hedera';
import { getProjects } from '@/lib/projectsDb';

const DEFAULT_DISTRIBUTION_AMOUNT = 136880;

export async function POST(req: Request) {
  try {
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const privy = getPrivyClient();
    const verifiedClaims = await privy.verifyAuthToken(authToken);
    const userId = (verifiedClaims as { userId?: string }).userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let amountUsd: number | undefined;
    try {
      const body = await req.json();
      if (typeof body?.amountUsd === 'number' && Number.isFinite(body.amountUsd)) {
        amountUsd = body.amountUsd;
      }
    } catch {
      // no body or invalid JSON
    }

    const creatorProjects = await getProjects({ creatorId: userId });
    const totalFunded = creatorProjects.reduce((sum, p) => sum + (p.amountRaised ?? 0), 0);

    if (totalFunded > 0) {
      if (amountUsd == null || amountUsd < totalFunded) {
        return NextResponse.json(
          {
            error: `Distribution amount cannot be lower than the amount funded by your community. Total funded: $${totalFunded.toLocaleString()}. Please distribute at least $${totalFunded.toLocaleString()}.`,
          },
          { status: 400 }
        );
      }
    }

    const { status, transactionId } = await executeDistribution(DEFAULT_DISTRIBUTION_AMOUNT);

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