import { AdminDashboardPage } from "@/features/dashboard/components/AdminDashboardPage";

export const metadata = {
  title: "관리자 대시보드 | 헤쳐모여",
  description: "현장 운영 핵심 지표와 위험 항목을 확인합니다.",
};

export default function DashboardPage({
  searchParams,
}: {
  searchParams?: { siteId?: string };
}) {
  return <AdminDashboardPage siteId={searchParams?.siteId} />;
}
