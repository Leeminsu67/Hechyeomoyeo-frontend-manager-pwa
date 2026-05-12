export type AuditEntity =
  | "USER"
  | "COMPANY"
  | "SITE"
  | "SITE_ASSIGNMENT"
  | "SITE_TYPE"
  | "ZONE"
  | "SCHEDULE"
  | "ATTENDANCE"
  | "BLE_SESSION"
  | "SWAP_REQUEST"
  | "LEAVE_REQUEST"
  | "MANUAL_CLOCK_OUT_REQUEST"
  | "FIELD_SITE"
  | "FIELD_WORK_LOG"
  | "FIELD_WORK_SCHEDULE"
  | "LOCATION"
  | "OTHER";

export interface AuditActor {
  id: string;
  loginId?: string;
  name?: string;
}

export interface AuditLogItem {
  id: string;
  entity: AuditEntity;
  action: string;
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  path: string | null;
  method: string | null;
  ipAddress: string | null;
  createdAt: string;
  actor: AuditActor | null;
}

export interface AuditLogListParams {
  entity?: AuditEntity;
  actorId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogListResponse {
  logs: AuditLogItem[];
  total: number;
}
