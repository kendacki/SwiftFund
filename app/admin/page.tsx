'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { updateProjectStatus } from '@/app/actions/admin';
import type { Project } from '@/lib/projects';
import { PROJECT_STATUS_LABEL } from '@/lib/projects';

const ADMIN_EMAIL = 'brodymatthewa@gmail.com';

export default function AdminPage() {
  const { user, ready, authenticated, getAccessToken } = usePrivy();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    if (!ready) return;

    const userEmail =
      (user as any)?.email?.address ||
      (user as any)?.google?.email ||
      ((user as any)?.email as string | undefined) ||
      '';
    const isAdmin = userEmail === ADMIN_EMAIL;

    if (!authenticated || !isAdmin) {
      router.push('/');
    }
  }, [ready, authenticated, user, router]);

  const userEmail =
    (user as any)?.email?.address ||
    (user as any)?.google?.email ||
    ((user as any)?.email as string | undefined) ||
    '';
  const isAdmin = userEmail === ADMIN_EMAIL;

  useEffect(() => {
    if (!ready || !authenticated || !isAdmin) return;

    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/admin/projects', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to load admin projects: ${res.status}`);
        }
        const json = await res.json();
        setProjects((json?.projects ?? []) as Project[]);
      } catch (err) {
        console.error('Failed to load admin projects:', err);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    void loadProjects();
  }, [ready, authenticated, isAdmin, getAccessToken]);

  const handleStatusChange = async (
    id: string,
    status: 'approved' | 'rejected'
  ) => {
    setIsProcessing(id);
    try {
      const result = await updateProjectStatus(id, status);
      if (!result.success) throw new Error(result.error);

      // Optimistically reflect the change in UI to reduce perceived delay.
      if (status === 'approved') {
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
        );
      }
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  const totalVolume = projects.reduce((sum, p) => sum + (p.amountRaised ?? 0), 0);
  const activeCreators = new Set(projects.map((p) => p.creatorName)).size;
  const verifiedSyncs = projects.filter((p) => p.youtubeLinked).length;
  const protocolTreasury = totalVolume * 0.05;
  const queuedProjects = useMemo(
    () => projects.filter((p) => p.status === 'pending'),
    [projects]
  );

  if (!ready) {
    return null;
  }

  if (!authenticated || !isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#050505] text-neutral-100 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              Admin Control Center
            </h1>
            <p className="mt-2 font-heading text-xs sm:text-sm text-neutral-400 max-w-2xl tracking-tight">
              Protocol-wide telemetry for SwiftFund. This view surfaces private
              creator metrics, platform volume, and yield splits for internal ops
              only.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-1.5">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-heading text-[11px] sm:text-xs text-emerald-200 tracking-tight">
              God Mode Active
            </span>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
            <p className="font-heading text-xs text-neutral-400 tracking-tight mb-1">
              Total Platform Volume
            </p>
            <p className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              }).format(totalVolume)}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
            <p className="font-heading text-xs text-neutral-400 tracking-tight mb-1">
              Active Creators
            </p>
            <p className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              {activeCreators}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
            <p className="font-heading text-xs text-neutral-400 tracking-tight mb-1">
              Verified YouTube Syncs
            </p>
            <p className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-300">
              {verifiedSyncs}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
            <p className="font-heading text-xs text-neutral-400 tracking-tight mb-1">
              Protocol Treasury (5%)
            </p>
            <p className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-sky-300">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              }).format(protocolTreasury)}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/70 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold text-white tracking-tight">
                Global Project Ledger
              </h2>
              <p className="font-heading text-xs text-neutral-400 mt-1 tracking-tight">
                End-to-end visibility into every live raise, private YouTube
                metrics, and verification artifacts.
              </p>
            </div>
            <span className="font-heading text-[11px] text-neutral-500 tracking-tight">
              {isLoadingProjects ? 'Loading...' : queuedProjects.length + ' projects'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-800 bg-neutral-950/70">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-heading text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                    Creator / Project
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-heading text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                    Funding Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-heading text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                    YouTube Metrics (Private)
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-heading text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                    Pitch Deck
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-heading text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {queuedProjects.length === 0 ? (
                  <tr>
                    <td className="px-4 sm:px-6 py-10 text-center text-neutral-500" colSpan={5}>
                      No projects waiting for review.
                    </td>
                  </tr>
                ) : (
                  queuedProjects.map((p) => {
                    const progress =
                      p.goalAmount > 0
                        ? Math.min(100, Math.round((p.amountRaised / p.goalAmount) * 100))
                        : 0;
                    const youtubeLinked = !!p.youtubeLinked;
                    const ytRevenue = p.verifiedYoutubeRevenue ?? 0;
                    const ytViews = p.verifiedYoutubeViews ?? 0;
                    const pdfUrl = p.accountInfoPdfUrl ?? null;

                    return (
                      <tr
                        key={p.id}
                        className="border-b border-neutral-800/80 last:border-0 hover:bg-neutral-900/60 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-3 align-top">
                          <div className="font-heading text-xs sm:text-sm text-neutral-100 tracking-tight">
                            {p.creatorName}
                          </div>
                          <div className="font-heading text-[11px] text-neutral-400 tracking-tight">
                            {p.title}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 align-top">
                          <div className="font-heading text-xs text-neutral-200 tracking-tight mb-1">
                            {progress}% funded
                          </div>
                          <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden mb-1">
                            <div
                              className="h-full bg-gradient-to-r from-sky-400 via-emerald-400 to-purple-400"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="font-heading text-[11px] text-neutral-500 tracking-tight">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0,
                            }).format(p.amountRaised)}{' '}
                            /{' '}
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0,
                            }).format(p.goalAmount)}
                          </div>
                          <div className="font-heading text-[11px] text-neutral-400 tracking-tight mt-1">
                            Status: {PROJECT_STATUS_LABEL[p.status] ?? p.status}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 align-top">
                          {youtubeLinked ? (
                            <div className="space-y-0.5">
                              <div className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span className="font-heading text-[10px] text-emerald-200 tracking-tight">
                                  Linked
                                </span>
                              </div>
                              <div className="font-heading text-xs text-emerald-300 tracking-tight">
                                Rev (30d):{' '}
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(ytRevenue)}
                              </div>
                              <div className="font-heading text-[11px] text-neutral-300 tracking-tight">
                                Views (30d): {ytViews.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 font-heading text-[10px] text-neutral-400 tracking-tight">
                              Not Linked
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 align-top">
                          {pdfUrl ? (
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-heading text-xs text-sky-300 hover:text-sky-200 tracking-tight underline decoration-dotted"
                            >
                              📄 View PDF
                            </a>
                          ) : (
                            <span className="font-heading text-xs text-neutral-500 tracking-tight">
                              No PDF
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 align-top">
                          <div className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              className="font-heading text-[11px] px-3 py-1 rounded-md border border-neutral-700 text-neutral-200 hover:border-sky-500 hover:bg-sky-500/10 transition-colors"
                            >
                              View Creator
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(p.id, 'approved')}
                              disabled={isProcessing === p.id}
                              className="font-heading text-[11px] px-3 py-1 rounded-md border border-emerald-700 text-emerald-300 hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isProcessing === p.id ? 'Approving...' : 'Approve'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}


