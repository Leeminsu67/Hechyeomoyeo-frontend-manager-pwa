import apiClient from "@/lib/axios";
import type {
  AdminDashboardData,
  AdminDashboardParams,
} from "@/types/dashboard";

type AdminDashboardPayload =
  | AdminDashboardData
  | { data: AdminDashboardData };

function isDashboardEnvelope(
  payload: AdminDashboardPayload,
): payload is { data: AdminDashboardData } {
  return (
    "data" in payload &&
    payload.data !== null &&
    typeof payload.data === "object" &&
    "date" in payload.data
  );
}

function unwrapDashboardPayload(
  payload: AdminDashboardPayload,
): AdminDashboardData {
  if (isDashboardEnvelope(payload)) {
    return payload.data;
  }

  return payload;
}

export const getAdminDashboard = async (
  params: AdminDashboardParams = {},
): Promise<AdminDashboardData> => {
  const response = await apiClient.get<AdminDashboardPayload>(
    "/dashboard/admin",
    {
      params: params.siteId ? { siteId: params.siteId } : undefined,
    },
  );

  return unwrapDashboardPayload(response.data);
};
