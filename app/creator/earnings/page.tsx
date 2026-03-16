'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/Button';
import DashboardCard from '@/components/DashboardCard';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';

type RangeKey = '7d' | '30d' | '12m' | 'all';

interface EarningsPoint {
  date: string;
  revenue: number;
  views: number;
}

export default function CreatorEarningsPage() {
  const { getAccessToken } = usePrivy();
  const [range, setRange] = useState<RangeKey>('12m');
  const [points, setPoints] = useState<EarningsPoint[]>([]);
  const [mocked, setMocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getAccessToken();
        if (!token) {
          setError('Please log in again to view earnings.');
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/youtube/earnings?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || 'Failed to load earnings.');
          setLoading(false);
          return;
        }
        setMocked(Boolean(data?.mocked));
        setPoints(Array.isArray(data?.points) ? data.points : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load earnings.'
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [getAccessToken, range]);

  const totals = useMemo(() => {
    return points.reduce(
      (acc, p) => {
        acc.revenue += Number(p.revenue) || 0;
        acc.views += Number(p.views) || 0;
        return acc;
      },
      { revenue: 0, views: 0 }
    );
  }, [points]);

  const rpm = useMemo(() => {
    if (!totals.views) return 0;
    return (totals.revenue / totals.views) * 1000;
  }, [totals.revenue, totals.views]);

  const yieldSplit = useMemo(() => {
    const funderPct = 0.2;
    const protocolPct = 0.05;
    const creatorPct = 0.75;
    const total = totals.revenue;
    return {
      funderPct,
      protocolPct,
      creatorPct,
      funder: total * funderPct,
      protocol: total * protocolPct,
      creator: total * creatorPct,
    };
  }, [totals.revenue]);

  const formatTick = (iso: string) => {
    const d = new Date(iso);
    if (range === '7d' || range === '30d') return format(d, 'MMM d');
    if (range === 'all') return format(d, 'yyyy');
    return format(d, 'MMM yyyy');
  };

  const formatTooltipLabel = (iso: string) => {
    const d = new Date(iso);
    if (range === '7d' || range === '30d') return format(d, 'EEE, MMM d, yyyy');
    if (range === 'all') return format(d, 'yyyy');
    return format(d, 'MMMM yyyy');
  };

  const chartData = useMemo(() => {
    // Ensure stable sort ascending by date.
    return [...points].sort((a, b) => a.date.localeCompare(b.date));
  }, [points]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/creator"
              className="text-sm text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span aria-hidden>←</span> Back to Creator Dashboard
            </Link>
            <h1 className="mt-4 font-heading text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              Earnings &amp; Yield Analytics
            </h1>
            <p className="mt-2 font-heading text-xs sm:text-sm text-neutral-400 max-w-2xl tracking-tight">
              Track your channel&apos;s growth and see exactly how your earnings are
              shared with your funders. <span className="italic">Not monetized on
              YouTube yet? We’ve enabled a live Demo Mode with sample data so you
              can explore the platform while you grow!</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-heading text-[11px] text-emerald-200 tracking-tight">
                Live Sync Active
              </span>
            </div>
            <Button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xs sm:text-sm"
            >
              Refresh
            </Button>
          </div>
        </div>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold text-white tracking-tight">
                Earnings Overview
              </h2>
              <p className="font-heading text-xs text-neutral-400 mt-1 tracking-tight">
                {mocked
                  ? 'Using placeholder data due to YouTube permissions/monetization limits.'
                  : 'Pulled directly from YouTube Analytics via secure OAuth2.'}
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-950/60 p-1">
              {(
                [
                  { key: '7d', label: '7 Days' },
                  { key: '30d', label: '30 Days' },
                  { key: '12m', label: '12 Months' },
                  { key: 'all', label: 'All Time' },
                ] as const
              ).map((t) => {
                const active = range === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setRange(t.key)}
                    className={[
                      'px-3 py-1.5 rounded-md text-xs font-heading tracking-tight transition-colors',
                      active
                        ? 'bg-white text-neutral-950'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-900',
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {loading ? (
              <p className="font-heading text-sm text-neutral-400 tracking-tight">
                Loading earnings…
              </p>
            ) : error ? (
              <p className="font-heading text-sm text-red-400 tracking-tight">
                {error}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <DashboardCard
                    title="Total Revenue"
                    value={new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(totals.revenue)}
                    subtitle="Private · YouTube Analytics"
                  />
                  <DashboardCard
                    title="Total Views"
                    value={totals.views.toLocaleString()}
                    subtitle="Channel traction"
                  />
                  <DashboardCard
                    title="Avg. RPM"
                    value={new Intl.NumberFormat('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(rpm)}
                    subtitle="Revenue per 1,000 views"
                  />
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-heading text-sm font-semibold tracking-tight text-white">
                      Revenue &amp; Views Trend
                    </p>
                    <p className="font-heading text-[11px] tracking-tight text-neutral-500">
                      Hover for exact values
                    </p>
                  </div>
                  <div className="w-full h-[350px] min-h-[300px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData || []} margin={{ top: 8, left: 0, right: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#222" strokeDasharray="3 6" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatTick}
                          stroke="#666"
                          tick={{ fontSize: 11 }}
                          minTickGap={18}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#666"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#444"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `${v}`}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            const p = payload[0]?.payload as EarningsPoint | undefined;
                            if (!p) return null;
                            return (
                              <div className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 shadow-xl">
                                <p className="font-heading text-xs text-neutral-300 tracking-tight">
                                  {formatTooltipLabel(label as string)}
                                </p>
                                <div className="mt-1 space-y-0.5">
                                  <p className="font-heading text-xs text-white tracking-tight">
                                    Revenue:{' '}
                                    {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }).format(p.revenue)}
                                  </p>
                                  <p className="font-heading text-xs text-neutral-300 tracking-tight">
                                    Views: {p.views.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="url(#colorRevenue)"
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="views"
                          stroke="#34D399"
                          strokeWidth={1.5}
                          fillOpacity={0}
                          dot={false}
                          activeDot={{ r: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
                  <div className="px-4 sm:px-6 py-4 border-b border-neutral-800">
                    <h3 className="font-heading text-base font-semibold text-white tracking-tight">
                      Smart Contract Yield Projection
                    </h3>
                    <p className="font-heading text-xs text-neutral-400 mt-1 tracking-tight">
                      A Web3 breakdown of how revenue could be split between funders, protocol, and creator.
                    </p>
                  </div>
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="h-3 rounded-full overflow-hidden bg-neutral-800">
                      <div className="h-full flex">
                        <div
                          className="h-full bg-purple-400/80"
                          style={{ width: `${yieldSplit.funderPct * 100}%` }}
                          title="Funder Yield"
                        />
                        <div
                          className="h-full bg-emerald-400/80"
                          style={{ width: `${yieldSplit.protocolPct * 100}%` }}
                          title="Protocol Fee"
                        />
                        <div
                          className="h-full bg-neutral-300/40"
                          style={{ width: `${yieldSplit.creatorPct * 100}%` }}
                          title="Creator Retained"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <DashboardCard
                        title="Funder Yield (20%)"
                        value={new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(yieldSplit.funder)}
                        subtitle="Allocated to investors"
                      />
                      <DashboardCard
                        title="Protocol Fee (5%)"
                        value={new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(yieldSplit.protocol)}
                        subtitle="SwiftFund treasury"
                      />
                      <DashboardCard
                        title="Creator Retained (75%)"
                        value={new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(yieldSplit.creator)}
                        subtitle="Creator keeps"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

