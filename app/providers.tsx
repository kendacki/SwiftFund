'use client';

import { PrivyProvider } from '@privy-io/react-auth';

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() ?? '';

if (!appId) {
  throw new Error(
    'NEXT_PUBLIC_PRIVY_APP_ID is not set. Add it in Vercel under Settings → Environment Variables (Production and Preview), then redeploy.'
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#dc2626',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
