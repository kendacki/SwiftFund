'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

const SWIND_TOKEN_ID = process.env.NEXT_PUBLIC_SWIND_TOKEN_ID ?? '—';

// Placeholder token breakdown; replace with real balances. Logos in public/logos/
const MOCK_TOKENS = [
  { symbol: 'HBAR', name: 'Hedera', amount: '—', equivalent: '—', logo: '/logos/hedera.png' },
  { symbol: 'SWIND', name: 'SwiftFund', amount: '—', equivalent: '—', logo: '/logos/swind.png' },
];

interface TxRow {
  id: string;
  hash: string;
  amount: string;
  tokenType: string;
  time: string;
}

const MOCK_TXS: TxRow[] = [
  { id: '1', hash: '0x7a3f...2e1c', amount: '+1,240 SWIND', tokenType: 'SWIND', time: '2 hours ago' },
  { id: '2', hash: '0x9b2c...4d8a', amount: '-50 HBAR', tokenType: 'HBAR', time: '1 day ago' },
  { id: '3', hash: '0x1e5f...8b3d', amount: '+100 SWIND', tokenType: 'SWIND', time: '3 days ago' },
];

export default function PortfolioPage() {
  const { user } = usePrivy();
  const [address, setAddress] = useState<string | null>(null);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [copied, setCopied] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [sendToken, setSendToken] = useState<'HBAR' | 'SWIND'>('SWIND');
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');

  useEffect(() => {
    if (user?.wallet?.address) {
      setAddress(user.wallet.address);
    }
  }, [user]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = address
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}`
    : '';

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={address ? '/creator' : '/'}
            className="text-sm text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span aria-hidden>←</span> Home
          </Link>
        </div>

        {!address ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-center">
            <p className="text-neutral-400">Connect your wallet to view your portfolio.</p>
          </div>
        ) : (
          <>
            {/* Total balance + Add funds card (reference layout) */}
            <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
              <div className="px-4 sm:px-6 py-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-heading text-3xl sm:text-4xl font-bold text-white">
                    $0.00
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">Total balance</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddFunds(true)}
                  className="rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold px-5 py-2.5 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.25)]"
                >
                  Add funds
                </button>
              </div>

              <div className="border-t border-neutral-800" />

              {/* Breakdown: expandable token list */}
              <button
                type="button"
                onClick={() => setBreakdownOpen((o) => !o)}
                className="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-3 text-left hover:bg-neutral-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-bold text-red-500">
                    S
                  </div>
                  <span className="font-heading text-sm font-medium text-neutral-300">
                    Breakdown
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-neutral-500 transition-transform ${breakdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {breakdownOpen && (
                <div className="border-t border-neutral-800 px-4 sm:px-6 py-4 space-y-3">
                  {MOCK_TOKENS.map((token) => (
                    <div
                      key={token.symbol}
                      className="flex items-center justify-between py-2 border-b border-neutral-800/60 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0 relative">
                          <img
                            src={token.logo}
                            alt={token.name}
                            className="h-full w-full object-contain"
                          />
                          <span className="sr-only">{token.name} logo</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-heading text-sm font-medium text-white">{token.symbol}</p>
                          <p className="text-xs text-neutral-500">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-heading text-sm font-semibold text-white">{token.amount}</p>
                        <p className="text-xs text-neutral-500">{token.equivalent}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Send tokens */}
            <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
              <div className="border-b border-neutral-800 px-4 sm:px-6 py-3">
                <h2 className="font-heading text-sm font-semibold text-white uppercase tracking-wider">
                  Send tokens
                </h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Token</label>
                  <select
                    value={sendToken}
                    onChange={(e) => setSendToken(e.target.value as 'HBAR' | 'SWIND')}
                    className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white focus:border-red-600 outline-none"
                  >
                    <option value="HBAR">HBAR</option>
                    <option value="SWIND">SWIND</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Amount</label>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Recipient address</label>
                  <input
                    type="text"
                    placeholder="0x... or 0.0.x"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-red-600 outline-none font-mono"
                  />
                </div>
                <button
                  type="button"
                  className="w-full rounded-lg bg-red-600 hover:bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  disabled={!sendAmount || !sendTo}
                >
                  Send
                </button>
              </div>
            </section>

            {/* Recent transactions */}
            <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
              <div className="border-b border-neutral-800 px-4 sm:px-6 py-3">
                <h2 className="font-heading text-sm font-semibold text-white uppercase tracking-wider">
                  Recent transactions
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-500">
                      <th className="px-4 sm:px-6 py-3 font-heading font-semibold">Transaction</th>
                      <th className="px-4 sm:px-6 py-3 font-heading font-semibold">Amount</th>
                      <th className="px-4 sm:px-6 py-3 font-heading font-semibold">Token</th>
                      <th className="px-4 sm:px-6 py-3 font-heading font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_TXS.map((tx) => (
                      <tr key={tx.id} className="border-b border-neutral-800/80 last:border-0">
                        <td className="px-4 sm:px-6 py-3 font-mono text-neutral-300">{tx.hash}</td>
                        <td className="px-4 sm:px-6 py-3 font-heading text-white">{tx.amount}</td>
                        <td className="px-4 sm:px-6 py-3 text-neutral-400">{tx.tokenType}</td>
                        <td className="px-4 sm:px-6 py-3 text-neutral-500">{tx.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Add funds modal: QR + address */}
      {showAddFunds && address && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowAddFunds(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-funds-title"
        >
          <div
            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 id="add-funds-title" className="font-heading text-lg font-semibold text-white">
                Add funds
              </h2>
              <button
                type="button"
                onClick={() => setShowAddFunds(false)}
                className="text-neutral-500 hover:text-white transition-colors p-1"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div className="rounded-lg bg-white p-2 mb-4">
                <img
                  src={qrUrl}
                  alt="Wallet address QR code"
                  width={200}
                  height={200}
                  className="w-[200px] h-[200px]"
                />
              </div>
              <p className="text-xs text-neutral-500 mb-2 w-full text-center">Wallet address</p>
              <code className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-300 font-mono break-all text-center mb-3">
                {address}
              </code>
              <button
                type="button"
                onClick={copyAddress}
                className="w-full rounded-lg bg-red-600 hover:bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                {copied ? 'Copied' : 'Copy address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}