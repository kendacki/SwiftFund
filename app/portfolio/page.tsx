'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/Button';
import { claimYield } from '@/lib/fundCreator';
import {
  TREASURY_EVM_ADDRESS,
  SWIFT_FUND_TREASURY_ABI,
} from '@/constants/contracts';

// Fixed SWIND token ID on Hedera testnet.
const SWIND_TOKEN_ID = '0.0.8216024';

// Logos in public/logos/
const TOKENS = [
  { symbol: 'HBAR', name: 'Hedera', logo: '/logos/hedera-hbar.png' },
  { symbol: 'SWIND', name: 'SwiftFund', logo: '/logos/swiftfund-logo.png' },
  { symbol: 'USDC', name: 'USD', logo: '/usdc.png' },
] as const;

type TokenSymbol = (typeof TOKENS)[number]['symbol'];

interface DashboardTx {
  id: string;
  hash: string;
  amount: string;
  tokenType: TokenSymbol | string;
  time: string;
  from?: string;
  to?: string;
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
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [sendToken, setSendToken] = useState<'HBAR' | 'SWIND'>('SWIND');
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Swap/Bridge state (demo)
  const [isSwapLoading, setIsSwapLoading] = useState(false);
  const [swapFromToken, setSwapFromToken] = useState<'USDC' | 'HBAR'>('USDC');
  const [swapToToken, setSwapToToken] = useState<'USDC' | 'HBAR'>('HBAR');
  const [swapFromAmount, setSwapFromAmount] = useState<string>('0');
  const [swapHederaAccountId, setSwapHederaAccountId] = useState<string>('');

