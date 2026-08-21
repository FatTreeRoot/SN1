import { t } from "@/config/strings";

export type RecordStatus = "filed" | "pending" | "urgent" | "superseded";

/**
 * Status colours are semantic and never decorative: green filed, ochre
 * pending, red urgent (reserved), muted superseded.
 */
const styles: Record<RecordStatus, { chip: string; dot: string }> = {
  filed: { chip: "bg-filed-soft text-filed", dot: "bg-filed" },
  pending: { chip: "bg-pending-soft text-pending", dot: "bg-pending" },
  urgent: { chip: "bg-urgent text-on-urgent", dot: "bg-on-urgent" },
  superseded: { chip: "bg-surface text-ink-muted border border-line", dot: "bg-ink-muted" },
};

const labels: Record<RecordStatus, string> = {
  filed: t("filed"),
  pending: t("notYetFiled"),
  urgent: t("urgent"),
  superseded: t("superseded"),
};

export function StatusChip({ status }: { status: RecordStatus }) {
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-medium ${s.chip}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {labels[status]}
    </span>
  );
}
