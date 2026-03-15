import { NextResponse } from 'next/server';
import { updateProjectStatus, getProjectById } from '@/lib/projectsDb';

const APPROVER_SECRET = process.env.APPROVER_SECRET?.trim();

/** POST: Approve a project (or set to processing). Requires approver secret. Body: { projectId: string, status?: 'approved' | 'processing' }. */
export async function POST(req: Request) {
  if (!APPROVER_SECRET) {
    return NextResponse.json(
      { error: 'Approval not configured. Set APPROVER_SECRET in the environment.' },
      { status: 503 }
    );
  }
  const secret = req.headers.get('x-approver-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== APPROVER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const projectId = (body?.projectId ?? body?.id) as string;
    const status = (body?.status === 'processing' ? 'processing' : 'approved') as 'approved' | 'processing';
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId or id is required' }, { status: 400 });
    }

    const existing = await getProjectById(projectId);
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updated = await updateProjectStatus(projectId, status);
    if (!updated) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
    return NextResponse.json({ success: true, project: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to approve project';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
