import { getSupabase } from '@/lib/supabase';
import { getProjectById } from '@/lib/projectsDb';

export type ActivityType = 'fund' | 'disburse';

/** Log a funding event (call after successful fund). */
export async function logFund(projectId: string, amount: number): Promise<void> {
  const project = await getProjectById(projectId);
  if (!project) return;
  await insertActivity(project.creatorId, 'fund', amount, projectId);
}

/** Log a disbursement event (call after successful distribute). */
export async function logDisburse(creatorId: string, amount: number): Promise<void> {
  await insertActivity(creatorId, 'disburse', amount, null);
}

async function insertActivity(
  creatorId: string,
  type: ActivityType,
  amount: number,
  projectId: string | null
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('creator_activity').insert({
    creator_id: creatorId,
    type,
    amount,
    project_id: projectId,
  });
  if (error) console.error('creator_activity insert error:', error);
}

export interface ChartPoint {
  date: string;
  funded: number;
  disbursed: number;
}

/** Get chart data for a creator: cumulative funded and disbursed by date. */
export async function getChartData(creatorId: string): Promise<ChartPoint[]> {
  const supabase = getSupabase();
  const { data: rows, error } = await supabase
    .from('creator_activity')
    .select('type, amount, created_at')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: true });

  if (error || !rows || rows.length === 0) return [];

  type Day = { fund: number; disburse: number };
  const byDate = new Map<string, Day>();

  for (const r of rows as { type: string; amount: number; created_at: string }[]) {
    const date = r.created_at.slice(0, 10);
    const day = byDate.get(date) ?? { fund: 0, disburse: 0 };
    if (r.type === 'fund') day.fund += Number(r.amount);
    else if (r.type === 'disburse') day.disburse += Number(r.amount);
    byDate.set(date, day);
  }

  const sortedDates = Array.from(byDate.keys()).sort();
  let cumFund = 0;
  let cumDisburse = 0;
  const points: ChartPoint[] = [];
  for (const date of sortedDates) {
    const day = byDate.get(date)!;
    cumFund += day.fund;
    cumDisburse += day.disburse;
    points.push({ date, funded: cumFund, disbursed: cumDisburse });
  }
  return points;
}
