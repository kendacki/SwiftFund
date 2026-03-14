'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

const SWIND_TOKEN_ID = process.env.NEXT_PUBLIC_SWIND_TOKEN_ID ?? '—';

// Placeholder transaction type; replace with real data from API/chain
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
  const [copied, setCopied] = useState(false);
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

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="text-sm text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span aria-hidden>←</span> Home
          </Link>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            Wallet
          </h1>
        </div>
        <p className="text-sm text-neutral-400">
          View balances, deposit, send tokens, and see SWIND and transaction history.
        </p>

        {!address ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-center">
            <p className="text-neutral-400">Connect your wallet to view your portfolio.</p>
          </div>
        ) : (
          <>
            {/* Balance section */}
            <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
              <div className="border-b border-neutral-800 px-4 sm:px-6 py-3">
                <h2 className="font-heading text-sm font-semibold text-white uppercase tracking-wider">
                  Balances
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
                <div className="p-4 sm:p-6">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Total (est.)</p>
                  <p className="font-heading text-2xl font-bold text-white">—</p>
                  <p className="text-xs text-neutral-500 mt-1">HBAR + SWIND</p>
                </div>
                <div className="p-4 sm:p-6">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">HBAR</p>
                  <p className="font-heading text-2xl font-bold text-red-500">—</p>
                  <p className="text-xs text-neutral-500 mt-1">Native Hedera</p>
                </div>
                <div className="p-4 sm:p-6">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">SWIND</p>
                  <p className="font-heading text-2xl font-bold text-red-500">—</p>
                  <p className="text-xs text-neutral-500 mt-1">Token ID: {SWIND_TOKEN_ID}</p>
                </div>
              </div>
            </section>

            {/* Deposit & Send row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Deposit */}
              <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
                <div className="border-b border-neutral-800 px-4 sm:px-6 py-3 flex items-center justify-between">
                  <h2 className="font-heading text-sm font-semibold text-white uppercase tracking-wider">
                    Deposit
                  </h2>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">Hedera & EVM</span>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  <div>
                    <p className="text-xs text-neutral-500 mb-2">Your address (any chain / Hedera)</p>
                    <div className="flex gap-2">
                      <code className="flex-1 rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-neutral-300 font-mono truncate">
                        {address}
                      </code>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="shrink-0 rounded-lg bg-red-600 hover:bg-red-500 px-3 py-2 text-xs font-semibold text-white transition-colors"
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Send HBAR or SWIND to this address on Hedera Testnet. Use the same address for EVM-compatible chains.
                  </p>
                </div>
              </section>

              {/* Send */}
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
            </div>

            {/* SWIND token card */}
            <section className="rounded-xl border border-red-900/40 bg-red-950/20 overflow-hidden">
              <div className="border-b border-red-900/40 px-4 sm:px-6 py-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <h2 className="font-heading text-sm font-semibold text-red-400 uppercase tracking-wider">
                  SWIND Token
                </h2>
              </div>
              <div className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Token ID (Hedera)</p>
                  <p className="font-mono text-sm text-white">{SWIND_TOKEN_ID}</p>
                </div>
                <a
                  href={`https://hashscan.io/testnet/token/${SWIND_TOKEN_ID}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                >
                  View on HashScan →
                </a>
              </div>
            </section>

            {/* Transactions */}
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
              {MOCK_TXS.length === 0 && (
                <div className="px-4 sm:px-6 py-8 text-center text-neutral-500 text-sm">
                  No transactions yet.
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
