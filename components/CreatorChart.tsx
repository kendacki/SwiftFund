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

  const getLengthForTimeframe = (tf: Timeframe): number => {
    switch (tf) {
      case '1H':
        return 60; // 60 minutes
      case '1D':
        return 24; // 24 hours
      case '1M':
        return 30; // 30 days
      case '1Y':
        return 52; // 52 weeks
      default:
        return 30;
    }
  };

  const buildMockSeries = (tf: Timeframe, basePrice: number): HbarPoint[] => {
    const len = getLengthForTimeframe(tf);
    const points: HbarPoint[] = [];
    let price = basePrice;
    for (let i = 0; i < len; i++) {
      const drift = 0.00005;
      const noise = (Math.random() - 0.5) * 0.002;
      price = Math.max(0.01, price * (1 + drift + noise));
      points.push({
        date: `${len - i}`,
        price: Number(price.toFixed(4)),
      });
    }
    return points.reverse();
  };

  const [hbarData, setHbarData] = useState<HbarPoint[]>(() =>
    buildMockSeries('1D', 0.08)
  );

  useEffect(() => {
    // Rebuild series when timeframe changes
    setHbarData((prev) => {
      const lastPrice = prev.length ? prev[prev.length - 1].price : 0.08;
      return buildMockSeries(timeframe, lastPrice || 0.08);
    });

    const intervalId = setInterval(() => {
      setHbarData((prev) => {
        if (!prev.length) return buildMockSeries(timeframe, 0.08);
        const last = prev[prev.length - 1];
        const drift = 0.00005;
        const noise = (Math.random() - 0.5) * 0.002;
        const nextPrice = Math.max(0.01, last.price * (1 + drift + noise));
        const nextPoint: HbarPoint = {
          date: String(Number(last.date) + 1 || Date.now()),
          price: Number(nextPrice.toFixed(4)),
        };
        const updated = [...prev.slice(1), nextPoint];
        return updated;
      });
    }, 5000);

    return () => clearInterval(intervalId);
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
            Simulated live HBAR price feed for demo purposes.
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

