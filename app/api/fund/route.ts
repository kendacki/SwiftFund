import { NextResponse } from 'next/server';
import { getPrivyClient } from '@/lib/privy';
import { fundProject } from '@/lib/hedera';
import { loadProjectsFromStorage, saveProjectsToStorage } from '@/lib/projectsStorage';

export async function POST(req: Request) {
  try {
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const privy = getPrivyClient();
    await privy.verifyAuthToken(authToken);

    const body = await req.json();
    const projectId = typeof body?.projectId === 'string' ? body.projectId : '';
    const amount = Number(body?.amount);
    if (!projectId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid projectId or amount' },
        { status: 400 }
      );
    }

    const result = await fundProject(projectId, amount);

    try {
      const projects = await loadProjectsFromStorage();
      const index = projects.findIndex((p) => p.id === projectId);
      if (index !== -1) {
        projects[index].amountRaised = (projects[index].amountRaised ?? 0) + amount;
        projects[index].updatedAt = new Date().toISOString();
        await saveProjectsToStorage(projects);
      }
    } catch (e) {
      console.error('Failed to update project amountRaised:', e);
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      transactionId: result.transactionId,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Funding request failed';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
