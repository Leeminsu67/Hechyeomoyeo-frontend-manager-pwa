"use client";

import Link from "next/link";
import { AlertCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminDashboardRiskItem } from "@/types/dashboard";
import {
  formatKstDateTime,
  RISK_SEVERITY_LABEL,
  RISK_TYPE_LABEL,
} from "../lib/dashboardFormat";
import { getRiskItemHref } from "../lib/dashboardNavigation";

function sortRiskItems(items: AdminDashboardRiskItem[]) {
  return [...items].sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "critical" ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function AdminDashboardRiskList({
  items,
}: {
  items: AdminDashboardRiskItem[];
}) {
  const sortedItems = sortRiskItems(items);

  return (
    <section className="rounded-lg border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-base font-bold text-text-strong">위험 목록</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            긴급 항목이 먼저 표시됩니다.
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
          {items.length}
        </span>
      </div>

      {sortedItems.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">
          <AlertCircle className="mb-3 h-8 w-8 text-success-foreground" />
          <p className="text-sm font-semibold text-text-strong">
            확인할 위험 항목이 없습니다.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {sortedItems.map((item, index) => (
            <Link
              key={`${item.type}-${item.targetId ?? item.siteId ?? index}-${item.createdAt}`}
              href={getRiskItemHref(item)}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted"
            >
              <span
                className={cn(
                  "mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                  item.severity === "critical"
                    ? "bg-danger/25 text-danger-foreground"
                    : "bg-secondary/30 text-secondary-foreground",
                )}
              >
                <AlertTriangle className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold",
                      item.severity === "critical"
                        ? "bg-danger/25 text-danger-foreground"
                        : "bg-secondary/30 text-secondary-foreground",
                    )}
                  >
                    {RISK_SEVERITY_LABEL[item.severity]}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                    {RISK_TYPE_LABEL[item.type]}
                  </span>
                </span>
                <span className="mt-1 block line-clamp-2 text-sm font-bold leading-5 text-text-strong">
                  {item.title}
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {[item.siteName, item.targetName].filter(Boolean).join(" · ") ||
                    "전체 범위"}{" "}
                  · {formatKstDateTime(item.createdAt)}
                </span>
              </span>
              <ChevronRight className="mt-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
