'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import DashboardCard from '@/components/DashboardCard';
import type { Project, ProjectStatus } from '@/lib/projects';
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
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [treasuryStatus, setTreasuryStatus] = useState<string | null>(null);
  const [isDistributing, setIsDistributing] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCreatorName('');
    setFormHandle('');
    setFormGoalAmount('');
    setFormImage(null);
    setFormImagePreview(null);
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
      const response = await fetch('/api/distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Distribution failed');
      }
      setTreasuryStatus(
        `Distribution succeeded. Status: ${data.status}, Tx: ${data.transactionId}`
      );
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
          <div>
            <Link
              href="/"
              className="text-sm text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span aria-hidden>←</span> Home
            </Link>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold mt-5">
              Creator Dashboard
            </h1>
          </div>
          <Link
            href="/discover"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Discover
          </Link>
        </div>

        {/* My Projects */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-neutral-800">
            <h2 className="font-heading text-lg font-semibold text-white">
              My Projects
            </h2>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 text-sm transition-colors"
            >
              Create project
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {projectsLoading ? (
              <div className="flex items-center gap-2 text-neutral-400 text-sm py-8">
                <SpinnerIcon className="h-4 w-4" />
                Loading projects…
              </div>
            ) : projects.length === 0 ? (
              <p className="text-sm text-neutral-500 py-8 text-center">
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
                      <button
                        type="button"
                        onClick={() => setProjectStatus(p, 'approved')}
                        className="rounded-lg border border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 px-3 py-1.5 text-xs font-medium transition-colors"
                      >
                        Mark approved (demo)
                      </button>
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
            <h2 className="font-heading text-lg font-semibold text-white">
              Reward Distribution
            </h2>
            <p className="text-sm text-neutral-400 mt-1 max-w-xl">
              Trigger distribution of on-chain yield to your supporters. This calls the SwiftFund treasury contract on Hedera.
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
                  <button
                    onClick={handleDistributeYield}
                    disabled={isDistributing}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isDistributing ? (
                      <>
                        <SpinnerIcon className="h-4 w-4 animate-spin shrink-0" />
                        Processing...
                      </>
                    ) : (
                      'Distribute Yield'
                    )}
                  </button>
                }
              />
            </div>
            {treasuryStatus && (
              <p
                className={`mt-4 text-sm whitespace-pre-wrap rounded-lg p-3 border ${
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
              <h2 id="create-project-title" className="font-heading text-lg font-semibold text-white">
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
              <p className="text-xs text-neutral-400">
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
                <p className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
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
