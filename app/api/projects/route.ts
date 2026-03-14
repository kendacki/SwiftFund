import { NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';
import { getPrivyClient } from '@/lib/privy';
import type { Project, ProjectStatus } from '@/lib/projects';

const PROJECTS_DATA_PATH = 'projects/data.json';
const PROJECTS_IMAGE_PREFIX = 'projects/images/';
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4 MB

function ensureBlobToken(): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set.');
  }
}

async function getAuthUserId(req: Request): Promise<string | null> {
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!authToken) return null;
  return getPrivyClient()
    .verifyAuthToken(authToken)
    .then((claims) => (claims as { userId?: string }).userId ?? null)
    .catch(() => null);
}

async function loadProjects(): Promise<Project[]> {
  try {
    const { blobs } = await list({ prefix: 'projects/', limit: 10 });
    const dataBlob = blobs.find((b) => b.pathname === PROJECTS_DATA_PATH);
    if (!dataBlob?.url) return [];
    const res = await fetch(dataBlob.url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.projects) ? data.projects : [];
  } catch {
    return [];
  }
}

async function saveProjects(projects: Project[]): Promise<void> {
  await put(PROJECTS_DATA_PATH, JSON.stringify({ projects }), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function GET(req: Request) {
  try {
    ensureBlobToken();
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get('mine') === '1';
    const discover = searchParams.get('discover') === '1';
    const userId = mine ? await getAuthUserId(req) : null;

    const projects = await loadProjects();

    if (discover) {
      const approved = projects.filter((p) => p.status === 'approved');
      return NextResponse.json({ projects: approved });
    }
    if (mine && userId) {
      const myProjects = projects.filter((p) => p.creatorId === userId);
      return NextResponse.json({ projects: myProjects });
    }

    return NextResponse.json({ projects: [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load projects';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    ensureBlobToken();
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const title = (formData.get('title') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    const creatorName = (formData.get('creatorName') as string)?.trim();
    const handle = (formData.get('handle') as string)?.trim();
    const goalAmount = Number(formData.get('goalAmount'));
    const status = ((formData.get('status') as string) || 'pending') as ProjectStatus;
    const imageFile = formData.get('image') as File | null;

    if (!title || !creatorName || !handle) {
      return NextResponse.json(
        { error: 'Title, creator name, and handle are required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(goalAmount) || goalAmount <= 0) {
      return NextResponse.json({ error: 'Goal amount must be a positive number' }, { status: 400 });
    }

    const projects = await loadProjects();
    const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();

    let imageUrl = '';
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      if (imageFile.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Image too large (max 4 MB)' }, { status: 400 });
      }
      const blob = await put(`${PROJECTS_IMAGE_PREFIX}${id}.jpg`, imageFile, {
        access: 'public',
        contentType: imageFile.type || 'image/jpeg',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      imageUrl = blob.url;
    }

    const newProject: Project = {
      id,
      creatorId: userId,
      creatorName,
      handle: handle.startsWith('@') ? handle : `@${handle}`,
      title,
      description: description || '',
      goalAmount,
      amountRaised: 0,
      imageUrl: imageUrl || '',
      status: imageUrl ? status : 'draft',
      createdAt: now,
      updatedAt: now,
      tags: ['all'],
    };

    projects.push(newProject);
    await saveProjects(projects);

    return NextResponse.json({ project: newProject });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create project';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    ensureBlobToken();
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    const status = body?.status as ProjectStatus | undefined;
    if (!id || !status || !['draft', 'pending', 'processing', 'approved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 });
    }

    const projects = await loadProjects();
    const index = projects.findIndex((p) => p.id === id && p.creatorId === userId);
    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (status === 'pending' && !projects[index].imageUrl) {
      return NextResponse.json(
        { error: 'Upload an image before submitting for approval' },
        { status: 400 }
      );
    }

    projects[index].status = status;
    projects[index].updatedAt = new Date().toISOString();
    await saveProjects(projects);

    return NextResponse.json({ project: projects[index] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update project';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
