'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import LoginButton from './LoginButton';

export default function AppNav() {
  const { authenticated, ready } = usePrivy();
  const logoHref = ready && authenticated ? '/creator' : '/';

  return (
    <nav className="relative z-10 flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 border-b border-neutral-800/50">
      <div className="flex items-center gap-2 min-w-0">
        <Link href={logoHref} className="inline-flex items-center gap-2">
          <img
            src="https://www.freelogovectors.net/wp-content/uploads/2019/10/swift-logo-program.png"
            alt="Swift logo"
            className="h-6 w-auto"
            width={24}
            height={24}
          />
          <span className="text-lg sm:text-xl font-extrabold tracking-tight truncate text-white">
            SwiftFund
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <Link
          href="/discover"
          className="text-xs sm:text-sm font-medium text-neutral-400 hover:text-white transition-colors"
        >
          Discover
        </Link>
        <LoginButton />
      </div>
    </nav>
  );
}
