'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import ProjectCard from '@/components/ProjectCard';
import type { ProjectCardProps } from '@/components/ProjectCard';
import type { Project } from '@/lib/projects';
import { Button } from '@/components/Button';
import { associateToken, fundCreator, CONTRACT_ADDRESS } from '@/lib/fundCreator';

type FilterKey = 'all' | 'trending' | 'endingSoon' | 'completed';

type ProjectCardData = Omit<ProjectCardProps, 'onFundClick'>;

const MOCK_PROJECTS: ProjectCardData[] = [
  {
    id: 'creator-1',
    creatorName: 'Channel Redstone',
    handle: '@redstone-tech',
    imageUrl:
      'https://images.pexels.com/photos/6898859/pexels-photo-6898859.jpeg?auto=compress&w=120&h=120',
    progressPercent: 68,
    stats: {
      amountRaisedLabel: '$45,000',
      goalLabel: '$100,000',
      backersLabel: '124',
      timeLeftLabel: '4 Days',
    },
    earningsDistributionPercent: 25,
    funderCount: 124,
  },
  {
    id: 'creator-2',
    creatorName: 'Creator Labs',
    handle: '@creator-labs',
    imageUrl:
      'https://images.pexels.com/photos/6898852/pexels-photo-6898852.jpeg?auto=compress&w=120&h=120',
    progressPercent: 32,
    stats: {
      amountRaisedLabel: '$12,800',
      goalLabel: '$40,000',
      backersLabel: '45',
      timeLeftLabel: '9 Days',
    },
    earningsDistributionPercent: 20,
    funderCount: 45,
  },
  {
    id: 'creator-3',
    creatorName: 'Studio Hedera',
    handle: '@hedera-studio',
    imageUrl:
      'https://images.pexels.com/photos/6898853/pexels-photo-6898853.jpeg?auto=compress&w=120&h=120',
    progressPercent: 91,
    stats: {
      amountRaisedLabel: '$91,000',
      goalLabel: '$100,000',
      backersLabel: '200',
      timeLeftLabel: '36 Hours',
    },
    earningsDistributionPercent: 30,
    funderCount: 200,
  },
];

function toCardProps(p: Project): ProjectCardData {
  const progressPercent = p.goalAmount > 0
    ? Math.min(100, Math.round((p.amountRaised / p.goalAmount) * 100))
    : 0;
  const funderCount = Math.min(200, Math.max(0, p.funderCount ?? 0));
  return {
    id: p.id,
    creatorName: p.creatorName,
    handle: p.handle,
    imageUrl: p.imageUrl || 'https://images.pexels.com/photos/6898859/pexels-photo-6898859.jpeg?auto=compress&w=120&h=120',
    progressPercent,
    stats: {
      amountRaisedLabel: `$${p.amountRaised.toLocaleString()}`,
      goalLabel: `$${p.goalAmount.toLocaleString()}`,
      backersLabel: String(funderCount),
      timeLeftLabel: '—',
    },
    earningsDistributionPercent: p.earningsDistributionPercent,
    funderCount,
    youtubeLinked: p.youtubeLinked ?? false,
    verifiedYoutubeViews: p.verifiedYoutubeViews,
  };
}

interface DiscoverProject extends ProjectCardData {
  tags?: FilterKey[];
}

