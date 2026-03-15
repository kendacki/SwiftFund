'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

export default function LandingPage() {
  const { authenticated, ready, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace('/portfolio');
    }
  }, [ready, authenticated, router]);

  if (ready && authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-500/30 overflow-x-hidden relative">
      <div className="vortex-bg-wrapper" aria-hidden>
        <div className="vortex-bg" />
      </div>
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <section className="relative z-10 w-full bg-neutral-900/30">
        <main className="flex flex-col items-center justify-center pt-4 sm:pt-6 md:pt-10 pb-16 sm:pb-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-400 mb-3 sm:mb-4"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          Powered by Hedera
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.65,
            delay: 0.12,
            ease: [0.22, 0.61, 0.36, 1],
          }}
          className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-3 sm:mb-4 leading-[1.1]"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="block"
          >
            Fund Your Next Project{' '}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.35 }}
            className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800 sm:whitespace-nowrap inline-block"
          >
            With Your Community.
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.5,
            ease: [0.22, 0.61, 0.36, 1],
          }}
          className="font-heading text-base sm:text-lg md:text-xl text-neutral-400 mb-6 sm:mb-8 w-full max-w-4xl leading-relaxed tracking-tight"
        >
          Turn your views into shared value. SwiftFund connects your YouTube channel to the blockchain, automatically sharing a piece of your ad revenue with the fans who support you most with their funds—all powered by secure, transparent smart contracts.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-wrap gap-3 sm:gap-4 justify-center mb-6 sm:mb-8"
        >
          <button
            type="button"
            onClick={login}
            className="font-heading inline-flex items-center justify-center gap-2 rounded-lg bg-white text-neutral-900 font-semibold px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base min-w-[10rem] sm:min-w-[11rem] hover:bg-neutral-200 transition-colors"
          >
            Get started
          </button>
          <Link
            href="/discover"
            className="font-heading inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-600 bg-neutral-900/80 text-white font-semibold px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base min-w-[10rem] sm:min-w-[11rem] hover:bg-neutral-800 hover:border-neutral-500 transition-colors"
          >
            Discover
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap gap-6 sm:gap-8 items-center justify-center border-t border-neutral-800/50 pt-4 sm:pt-6 mt-2 sm:mt-4 w-full max-w-4xl"
        >
          <div className="text-center flex-1 min-w-[5rem] sm:min-w-[6rem]">
            <p className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">200ms</p>
            <p className="font-heading text-[10px] sm:text-xs text-neutral-500 uppercase tracking-widest mt-1">
              Consensus Speed
            </p>
          </div>
          <div className="hidden sm:block w-px h-12 bg-neutral-800" />
          <div className="text-center flex-1 min-w-[5rem] sm:min-w-[6rem]">
            <p className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">ERC-20</p>
            <p className="font-heading text-[10px] sm:text-xs text-neutral-500 uppercase tracking-widest mt-1">
              EVM Compatible
            </p>
          </div>
          <div className="hidden sm:block w-px h-12 bg-neutral-800" />
          <div className="text-center flex-1 min-w-[5rem] sm:min-w-[6rem]">
            <p className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">100%</p>
            <p className="font-heading text-[10px] sm:text-xs text-neutral-500 uppercase tracking-widest mt-1">
              On-Chain Oracle
            </p>
          </div>
        </motion.div>
        </main>
      </section>

      {/* Product section: about SwiftFund + Discover CTA */}
      <section className="relative z-10 w-full border-t border-neutral-800/50 bg-neutral-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
            <div className="flex-1 min-w-0">
              <p className="font-heading text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
                How it works
              </p>
              <h2 className="font-heading text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
                Fund creators. Share in their success.
              </h2>
              <p className="font-heading text-xs sm:text-base text-neutral-400 leading-relaxed tracking-tight max-w-xl">
                Creators list projects; backers fund them and earn a share of future revenue. Everything runs on Hedera—fast, low-cost, and transparent. Browse live projects, fund your favorites, and track rewards from one place.
              </p>
              <Link
                href="/discover"
                className="font-heading inline-flex items-center gap-2 mt-6 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold px-5 py-2.5 text-sm transition-colors"
              >
                Discover projects
              </Link>
            </div>
            <div className="flex-shrink-0 w-full md:w-72 lg:w-80">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80"
                  alt="Community and creators collaborating"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
