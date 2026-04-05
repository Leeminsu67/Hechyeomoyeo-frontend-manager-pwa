import apiClient from "@/lib/axios";
import type { CreateFieldSiteDto, GetFieldSiteParams, UpdateFieldSiteDto } from "@/types/field";

export interface FieldWorkLogItemDto {
  userId: string;
  startedAt?: string;
  endedAt?: string;
  description?: string;
  participantUserIds?: string[];
}

export interface RegisterFieldSiteDto {
  title: string;
  latitude?: number;
  longitude?: number;
  fieldSiteTypeId?: number;
  startDate: string;
  endDate?: string;
  logs?: FieldWorkLogItemDto[];
}

export interface UpdateFieldSiteRegisterDto {
  title?: string;
  latitude?: number;
  longitude?: number;
  fieldSiteTypeId?: number | null;
  startDate?: string;
  endDate?: string | null;
  startedAt?: string;
  endedAt?: string;
  description?: string;
  participantUserIds?: string[];
}

export const registerFieldSite = (dto: RegisterFieldSiteDto) =>
  apiClient.post("/field-site/register", dto).then((r) => r.data);

export const updateFieldSiteRegister = (logId: string, dto: UpdateFieldSiteRegisterDto) =>
  apiClient.patch(`/field-site/register/${logId}`, dto).then((r) => r.data);

export const getFieldSites = (params: GetFieldSiteParams) =>
  apiClient.get("/field-site", { params }).then((r) => r.data);

export const getFieldSite = (id: string) =>
  apiClient.get(`/field-site/${id}`).then((r) => r.data);

export const createFieldSite = (dto: CreateFieldSiteDto) =>
  apiClient.post("/field-site", dto).then((r) => r.data);

export const updateFieldSite = ({
  id,
  dto,
}: {
  id: string;
  dto: UpdateFieldSiteDto;
}) => apiClient.patch(`/field-site/${id}`, dto).then((r) => r.data);

export const deleteFieldSite = (id: string) =>
  apiClient.delete(`/field-site/${id}`).then((r) => r.data);