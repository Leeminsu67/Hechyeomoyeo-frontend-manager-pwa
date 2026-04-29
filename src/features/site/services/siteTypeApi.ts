import apiClient from "@/lib/axios";
import type {
  SiteType,
  SiteTypeListResponse,
  CreateSiteTypeDto,
  UpdateSiteTypeDto,
} from "@/types/site";

export const getSiteTypes = async (): Promise<SiteTypeListResponse> => {
  const response = await apiClient.get("/site-type");
  return response.data;
};

export const getSiteType = async (id: number): Promise<SiteType> => {
  const response = await apiClient.get(`/site-type/${id}`);
  return response.data.data?.siteType ?? response.data.data;
};

export const createSiteType = async (dto: CreateSiteTypeDto): Promise<SiteType> => {
  const response = await apiClient.post("/site-type", dto);
  return response.data.data?.siteType ?? response.data.data;
};

export const updateSiteType = async ({
  id,
  dto,
}: {
  id: number;
  dto: UpdateSiteTypeDto;
}): Promise<SiteType> => {
  const response = await apiClient.patch(`/site-type/${id}`, dto);
  return response.data.data?.siteType ?? response.data.data;
};

export const deleteSiteType = async (id: number): Promise<void> => {
  await apiClient.delete(`/site-type/${id}`);
};
