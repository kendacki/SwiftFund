'use client';

import { useEffect } from 'react';

const isConsensusError = (error: Error & { digest?: string }) => {
  const msg = (error?.message || '').toLowerCase();
  return (
    msg.includes('consensus') ||
    msg.includes('contract') ||
    msg.includes('hedera') ||
    msg.includes('transaction') ||
    error?.digest?.startsWith('CONSENSUS')
  );
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const showConsensus = isConsensusError(error);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-heading text-3xl font-black tracking-tight text-white">
          {showConsensus ? 'Consensus Error' : 'Something went wrong.'}
        </h1>
        <p className="font-heading text-sm text-neutral-400 tracking-tight">
          {showConsensus
            ? 'A contract or network call failed. Check your connection and try again.'
            : 'An unexpected error occurred while loading SwiftFund. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

