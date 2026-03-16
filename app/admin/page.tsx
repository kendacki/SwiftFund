'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

interface AdminProject {
  id: string;
  creatorName: string;
  title: string;
  goalAmount: number;
  verifiedYoutubeRevenue?: number;
  verifiedYoutubeViews?: number;
}

const ADMIN_EMAIL = 'brodymatthewa@gmail.com';

export default function AdminPage() {
  const { user, getAccessToken, ready } = usePrivy();
  const router = useRouter();
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    const email = (user as any)?.email as string | undefined;
    const isAdmin = email === ADMIN_EMAIL;

    if (!isAdmin) {
      router.replace('/');
      return;
    }

    const load = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          setError('Unauthorized');
          setLoading(false);
          return;
        }
        const res = await fetch('/api/admin/projects', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || 'Failed to load projects');
          setLoading(false);
          return;
        }
        setProjects(
          Array.isArray(data?.projects)
            ? data.projects
            : []
        );
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load projects'
        );
        setLoading(false);
      }
    };

    load();
  }, [user, getAccessToken, ready, router]);

  if (!ready) {
    return null;
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Admin Dashboard
          </h1>
          <p className="font-heading text-xs sm:text-sm text-neutral-400 mt-2 tracking-tight max-w-2xl">
            Platform-wide overview of creator projects and verified YouTube analytics. This view is restricted to protocol administrators.
          </p>
        </header>

        {loading ? (
          <p className="font-heading text-sm text-neutral-500 tracking-tight">
            Loading projects…
          </p>
        ) : error ? (
          <p className="font-heading text-sm text-red-400 tracking-tight">
            {error}
          </p>
        ) : projects.length === 0 ? (
          <p className="font-heading text-sm text-neutral-500 tracking-tight">
            No projects found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/60">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-800 bg-neutral-900/80">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-heading text-xs font-semibold text-neutral-400 tracking-wider uppercase">
                    Creator
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-heading text-xs font-semibold text-neutral-400 tracking-wider uppercase">
                    Project Title
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-heading text-xs font-semibold text-neutral-400 tracking-wider uppercase">
                    Funding Goal (USD)
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-heading text-xs font-semibold text-neutral-400 tracking-wider uppercase">
                    Verified Revenue (30d)
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-heading text-xs font-semibold text-neutral-400 tracking-wider uppercase">
                    Verified Views (30d)
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-neutral-800/80 last:border-0"
                  >
                    <td className="px-4 sm:px-6 py-3 font-heading text-xs sm:text-sm text-neutral-100 tracking-tight">
                      {p.creatorName}
                    </td>
                    <td className="px-4 sm:px-6 py-3 font-heading text-xs sm:text-sm text-neutral-100 tracking-tight">
                      {p.title}
                    </td>
                    <td className="px-4 sm:px-6 py-3 font-heading text-xs sm:text-sm text-neutral-100 tracking-tight">
                      ${p.goalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 font-heading text-xs sm:text-sm text-emerald-300 tracking-tight">
                      {typeof p.verifiedYoutubeRevenue === 'number'
                        ? `$${p.verifiedYoutubeRevenue.toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 font-heading text-xs sm:text-sm text-emerald-300 tracking-tight">
                      {typeof p.verifiedYoutubeViews === 'number'
                        ? p.verifiedYoutubeViews.toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

