/**
 * Project entity: creator-submitted campaign for Discover.
 * Status flow: draft → pending (submitted) → processing (backend review) → approved (live on Discover).
 */
export type ProjectStatus = 'draft' | 'pending' | 'processing' | 'approved';

export interface Project {
  id: string;
  creatorId: string;
  creatorName: string;
  handle: string;
  title: string;
  description: string;
  goalAmount: number;
  amountRaised: number;
  imageUrl: string;
  status: ProjectStatus;
  createdAt: string; // ISO
  updatedAt: string;
  /** For Discover filters */
  tags?: ('all' | 'trending' | 'endingSoon')[];
  /** Percentage of earnings (0–100) shared with backers */
  earningsDistributionPercent?: number;
  /** URL to uploaded PDF with account information */
  accountInfoPdfUrl?: string;
  /** Unique funder count for this project (capped at 200 on-chain). From contract or backend. */
  funderCount?: number;
  /** Verified 30-day YouTube views fetched via Analytics API. */
  verifiedYoutubeViews?: number;
  /** Verified 30-day estimated YouTube revenue (fiat) fetched via Analytics API. */
  verifiedYoutubeRevenue?: number;
  /** Whether the creator has linked YouTube Analytics for this project. */
  youtubeLinked?: boolean;
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draft',
  pending: 'Pending review',
  processing: 'Processing',
  approved: 'Approved',
};
