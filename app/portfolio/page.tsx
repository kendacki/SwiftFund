'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/Button';
import { claimYield } from '@/lib/fundCreator';
import {
  TREASURY_EVM_ADDRESS,
  SWIFT_FUND_TREASURY_ABI,
} from '@/constants/contracts';

// Fixed SWIND token ID on Hedera testnet.
const SWIND_TOKEN_ID = '0.0.8216024';

/** Mock USD price for SWIND (testnet token; no market). */
const SWIND_MOCK_PRICE = 0.05;

// Logos in public/logos/
const TOKENS = [
  { symbol: 'HBAR', name: 'Hedera', logo: '/logos/hedera.png' },
  { symbol: 'SWIND', name: 'SwiftFund', logo: '/logos/swiftfund-logo.png' },
] as const;

type TokenSymbol = (typeof TOKENS)[number]['symbol'];

interface DashboardTx {
  id: string;
  hash: string;
  amount: string;
  tokenType: TokenSymbol | string;
  time: string;
}

/** Funded project entry for claim yield list (from API or mock). */
interface FundedProject {
  creatorAddress: string;
  label: string;
  projectName?: string;
}

interface ClaimCard extends FundedProject {
  claimable: number;
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32 24" className="animate-spin" style={{ transformOrigin: '12px 12px' }} />
    </svg>
  );
}

