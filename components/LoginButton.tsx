'use client';

import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LoginButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  // Prevent UI shifting before Privy loads
  if (!ready) {
    return <div className="h-10 w-32 bg-neutral-900 rounded-md animate-pulse"></div>;
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-6">
        <Link href="/portfolio" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
          Dashboard
        </Link>
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 py-1.5 px-3 rounded-md">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
          <span className="text-xs font-mono text-neutral-400">
            {/* Added an extra ? after id to make strict TypeScript happy! */}
            {user?.id?.split('did:privy:')[1]?.substring(0, 6)}...
          </span>
          <button 
            onClick={logout} 
            className="text-xs text-neutral-500 hover:text-red-400 ml-2 border-l border-neutral-700 pl-3 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={login}
      className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-2.5 px-6 rounded-md shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all border border-red-500/50"
    >
      Initialize Wallet
    </motion.button>
  );
}