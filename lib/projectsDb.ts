import { getSupabase } from '@/lib/supabase';
import type { Project, ProjectStatus } from '@/lib/projects';

type Row = {
  id: string;
  creator_id: string;
  creator_name: string;
  handle: string;
  title: string;
  description: string | null;
  goal_amount: number;
  amount_raised: number;
  image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  earnings_distribution_percent: number | null;
  account_info_pdf_url: string | null;
  funder_count?: number;
  verified_youtube_views?: number | null;
  verified_youtube_revenue?: number | null;
  youtube_linked?: boolean | null;
};

function rowToProject(r: Row): Project {
  return {
    id: r.id,
    creatorId: r.creator_id,
    creatorName: r.creator_name,
    handle: r.handle,
    title: r.title,
    description: r.description ?? '',
    goalAmount: Number(r.goal_amount),
    amountRaised: Number(r.amount_raised),
    imageUrl: r.image_url ?? '',
    status: r.status as ProjectStatus,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    tags: (r.tags ?? ['all']) as Project['tags'],
    earningsDistributionPercent: r.earnings_distribution_percent ?? undefined,
    accountInfoPdfUrl: r.account_info_pdf_url ?? undefined,
    funderCount: r.funder_count ?? 0,
    verifiedYoutubeViews: r.verified_youtube_views ?? undefined,
    verifiedYoutubeRevenue: r.verified_youtube_revenue ?? undefined,
    youtubeLinked: r.youtube_linked ?? undefined,
  };
}

/** Fetch all projects, or by creator_id, or by status. */
export async function getProjects(options?: {
  creatorId?: string;
  status?: ProjectStatus;
}): Promise<Project[]> {
  const supabase = getSupabase();
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (options?.creatorId) {
    query = query.eq('creator_id', options.creatorId);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  const { data, error } = await query;
  if (error) {
    console.error('getProjects error:', error);
    throw error;
  }
  return (data as Row[]).map(rowToProject);
}

/** Insert a new project (draft or pending). */
export async function insertProject(project: Project): Promise<void> {
  const supabase = getSupabase();
  const row = {
    id: project.id,
    creator_id: project.creatorId,
    creator_name: project.creatorName,
    handle: project.handle,
    title: project.title,
    description: project.description || '',
    goal_amount: project.goalAmount,
    amount_raised: project.amountRaised,
    image_url: project.imageUrl || '',
    // Force into the review queue.
    status: 'pending',
    created_at: project.createdAt,
    updated_at: project.updatedAt,
    tags: project.tags ?? ['all'],
    earnings_distribution_percent: project.earningsDistributionPercent ?? null,
    account_info_pdf_url: project.accountInfoPdfUrl ?? null,
    verified_youtube_views: project.verifiedYoutubeViews ?? null,
    verified_youtube_revenue: project.verifiedYoutubeRevenue ?? null,
    youtube_linked: project.youtubeLinked ?? null,
  };

  const { data, error } = await supabase
    .from('projects')
    .insert([row as never])
    .select();

  if (error) {
    console.error('🚨 SUPABASE FATAL INSERT ERROR:');
    console.error('Message:', (error as any).message);
    console.error('Details:', (error as any).details);
    console.error('Hint:', (error as any).hint);
    console.error('Code:', (error as any).code);
    // Throw the actual message to the frontend so the user can see it.
    throw new Error(`Database Error: ${(error as any).message}`);
  }
}

/** Update project status (creator: draft/pending; approver: approved/processing). */
export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  creatorId?: string
): Promise<Project | null> {
  const supabase = getSupabase();
  const updatePayload = { status, updated_at: new Date().toISOString() };
  let query = supabase
    .from('projects')
    .update(updatePayload as never)
    .eq('id', projectId);
  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  }
  const { data, error } = await query.select().maybeSingle();
  if (error || !data) return null;
  return rowToProject(data as Row);
}

/** Increment amount_raised for a project (after successful fund). */
export async function incrementAmountRaised(projectId: string, amount: number): Promise<void> {
  const supabase = getSupabase();
  const { data: row } = await supabase.from('projects').select('amount_raised').eq('id', projectId).single();
  if (!row) return;
  const current = Number((row as { amount_raised: number }).amount_raised) || 0;
  const updatePayload = { amount_raised: current + amount, updated_at: new Date().toISOString() };
  const { error } = await supabase
    .from('projects')
    .update(updatePayload as never)
    .eq('id', projectId);
  if (error) {
    console.error('incrementAmountRaised error:', error);
    throw error;
  }
}

/** Get a single project by id. */
export async function getProjectById(projectId: string): Promise<Project | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
  if (error || !data) return null;
  return rowToProject(data as Row);
}

/** Update YouTube metrics for all projects owned by a creator. */
export async function updateYoutubeMetricsForCreator(
  creatorId: string,
  metrics: { revenue: number; views: number; linked: boolean }
): Promise<void> {
  const supabase = getSupabase();
  const updatePayload = {
    verified_youtube_revenue: metrics.revenue,
    verified_youtube_views: metrics.views,
    youtube_linked: metrics.linked,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from('projects')
    .update(updatePayload as never)
    .eq('creator_id', creatorId);
  if (error) {
    console.error('updateYoutubeMetricsForCreator error:', error);
    throw error;
  }
}
