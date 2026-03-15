export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img
          src="https://www.freelogovectors.net/wp-content/uploads/2019/10/swift-logo-program.png"
          alt="SwiftFund"
          className="h-12 w-auto animate-pulse opacity-90"
          width={48}
          height={48}
        />
        <p className="font-heading text-sm text-neutral-400 tracking-tight">Connecting to Hedera...</p>
      </div>
    </div>
  );
}
