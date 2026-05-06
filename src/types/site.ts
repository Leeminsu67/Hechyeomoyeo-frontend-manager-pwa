// ─── Site Type ───────────────────────────────────────────────────────────────

export interface SiteType {
  id: number;
  name: string;
  color: string; // hex color (e.g. "#A5D8FF")
  createdAt: string;
}

export interface CreateSiteTypeDto {
  name: string;
  color: string;
}

export type UpdateSiteTypeDto = Partial<CreateSiteTypeDto>;

export interface SiteTypeListResponse {
  data: { siteTypes: SiteType[] };
}

// ─── Site ─────────────────────────────────────────────────────────────────────

export type SiteStatus = "planned" | "active" | "closed";

export type SiteAssignmentType =
  | "siteSupervisor"
  | "regularWorker"
  | "substituteWorker";

export interface SiteAssignmentInput {
  userId: string;
  type: SiteAssignmentType;
}

export interface SiteAssignmentUser {
  id: string;
  loginId: string;
  name: string;
  role: number;
}

export interface SiteAssignment extends SiteAssignmentInput {
  user?: SiteAssignmentUser;
}

export interface SiteItem {
  id: string;
  name: string;
  displayCode: number;
  isDeleted: boolean;
  operationStartDate: string;
  operationEndDate: string;
  status: SiteStatus;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
  siteType: Pick<SiteType, "id" | "name" | "color"> | null;
}

export interface CreateSiteDto {
  name: string;
  operationStartDate: string;
  operationEndDate: string;
  siteTypeId?: number;
  status?: SiteStatus;
  assignments?: SiteAssignmentInput[];
  latitude?: number;
  longitude?: number;
}

export interface UpdateSiteDto {
  name?: string;
  operationStartDate?: string;
  operationEndDate?: string;
  status?: SiteStatus;
  assignments?: SiteAssignmentInput[];
  latitude?: number;
  longitude?: number;
  siteTypeId?: number | null;
}

export interface SiteListParams {
  page: number;
  take: number;
  name?: string;
}

export interface SiteListResponse {
  data: { sites: SiteItem[]; total: number };
}

// ─── Site Detail (GET /site/:id) ─────────────────────────────────────────────
// Detail includes `siteType` and assignment entries with minimal user fields.

export interface SiteItemWithAssignments extends SiteItem {
  assignments: SiteAssignment[];
  users?: SiteDetailUser[];
}

// ─── Site Staff Assignment ────────────────────────────────────────────────────
// PATCH /site/:id with `assignments` replaces all site assignments.

export interface SiteDetailUser {
  id: string;
  loginId: string;
  name: string;
  role: number;
}

export type SiteUser = SiteDetailUser;

export interface SiteUsersResponse {
  data: { users: SiteDetailUser[] };
}

export interface AssignUsersDto {
  assignments: SiteAssignmentInput[];
}
