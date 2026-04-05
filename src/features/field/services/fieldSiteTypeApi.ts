import apiClient from "@/lib/axios";

export const getFieldSiteTypes = () =>
  apiClient.get("/field-site-type").then((r) => r.data);

export const createFieldSiteType = (dto: { name: string; color: string }) =>
  apiClient.post("/field-site-type", dto).then((r) => r.data);

export const updateFieldSiteType = ({
  id,
  dto,
}: {
  id: number;
  dto: Partial<{ name: string; color: string }>;
}) => apiClient.patch(`/field-site-type/${id}`, dto).then((r) => r.data);

export const deleteFieldSiteType = (id: number) =>
  apiClient.delete(`/field-site-type/${id}`).then((r) => r.data);