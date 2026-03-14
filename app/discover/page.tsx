'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ProjectCard, {
  ProjectCardProps,
  ProjectCardStats,
} from '@/components/ProjectCard';
import { fundProject } from '@/lib/hedera';

type FilterKey = 'all' | 'trending' | 'endingSoon';

interface Project extends Omit<ProjectCardProps, 'onFundClick'> {
  tags: FilterKey[];
}

const PROJECTS: Project[] = [
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
    tags: ['all', 'trending'],
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
    tags: ['all'],
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
    tags: ['all', 'trending', 'endingSoon'],
  },
];

export default function DiscoverPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const filteredProjects = useMemo(
    () =>
      PROJECTS.filter((p) =>
        activeFilter === 'all' ? true : p.tags.includes(activeFilter)
      ),
    [activeFilter]
  );

  const selectedProject = useMemo(
    () => PROJECTS.find((p) => p.id === selectedProjectId) ?? null,
    [selectedProjectId]
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

    try {
      setIsSubmitting(true);
      setStatus('Submitting funding transaction on Hedera...');
      const result = await fundProject(selectedProject.id, numericAmount);
      setStatus(
        `Funding submitted. Status: ${result.status}, Tx: ${result.transactionId}`
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
  ];

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 space-y-3 text-center sm:text-left">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Support Your Favorite Creators
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto sm:mx-0">
            Directly fund upcoming projects and earn a share of future revenue.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3 border-b border-neutral-800 pb-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-heading text-lg font-semibold text-white">
                  Fund {selectedProject.creatorName}
                </h2>
                <p className="text-xs text-neutral-400">
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
              <p className="mb-3 text-xs text-neutral-400 whitespace-pre-wrap">
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

