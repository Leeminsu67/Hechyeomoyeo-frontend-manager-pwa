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
  status?: SiteStatus;
  userIds?: string[];
  latitude?: number;
  longitude?: number;
}

export type UpdateSiteDto = Partial<CreateSiteDto>;

export interface SiteListParams {
  page: number;
  take: number;
  name?: string;
}

export interface SiteListResponse {
  data: { sites: SiteItem[]; total: number };
}

// ─── Site Detail (GET /site/:id) ─────────────────────────────────────────────
// findOne includes `relations: ['users']` — returns full site + assigned users

export interface SiteItemWithUsers extends SiteItem {
  users: SiteUser[];
}

// ─── Site Staff Assignment ────────────────────────────────────────────────────
// GET /site/:id/users → AssignedUsersResponse
// POST /site/:id/users → body: AssignUsersDto

export interface SiteUser {
  id: string;
  name: string;
  loginId: string;
  role: number;
  phone?: string;
}

export interface SiteUsersResponse {
  data: { users: SiteUser[] };
}

export interface AssignUsersDto {
  userIds: string[];
}
