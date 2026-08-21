/** Loading placeholders. Under reduced motion the shimmer stops and the
 *  blocks hold steady — the state is still legible. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`animate-shimmer rounded-md bg-line ${className}`} />
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-line bg-surface px-4 py-3"
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
