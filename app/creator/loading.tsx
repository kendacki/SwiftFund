export default function CreatorLoading() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse" />
          <div className="h-8 w-64 bg-neutral-800 rounded animate-pulse mt-3" />
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-neutral-800">
            <div className="h-5 w-28 bg-neutral-800 rounded animate-pulse" />
            <div className="h-9 w-32 bg-neutral-800 rounded-lg animate-pulse" />
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-950/80 animate-pulse"
              >
                <div className="h-12 w-12 rounded-lg bg-neutral-800" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-neutral-800 rounded mb-2" />
                  <div className="h-3 w-24 bg-neutral-800/80 rounded" />
                </div>
                <div className="h-6 w-16 rounded-full bg-neutral-800" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-neutral-800">
            <div className="h-5 w-48 bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-full max-w-xl bg-neutral-800/80 rounded animate-pulse mt-2" />
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5 animate-pulse"
                >
                  <div className="h-4 w-24 bg-neutral-800 rounded mb-3" />
                  <div className="h-8 w-20 bg-neutral-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
