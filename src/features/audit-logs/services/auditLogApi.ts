import apiClient from "@/lib/axios";
import type {
  AuditLogItem,
  AuditLogListParams,
  AuditLogListResponse,
} from "@/types/auditLog";

interface ApiEnvelope<T> {
  data?: T;
}

interface AuditLogListPayload {
  logs?: AuditLogItem[];
  total?: number;
}

function normalizeAuditLogs(payload: unknown): AuditLogListResponse {
  const envelope = payload as ApiEnvelope<AuditLogListPayload | AuditLogItem[]>;
  const data = envelope.data;

  if (Array.isArray(data)) {
    return {
      logs: data,
      total: data.length,
    };
  }

  const logs = data?.logs ?? [];

  return {
    logs,
    total: data?.total ?? logs.length,
  };
}

export const getAuditLogs = async (
  params: AuditLogListParams,
): Promise<AuditLogListResponse> => {
  const response = await apiClient.get("/audit-logs", { params });
  return normalizeAuditLogs(response.data);
};
