import { cn } from "@/lib/utils";
import type { SwapRequestStatus } from "@/types/swapRequest";

export const SWAP_REQUEST_STATUS_META: Record<
  SwapRequestStatus,
  { label: string; className: string; dotClassName: string }
> = {
  pending: {
    label: "대상자 응답 대기",
    className: "bg-secondary/25 text-secondary-foreground border-secondary/40",
    dotClassName: "bg-secondary-foreground",
  },
  target_accepted: {
    label: "승인 대기",
    className: "bg-primary/15 text-primary-foreground border-primary/35",
    dotClassName: "bg-primary-500",
  },
  approved: {
    label: "승인 완료",
    className: "bg-success/25 text-success-foreground border-success/40",
    dotClassName: "bg-success-foreground",
  },
  rejected: {
    label: "반려",
    className: "bg-danger/20 text-danger-foreground border-danger/40",
    dotClassName: "bg-danger-foreground",
  },
  cancelled: {
    label: "취소",
    className: "bg-muted text-muted-foreground border-border",
    dotClassName: "bg-muted-foreground",
  },
};

export function SwapRequestStatusBadge({
  status,
  className,
}: {
  status: SwapRequestStatus;
  className?: string;
}) {
  const meta = SWAP_REQUEST_STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", meta.dotClassName)} />
      {meta.label}
    </span>
  );
}
