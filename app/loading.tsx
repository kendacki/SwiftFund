export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-14 w-14 rounded-xl bg-red-600/90 animate-pulse"
          style={{
            boxShadow: '0 0 32px rgba(220, 38, 38, 0.5)',
          }}
          aria-hidden
        />
        <p className="text-sm text-neutral-400">Connecting to Hedera...</p>
      </div>
    </div>
  );
}
