'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

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
      'SwiftFund uses Hedera for fast finality (~200ms), low fees, and EVM compatibility. Smart contracts run on Hedera’s network so funding and revenue sharing are transparent and on-chain. Your wallet works with Hedera Testnet (and mainnet when configured).',
  },
].map((item, i) => ({ ...item, id: item.id ?? String(i + 1) }));

export default function FAQPage() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-sm text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1 mb-6"
        >
          <span aria-hidden>←</span> Home
        </Link>
        <div className="mb-6 sm:mb-8 space-y-3 text-center sm:text-left">
          <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            Frequently Asked Questions
          </h1>
          <p className="font-heading text-xs sm:text-base text-neutral-400 max-w-2xl mx-auto sm:mx-0 tracking-tight">
            Answers about using SwiftFund to fund creators and manage your wallet.
          </p>
        </div>

        <div className="space-y-0">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="relative"
                style={{ marginTop: index === 0 ? 0 : '-8px' }}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="w-full text-left rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden transition-colors hover:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-neutral-950"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  id={`faq-question-${item.id}`}
                >
                  <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
                    <span className="font-heading text-sm sm:text-base font-semibold text-white pr-8 tracking-tight">
                      {item.question}
                    </span>
                    <span
                      className={`shrink-0 w-8 h-8 rounded-full border border-neutral-600 flex items-center justify-center text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  </div>
                  <div
                    id={`faq-answer-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-question-${item.id}`}
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
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
