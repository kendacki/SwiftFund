'use client';

import { motion } from 'framer-motion';
import LoginButton from '../components/LoginButton';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-500/30">
      
      {/* Subtle Grid Background for technical aesthetic */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none"></div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center max-w-7xl mx-auto px-6 py-6 border-b border-neutral-800/50">
        <div className="flex items-center gap-2">
          <a
            href="https://www.freelogovectors.net/swift-logo-2/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center"
          >
            <img
              src="https://www.freelogovectors.net/wp-content/uploads/2019/10/swift-logo-program.png"
              alt="Swift logo"
              className="h-6 w-auto"
            />
          </a>
          <span className="text-xl font-extrabold tracking-tight">SwiftFund</span>
        </div>
        <LoginButton />
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-32 pb-20 px-6 max-w-4xl mx-auto text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-400 mb-8"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Powered by Hedera
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight"
        >
          Fund Your Next Project <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">
            with your Community.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl leading-relaxed"
        >
          Turn your views into shared value. SwiftFund connects your YouTube channel to the blockchain, automatically sharing a piece of your ad revenue with the fans who support you most with their funds—all powered by secure, transparent smart contracts.
        </motion.p>

        {/* Trust Markers */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex gap-8 items-center justify-center border-t border-neutral-800/50 pt-10 mt-10 w-full"
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-white">200ms</p>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Consensus Speed</p>
          </div>
          <div className="w-px h-12 bg-neutral-800"></div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">ERC-20</p>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">EVM Compatible</p>
          </div>
          <div className="w-px h-12 bg-neutral-800"></div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">100%</p>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">On-Chain Oracle</p>
          </div>
        </motion.div>

      </main>
    </div>
  );
}