export default function PortfolioPage() {
  const { user, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const [address, setAddress] = useState<string | null>(null);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [sendToken, setSendToken] = useState<'HBAR' | 'SWIND'>('SWIND');
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  // Dashboard state
  const [hbarBalance, setHbarBalance] = useState<number>(0);
  const [swindBalance, setSwindBalance] = useState<number>(0);
  const [hbarUsdPrice, setHbarUsdPrice] = useState<number>(0);
  const [transactions, setTransactions] = useState<DashboardTx[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Claim yield (funder pull)
  const [claimCards, setClaimCards] = useState<ClaimCard[]>([]);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [claimingCreator, setClaimingCreator] = useState<string | null>(null);
  const [claimCreatorInput, setClaimCreatorInput] = useState('');
  const [txFilter, setTxFilter] = useState<'recent' | 'day' | 'month' | 'all'>('recent');

  const totalUsdBalance =
    hbarBalance * hbarUsdPrice + swindBalance * SWIND_MOCK_PRICE;

  // Resolve the active wallet address from Privy.
  useEffect(() => {
    const primaryWallet = wallets[0];
    if (primaryWallet?.address) {
      setAddress(primaryWallet.address);
      return;
    }
    if (user?.wallet?.address) {
      setAddress(user.wallet.address);
    }
  }, [wallets, user]);

  // Fetch live dashboard data (balances + recent transactions) from Hedera mirror node.
  useEffect(() => {
    if (!address) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // 0) Fetch live HBAR/USD exchange rate (current_rate.cent_equivalent / hbar_equivalent / 100 = USD per HBAR).
        try {
          const rateRes = await fetch(
            'https://testnet.mirrornode.hedera.com/api/v1/network/exchangerate'
          );
          if (rateRes.ok) {
            const rateJson = await rateRes.json();
            const current = rateJson?.current_rate;
            const cent = current?.cent_equivalent;
            const hbarEq = current?.hbar_equivalent;
            if (
              typeof cent === 'number' &&
              typeof hbarEq === 'number' &&
              hbarEq > 0
            ) {
              const usdPerHbar = cent / hbarEq / 100;
              if (!cancelled) setHbarUsdPrice(usdPerHbar);
            }
          }
        } catch {
          // Keep previous hbarUsdPrice on failure
        }

        // 1) Resolve Hedera account ID from the wallet address (EVM or account form).
        const accountRes = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/accounts/${address}`
        );
        if (!accountRes.ok) {
          if (!cancelled) {
            setHbarBalance(0);
            setSwindBalance(0);
            setTransactions([]);
          }
          return;
        }

        const accountJson = await accountRes.json();
        const accountId: string | undefined = accountJson?.account;
        if (!accountId) {
          if (!cancelled) {
            setHbarBalance(0);
            setSwindBalance(0);
            setTransactions([]);
          }
          return;
        }

        // 2) Balances
        const balancesRes = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/balances?account.id=${accountId}`
        );
        if (balancesRes.ok) {
          const balancesJson = await balancesRes.json();
          const entry = Array.isArray(balancesJson?.balances)
            ? balancesJson.balances[0]
            : null;
          const tinybar: number | undefined = entry?.balance;
          const tokens: { token_id: string; balance: number }[] =
            entry?.tokens ?? [];

          if (typeof tinybar === 'number') {
            const hbar = tinybar / 1e8;
            if (!cancelled) setHbarBalance(hbar);
          }

          const swindToken = tokens.find((t) => t.token_id === SWIND_TOKEN_ID);
          if (swindToken && typeof swindToken.balance === 'number') {
            // SWIND uses 2 decimals: raw balance 10000 => 100.00 SWIND
            const swind = swindToken.balance / 100;
            if (!cancelled) setSwindBalance(swind);
          } else if (!cancelled) {
            setSwindBalance(0);
          }
        }

        // 3) Recent transactions
        const txRes = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/transactions?account.id=${accountId}&limit=10&order=desc`
        );

        if (txRes.ok) {
          const txJson = await txRes.json();
          const txs: any[] = Array.isArray(txJson?.transactions)
            ? txJson.transactions
            : [];

          const mapped: DashboardTx[] = txs.map((tx, idx) => {
            const consensus = tx.consensus_timestamp as string | undefined;
            let time = '—';
            if (consensus) {
              const [secondsStr] = consensus.split('.');
              const seconds = Number(secondsStr);
              if (!Number.isNaN(seconds)) {
                time = new Date(seconds * 1000).toLocaleString();
              }
            }

            // Default type
            let tokenType: TokenSymbol | string = 'HBAR';
            let amountLabel = '—';

            // Prefer token transfers for SWIND, otherwise HBAR transfers.
            const tokenTransfers: any[] = tx.token_transfers ?? [];
            const swindTransfer = tokenTransfers.find(
              (t) => t.account === accountId && t.token_id === SWIND_TOKEN_ID
            );

            if (swindTransfer) {
              const raw = Number(swindTransfer.amount ?? 0);
              const sign = raw > 0 ? '+' : '';
              // SWIND uses 2 decimals in Mirror Node history as well.
              const amt = Math.abs(raw) / 100;
              tokenType = 'SWIND';
              amountLabel = `${sign}${amt.toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })} SWIND`;
            } else if (Array.isArray(tx.transfers)) {
              const ownTransfer = tx.transfers.find(
                (t: any) => t.account === accountId
              );
              if (ownTransfer) {
                const raw = Number(ownTransfer.amount ?? 0);
                const sign = raw > 0 ? '+' : '';
                const amt = Math.abs(raw) / 1e8;
                tokenType = 'HBAR';
                amountLabel = `${sign}${amt.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })} HBAR`;
              }
            }

            const hash =
              (tx.transaction_hash as string | undefined) ??
              (tx.transaction_id as string | undefined) ??
              '—';

            const shortHash =
              typeof hash === 'string' && hash.length > 16
                ? `${hash.slice(0, 10)}…${hash.slice(-6)}`
                : hash;

            return {
              id: `${tx.transaction_id ?? idx}`,
              hash: shortHash,
              amount: amountLabel,
              tokenType,
              time,
            };
          });

          if (!cancelled) {
            setTransactions(mapped);
          }
        }
      } catch {
        if (!cancelled) {
          setTransactions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchDashboardData();
    // Poll every 15 seconds
    intervalId = setInterval(fetchDashboardData, 15000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [address]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch funded projects (creators the user has funded on Discover) and compute live claimable yield.
  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    const loadClaimCards = async () => {
      try {
        const token = await getAccessToken();
        if (cancelled) return;

        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/portfolio/funded', { headers });
        const data = (res.ok ? await res.json() : { projects: [] }) as {
          projects?: (FundedProject & { projectName?: string })[];
        };
        const projects: FundedProject[] = Array.isArray(data?.projects)
          ? data.projects
          : [];

        if (projects.length === 0) {
          if (!cancelled) setClaimCards([]);
          return;
        }

        // Try to use the connected wallet provider for on-chain read calls.
        const wallet = wallets[0];
        if (!wallet?.getEthereumProvider) {
          if (!cancelled) {
            setClaimCards(
              projects.map((p) => ({
                ...p,
                claimable: 0,
              }))
            );
          }
          return;
        }

        const provider = new ethers.BrowserProvider(
          await wallet.getEthereumProvider()
        );
        const contract = new ethers.Contract(
          TREASURY_EVM_ADDRESS,
          SWIFT_FUND_TREASURY_ABI,
          provider
        );

        const cards: ClaimCard[] = [];
        for (const project of projects) {
          let claimable = 0;
          try {
            const raw: bigint = await contract.claimableByCreatorByFunder(
              project.creatorAddress,
              address
            );
            // claimable is denominated in HBAR with 18 decimals (parseEther on write).
            const asHbar = parseFloat(ethers.formatEther(raw));
            claimable = Number.isFinite(asHbar) ? asHbar : 0;
          } catch {
            claimable = 0;
          }
          cards.push({
            ...project,
            claimable,
          });
        }

        if (!cancelled) setClaimCards(cards);
      } catch {
        if (!cancelled) setClaimCards([]);
      }
    };

    loadClaimCards();
    return () => {
      cancelled = true;
    };
  }, [address, getAccessToken, wallets]);

  const handleClaimYield = async (creatorAddress: string) => {
    const wallet = wallets[0];
    if (!wallet?.getEthereumProvider) {
      setClaimStatus('Wallet not ready. Please connect your wallet and try again.');
      return;
    }
    const card = claimCards.find((c) => c.creatorAddress === creatorAddress);
    if (!card || card.claimable <= 0) {
      setClaimStatus('No yield available to claim for this project.');
      return;
    }
    setClaimingCreator(creatorAddress);
    setClaimStatus(null);
    try {
      const provider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const { hash } = await claimYield(signer, creatorAddress);
      setClaimStatus(`Yield claimed successfully! Tx: ${hash.slice(0, 10)}…${hash.slice(-8)}`);
      setTimeout(() => setClaimStatus(null), 5000);
      // Optimistically zero out claimable yield for this card.
      setClaimCards((prev) =>
        prev.map((c) =>
          c.creatorAddress === creatorAddress ? { ...c, claimable: 0 } : c
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claim failed.';
      const friendly =
        msg.includes('NothingToClaim') || msg.includes('nothing to claim')
          ? 'No new yield available to claim at this time.'
          : msg.includes('user rejected') || msg.includes('denied')
            ? 'Transaction was rejected.'
            : msg;
      setClaimStatus(friendly);
    } finally {
      setClaimingCreator(null);
    }
  };

  const qrUrl = address
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}`
    : '';

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {!address ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-center"
          >
            <p className="font-heading text-neutral-400 tracking-tight">
              Connect your wallet to view your portfolio.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Total balance + Add funds card (reference layout) */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:bg-neutral-900/80"
            >
              <div className="px-4 sm:px-6 py-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    {Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(totalUsdBalance)}
                  </p>
                  <p className="font-heading text-sm text-neutral-500 mt-1 tracking-tight">
                    Total balance
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddFunds(true)}
                    className="rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold px-5 py-2.5 transition-all duration-200 hover:scale-[1.02] shadow-[0_0_20px_rgba(220,38,38,0.25)]"
                  >
                    Add funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSendModalOpen(true)}
                    className="rounded-xl border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-100 font-semibold px-5 py-2.5 transition-all duration-200 hover:scale-[1.02]"
                  >
                    Send
                  </button>
                </div>
              </div>

              <div className="border-t border-neutral-800" />

              {/* Breakdown: expandable token list */}
              <button
                type="button"
                onClick={() => setBreakdownOpen((o) => !o)}
                className="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-3 text-left hover:bg-neutral-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-2">
                    <img
                      src="/logos/hedera.png"
                      alt=""
                      className="h-6 w-6 rounded-full border-2 border-neutral-900 object-cover shrink-0"
                      aria-hidden
                    />
                    <img
                      src="/logos/swiftfund-logo.png"
                      alt=""
                      className="h-6 w-6 rounded-full border-2 border-neutral-900 object-cover shrink-0"
                      aria-hidden
                    />
                  </div>
                  <span className="font-heading text-sm font-medium text-neutral-300 tracking-tight">
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
                  {TOKENS.map((token) => (
                    <div
                      key={token.symbol}
                      className="flex items-center justify-between py-2 border-b border-neutral-800/60 last:border-0 transition-all duration-200 hover:bg-neutral-900 hover:scale-[1.01] rounded-lg"
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
                          <p className="font-heading text-sm font-medium text-white tracking-tight">{token.symbol}</p>
                              <p className="font-heading text-xs text-neutral-500 tracking-tight">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-heading text-sm font-semibold text-white tracking-tight">
                          {token.symbol === 'HBAR'
                            ? `${hbarBalance.toLocaleString(undefined, {
                                maximumFractionDigits: 4,
                              })} HBAR`
                            : `${swindBalance.toLocaleString(undefined, {
                                maximumFractionDigits: 4,
                              })} SWIND`}
                        </p>
                        <p className="font-heading text-xs text-neutral-500 tracking-tight">
                          {token.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>

            {/* Send tokens moved into modal; inline card removed */}

            {/* Claim yield (funder pull) */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:bg-neutral-900/80"
            >
              <div className="border-b border-neutral-800 px-4 sm:px-6 py-3">
                <h2 className="font-heading text-sm font-semibold text-white uppercase tracking-wider">
                  Claim yield
                </h2>
                <p className="font-heading text-xs text-neutral-500 mt-1 tracking-tight">
                  Claim your share of yield from creators you have funded.
                </p>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                {claimCards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {claimCards.map((card) => {
                      const hasYield = card.claimable > 0;
                      const isCardClaiming =
                        claimingCreator === card.creatorAddress;
                      return (
                        <div
                          key={card.creatorAddress}
                          className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 shadow-[0_0_20px_rgba(0,0,0,0.35)] transition-all duration-200 hover:scale-[1.02] hover:bg-neutral-900"
                        >
                          <div className="mb-3">
                            <p className="font-heading text-sm font-semibold text-white tracking-tight truncate">
                              {card.projectName || card.label}
                            </p>
                            <p className="font-mono text-[11px] text-neutral-500 mt-1 break-all">
                              {card.creatorAddress.slice(0, 10)}…
                              {card.creatorAddress.slice(-8)}
                            </p>
                          </div>
                          <div className="mb-3">
                            <p className="font-heading text-xs text-neutral-500 tracking-tight">
                              Available yield
                            </p>
                            <p className="font-heading text-sm font-semibold text-emerald-300 tracking-tight mt-0.5">
                              {hasYield
                                ? `${card.claimable.toLocaleString(undefined, {
                                    maximumFractionDigits: 6,
                                  })} HBAR`
                                : '0 HBAR'}
                            </p>
                          </div>
                          <div className="mt-auto">
                            <Button
                              type="button"
                              onClick={() =>
                                hasYield && handleClaimYield(card.creatorAddress)
                              }
                              disabled={!hasYield || isCardClaiming}
                              className="w-full disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isCardClaiming ? (
                                <>
                                  <SpinnerIcon className="h-4 w-4 animate-spin shrink-0 mr-2" />
                                  Claiming…
                                </>
                              ) : hasYield ? (
                                'Claim Yield'
                              ) : (
                                'No Yield Available'
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="font-heading text-sm text-neutral-500 tracking-tight">
                      You do not have any funded projects with claimable yield
                      yet. Visit Discover to back a creator and start earning.
                    </p>
                    <Button
                      type="button"
                      onClick={() => (window.location.href = '/discover')}
                      className="text-sm"
                    >
                      Go to Discover
                    </Button>
                  </div>
                )}
                {claimStatus && (
                  <p
                    className={`text-xs whitespace-pre-wrap rounded-lg p-2 border ${
                      claimStatus.startsWith('Yield claimed successfully')
                        ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                        : 'text-red-300 bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    {claimStatus}
                  </p>
                )}
              </div>
            </motion.section>

            {/* Recent transactions */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden"
            >
              <div className="border-b border-neutral-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-sm font-semibold text-white uppercase tracking-wider">
                  Transaction history
                </h2>
                <div className="flex bg-neutral-900/80 border border-neutral-800 rounded-lg p-1">
                  {(['recent', 'day', 'month', 'all'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setTxFilter(filter)}
                      className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                        txFilter === filter
                          ? 'bg-neutral-800 text-white shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
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
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 sm:px-6 py-4 text-center text-xs text-neutral-500"
                        >
                          Loading transactions…
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 sm:px-6 py-4 text-center text-xs text-neutral-500"
                        >
                          No recent transactions found.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b border-neutral-800/80 last:border-0 transition-all duration-200 hover:bg-neutral-900 hover:scale-[1.01]"
                        >
                          <td className="px-4 sm:px-6 py-3 font-mono text-neutral-300">{tx.hash}</td>
                          <td className="px-4 sm:px-6 py-3 font-heading text-white">{tx.amount}</td>
                          <td className="px-4 sm:px-6 py-3 text-neutral-400">{tx.tokenType}</td>
                          <td className="px-4 sm:px-6 py-3 text-neutral-500">{tx.time}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.section>
          </>
        )}
      </div>

      {/* Send funds modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-white tracking-tight">
                Send Funds
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsSendModalOpen(false);
                  setSendError(null);
                }}
                className="text-neutral-500 hover:text-white transition-colors p-1"
                aria-label="Close send modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
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
                <label className="block text-xs text-neutral-500 mb-1">Amount (USD)</label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={sendAmount}
                  onChange={(e) => {
                    setSendAmount(e.target.value);
                    setSendError(null);
                  }}
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Recipient address</label>
                <input
                  type="text"
                  placeholder="Enter wallet address (0x... or 0.0...)"
                  value={sendTo}
                  onChange={(e) => {
                    setSendTo(e.target.value);
                    setSendError(null);
                  }}
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-red-600 outline-none font-mono"
                />
              </div>

              {sendError && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                  {sendError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSendModalOpen(false);
                    setSendError(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-neutral-700 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSendError(null);
                    const amt = sendAmount.trim();
                    const to = sendTo.trim();
                    if (!amt || !to) {
                      setSendError('Please enter a valid amount and recipient address.');
                      return;
                    }
                    if (Number.isNaN(Number(amt)) || Number(amt) <= 0) {
                      setSendError('Please enter a positive amount.');
                      return;
                    }
                    // TODO: wire to actual send transaction
                    setSendError('Send is not yet connected to the network. Coming soon.');
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-colors"
                >
                  Review Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <h2 id="add-funds-title" className="font-heading text-lg font-semibold text-white tracking-tight">
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
              <p className="font-heading text-xs text-neutral-500 mb-2 w-full text-center tracking-tight">Wallet address</p>
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