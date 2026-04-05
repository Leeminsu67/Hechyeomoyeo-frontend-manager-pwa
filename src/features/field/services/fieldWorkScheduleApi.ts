import apiClient from "@/lib/axios";
import type {
  CreateFieldWorkScheduleDto,
  GetFieldWorkScheduleParams,
  UpdateFieldWorkScheduleDto,
} from "@/types/field";

export const getFieldWorkSchedules = (params: GetFieldWorkScheduleParams) =>
  apiClient.get("/field-work-schedule", { params }).then((r) => r.data);

export const getFieldWorkSchedule = (id: string) =>
  apiClient.get(`/field-work-schedule/${id}`).then((r) => r.data);

export const createFieldWorkSchedule = (dto: CreateFieldWorkScheduleDto) =>
  apiClient.post("/field-work-schedule", dto).then((r) => r.data);

export const updateFieldWorkSchedule = ({
  id,
  dto,
}: {
  id: string;
  dto: UpdateFieldWorkScheduleDto;
}) => apiClient.patch(`/field-work-schedule/${id}`, dto).then((r) => r.data);

export const deleteFieldWorkSchedule = (id: string) =>
  apiClient.delete(`/field-work-schedule/${id}`).then((r) => r.data);