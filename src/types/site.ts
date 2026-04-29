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
  userIds?: string[];
  latitude?: number;
  longitude?: number;
}

export interface UpdateSiteDto {
  name?: string;
  operationStartDate?: string;
  operationEndDate?: string;
  status?: SiteStatus;
  userIds?: string[];
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
// Detail includes `siteType` and minimal assigned user fields.

export interface SiteItemWithUsers extends SiteItem {
  users: SiteDetailUser[];
}

// ─── Site Staff Assignment ────────────────────────────────────────────────────
// GET /site/:id/users → AssignedUsersResponse
// POST /site/:id/users → body: AssignUsersDto

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
  userIds: string[];
}
