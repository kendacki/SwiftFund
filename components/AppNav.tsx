'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import LoginButton from './LoginButton';

function MenuGridIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" />
    </svg>
  );
}

const SUBPAGE_LINKS = [
  { href: '/creator', label: 'Dashboard' },
  { href: '/discover', label: 'Discover' },
  { href: '/portfolio', label: 'Wallet' },
  { href: '/faq', label: 'FAQ' },
];

export default function AppNav() {
  const { authenticated, ready } = usePrivy();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const showWidget = ready && (pathname !== '/' || authenticated);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const logoHref = ready && authenticated ? '/portfolio' : '/';

  return (
    <nav className="relative z-50 flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 border-b border-neutral-800/50">
      <div className="flex items-center min-w-0">
        <Link href={logoHref} className="inline-flex items-center gap-2 min-w-0">
          <img
            src="https://www.freelogovectors.net/wp-content/uploads/2019/10/swift-logo-program.png"
            alt="Swift logo"
            className="h-6 w-auto shrink-0"
            width={24}
            height={24}
          />
          <span className="font-heading text-lg sm:text-xl font-extrabold tracking-tight truncate text-white">
            SwiftFund
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {showWidget && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-neutral-700 bg-neutral-900/80 text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Open menu"
            >
              <MenuGridIcon className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 min-w-[180px] rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl py-2 z-[100]">
                {SUBPAGE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`font-heading block px-4 py-2.5 text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? 'text-red-400 bg-red-500/10'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        <LoginButton />
      </div>
    </nav>
  );
}
