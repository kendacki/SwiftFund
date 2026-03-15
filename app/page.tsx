'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

const FAQ_ITEMS = [
  {
    id: '1',
    question: 'What is SwiftFund?',
    answer:
      'SwiftFund is a decentralized micro-sponsorship platform that lets creators raise funds from their community and share future revenue (e.g. from YouTube) with supporters. Funds and payouts are handled on the Hedera network using smart contracts.',
  },
  {
    id: '2',
    question: 'How do I fund a creator or project?',
    answer:
      'Go to Discover, browse approved projects, and click "Fund This Project" on a card. Enter the amount you want to contribute. You must be logged in with a wallet; the transaction is submitted on Hedera and you may receive SWIND or a share of future yield.',
  },
  {
    id: '3',
    question: 'How do I create and list my own project?',
    answer:
      'Log in and open the Creator Dashboard. Click "Create project", fill in the title, description, funding goal, and upload a cover image. Save as draft or "Submit for approval". Once approved, your project appears on Discover and others can fund it.',
  },
  {
    id: '4',
    question: 'What is the Wallet page for?',
    answer:
      'The Wallet (portfolio) page shows your connected wallet balance, a breakdown of HBAR and SWIND tokens, and lets you add funds (via QR/deposit address), send tokens, and view recent transactions. You need to be logged in to see it.',
  },
  {
    id: '5',
    question: 'What does "Distribute Yield" do on the Creator Dashboard?',
    answer:
      'Creators use this to trigger an on-chain distribution of treasury yield to supporters. It calls the SwiftFund treasury contract on Hedera to send SWIND (or configured rewards) to the list of fans who have funded the project. Only the connected creator account can run this.',
  },
  {
    id: '6',
    question: 'Why Hedera?',
    answer:
      'SwiftFund uses Hedera for fast finality (~200ms), low fees, and EVM compatibility. Smart contracts run on Hedera\'s network so funding and revenue sharing are transparent and on-chain. Your wallet works with Hedera Testnet (and mainnet when configured).',
  },
];

export default function LandingPage() {
  const { authenticated, ready, login } = usePrivy();
  const router = useRouter();
  const [faqOpenId, setFaqOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

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
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-400 mb-2 sm:mb-3"
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
          className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-2 sm:mb-3 leading-[1.1]"
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
          className="font-heading text-sm sm:text-base md:text-lg text-neutral-400 mb-4 sm:mb-6 w-full max-w-4xl leading-relaxed tracking-tight"
        >
          Turn your views into shared value. SwiftFund connects your YouTube channel to the blockchain, automatically sharing a piece of your ad revenue with the fans who support you most with their funds—all powered by secure, transparent smart contracts.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-wrap gap-3 sm:gap-4 justify-center mb-4 sm:mb-6"
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
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap gap-6 sm:gap-8 items-center justify-center border-t border-neutral-800/50 pt-4 sm:pt-6 mt-2 sm:mt-4 w-full max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.75 }}
            className="text-center flex-1 min-w-[5rem] sm:min-w-[6rem]"
          >
            <p className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">200ms</p>
            <p className="font-heading text-[10px] sm:text-xs text-neutral-500 uppercase tracking-widest mt-1">
              Consensus Speed
            </p>
          </motion.div>
          <div className="hidden sm:block w-px h-12 bg-neutral-800" />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.85 }}
            className="text-center flex-1 min-w-[5rem] sm:min-w-[6rem]"
          >
            <p className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">ERC-20</p>
            <p className="font-heading text-[10px] sm:text-xs text-neutral-500 uppercase tracking-widest mt-1">
              EVM Compatible
            </p>
          </motion.div>
          <div className="hidden sm:block w-px h-12 bg-neutral-800" />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.95 }}
            className="text-center flex-1 min-w-[5rem] sm:min-w-[6rem]"
          >
            <p className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">100%</p>
            <p className="font-heading text-[10px] sm:text-xs text-neutral-500 uppercase tracking-widest mt-1">
              On-Chain Oracle
            </p>
          </motion.div>
        </motion.div>
        </main>
      </section>

      {/* Product section: about SwiftFund + Discover CTA */}
      <section className="relative z-10 w-full border-t border-neutral-800/50 bg-neutral-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
            <div className="flex-1 min-w-0">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45 }}
                className="font-heading text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2"
              >
                How it works
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="font-heading text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3"
              >
                Fund creators. Share in their success.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.14 }}
                className="font-heading text-xs sm:text-base text-neutral-400 leading-relaxed tracking-tight max-w-xl"
              >
                Creators list projects; backers fund them and earn a share of future revenue. Everything runs on Hedera—fast, low-cost, and transparent. Browse live projects, fund your favorites, and track rewards from one place.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: 0.2 }}
              >
                <Link
                  href="/discover"
                  className="font-heading inline-flex items-center gap-2 mt-6 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold px-5 py-2.5 text-sm transition-colors"
                >
                  Discover projects
                </Link>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-shrink-0 w-full md:w-72 lg:w-80 flex items-center justify-center min-h-[200px]"
            >
              <img
                src="/images/content-creators-vector.svg"
                alt="Content creators: video, music, and food creators with community engagement"
                className="w-full max-w-sm h-auto object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <section className="relative z-10 w-full border-t border-neutral-800/50 bg-neutral-900/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="mb-6 sm:mb-8 space-y-3 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-heading text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white"
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-heading text-xs sm:text-base text-neutral-400 max-w-2xl mx-auto tracking-tight"
            >
              Answers about using SwiftFund to fund creators and manage your wallet.
            </motion.p>
          </div>
          <div className="space-y-0">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = faqOpenId === item.id;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="relative"
                  style={{ marginTop: index === 0 ? 0 : '-8px' }}
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpenId(isOpen ? null : item.id)}
                    className="w-full text-left rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden transition-colors hover:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-neutral-950"
                    aria-expanded={isOpen}
                    aria-controls={`home-faq-answer-${item.id}`}
                    id={`home-faq-question-${item.id}`}
                  >
                    <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
                      <span className="font-heading text-sm sm:text-base font-semibold text-white pr-8 tracking-tight">
                        {item.question}
                      </span>
                      <span
                        className={`shrink-0 w-8 h-8 rounded-full border border-neutral-600 flex items-center justify-center text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                    <div
                      id={`home-faq-answer-${item.id}`}
                      role="region"
                      aria-labelledby={`home-faq-question-${item.id}`}
                      className={`grid transition-[grid-template-rows] duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 sm:px-6 pb-4 pt-0 border-t border-neutral-800/80">
                          <p className="font-heading text-sm text-neutral-400 leading-relaxed tracking-tight">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full bg-red-600 py-4 sm:py-5"
      >
        <p className="font-heading text-white text-center text-sm sm:text-base tracking-tight w-full max-w-7xl mx-auto px-4">
          © 2026 SwiftFund. All Rights Reserved.
        </p>
      </motion.footer>
    </div>
  );
}
