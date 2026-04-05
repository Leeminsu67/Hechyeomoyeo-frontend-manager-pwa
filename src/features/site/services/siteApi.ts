import apiClient from "@/lib/axios";
import type {
  SiteListParams,
  SiteListResponse,
  SiteItem,
  CreateSiteDto,
  UpdateSiteDto,
  SiteUsersResponse,
  AssignUsersDto,
} from "@/types/site";

export const getSites = async (params: SiteListParams): Promise<SiteListResponse> => {
  const response = await apiClient.get("/site", { params });
  return response.data;
};

export const getSite = async (id: string): Promise<SiteItem> => {
  const response = await apiClient.get(`/site/${id}`);
  return response.data.data;
};

export const createSite = async (dto: CreateSiteDto): Promise<SiteItem> => {
  const response = await apiClient.post("/site", dto);
  return response.data.data?.site ?? response.data.data;
};

export const updateSite = async ({
  id,
  dto,
}: {
  id: string;
  dto: UpdateSiteDto;
}): Promise<SiteItem> => {
  const response = await apiClient.patch(`/site/${id}`, dto);
  return response.data.data?.site ?? response.data.data;
};

export const deleteSite = async (id: string): Promise<void> => {
  await apiClient.delete(`/site/${id}`);
};

export const updateSiteType = async ({
  siteId,
  siteTypeId,
}: {
  siteId: string;
  siteTypeId: number;
}): Promise<SiteItem> => {
  const response = await apiClient.patch(`/site/${siteId}/${siteTypeId}`);
  return response.data.data?.site ?? response.data.data;
};

// ─── Site User Assignment ────────────────────────────────────────────────────
// 아래 엔드포인트는 백엔드 ManyToMany 관계 기반 — /site/:id/users

export const getSiteUsers = async (siteId: string): Promise<SiteUsersResponse> => {
  const response = await apiClient.get(`/site/${siteId}/users`);
  return response.data;
};

export const assignSiteUsers = async ({
  siteId,
  dto,
}: {
  siteId: string;
  dto: AssignUsersDto;
}): Promise<void> => {
  await apiClient.post(`/site/${siteId}/users`, dto);
};

export const removeSiteUser = async ({
  siteId,
  userId,
}: {
  siteId: string;
  userId: string;
}): Promise<void> => {
  await apiClient.delete(`/site/${siteId}/users/${userId}`);
};
