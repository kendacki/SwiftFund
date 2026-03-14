'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import DashboardCard from '../../components/DashboardCard';

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32 24"
        className="animate-spin"
        style={{ transformOrigin: '12px 12px' }}
      />
    </svg>
  );
}

export default function CreatorDashboard() {
  const { getAccessToken } = usePrivy();
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDistributeYield = async () => {
    setIsProcessing(true);
    setStatus(null);

    try {
      const token = await getAccessToken();

      const response = await fetch('/api/distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Distribution failed');
      }

      setStatus(
        `Distribution succeeded. Status: ${data.status}, Tx: ${data.transactionId}`
      );
    } catch (error: unknown) {
      setStatus(
        error instanceof Error ? error.message : 'Distribution failed.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="font-heading text-2xl font-bold">
          Creator Treasury Controls
        </h1>
        <p className="text-sm text-neutral-400 max-w-xl">
          Trigger distribution of on-chain yield to your supporters. This calls
          the SwiftFund treasury contract on Hedera.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DashboardCard
            title="Treasury Balance"
            value="—"
            subtitle="On-chain SWIND balance"
          />
          <DashboardCard
            title="Last Distribution"
            value="—"
            subtitle="Most recent payout"
          />
          <DashboardCard
            title="Actions"
            value={
              <button
                onClick={handleDistributeYield}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <SpinnerIcon className="h-4 w-4 animate-spin shrink-0" />
                    Processing...
                  </>
                ) : (
                  'Distribute Yield'
                )}
              </button>
            }
          />
        </div>

        {status && (
          <p className="text-xs text-neutral-300 whitespace-pre-wrap bg-neutral-900/50 rounded-lg p-4 border border-neutral-800">
            {status}
          </p>
        )}
      </div>
    </main>
  );
}
