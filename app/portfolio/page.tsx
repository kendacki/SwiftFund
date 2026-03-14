'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export default function PortfolioPage() {
  const { user } = usePrivy();
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (user?.wallet?.address) {
      setAddress(user.wallet.address);
    }
  }, [user]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="font-heading text-2xl font-bold">Your Portfolio</h1>
        <p className="text-sm text-neutral-400">
          View your SwiftFund positions and claimable yield.
        </p>

        <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
          <p className="text-xs text-neutral-500 uppercase tracking-[0.16em] mb-1">
            Connected wallet
          </p>
          <p className="font-mono text-sm text-neutral-200">
            {address ?? 'Not connected'}
          </p>
        </div>

        {/* This is where you would fetch and render on-chain balances
            using SWIFT_FUND_TREASURY_ABI and TREASURY_CONTRACT_ID
            from `@/constants/contracts` plus a JSON-RPC provider. */}
      </div>
    </main>
  );
}

