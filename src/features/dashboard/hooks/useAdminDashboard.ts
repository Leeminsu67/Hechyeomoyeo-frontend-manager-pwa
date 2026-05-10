import { useQuery } from "@tanstack/react-query";
import type { AdminDashboardParams } from "@/types/dashboard";
import { getAdminDashboard } from "../services/adminDashboardApi";

export const ADMIN_DASHBOARD_KEYS = {
  all: ["dashboard", "admin"] as const,
  detail: (siteId?: string) =>
    ["dashboard", "admin", { siteId: siteId ?? null }] as const,
};

export function useAdminDashboard(
  params: AdminDashboardParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ADMIN_DASHBOARD_KEYS.detail(params.siteId),
    queryFn: () => getAdminDashboard(params),
    enabled,
  });
}
