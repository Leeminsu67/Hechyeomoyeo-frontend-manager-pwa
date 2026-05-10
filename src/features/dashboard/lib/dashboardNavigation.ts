import type { AdminDashboardRiskItem } from "@/types/dashboard";

function appendSiteId(path: string, siteId: string | null) {
  if (!siteId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}siteId=${encodeURIComponent(siteId)}`;
}

export function getRiskItemHref(item: AdminDashboardRiskItem) {
  if (item.type === "schedule") {
    return appendSiteId("/duty", item.siteId);
  }

  if (item.type === "attendance") {
    return item.siteId
      ? `/attendance/${encodeURIComponent(item.siteId)}`
      : "/attendance";
  }

  if (item.type === "approval") {
    return appendSiteId("/duty?tab=swap", item.siteId);
  }

  return appendSiteId("/locations", item.siteId);
}
