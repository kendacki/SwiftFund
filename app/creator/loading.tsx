export default function CreatorLoading() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-neutral-800 rounded animate-pulse" />
        <div className="h-4 w-full max-w-md bg-neutral-800/80 rounded animate-pulse" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
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

        <div className="mt-8 flex flex-col gap-3">
          <div className="h-10 w-36 bg-neutral-800 rounded-lg animate-pulse" />
          <div className="h-4 w-full max-w-sm bg-neutral-800/80 rounded animate-pulse" />
        </div>
      </div>
    </main>
  );
}
