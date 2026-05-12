import { useQuery } from "@tanstack/react-query";
import type { AuditLogListParams } from "@/types/auditLog";
import { getAuditLogs } from "../services/auditLogApi";

export const AUDIT_LOG_KEYS = {
  all: ["audit-logs"] as const,
  list: (params: AuditLogListParams) => ["audit-logs", "list", params] as const,
};

export function useAuditLogs(params: AuditLogListParams, enabled = true) {
  return useQuery({
    queryKey: AUDIT_LOG_KEYS.list(params),
    queryFn: () => getAuditLogs(params),
    enabled,
    placeholderData: (prev) => prev,
  });
}
