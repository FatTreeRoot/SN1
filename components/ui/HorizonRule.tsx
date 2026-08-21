/**
 * The brand motif in miniature: three horizon bands — cedar red over water
 * over sand — used as a section divider and card signature. Landscape
 * abstraction only; this is the application's recurring identity element.
 */
export function HorizonRule({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex w-14 flex-col gap-[3px] ${className}`}>
      <span className="h-[3px] rounded-full bg-accent" />
      <span className="ml-1.5 h-[3px] rounded-full bg-water" />
      <span className="ml-3 h-[3px] rounded-full bg-pending" />
    </div>
  );
}