export default function DiscoverPage() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [apiProjects, setApiProjects] = useState<DiscoverProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [fundAmountUsd, setFundAmountUsd] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Fallback demo USD->HBAR conversion; overridden by live CoinCap fetch if available.
  const [hbarPrice, setHbarPrice] = useState<number>(0.1142);
  const [mockHbarBalance, setMockHbarBalance] = useState<number>(100);

  const toast = {
    success: (message: string) => {
      setToastType('success');
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 3500);
    },
    error: (message: string) => {
      setToastType('error');
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 3500);
    },
  };

  const hbarRequired = fundAmountUsd
    ? (() => {
        const n = Number(fundAmountUsd);
        if (!Number.isFinite(n) || hbarPrice <= 0) return 0;
        return n / hbarPrice;
      })()
    : 0;

  // Fetch live HBAR price (CoinCap). If rate-limited, we keep fallback 0.1142.
  useEffect(() => {
    let isMounted = true;
    const fetchHbarPrice = async () => {
      try {
        const res = await fetch(
          'https://api.coincap.io/v2/assets/hedera-hashgraph',
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('Rate limited');
        const json = await res.json();
        const price = json?.data?.priceUsd;
        if (price && isMounted) setHbarPrice(parseFloat(price));
      } catch {
        // Silently fail and rely on default state.
      }
    };

    fetchHbarPrice();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    fetch('/api/projects?discover=1')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data?.projects) ? data.projects : [];
        setApiProjects(list.map((p: Project) => ({ ...toCardProps(p), tags: p.tags || ['all'] })));
      })
      .catch(() => setApiProjects([]))
      .finally(() => setProjectsLoading(false));
  }, []);

  const allProjects = useMemo(() => {
    const fromApi = apiProjects;
    const mockWithTags = MOCK_PROJECTS.map((p) => ({
      ...p,
      tags: ['all'] as FilterKey[],
    }));

    // If we have approved campaigns from the API, always show those.
    if (fromApi.length > 0) return fromApi;

    // Logged-out experience: preserve the previous “funding cards” UI by
    // showing mocks even when no approved campaigns exist yet.
    if (!authenticated) return mockWithTags;

    // Logged-in experience: production stays empty until admin approves campaigns.
    if (process.env.NODE_ENV === 'development') return mockWithTags;
    return [];
  }, [apiProjects, authenticated]);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') return allProjects;

    if (activeFilter === 'trending') {
      // Projects actively gaining traction but not yet fully funded.
      const list = allProjects.filter(
        (p) => p.progressPercent >= 60 && p.progressPercent < 100
      );
      return list.length > 0 ? list : allProjects;
    }

    if (activeFilter === 'endingSoon') {
      // High-progress campaigns approaching completion.
      const list = allProjects.filter(
        (p) => p.progressPercent >= 90 && p.progressPercent < 100
      );
      return list.length > 0 ? list : allProjects;
    }

    if (activeFilter === 'completed') {
      // Only fully funded projects; if none exist yet, show an empty state.
      return allProjects.filter((p) => p.progressPercent >= 100);
    }

    return allProjects;
  }, [activeFilter, allProjects]);

  const selectedProject = useMemo(
    () => allProjects.find((p) => p.id === selectedProjectId) ?? null,
    [selectedProjectId, allProjects]
  );
  const selectedProjectFunderCap = (selectedProject && typeof (selectedProject as { funderCount?: number }).funderCount === 'number')
    ? (selectedProject as { funderCount: number }).funderCount >= 200
    : false;

  const openModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setFundAmountUsd('');
    setStatus(null);
  };

  const closeModal = () => {
    setSelectedProjectId(null);
    setFundAmountUsd('');
    setIsSubmitting(false);
  };

  const handleFund = async () => {
    if (!selectedProject) return;
    const funderCount = (selectedProject as { funderCount?: number }).funderCount ?? 0;
    if (funderCount >= 200) {
      setStatus('This project has reached the 200 funder maximum.');
      return;
    }
    const fundAmountUsdTrimmed = fundAmountUsd.trim();
    if (!fundAmountUsdTrimmed || Number(fundAmountUsdTrimmed) <= 0) {
      setStatus('Enter a valid amount (USD) to fund.');
      return;
    }
    const requiredHbar = hbarRequired;
    if (requiredHbar <= 0) {
      setStatus('Enter a valid amount (USD) to fund.');
      return;
    }
    if (!authenticated) {
      setStatus('Please log in to fund a project.');
      return;
    }

    const wallet = wallets[0];
    if (!wallet?.getEthereumProvider) {
      setStatus('Wallet not ready. Please connect your wallet and try again.');
      return;
    }

    try {
      // Simulate smart contract execution delay before running the on-chain steps.
      setIsSubmitting(true);
      setStatus('Funding...');
      await new Promise((r) => setTimeout(r, 1500));

      setStatus('Step 1/2: Associating SWIND token with your wallet. Approve in your wallet.');
      const provider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      // Check available HBAR balance (testnet). If the lookup fails, we keep mockHbarBalance.
      try {
        const signerAddress = await signer.getAddress();
        const accountRes = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/accounts/${signerAddress}`
        );
        if (accountRes.ok) {
          const accountJson = await accountRes.json();
          const accountId: string | undefined = accountJson?.account;
          if (accountId) {
            const balancesRes = await fetch(
              `https://testnet.mirrornode.hedera.com/api/v1/balances?account.id=${accountId}`
            );
            if (balancesRes.ok) {
              const balancesJson = await balancesRes.json();
              const entry = Array.isArray(balancesJson?.balances)
                ? balancesJson.balances[0]
                : null;
              const tinybar: number | undefined = entry?.balance;
              const available = typeof tinybar === 'number' ? tinybar / 1e8 : mockHbarBalance;
              setMockHbarBalance(available);
              if (available > 0 && requiredHbar > available) {
                toast.error('Insufficient HBAR balance.');
                setIsSubmitting(false);
                return;
              }
            }
          }
        }
      } catch {
        // Ignore balance fetch failures and use mockHbarBalance.
        if (mockHbarBalance > 0 && requiredHbar > mockHbarBalance) {
          toast.error('Insufficient HBAR balance.');
          setIsSubmitting(false);
          return;
        }
      }

      try {
        await associateToken(signer);
      } catch (assocErr) {
        const msg = assocErr instanceof Error ? assocErr.message : 'Token association failed.';
        if (msg.includes('TOKEN_ALREADY_ASSOCIATED') || msg.includes('already associated')) {
          // Already associated; continue to funding.
        } else {
          setStatus(`Association required: ${msg}. Please try again.`);
          return;
        }
      }

      setStatus('Step 2/2: Confirm funding in your wallet.');
      const creatorAddress = (selectedProject as { creatorEvmAddress?: string }).creatorEvmAddress ?? CONTRACT_ADDRESS;
      const { hash } = await fundCreator(signer, creatorAddress, requiredHbar.toFixed(2));

      toast.success(`Successfully funded with ${requiredHbar.toFixed(2)} HBAR!`);
      setStatus(`Funding successful! Transaction: ${hash.slice(0, 10)}…${hash.slice(-8)}`);
      setFundAmountUsd('');
      setTimeout(() => {
        closeModal();
      }, 2500);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Funding transaction failed.';
      setStatus(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All Projects' },
    { key: 'trending', label: 'Trending' },
    { key: 'endingSoon', label: 'Ending Soon' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link
            href={authenticated ? '/creator' : '/'}
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            aria-label={authenticated ? 'Back to dashboard' : 'Back to homepage'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
        </div>
        <div className="mb-6 sm:mb-8 space-y-3 text-center sm:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
            className="font-heading text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white"
          >
            Support Your Favorite Creators
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            className="font-heading text-xs sm:text-base text-neutral-400 max-w-2xl mx-auto sm:mx-0 tracking-tight"
          >
            Directly fund upcoming projects and earn a share of future revenue.
          </motion.p>
        </div>

        <div className="mb-6 sm:mb-8 flex flex-wrap gap-2 sm:gap-3 border-b border-neutral-800 pb-4">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`text-xs sm:text-sm rounded-full px-4 py-1.5 border transition-colors ${
                  isActive
                    ? 'border-red-600 bg-red-600/10 text-red-400'
                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {projectsLoading ? (
          <div className="text-sm text-neutral-500 py-8 text-center">
            Loading projects…
          </div>
        ) : (
          <>
            {filteredProjects.length === 0 ? (
              authenticated ? (
                <div className="text-sm text-neutral-500 py-10 text-center">
                  No approved projects yet. Check back soon.
                </div>
              ) : (
                // Logged-out: preserve the previous container structure (grid wrapper),
                // even if it renders zero cards.
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" />
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <ProjectCard
                      {...project}
                      onFundClick={openModal}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 sm:p-6">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5 shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-heading text-lg font-semibold text-white tracking-tight">
                  Fund {selectedProject.creatorName}
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 mb-6 mx-auto w-fit">
                  <p className="text-xs text-neutral-300 text-center font-light tracking-wide">
                    Prove your loyalty and get rewarded.
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-xs text-neutral-500 hover:text-neutral-300"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <label className="block text-xs text-neutral-400">
                Amount (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={fundAmountUsd}
                onChange={(e) => setFundAmountUsd(e.target.value)}
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-red-600"
                placeholder="$0.00"
              />
              <p className="text-sm text-neutral-400 mt-2">
                Equivalent: {hbarRequired.toFixed(2)} HBAR
              </p>
            </div>

            {toastMessage && (
              <p
                className={`mb-3 text-sm whitespace-pre-wrap rounded-lg p-2 ${
                  toastType === 'success'
                    ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                    : 'text-red-300 bg-red-500/10 border border-red-500/20'
                }`}
              >
                {toastMessage}
              </p>
            )}

            {status && (
              <p
                className={`mb-3 text-sm whitespace-pre-wrap rounded-lg p-2 ${
                  status.startsWith('Funding successful')
                    ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                    : status.startsWith('Step ') || status.startsWith('Funding submitted') || status.startsWith('Submitting')
                      ? 'text-neutral-300 bg-neutral-800/80'
                      : status.startsWith('Enter a valid') || status.startsWith('Please log in') || status.startsWith('Association required') || status.includes('failed') || status.includes('revert')
                        ? 'text-red-300 bg-red-500/10 border border-red-500/20'
                        : 'text-neutral-400 bg-neutral-800/60'
                }`}
              >
                {status}
              </p>
            )}

            {selectedProjectFunderCap && (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mb-3">
                This project has reached the 200 funder maximum and cannot accept new funders.
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-900"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={handleFund}
                disabled={isSubmitting || selectedProjectFunderCap}
                className="px-4 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Funding...' : selectedProjectFunderCap ? 'Sold Out' : 'Confirm Funding'}
              </Button>
            </div>
            <p className="text-xs text-neutral-500 text-center mt-2">
              Testnet: Funding uses HBAR. SWIND balances remain untouched.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

