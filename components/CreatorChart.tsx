'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export interface ChartPoint {
  time: string;
  price: number;
  dateStr: string;
}

export default function CreatorChart() {
  const [timeframe, setTimeframe] = useState<'1H' | '1D' | '1M' | '1Y'>('1D');
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. FETCH HISTORICAL DATA (The Chart Line)
  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const end = Date.now();
        let start = end;
        let interval = 'm15';

        if (timeframe === '1H') {
          start = end - 3600000;
          interval = 'm1';
        }
        if (timeframe === '1D') {
          start = end - 86400000;
          interval = 'm15';
        }
        if (timeframe === '1M') {
          start = end - 2592000000;
          interval = 'h12';
        }
        if (timeframe === '1Y') {
          start = end - 31536000000;
          interval = 'd1';
        }

        const url = `https://api.coincap.io/v2/assets/hedera-hashgraph/history?interval=${interval}&start=${start}&end=${end}`;

        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();

        if (json.data && Array.isArray(json.data) && isMounted) {
          const formattedData: ChartPoint[] = json.data.map((d: any) => ({
            time: new Date(d.time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            dateStr: new Date(d.time).toLocaleDateString(),
            price: parseFloat(d.priceUsd),
          }));

          setChartData(formattedData);

          if (formattedData.length > 0) {
            const firstPrice = formattedData[0].price;
            const lastPrice = formattedData[formattedData.length - 1].price;
            const change = ((lastPrice - firstPrice) / firstPrice) * 100;
            setPriceChange(change);
          }
        }
      } catch (error) {
        console.error('Failed to fetch historical HBAR data:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [timeframe]);

  // 2. FETCH LIVE TICKER (The Heartbeat)
  useEffect(() => {
    let isMounted = true;

    const fetchLivePrice = async () => {
      try {
        const res = await fetch(
          'https://api.coincap.io/v2/assets/hedera-hashgraph',
          { cache: 'no-store' }
        );
        const json = await res.json();

        if (json.data && json.data.priceUsd && isMounted) {
          const livePrice = parseFloat(json.data.priceUsd);
          setCurrentPrice(livePrice);

          setChartData((prev) => {
            if (prev.length === 0) return prev;
            const newData = [...prev];
            newData[newData.length - 1].price = livePrice;
            return newData;
          });
        }
      } catch (error) {
        console.error('Failed to fetch live HBAR price:', error);
      }
    };

    // Fetch immediately, then every 10 seconds
    fetchLivePrice();
    const intervalId = setInterval(fetchLivePrice, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // 3. RENDER THE UI
  const isPositive = priceChange >= 0;

  return (
    <div className="w-full bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 font-sans">
      {/* Header & KPIs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white">Live Hedera Network</h2>
            <div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-xs font-medium border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Mainnet Synced
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white">
              {currentPrice > 0 ? `$${currentPrice.toFixed(4)}` : '...'}
            </span>
            <span
              className={`font-medium ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {priceChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex bg-[#111] border border-gray-800 rounded-lg p-1">
          {['1H', '1D', '1M', '1Y'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as any)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                timeframe === tf
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* The Chart Area */}
      <div className="w-full h-[350px]">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-[#111] rounded-xl border border-gray-800/50">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium animate-pulse">
              Establishing secure feed...
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-red-400 bg-red-400/10 rounded-xl border border-red-500/20">
            Connection Interrupted. Retrying...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? '#10b981' : '#ef4444'}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? '#10b981' : '#ef4444'}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#262626"
              />

              <XAxis
                dataKey={timeframe === '1D' || timeframe === '1H' ? 'time' : 'dateStr'}
                stroke="#52525b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />

              <YAxis
                domain={['dataMin', 'dataMax']}
                stroke="#52525b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(4)}`}
                allowDataOverflow
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '8px',
                  color: '#e4e4e7',
                }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                formatter={(value: number) => [`$${value.toFixed(4)}`, 'HBAR']}
                labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
              />

              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPrice)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

