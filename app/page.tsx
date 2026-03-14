'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

export default function LandingPage() {
  const { authenticated, ready } = usePrivy();
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-500/30 overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <main className="relative z-10 flex flex-col items-center justify-center pt-4 sm:pt-6 md:pt-10 pb-16 sm:pb-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
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
          className="text-base sm:text-lg md:text-xl text-neutral-400 mb-4 sm:mb-6 w-full max-w-4xl leading-relaxed"
        >
          Turn your views into shared value. SwiftFund connects your YouTube channel to the blockchain, automatically sharing a piece of your ad revenue with the fans who support you most with their funds—all powered by secure, transparent smart contracts.
        </motion.p>

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
    </div>
  );
}
