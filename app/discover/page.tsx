'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import ProjectCard from '@/components/ProjectCard';
import type { ProjectCardProps } from '@/components/ProjectCard';
import type { Project } from '@/lib/projects';

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
      backersLabel: '1,240',
      timeLeftLabel: '4 Days',
    },
    earningsDistributionPercent: 25,
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
      backersLabel: '540',
      timeLeftLabel: '9 Days',
    },
    earningsDistributionPercent: 20,
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
      backersLabel: '2,015',
      timeLeftLabel: '36 Hours',
    },
    earningsDistributionPercent: 30,
  },
];

function toCardProps(p: Project): ProjectCardData {
  const progressPercent = p.goalAmount > 0
    ? Math.min(100, Math.round((p.amountRaised / p.goalAmount) * 100))
    : 0;
  return {
    id: p.id,
    creatorName: p.creatorName,
    handle: p.handle,
    imageUrl: p.imageUrl || 'https://images.pexels.com/photos/6898859/pexels-photo-6898859.jpeg?auto=compress&w=120&h=120',
    progressPercent,
    stats: {
      amountRaisedLabel: `$${p.amountRaised.toLocaleString()}`,
      goalLabel: `$${p.goalAmount.toLocaleString()}`,
      backersLabel: '0',
      timeLeftLabel: '—',
    },
    earningsDistributionPercent: p.earningsDistributionPercent,
  };
}

interface DiscoverProject extends ProjectCardData {
  tags?: FilterKey[];
}

export default function DiscoverPage() {
  const { getAccessToken, authenticated } = usePrivy();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [apiProjects, setApiProjects] = useState<DiscoverProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
    const mockWithTags = MOCK_PROJECTS.map((p) => ({ ...p, tags: ['all'] as FilterKey[] }));
    if (fromApi.length > 0) return [...fromApi, ...mockWithTags];
    return mockWithTags;
  }, [apiProjects]);

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
      // Only fully funded projects.
      const list = allProjects.filter((p) => p.progressPercent >= 100);
      return list.length > 0 ? list : allProjects;
    }

    return allProjects;
  }, [activeFilter, allProjects]);

  const selectedProject = useMemo(
    () => allProjects.find((p) => p.id === selectedProjectId) ?? null,
    [selectedProjectId, allProjects]
  );

  const openModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setAmount('');
    setStatus(null);
  };

  const closeModal = () => {
    setSelectedProjectId(null);
    setAmount('');
    setIsSubmitting(false);
  };

  const handleFund = async () => {
    if (!selectedProject) return;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setStatus('Enter a valid amount to fund.');
      return;
    }
    if (!authenticated) {
      setStatus('Please log in to fund a project.');
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus('Submitting funding transaction on Hedera...');
      const token = await getAccessToken();
      const response = await fetch('/api/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          amount: numericAmount,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Funding failed');
      }
      setStatus(
        `Funding submitted. Status: ${data.status}, Tx: ${data.transactionId}`
      );
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
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 sm:p-6">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5 shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-heading text-lg font-semibold text-white tracking-tight">
                  Fund {selectedProject.creatorName}
                </h2>
                <p className="font-heading text-xs text-neutral-400 tracking-tight">
                  Enter the amount you want to contribute to this project.
                </p>
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
                Funding amount (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-red-600"
                placeholder="e.g. 250"
              />
            </div>

            {status && (
              <p
                className={`mb-3 text-sm whitespace-pre-wrap rounded-lg p-2 ${
                  status.startsWith('Funding submitted') || status.startsWith('Submitting')
                    ? 'text-neutral-300 bg-neutral-800/80'
                    : status.startsWith('Enter a valid') || status.startsWith('Please log in') || status.includes('failed') || status.includes('revert')
                      ? 'text-red-300 bg-red-500/10 border border-red-500/20'
                      : 'text-neutral-400 bg-neutral-800/60'
                }`}
              >
                {status}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={handleFund}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60"
              >
                {isSubmitting ? 'Funding...' : 'Confirm Funding'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

