'use client';

import { useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { motion } from 'framer-motion';

export interface ChartPoint {
  date: string;
  funded: number;
  disbursed: number;
}

function formatDate(label: string): string {
  try {
    const d = new Date(label);
    return isNaN(d.getTime()) ? label : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
  } catch {
    return label;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

const RED_PRIMARY = '#dc2626';
const RED_SECONDARY = '#b91c1c';

interface CreatorChartProps {
  points: ChartPoint[];
  loading?: boolean;
  onRefresh?: () => void;
}

export default function CreatorChart({ points, loading, onRefresh }: CreatorChartProps) {
  const chartData = useMemo(() => {
    if (!points.length) return [];
    return points.map((p) => ({
      ...p,
      dateLabel: formatDate(p.date),
    }));
  }, [points]);

  const hasData = chartData.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-xl"
    >
      <div className="px-4 sm:px-6 py-4 border-b border-white/10">
        <h2 className="font-heading text-lg font-semibold text-white tracking-tight">
          Funding & Disbursements
        </h2>
        <p className="font-heading text-xs text-neutral-400 mt-0.5 tracking-tight">
          Cumulative amounts over time. Updates when projects are funded or you run a distribution.
        </p>
      </div>
      <div className="p-4 sm:p-6 min-h-[280px]">
        {loading ? (
          <div className="h-[260px] flex items-center justify-center text-neutral-500 text-sm">
            <span className="animate-pulse">Loading chart…</span>
          </div>
        ) : !hasData ? (
          <div className="h-[260px] flex flex-col items-center justify-center text-neutral-500 text-sm text-center px-4">
            <p className="font-heading tracking-tight">No activity yet.</p>
            <p className="text-xs mt-1 max-w-sm">
              Fund a project or distribute yield to see your funding and disbursement lines here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fundGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RED_PRIMARY} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={RED_PRIMARY} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="disburseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RED_SECONDARY} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={RED_SECONDARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(23,23,23,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(12px)',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.dateLabel ?? ''}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                itemStyle={{ color: '#fca5a5' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                formatter={(value) => value}
                iconType="line"
                iconSize={10}
              />
              <Area
                type="monotone"
                dataKey="funded"
                name="Funded"
                stroke={RED_PRIMARY}
                strokeWidth={2}
                fill="url(#fundGradient)"
              />
              <Line
                type="monotone"
                dataKey="disbursed"
                name="Disbursed"
                stroke={RED_SECONDARY}
                strokeWidth={2}
                dot={{ fill: RED_SECONDARY, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: RED_SECONDARY, stroke: 'rgba(255,255,255,0.3)' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.section>
  );
}
