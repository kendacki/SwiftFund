'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { mainnet, sepolia } from 'viem/chains';

interface ProvidersProps {
  children: React.ReactNode;
  appId: string;
}

export default function Providers({ children, appId }: ProvidersProps) {
  if (!appId) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-heading text-xl font-bold text-white">
            Auth not configured
          </h1>
          <p className="text-sm text-neutral-400">
            In Vercel: Settings → Environment Variables → add <code className="rounded bg-neutral-800 px-1 py-0.5 text-xs">NEXT_PUBLIC_PRIVY_APP_ID</code> with your Privy App ID. Enable Production and Preview, save, then start a new deployment (Redeploy or push a commit). The value is applied only on a new build.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Sith Mode: dark Privy modals (confirm tx, login) + red accent
        appearance: {
          theme: 'dark',
          accentColor: '#DC2626', // Tailwind red-600
          ...(process.env.NEXT_PUBLIC_PRIVY_LOGO_URL
            ? { logo: process.env.NEXT_PUBLIC_PRIVY_LOGO_URL }
            : {}),
        },

        // 1. Tell the UI to show both Email/Social AND external Wallets (MetaMask)
        loginMethods: ['email', 'wallet', 'google', 'apple'],

        // 2. Configure how the embedded wallets behave
        embeddedWallets: {
          createOnLogin: 'users-without-wallets', // Only create an embedded wallet if they don't use MetaMask
        },

        // 3. Ensure Sepolia is in your supported chains
        defaultChain: sepolia,
        supportedChains: [sepolia, mainnet], // Imported from viem/chains
      }}
    >
      {children}
    </PrivyProvider>
  );
}