  // Dashboard state
  const [hbarBalance, setHbarBalance] = useState<number>(0);
  const [swindBalance, setSwindBalance] = useState<number>(0);
  const [usdcAmount, setUsdcAmount] = useState<number>(0);
  const [hbarUsdPrice, setHbarUsdPrice] = useState<number>(0);
  const [transactions, setTransactions] = useState<DashboardTx[]>([]);
  const [usdcTransactions, setUsdcTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Claim yield (funder pull)
  const [claimCards, setClaimCards] = useState<ClaimCard[]>([]);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [claimingCreator, setClaimingCreator] = useState<string | null>(null);
  const [claimCreatorInput, setClaimCreatorInput] = useState('');
  const [txFilter, setTxFilter] = useState<'recent' | 'day' | 'month' | 'all'>('recent');

  // Mock "Claimable Yield" dashboard (demo)
  const [claimableYields, setClaimableYields] = useState<
    Array<{ id: number; creator: string; yieldAmount: number; asset: 'HBAR' | 'SWIND' }>
  >([]);
  const [isClaimingYield, setIsClaimingYield] = useState<number | null>(null);

  // Live token prices for allocation donut (HBAR from CoinCap, SWIND fixed demo)
  const [hbarPrice, setHbarPrice] = useState<number>(0.1142);
  const [swindPrice] = useState<number>(0.05);

  const [usdcPrice] = useState<number>(1.0); // USDC is pegged to $1
  // Single source of truth for portfolio math
  const hbarAmount = hbarBalance;
  const swindAmount = swindBalance;
  const hbarUsdValue = hbarAmount * hbarPrice;
  const swindUsdValue = swindAmount * swindPrice;
  const usdcUsdValue = usdcAmount * usdcPrice;
  const totalUsdBalance = hbarUsdValue + swindUsdValue + usdcUsdValue;

  const rawAllocationData = [
    {
      name: 'Hedera (HBAR)',
      value: hbarUsdValue,
      raw: `${hbarAmount} HBAR`,
      color: '#8b5cf6',
      icon: '/logos/hedera-hbar.png',
    },
    {
      name: 'SwiftFund (SWIND)',
      value: swindUsdValue,
      raw: `${swindAmount} SWIND`,
      color: '#10b981',
      icon: '/logos/swiftfund-logo.png',
    },
    {
      name: 'USD Coin (USDC)',
      value: usdcUsdValue,
      raw: `${usdcAmount} USDC`,
      color: '#3b82f6',
      icon: '/usdc.png',
    },
  ];

  // This physically removes USDC from the UI for non-admins
  const filteredAllocationData = rawAllocationData.filter(
    (asset) => asset.value > 0
  );

  const toast = {
    loading: (message: string) => {
      setToastMessage(message);
    },
    error: (message: string) => {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 3500);
    },
    success: (message: string) => {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 3000);
    },
  };

  const swapFromAmountNum = Number(swapFromAmount) || 0;
  const swapToAmountNum =
    swapFromToken === 'USDC' && swapToToken === 'HBAR'
      ? hbarPrice > 0
        ? swapFromAmountNum / hbarPrice
        : 0
      : swapFromToken === 'HBAR' && swapToToken === 'USDC'
        ? swapFromAmountNum * hbarPrice
        : swapFromAmountNum;
  const swapToAmountStr = swapToAmountNum.toFixed(6);

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

  // Fetch live Sepolia USDC balance for the connected Privy wallet.
  useEffect(() => {
    const fetchLiveUsdc = async () => {
      try {
        const activeWallet = wallets[0];
        if (!activeWallet) return;

        // 1) Fetch the total balance (works regardless of wallet network)
        const provider = new ethers.JsonRpcProvider(
          'https://ethereum-sepolia-rpc.publicnode.com'
        );

        const usdcAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
        const usdcAbi = ['function balanceOf(address owner) view returns (uint256)'];
        const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, provider);

        const balance = await usdcContract.balanceOf(activeWallet.address);
        const formattedBalance = parseFloat(ethers.formatUnits(balance, 6));
        setUsdcAmount(formattedBalance);

        // 2) Fetch real USDC transfer history from Sepolia Etherscan
        const etherscanUrl = `https://api-sepolia.etherscan.io/api?module=account&action=tokentx&contractaddress=${usdcAddress}&address=${activeWallet.address}&page=1&offset=50&sort=desc`;

        const historyRes = await fetch(etherscanUrl);
        const historyData = await historyRes.json();

        console.log('🔍 DEBUG: Etherscan API Response:', historyData);

        if (historyData?.status === '1' && Array.isArray(historyData?.result) && historyData.result.length > 0) {
          const addrLower = activeWallet.address.toLowerCase();

          const realUsdcTransactions = historyData.result.map((tx: any) => ({
            id: tx.hash,
            type:
              tx.to.toLowerCase() === addrLower
                ? 'Receive'
                : 'Send',
            asset: 'USDC',
            amount: parseFloat(ethers.formatUnits(tx.value, 6)),
            date: new Date(parseInt(tx.timeStamp) * 1000).toLocaleString(),
            icon: '/usdc.png',
            status: 'Completed',
            from: tx.from,
            to: tx.to,
          }));

          // Set to our isolated state instead of the shared state
          setUsdcTransactions(realUsdcTransactions);
        } else {
          console.log('⚠️ DEBUG: Etherscan returned no transactions or an error.');
        }
      } catch (error) {
        console.error('❌ Failed to fetch live USDC data:', error);
      }
    };

    fetchLiveUsdc();
  }, [wallets]);

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

  // Fetch live HBAR price from CoinCap for allocation donut
  useEffect(() => {
    let isMounted = true;
    const fetchHbarPrice = async () => {
      try {
        const res = await fetch('https://api.coincap.io/v2/assets/hedera-hashgraph', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Rate limited');
        const json = await res.json();
        if (json?.data?.priceUsd && isMounted) {
          setHbarPrice(parseFloat(json.data.priceUsd));
        }
      } catch {
        console.warn('CoinCap API fallback triggered. Using default HBAR price.');
        // Silently rely on default 0.1142 state
      }
    };
    fetchHbarPrice();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleClaimMockYield = (id: number) => {
    const item = claimableYields.find((y) => y.id === id);
    if (!item) return;
    setIsClaimingYield(id);

    setTimeout(() => {
      // Optimistically remove the item so UI feels instant.
      setClaimableYields((prev) => prev.filter((y) => y.id !== id));
      toast.success(
        `Successfully claimed ${item.yieldAmount.toFixed(2)} ${item.asset}!`
      );
      setIsClaimingYield(null);
    }, 2000);
  };

  const handleSwap = async () => {
    const setIsSwapping = setIsSwapLoading;
    const swapAmount = swapFromAmount;

    setIsSwapping(true);
    try {
      const activeWallet = wallets[0];
      if (!activeWallet) throw new Error('Please connect a wallet first.');

      if (swapFromToken !== 'USDC') {
        throw new Error('Swap currently supports USDC → HBAR only.');
      }

      const amountNum = Number(swapAmount);
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        throw new Error('Enter a valid USDC amount.');
      }

      // 1. Unify external + embedded wallets via Privy
      const provider = await activeWallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      // 2. Setup real USDC ERC-20 transfer interaction
      const usdcAbi = ['function transfer(address to, uint256 amount) returns (bool)'];
      const usdcAddress =
        process.env.NEXT_PUBLIC_TESTNET_USDC_ADDRESS || '0xYourTestnetUSDC';
      const treasuryAddress =
        process.env.NEXT_PUBLIC_EVM_TREASURY || '0xYourTreasury';

      const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, signer);
      const amountInUnits = ethers.parseUnits(amountNum.toString(), 6);

      toast.loading('Initiating USDC transfer...');
      const tx = await usdcContract.transfer(treasuryAddress, amountInUnits);

      toast.loading('Waiting for EVM block confirmation...');
      await tx.wait();

      const hederaAccountId = swapHederaAccountId.trim();
      if (!hederaAccountId) {
        throw new Error('Enter your Hedera account ID (0.0.xxxxx).');
      }

      toast.loading('Verifying with Cross-Chain Oracle...');
      const response = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evmTxHash: tx.hash,
          hederaAccountId,
          amount: swapAmount,
        }),
      });

      const result = await response.json();
      if (result?.success) {
        setTransactions((prev) => [
          {
            id: `${Date.now()}-usdc-swap`,
            hash: tx.hash.slice(0, 8) + '…' + tx.hash.slice(-6),
            amount: `-${amountNum.toLocaleString(undefined, { maximumFractionDigits: 6 })} USDC`,
            tokenType: 'USDC',
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
        toast.success(`Swap Complete! Hedera Tx: ${result.hederaTxId}`);
        setIsSwapModalOpen(false);
      } else {
        throw new Error(result?.error || 'Swap failed.');
      }
    } catch (error: any) {
      console.error('Swap Error:', error);
      toast.error(error?.message || 'Swap failed.');
    } finally {
      setIsSwapping(false);
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
                    {totalUsdBalance > 0
                      ? Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(totalUsdBalance)
                      : '$0.00'}
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
                    className="min-w-[8.5rem] inline-flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-100 font-semibold px-5 py-2.5 transition-all duration-200 hover:scale-[1.02]"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSwapModalOpen(true)}
                    className="min-w-[8.5rem] inline-flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-100 font-semibold px-5 py-2.5 transition-all duration-200 hover:scale-[1.02]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-neutral-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h10M7 7l3-3M7 7l3 3M17 17H7m10 0l-3 3m3-3l-3-3"
                        />
                      </svg>
                      Swap
                    </span>
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
                      src="/logos/hedera-hbar.png"
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
                    <img
                      src="/usdc.png"
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
                            : token.symbol === 'SWIND'
                            ? `${swindBalance.toLocaleString(undefined, {
                                maximumFractionDigits: 4,
                              })} SWIND`
                            : `${usdcAmount.toLocaleString()} USDC`}
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

            {/* Portfolio allocation donut chart */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden"
            >
              <div className="border-b border-neutral-800 px-4 sm:px-6 py-3 flex items-center justify-between">
                <h2 className="font-heading text-sm font-semibold text-white uppercase tracking-wider">
                  Portfolio allocation
                </h2>
                <p className="text-[11px] text-neutral-500">
                  Live HBAR price via CoinCap
                </p>
              </div>
              <div className="px-4 sm:px-6 py-4 grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 items-center">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredAllocationData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="60%"
                        outerRadius="90%"
                        stroke="none"
                      >
                        {filteredAllocationData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          border: '1px solid #1f2937',
                          borderRadius: 8,
                          padding: '8px 10px',
                        }}
                        formatter={(value: number, name, props: any) => {
                          const usd = value || 0;
                          const label =
                            props && props.payload && props.payload.raw
                              ? props.payload.raw
                              : name;
                          return [
                            usd.toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }),
                            label,
                          ];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-4 w-full mt-6 md:mt-0">
                  {filteredAllocationData.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between w-full p-2 hover:bg-neutral-800/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* The Physical Asset Logo */}
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center p-2 border border-neutral-700 shrink-0">
                          <img
                            src={entry.icon}
                            alt={entry.name}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Asset Name, Dot, and Raw Balance */}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: entry.color }}
                            ></span>
                            <span className="text-white font-bold text-sm md:text-base">
                              {entry.name}
                            </span>
                          </div>
                          <span className="text-neutral-400 text-xs md:text-sm">
                            {entry.raw}
                          </span>
                        </div>
                      </div>

                      {/* Total USD Value */}
      <span className="text-white font-mono font-bold">
        ${entry.value.toFixed(2)}
      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Claimable Yield from Creators (demo) */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:bg-neutral-900/80"
            >
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Claimable Yield from Creators
                </h3>

                {claimableYields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-neutral-900/60 border border-neutral-800 rounded-xl text-center border-dashed">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-xl">
                      🌟
                    </div>
                    <p className="text-neutral-300 font-medium mb-2">
                      No Claimable Yield Yet
                    </p>
                    <p className="text-neutral-500 text-sm mb-6 max-w-sm">
                      Fund creators on the platform to start earning a share
                      of their YouTube ad revenue.
                    </p>
                    <Link
                      href="/discover"
                      className="bg-white text-black px-6 py-2.5 rounded-lg font-bold hover:bg-neutral-200 transition-all duration-200"
                    >
                      Discover Creators
                    </Link>
                  </div>
                ) : (
                  <div>
                    {claimableYields.map((creator) => (
                      <div
                        key={creator.id}
                        className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 flex justify-between items-center mb-3"
                      >
                        <div>
                          <p className="font-heading text-sm font-semibold text-white tracking-tight">
                            {creator.creator}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Ad Revenue Share
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-300 font-mono drop-shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                              {creator.yieldAmount.toFixed(2)} {creator.asset}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={isClaimingYield === creator.id}
                            onClick={() => handleClaimMockYield(creator.id)}
                            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold disabled:bg-emerald-600/80 disabled:cursor-wait transition-all"
                          >
                            {isClaimingYield === creator.id ? (
                              <span className="inline-flex items-center gap-2 justify-center">
                                <SpinnerIcon className="h-4 w-4 animate-spin shrink-0" />
                                Claiming...
                              </span>
                            ) : (
                              'Claim'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>

            {/* Send tokens moved into modal; inline card removed */}

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
                      [...transactions, ...usdcTransactions]
                        .sort(
                          (a: any, b: any) =>
                            new Date(b.date ?? b.time).getTime() -
                            new Date(a.date ?? a.time).getTime()
                        )
                        .map((tx: any) => (
                        <tr
                          key={tx.id}
                          className="border-b border-neutral-800/80 last:border-0 transition-all duration-200 hover:bg-neutral-900 hover:scale-[1.01]"
                        >
                          <td className="px-4 sm:px-6 py-3 font-mono text-neutral-300">
                            {tx.from ? (
                              <span title={tx.from}>
                                {tx.from.slice(0, 6)}…{tx.from.slice(-4)}
                              </span>
                            ) : (
                              tx.hash
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3 font-heading text-white">{tx.amount}</td>
                          <td className="px-4 sm:px-6 py-3 text-neutral-400">{tx.tokenType ?? tx.asset}</td>
                          <td className="px-4 sm:px-6 py-3 text-neutral-500">{tx.time ?? tx.date}</td>
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

      {toastMessage && (
        <div className="fixed top-4 right-4 z-[60] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          {toastMessage}
        </div>
      )}

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

      {/* Swap modal: Cross-chain Swap/Bridge */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-white tracking-tight">
                Cross-Chain Swap
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsSwapModalOpen(false);
                  setIsSwapLoading(false);
                }}
                className="text-neutral-500 hover:text-white transition-colors p-1"
                aria-label="Close swap modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-neutral-500 mb-4">Powered by Hedera Hashport Oracle</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs text-neutral-500">From</label>
                <div className="flex gap-3">
                  <select
                    value={swapFromToken}
                    onChange={(e) => setSwapFromToken(e.target.value as 'USDC' | 'HBAR')}
                    className="w-32 rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white focus:border-red-600 outline-none"
                  >
                    <option value="USDC">USDC - EVM</option>
                    <option value="HBAR">HBAR - Hedera</option>
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={swapFromAmount}
                    onChange={(e) => setSwapFromAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-red-600 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const from = swapFromToken;
                    const to = swapToToken;
                    setSwapFromToken(to);
                    setSwapToToken(from);
                  }}
                  className="w-10 h-10 rounded-xl bg-neutral-900/60 border border-neutral-800 text-neutral-200 hover:bg-neutral-800 transition-colors flex items-center justify-center"
                  aria-label="Flip tokens"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-4 4m4-4l4 4" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-neutral-500">To</label>
                <div className="flex gap-3">
                  <select
                    value={swapToToken}
                    onChange={(e) => setSwapToToken(e.target.value as 'USDC' | 'HBAR')}
                    className="w-32 rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white focus:border-red-600 outline-none"
                  >
                    <option value="HBAR">HBAR - Hedera</option>
                    <option value="USDC">USDC - EVM</option>
                  </select>
                  <input
                    type="text"
                    readOnly
                    value={swapToAmountStr}
                    className="flex-1 rounded-lg bg-neutral-900/60 border border-neutral-800 px-3 py-2 text-sm text-white/90 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-neutral-500">Hedera account ID</label>
                <input
                  type="text"
                  value={swapHederaAccountId}
                  onChange={(e) => setSwapHederaAccountId(e.target.value)}
                  placeholder="0.0.xxxxx"
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-red-600 outline-none font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleSwap}
                disabled={isSwapLoading}
                className="w-full mt-6 bg-red-600 hover:bg-red-700 disabled:bg-red-600/80 disabled:cursor-wait text-white font-bold py-3 rounded-lg transition-all"
              >
                {isSwapLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <SpinnerIcon className="h-4 w-4 animate-spin shrink-0 text-white" />
                    Bridging Assets...
                  </span>
                ) : (
                  'Initiate Swap'
                )}
              </button>
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