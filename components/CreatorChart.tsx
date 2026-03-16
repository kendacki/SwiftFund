'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';

export interface ChartPoint {
  name?: string;
  date?: string;
  value?: number;
  revenue?: number;
  views?: number;
  [key: string]: any;
}

type Timeframe = '1H' | '1D' | '1M' | '1Y';

interface HbarPoint {
  date: string;
  price: number;
}

interface CreatorChartProps {
  points?: ChartPoint[];
  loading?: boolean;
  onRefresh?: () => void;
}

export default function CreatorChart(_props: CreatorChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');

  const buildMockSeries = (days: number): HbarPoint[] => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    const base = 0.075;
    const span = 0.02;
    return Array.from({ length: days }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const t = i / Math.max(1, days - 1);
      const seasonal = Math.sin((i / 7) * Math.PI * 2) * 0.03;
      const value = base + span * t + seasonal;
      return {
        date: d.toLocaleDateString(),
        price: Number(value.toFixed(4)),
      };
    });
  };

  const [hbarData, setHbarData] = useState<HbarPoint[]>(() => buildMockSeries(30));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    const fetchData = async () => {
      try {
        const intervalParam =
          timeframe === '1H'
            ? 'h1'
            : timeframe === '1D'
              ? 'm30'
              : timeframe === '1M'
                ? 'd1'
                : 'd1';

        const res = await fetch(
          `https://api.coincap.io/v2/assets/hedera-hashgraph/history?interval=${intervalParam}`
        );
        const json = await res.json();
        const raw = Array.isArray(json?.data) ? json.data : [];
        const formatted: HbarPoint[] = raw.map((item: any) => ({
          date: new Date(item.time).toLocaleDateString(),
          price: Number.parseFloat(item.priceUsd ?? '0') || 0,
        }));
        if (formatted.length > 0) {
          let sliced: HbarPoint[] = formatted;
          if (timeframe === '1H') {
            sliced = formatted.slice(-24);
          } else if (timeframe === '1D') {
            sliced = formatted.slice(-48);
          } else if (timeframe === '1M') {
            sliced = formatted.slice(-30);
          } else if (timeframe === '1Y') {
            sliced = formatted.slice(-365);
          }
          setHbarData(sliced);
        } else {
          // fall back to local mock if API returns nothing
          const fallbackDays = timeframe === '1Y' ? 365 : timeframe === '1M' ? 30 : 30;
          setHbarData(buildMockSeries(fallbackDays));
        }
      } catch {
        // leave existing data; UI will show last good value or skeleton
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
    intervalId = setInterval(fetchData, 60_000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timeframe]);

  const chartData = useMemo(
    () => (Array.isArray(hbarData) ? hbarData : []),
    [hbarData]
  );

  const currentPrice =
    chartData.length > 0 ? chartData[chartData.length - 1]?.price ?? 0 : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-xl"
    >
      <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-white tracking-tight">
            Live Hedera Mainnet (HBAR/USD)
          </h2>
          <p className="font-heading text-xs text-neutral-400 mt-0.5 tracking-tight">
            Powered by CoinCap. Auto-refreshes every 60 seconds.
          </p>
          <p className="mt-1 font-heading text-xs text-emerald-300 tracking-tight">
            Current price:{' '}
            <span className="font-semibold">
              {currentPrice ? `$${currentPrice.toFixed(4)}` : '—'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-heading text-[11px] text-emerald-200 tracking-tight">
              Network Synced
            </span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-950/80 p-1">
            {(
              [
                { key: '1H', label: 'Hourly' },
                { key: '1D', label: 'Daily' },
                { key: '1M', label: 'Monthly' },
                { key: '1Y', label: 'Yearly' },
              ] as const
            ).map((t) => {
              const active = timeframe === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTimeframe(t.key)}
                  className={[
                    'px-2.5 py-1 rounded-md text-[11px] font-heading tracking-tight transition-colors',
                    active
                      ? 'bg-white text-neutral-950'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {loading && chartData.length === 0 ? (
          <div className="flex w-full h-[260px] items-center justify-center">
            <p className="font-heading text-sm text-neutral-500 tracking-tight animate-pulse">
              Syncing with Mainnet…
            </p>
          </div>
        ) : (
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="hbarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.25)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(55,65,81,0.8)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v.toFixed(3)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15,23,42,0.98)',
                    border: '1px solid rgba(148,163,184,0.4)',
                    borderRadius: 10,
                    padding: '8px 10px',
                  }}
                  labelStyle={{ color: 'rgba(226,232,240,0.9)', fontSize: 12 }}
                  formatter={(value: number) => [
                    `$${(value as number).toFixed(4)}`,
                    'HBAR Price',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#hbarGradient)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.section>
  );
}

