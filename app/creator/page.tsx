'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { motion } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import DashboardCard from '@/components/DashboardCard';
import CreatorChart from '@/components/CreatorChart';
import type { Project, ProjectStatus } from '@/lib/projects';
import type { ChartPoint } from '@/components/CreatorChart';
import { PROJECT_STATUS_LABEL } from '@/lib/projects';

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32 24"
        className="animate-spin"
        style={{ transformOrigin: '12px 12px' }}
      />
    </svg>
  );
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: 'bg-neutral-600 text-neutral-200',
  pending: 'bg-amber-600/20 text-amber-400 border border-amber-500/40',
  processing: 'bg-blue-600/20 text-blue-400 border border-blue-500/40',
  approved: 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40',
};

export default function CreatorDashboard() {
  const { getAccessToken } = usePrivy();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCreatorName, setFormCreatorName] = useState('');
  const [formHandle, setFormHandle] = useState('');
  const [formGoalAmount, setFormGoalAmount] = useState('');
  const [formEarningsPercent, setFormEarningsPercent] = useState('');
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formAccountPdf, setFormAccountPdf] = useState<File | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [treasuryStatus, setTreasuryStatus] = useState<string | null>(null);
  const [isDistributing, setIsDistributing] = useState(false);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const loadChartData = async () => {
    setChartLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setChartPoints([]);
        return;
      }
      const res = await fetch('/api/creator/chart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setChartPoints(Array.isArray(data?.points) ? data.points : []);
    } catch {
      setChartPoints([]);
    } finally {
      setChartLoading(false);
    }
  };

  const loadMyProjects = async () => {
    setProjectsLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setProjects([]);
        return;
      }
      const res = await fetch('/api/projects?mine=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProjects(Array.isArray(data?.projects) ? data.projects : []);
    } catch {
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    loadMyProjects();
    loadChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCreatorName('');
    setFormHandle('');
    setFormGoalAmount('');
    setFormEarningsPercent('');
    setFormImage(null);
    setFormImagePreview(null);
    setFormAccountPdf(null);
    setFormError(null);
    setCreateOpen(true);
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (formImagePreview) URL.revokeObjectURL(formImagePreview);
    if (!file) {
      setFormImage(null);
      setFormImagePreview(null);
      return;
    }
    setFormImage(file);
    setFormImagePreview(URL.createObjectURL(file));
  };

  const submitProject = async (asDraft: boolean) => {
    setFormError(null);
    if (!formTitle.trim() || !formCreatorName.trim() || !formHandle.trim()) {
      setFormError('Title, creator name, and handle are required.');
      return;
    }
    const goal = Number(formGoalAmount);
    if (!Number.isFinite(goal) || goal <= 0) {
      setFormError('Goal amount must be a positive number.');
      return;
    }
    if (!asDraft && !formImage) {
      setFormError('Upload an image before submitting for approval.');
      return;
    }

    setFormSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setFormError('Please log in again.');
        setFormSubmitting(false);
        return;
      }
      const formData = new FormData();
      formData.set('title', formTitle.trim());
      formData.set('description', formDescription.trim());
      formData.set('creatorName', formCreatorName.trim());
      formData.set('handle', formHandle.trim().startsWith('@') ? formHandle.trim() : `@${formHandle.trim()}`);
      formData.set('goalAmount', String(goal));
      formData.set('status', asDraft ? 'draft' : 'pending');
      if (formImage) formData.set('image', formImage);
      const pct = formEarningsPercent.trim();
      if (pct !== '') {
        const num = Number(pct);
        if (Number.isFinite(num) && num >= 0 && num <= 100) {
          formData.set('earningsDistributionPercent', String(Math.round(num)));
        }
      }
      if (formAccountPdf) formData.set('accountPdf', formAccountPdf);

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create project');
      }
      setCreateOpen(false);
      loadMyProjects();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setFormSubmitting(false);
    }
  };

  const submitForApproval = async (project: Project) => {
    if (!project.imageUrl) {
      setFormError('Upload an image first (edit project or create new with image).');
      return;
    }
    setFormError(null);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: project.id, status: 'pending' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to submit');
      }
      loadMyProjects();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit');
    }
  };

  const setProjectStatus = async (project: Project, status: ProjectStatus) => {
    setFormError(null);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: project.id, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to update');
      }
      loadMyProjects();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleDistributeYield = async () => {
    setIsDistributing(true);
    setTreasuryStatus(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setTreasuryStatus('Please log in to run a distribution.');
        setIsDistributing(false);
        return;
      }
      const totalFunded = projects.reduce((sum, p) => sum + (p.amountRaised ?? 0), 0);
      const response = await fetch('/api/distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amountUsd: totalFunded }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Distribution failed');
      }
      setTreasuryStatus(
        `Distribution succeeded. Status: ${data.status}, Tx: ${data.transactionId}`
      );
      loadChartData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Distribution failed.';
      const friendly =
        msg.includes('reverted') || msg.includes('insufficient balance')
          ? msg
          : msg.includes('CONTRACT_REVERT')
            ? 'The distribution was reverted by the contract. The treasury may have insufficient balance or contract conditions were not met. Please check your treasury balance and try again.'
            : msg;
      setTreasuryStatus(friendly);
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link
              href="/portfolio"
              className="text-sm text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span aria-hidden>←</span> Home
            </Link>
            <div className="mt-5 mb-6 sm:mb-8 space-y-3 text-center sm:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
                className="font-heading text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white"
              >
                Creator Dashboard
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
                className="font-heading text-xs sm:text-base text-neutral-400 max-w-2xl mx-auto sm:mx-0 tracking-tight"
              >
                Manage your projects and distribute yield to your supporters.
              </motion.p>
            </div>
          </div>
          <Link
            href="/discover"
            className="text-sm text-neutral-400 hover:text-white transition-colors shrink-0"
          >
            Discover
          </Link>
        </div>

        {/* Funding & Disbursements Chart */}
        <CreatorChart points={chartPoints} loading={chartLoading} />

        {/* My Projects */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-neutral-800">
            <h2 className="font-heading text-lg font-semibold text-white tracking-tight">
              My Projects
            </h2>
            <Button type="button" onClick={openCreate}>
              Create project
            </Button>
          </div>
          <div className="p-4 sm:p-6">
            {projectsLoading ? (
              <div className="flex items-center gap-2 text-neutral-400 text-sm py-8">
                <SpinnerIcon className="h-4 w-4" />
                Loading projects…
              </div>
            ) : projects.length === 0 ? (
              <p className="font-heading text-sm text-neutral-500 py-8 text-center tracking-tight">
                No projects yet. Create one to submit for approval and list on Discover.
              </p>
            ) : (
              <ul className="space-y-3">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 rounded-lg border border-neutral-800 bg-neutral-950/80"
                  >
                    <div className="h-12 w-12 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-neutral-500 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-sm font-semibold text-white truncate">
                        {p.title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {p.creatorName} · Goal ${p.goalAmount.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}
                    >
                      {PROJECT_STATUS_LABEL[p.status]}
                    </span>
                    {p.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => submitForApproval(p)}
                        disabled={!p.imageUrl}
                        className="rounded-lg border border-neutral-600 hover:border-red-500 hover:bg-red-500/10 text-neutral-300 hover:text-red-400 px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit for approval
                      </button>
                    )}
                    {(p.status === 'pending' || p.status === 'processing') && (
                      <span className="text-xs text-neutral-500">
                        Pending approval
                      </span>
                    )}
                    {p.status === 'approved' && (
                      <Link
                        href="/discover"
                        className="text-xs font-medium text-red-400 hover:text-red-300"
                      >
                        View on Discover
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Reward Distribution */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-neutral-800">
            <h2 className="font-heading text-lg font-semibold text-white tracking-tight">
              Reward Distribution
            </h2>
            <p className="font-heading text-xs text-neutral-400 mt-1 max-w-xl tracking-tight">
              Send rewards from your treasury to your backers. Payouts run on Hedera and are secure and transparent. The amount you distribute must be at least equal to what your community has funded so far across your projects.
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <DashboardCard
                title="Treasury Balance"
                value="—"
                subtitle="On-chain SWIND balance"
              />
              <DashboardCard
                title="Last Distribution"
                value="—"
                subtitle="Most recent payout"
              />
              <DashboardCard
                title="Actions"
                value={
                  <Button
                    type="button"
                    onClick={handleDistributeYield}
                    disabled={isDistributing}
                    className="disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isDistributing ? (
                      <>
                        <SpinnerIcon className="h-4 w-4 animate-spin shrink-0" />
                        Processing...
                      </>
                    ) : (
                      'Distribute Yield'
                    )}
                  </Button>
                }
              />
            </div>
            {treasuryStatus && (
              <p
                className={`mt-4 text-xs whitespace-pre-wrap rounded-lg p-2 border ${
                  treasuryStatus.startsWith('Distribution succeeded')
                    ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-red-300 bg-red-500/10 border-red-500/30'
                }`}
              >
                {treasuryStatus}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Create project modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => !formSubmitting && setCreateOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-title"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950 z-10">
              <h2 id="create-project-title" className="font-heading text-lg font-semibold text-white tracking-tight">
                Create project
              </h2>
              <button
                type="button"
                onClick={() => !formSubmitting && setCreateOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors p-1"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <p className="font-heading text-xs text-neutral-400 tracking-tight">
                Fill in the details below. Save as draft or submit for approval. Once approved, the project will appear on Discover. Upload an image before submitting for approval.
              </p>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Project title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. New documentary series"
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-red-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of your project"
                  rows={3}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-red-600 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Creator name *</label>
                  <input
                    type="text"
                    value={formCreatorName}
                    onChange={(e) => setFormCreatorName(e.target.value)}
                    placeholder="Your name or channel"
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Handle *</label>
                  <input
                    type="text"
                    value={formHandle}
                    onChange={(e) => setFormHandle(e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-red-600 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Funding goal (USD) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formGoalAmount}
                  onChange={(e) => setFormGoalAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-red-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Percentage of earnings to distribute (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formEarningsPercent}
                  onChange={(e) => setFormEarningsPercent(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-red-600 outline-none"
                />
                <p className="font-heading text-[11px] text-neutral-500 mt-1 tracking-tight">
                  Share of project revenue (0–100%) that goes to backers. Shown on Discover.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Account information (PDF)</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3 py-2 text-xs font-medium text-white cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setFormAccountPdf(e.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                    {formAccountPdf ? formAccountPdf.name : 'Upload PDF'}
                  </label>
                  {formAccountPdf && (
                    <button
                      type="button"
                      onClick={() => setFormAccountPdf(null)}
                      className="text-xs text-neutral-400 hover:text-red-400"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="font-heading text-[11px] text-neutral-500 mt-1 tracking-tight">
                  Optional PDF with account/identity info for verification. Max 5 MB.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Cover image (required for approval)</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3 py-2 text-xs font-medium text-white cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onImageChange}
                      className="sr-only"
                    />
                    Choose image
                  </label>
                  {formImagePreview && (
                    <div className="h-16 w-16 rounded-lg border border-neutral-700 overflow-hidden flex-shrink-0">
                      <img src={formImagePreview} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  {formImage && (
                    <span className="text-xs text-neutral-500">{formImage.name}</span>
                  )}
                </div>
              </div>
              {formError && (
                <p className="text-[11px] text-red-400 bg-red-500/10 rounded-lg p-1.5">
                  {formError}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => submitProject(true)}
                  disabled={formSubmitting}
                  className="rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving…' : 'Save as draft'}
                </button>
                <button
                  type="button"
                  onClick={() => submitProject(false)}
                  disabled={formSubmitting || !formImage}
                  className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formSubmitting ? 'Submitting…' : 'Submit for approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
