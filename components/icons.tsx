/**
 * Geometric, abstract icon set — deliberately plain line work. No cultural
 * motifs of any kind (see docs/DESIGN-PLAN.md §2); visual character in this
 * application comes from landscape abstraction elsewhere, never iconography.
 */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconPhone({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

export function IconFlag({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 21V4m0 1h13l-2.5 4L18 13H5" />
    </svg>
  );
}

export function IconTruck({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M1 7h13v9H1zM14 10h4l3 3v3h-7z" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="17.5" cy="18" r="1.8" />
    </svg>
  );
}

export function IconClipboard({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0M8.5 10h7M8.5 14h7M8.5 18h4" />
    </svg>
  );
}

export function IconCamera({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 8h3l2-3h8l2 3h3v12H3z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

export function IconPaperclip({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 11.5 11.6 20a5 5 0 0 1-7-7L13 4.5a3.4 3.4 0 0 1 4.8 4.8L9.5 17.6a1.8 1.8 0 0 1-2.5-2.5L15 7" />
    </svg>
  );
}

export function IconList({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  );
}

export function IconMoon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  );
}
