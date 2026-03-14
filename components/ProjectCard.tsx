import { ReactNode } from 'react';

export interface ProjectCardStats {
  amountRaisedLabel: string;
  goalLabel: string;
  backersLabel: string;
  timeLeftLabel: string;
}

export interface ProjectCardProps {
  id: string;
  creatorName: string;
  handle: string;
  imageUrl: string;
  progressPercent: number;
  stats: ProjectCardStats;
  onFundClick: (projectId: string) => void;
}

export default function ProjectCard({
  id,
  creatorName,
  handle,
  imageUrl,
  progressPercent,
  stats,
  onFundClick,
}: ProjectCardProps) {
  const safeProgress = Math.max(0, Math.min(100, progressPercent));

  return (
    <div className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center text-xs font-semibold">
          <img
            src={imageUrl}
            alt={creatorName}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="font-heading text-sm font-semibold text-white">
            {creatorName}
          </p>
          <p className="text-xs text-neutral-400">{handle}</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Funding progress</span>
          <span className="text-xs font-heading text-neutral-200">
            {safeProgress.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-red-600 rounded-full"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-3 mb-4 grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-neutral-500 mb-1">Amount Raised</p>
          <p className="font-heading text-sm text-white">
            {stats.amountRaisedLabel}
          </p>
          <p className="text-[11px] text-neutral-500">Goal {stats.goalLabel}</p>
        </div>
        <div>
          <p className="text-neutral-500 mb-1">Backers</p>
          <p className="font-heading text-sm text-white">
            {stats.backersLabel}
          </p>
        </div>
        <div>
          <p className="text-neutral-500 mb-1 flex items-center gap-1">
            <span className="inline-flex h-3 w-3 items-center justify-center">
              <span className="inline-block h-3 w-3 rounded-full border border-red-500 border-t-transparent animate-spin" />
            </span>
            Time Left
          </p>
          <p className="font-heading text-sm text-white">
            {stats.timeLeftLabel}
          </p>
        </div>
      </div>

      <button
        onClick={() => onFundClick(id)}
        className="mt-auto inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
      >
        Fund This Project
      </button>
    </div>
  );
}

