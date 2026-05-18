import apiClient from "@/lib/axios";
import type {
  SiteListParams,
  SiteListResponse,
  SiteItem,
  SiteItemWithAssignments,
  CreateSiteDto,
  UpdateSiteDto,
  SiteUsersResponse,
  AssignUsersDto,
} from "@/types/site";

function getCreatedAtTime(site: SiteItem) {
  const time = new Date(site.createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortSitesByCreatedAtDesc(sites: SiteItem[]) {
  return [...sites].sort((a, b) => getCreatedAtTime(b) - getCreatedAtTime(a));
}

export const getSites = async (params: SiteListParams): Promise<SiteListResponse> => {
  const response = await apiClient.get("/site", { params });
  const payload = response.data as SiteListResponse;

  return {
    ...payload,
    data: {
      ...payload.data,
      sites: sortSitesByCreatedAtDesc(payload.data.sites),
    },
  };
};

export const getSite = async (id: string): Promise<SiteItemWithAssignments> => {
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

// ─── Site User Assignment ────────────────────────────────────────────────────
// 신규 백엔드는 PATCH /site/:id 의 assignments 로 전체 교체한다.

export const getSiteUsers = async (siteId: string): Promise<SiteUsersResponse> => {
  const response = await apiClient.get(`/site/${siteId}`);
  const detail = response.data.data as SiteItemWithAssignments;
  const users =
    detail.assignments
      ?.map((assignment) => assignment.user)
      .filter((user): user is NonNullable<typeof user> => Boolean(user)) ??
    detail.users ??
    [];

  return { data: { users } };
};

export const assignSiteUsers = async ({
  siteId,
  dto,
}: {
  siteId: string;
  dto: AssignUsersDto;
}): Promise<void> => {
  await apiClient.patch(`/site/${siteId}`, dto);
};

export const removeSiteUser = async ({
  siteId,
  userId,
}: {
  siteId: string;
  userId: string;
}): Promise<void> => {
  const response = await apiClient.get(`/site/${siteId}`);
  const detail = response.data.data as SiteItemWithAssignments;
  const assignments =
    detail.assignments
      ?.filter((assignment) => assignment.userId !== userId)
      .map(({ userId: assignedUserId, type }) => ({
        userId: assignedUserId,
        type,
      })) ?? [];

  await apiClient.patch(`/site/${siteId}`, { assignments });
};
