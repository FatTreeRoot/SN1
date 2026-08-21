/**
 * An occurrence number is read aloud over radio and written onto paper, so it
 * renders in the data face (slashed zero, unambiguous 1/l/I) with the segment
 * structure visible. The large size is the post-submit confirmation moment.
 */
export function OccurrenceNumber({
  value,
  size = "default",
  className = "",
}: {
  value: string;
  size?: "default" | "large";
  className?: string;
}) {
  return (
    <span
      className={`font-data font-medium tracking-wide ${
        size === "large" ? "text-h1" : "text-body"
      } ${className}`}
    >
      {value}
    </span>
  );
}
