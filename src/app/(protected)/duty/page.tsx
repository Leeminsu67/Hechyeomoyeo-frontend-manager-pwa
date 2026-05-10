import { DutyManagementPage } from "@/features/duty/components/DutyManagementPage";

export const metadata = {
  title: "당직 관리 | 헤쳐모여",
  description: "당직 관리 페이지",
};

export default function DutyPage({
  searchParams,
}: {
  searchParams?: { siteId?: string; tab?: string };
}) {
  return (
    <DutyManagementPage
      initialSiteId={searchParams?.siteId}
      initialTab={searchParams?.tab === "swap" ? "swap" : "calendar"}
    />
  );
}
