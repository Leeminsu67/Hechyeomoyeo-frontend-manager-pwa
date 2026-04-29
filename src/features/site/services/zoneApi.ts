import apiClient from "@/lib/axios";
import type {
  ZoneListParams,
  ZoneListResponse,
  ZoneItem,
  CreateZoneDto,
  UpdateZoneDto,
} from "@/types/zone";

export const getZones = async (
  siteId: string,
  params: ZoneListParams
): Promise<ZoneListResponse> => {
  const response = await apiClient.get(`/zone/${siteId}`, { params });
  return response.data;
};

export const getZone = async (
  id: string,
  siteId: string
): Promise<{ data: { zone: ZoneItem } }> => {
  const response = await apiClient.get(`/zone/${siteId}/${id}`);
  return response.data;
};

export const createZone = async (
  siteId: string,
  dto: CreateZoneDto
): Promise<{ data: { zone: ZoneItem } }> => {
  const response = await apiClient.post(`/zone/${siteId}`, dto);
  return response.data;
};

export const updateZone = async ({
  id,
  siteId,
  dto,
}: {
  id: string;
  siteId: string;
  dto: UpdateZoneDto;
}): Promise<{ data: { zone: ZoneItem } }> => {
  const response = await apiClient.patch(`/zone/${siteId}/${id}`, dto);
  return response.data;
};

export const deleteZone = async (id: string, siteId: string): Promise<void> => {
  await apiClient.delete(`/zone/${siteId}/${id}`);
};
