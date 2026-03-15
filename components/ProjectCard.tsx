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
  /** Percentage of earnings shared with backers (0–100). Shown on card when set. */
  earningsDistributionPercent?: number;
  onFundClick: (projectId: string) => void;
}

export default function ProjectCard({
  id,
  creatorName,
  handle,
  imageUrl,
  progressPercent,
  stats,
  earningsDistributionPercent,
  onFundClick,
}: ProjectCardProps) {
  const safeProgress = Math.max(0, Math.min(100, progressPercent));
  const hasEarningsPct = typeof earningsDistributionPercent === 'number' && earningsDistributionPercent >= 0 && earningsDistributionPercent <= 100;

  return (
    <div className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 shadow-[0_0_20px_rgba(0,0,0,0.35)] min-w-0">
      <div className="flex items-center gap-3 mb-3 sm:mb-4 min-w-0">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0">
          <img
            src={imageUrl}
            alt={creatorName}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold text-white truncate tracking-tight">
            {creatorName}
          </p>
          <p className="font-heading text-xs text-neutral-400 truncate tracking-tight">{handle}</p>
        </div>
      </div>

      {hasEarningsPct && (
        <p className="font-heading text-xs text-red-400/90 mb-2 tracking-tight">
          {earningsDistributionPercent}% of earnings to backers
        </p>
      )}

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-heading text-xs text-neutral-400 tracking-tight">Funding progress</span>
          <span className="font-heading text-xs text-neutral-200 tracking-tight">
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

      <div className="mt-3 mb-4 grid grid-cols-3 gap-2 sm:gap-3 text-xs min-w-0">
        <div>
          <p className="font-heading text-neutral-500 mb-1 text-xs tracking-tight">Amount Raised</p>
          <p className="font-heading text-sm text-white tracking-tight">
            {stats.amountRaisedLabel}
          </p>
          <p className="font-heading text-[11px] text-neutral-500 tracking-tight">Goal {stats.goalLabel}</p>
        </div>
        <div>
          <p className="font-heading text-neutral-500 mb-1 text-xs tracking-tight">Backers</p>
          <p className="font-heading text-sm text-white tracking-tight">
            {stats.backersLabel}
          </p>
        </div>
        <div>
          <p className="font-heading text-neutral-500 mb-1 text-xs tracking-tight flex items-center gap-1">
            <span className="inline-flex h-3 w-3 items-center justify-center">
              <span className="inline-block h-3 w-3 rounded-full border border-red-500 border-t-transparent animate-spin" />
            </span>
            Time Left
          </p>
          <p className="font-heading text-sm text-white tracking-tight">
            {stats.timeLeftLabel}
          </p>
        </div>
      </div>

      <button
        onClick={() => onFundClick(id)}
        className="mt-auto inline-flex items-center justify-center rounded-lg bg-red-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-red-500 transition-colors w-full sm:w-auto"
      >
        Fund This Project
      </button>
    </div>
  );
}

