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
  time: string;
  price: number;
}

interface CreatorChartProps {
  points?: ChartPoint[];
  loading?: boolean;
  onRefresh?: () => void;
}

export default function CreatorChart(_props: CreatorChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartData, setChartData] = useState<HbarPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState<{
    amount: number;
    percentage: number;
    isPositive: boolean;
  }>({ amount: 0, percentage: 0, isPositive: true });

  // Map timeframe to CoinCap interval
  const getIntervalForTimeframe = (tf: Timeframe): string => {
    switch (tf) {
      case '1H':
        return 'm1';
      case '1D':
        return 'm15';
      case '1M':
        return 'h12';
      case '1Y':
        return 'd1';
      default:
        return 'm15';
    }
  };

  // 1) Historical fetch whenever timeframe changes
  useEffect(() => {
    const fetchHistorical = async () => {
      try {
        const interval = getIntervalForTimeframe(timeframe);
        const res = await fetch(
          `https://api.coincap.io/v2/assets/hedera-hashgraph/history?interval=${interval}`
        );
        const json = await res.json();
        const raw = Array.isArray(json?.data) ? json.data : [];

        const mapped: HbarPoint[] = raw.map((pt: any) => {
          const d = new Date(pt.time);
          const timeLabel =
            timeframe === '1H' || timeframe === '1D'
              ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : d.toLocaleDateString();
          return {
            time: timeLabel,
            price: Number.parseFloat(pt.priceUsd ?? '0') || 0,
          };
        });

        if (!mapped.length) return;

        // Slice to a reasonable recent window
        let windowed = mapped;
        if (timeframe === '1H') windowed = mapped.slice(-60);
        else if (timeframe === '1D') windowed = mapped.slice(-96);
        else if (timeframe === '1M') windowed = mapped.slice(-60);
        else if (timeframe === '1Y') windowed = mapped.slice(-365);

        setChartData(windowed);

        const first = windowed[0]?.price ?? 0;
        const last = windowed[windowed.length - 1]?.price ?? 0;
        if (first > 0) {
          const amount = last - first;
          const percentage = (amount / first) * 100;
          setPriceChange({
            amount,
            percentage,
            isPositive: amount >= 0,
          });
        }
        setCurrentPrice(last);
      } catch {
        // On failure, leave existing data
      }
    };

    void fetchHistorical();
  }, [timeframe]);

  // 2) High-frequency live ticker (3s)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(
          'https://api.coincap.io/v2/assets/hedera-hashgraph'
        );
        const json = await res.json();
        const price = Number.parseFloat(json?.data?.priceUsd ?? '0') || 0;
        if (!price) return;

        setCurrentPrice(price);
        setChartData((prev) => {
          if (!prev.length) return prev;
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            price,
          };
          return updated;
        });
      } catch {
        // ignore transient errors
      }
    }, 3000);

    return () => clearInterval(id);
  }, []);

  const chartSeries = useMemo(
    () => (Array.isArray(chartData) ? chartData : []),
    [chartData]
  );

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
            Live HBAR price feed from CoinCap, auto-updating every 3 seconds.
          </p>
          <p className="mt-1 font-heading text-xs text-emerald-300 tracking-tight">
            Current price:{' '}
            <span className="font-semibold">
              {currentPrice ? `$${currentPrice.toFixed(4)}` : '—'}
            </span>
            {priceChange.amount !== 0 && (
              <span
                className={`ml-2 ${
                  priceChange.isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {priceChange.isPositive ? '+' : '-'}
                {Math.abs(priceChange.percentage).toFixed(2)}%
              </span>
            )}
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
        <div className="w-full h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartSeries}>
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
                dataKey="time"
                tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(55,65,81,0.8)' }}
                tickLine={false}
              />
              <YAxis
                type="number"
                domain={['dataMin', 'dataMax']}
                allowDataOverflow={true}
                hide={false}
                width={60}
                tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v as number).toFixed(4)}`}
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
      </div>
    </motion.section>
  );
}

