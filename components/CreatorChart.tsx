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
  const [hbarData, setHbarData] = useState<HbarPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    const fetchData = async () => {
      try {
        const res = await fetch(
          'https://api.coincap.io/v2/assets/hedera-hashgraph/history?interval=d1'
        );
        const json = await res.json();
        const raw = Array.isArray(json?.data) ? json.data : [];
        const formatted: HbarPoint[] = raw.map((item: any) => ({
          date: new Date(item.time).toLocaleDateString(),
          price: Number.parseFloat(item.priceUsd ?? '0') || 0,
        }));
        setHbarData(formatted);
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
  }, []);

  const chartData = useMemo(
    () => (Array.isArray(hbarData) ? hbarData : []),
    [hbarData]
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-xl"
    >
      <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-white tracking-tight">
            Live Hedera Mainnet (HBAR/USD)
          </h2>
          <p className="font-heading text-xs text-neutral-400 mt-0.5 tracking-tight">
            Daily HBAR price powered by CoinCap. Auto-refreshes every 60 seconds.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-heading text-[11px] text-emerald-200 tracking-tight">
            Network Synced
          </span>
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

