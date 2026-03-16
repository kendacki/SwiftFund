'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/Button';
import DashboardCard from '@/components/DashboardCard';

interface Metrics {
  revenue: number;
  views: number;
}

export default function CreatorEarningsPage() {
  const { getAccessToken } = usePrivy();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
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
        const res = await fetch('/api/youtube/earnings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || 'Failed to load earnings.');
          setLoading(false);
          return;
        }
        setMetrics({
          revenue: Number(data.revenue ?? 0),
          views: Number(data.views ?? 0),
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load earnings.'
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [getAccessToken]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/creator"
              className="text-sm text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span aria-hidden>←</span> Back to Creator Dashboard
            </Link>
            <h1 className="mt-4 font-heading text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              Earnings Overview
            </h1>
            <p className="mt-2 font-heading text-xs sm:text-sm text-neutral-400 max-w-2xl tracking-tight">
              Private, real-time insight into your YouTube channel performance.
              Only you (the creator) can see this page.
            </p>
          </div>
        </div>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-white tracking-tight">
                30-Day Performance
              </h2>
              <p className="font-heading text-xs text-neutral-400 mt-1 tracking-tight">
                Pulled directly from YouTube Analytics via secure OAuth2.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xs sm:text-sm"
            >
              Refresh
            </Button>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {loading ? (
              <p className="font-heading text-sm text-neutral-400 tracking-tight">
                Loading earnings…
              </p>
            ) : error ? (
              <p className="font-heading text-sm text-red-400 tracking-tight">
                {error}
              </p>
            ) : metrics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DashboardCard
                  title="30-Day Estimated Revenue"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(metrics.revenue)}
                  subtitle="Private · YouTube Analytics"
                />
                <DashboardCard
                  title="30-Day Channel Views"
                  value={metrics.views.toLocaleString()}
                  subtitle="Private · YouTube Analytics"
                />
              </div>
            ) : (
              <p className="font-heading text-sm text-neutral-400 tracking-tight">
                No earnings data available yet. Make sure your YouTube account is
                connected and try again.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

