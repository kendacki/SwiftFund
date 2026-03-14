'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

export default function LoginButton() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const router = useRouter();

  // If Privy is still initializing, show a ghost/loading state
  if (!ready) {
    return (
      <div className="h-10 w-32 bg-neutral-900 animate-pulse rounded-lg border border-neutral-800" />
    );
  }

  return (
    <div className="flex items-center gap-4">
      {authenticated ? (
        <>
          <button
            onClick={() => router.push('/portfolio')}
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Wallet
          </button>
          <button
            onClick={() => router.push('/creator')}
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Dashboard
          </button>

          {/* User Wallet / Logout Button */}
          <button
            onClick={logout}
            className="font-heading bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg border border-neutral-800 transition-all text-sm flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            {user?.wallet?.address?.substring(0, 6)}...{user?.wallet?.address?.slice(-4)}
          </button>
        </>
      ) : (
        /* The Main Login Trigger */
        <button
          onClick={login}
          className="font-heading bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all transform hover:scale-105 active:scale-95"
        >
          Login
        </button>
      )}
    </div>
  );
}