import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPrivyClient } from '@/lib/privy';
import { getProjects, insertProject, updateProjectStatus, getProjectById } from '@/lib/projectsDb';
import type { Project, ProjectStatus } from '@/lib/projects';

export const dynamic = 'force-dynamic';

const PROJECTS_DATA_PATH = 'projects/data.json';
const PROJECTS_IMAGE_PREFIX = 'projects/images/';
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4 MB
const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5 MB

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
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get('mine') === '1';
    const discover = searchParams.get('discover') === '1';
    const userId = mine ? await getAuthUserId(req) : null;

    if (discover) {
      const projects = await getProjects({ status: 'approved' });
      return NextResponse.json({ projects });
    }
    if (mine && userId) {
      const projects = await getProjects({ creatorId: userId });
      return NextResponse.json({ projects });
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
    const earningsPercent = Number(formData.get('earningsDistributionPercent'));
    const accountPdf = formData.get('accountPdf') as File | null;
    const accountInfoPdfUrlFromClient = (formData.get('accountInfoPdfUrl') as string | null)?.trim() || '';

    if (!title || !creatorName || !handle) {
      return NextResponse.json(
        { error: 'Title, creator name, and handle are required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(goalAmount) || goalAmount <= 0) {
      return NextResponse.json({ error: 'Goal amount must be a positive number' }, { status: 400 });
    }
    const safeEarningsPercent = Number.isFinite(earningsPercent) && earningsPercent >= 0 && earningsPercent <= 100
      ? Math.round(earningsPercent)
      : undefined;

    const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();

    let imageUrl = '';
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      if (imageFile.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Image too large (max 4 MB)' }, { status: 400 });
      }
      if (!supabase) {
        return NextResponse.json(
          { error: 'Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
          { status: 500 }
        );
      }

      // 1) Create a unique URL-safe file name
      const fileExt = imageFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      // 2) Upload the image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type || 'image/jpeg',
        });

      if (uploadError) {
        console.error('🚨 SUPABASE IMAGE UPLOAD ERROR:', uploadError);
        return NextResponse.json({ error: 'Failed to upload image to Supabase.' }, { status: 500 });
      }

      // 3) Extract the public URL
      const { data: publicUrlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrlData?.publicUrl ?? '';
    }

    let accountInfoPdfUrl = '';
    if (accountInfoPdfUrlFromClient) {
      accountInfoPdfUrl = accountInfoPdfUrlFromClient;
    } else if (accountPdf && accountPdf instanceof File && accountPdf.size > 0) {
      if (accountPdf.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Account document must be a PDF' }, { status: 400 });
      }
      if (accountPdf.size > MAX_PDF_SIZE) {
        return NextResponse.json({ error: 'PDF too large (max 5 MB)' }, { status: 400 });
      }

      if (!supabase) {
        return NextResponse.json(
          { error: 'Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
          { status: 500 }
        );
      }

      const filePath = `${userId}/${id}.pdf`;
      const bytes = new Uint8Array(await accountPdf.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from('pitch-decks')
        .upload(filePath, bytes, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload PDF to Supabase Storage' }, { status: 500 });
      }

      const { data } = supabase.storage.from('pitch-decks').getPublicUrl(filePath);
      accountInfoPdfUrl = data?.publicUrl ?? '';
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
      earningsDistributionPercent: safeEarningsPercent,
      accountInfoPdfUrl: accountInfoPdfUrl || undefined,
    };

    await insertProject(newProject);

    return NextResponse.json({ project: newProject });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create project';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
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

    const existing = await getProjectById(id);
    if (!existing || existing.creatorId !== userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (status === 'approved' || status === 'processing') {
      return NextResponse.json(
        { error: 'Only an approver can approve projects. Use the approve API with your approver secret.' },
        { status: 403 }
      );
    }

    if (status === 'pending' && !existing.imageUrl) {
      return NextResponse.json(
        { error: 'Upload an image before submitting for approval' },
        { status: 400 }
      );
    }

    const updated = await updateProjectStatus(id, status, userId);
    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ project: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update project';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
