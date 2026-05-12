import { ApprovalsPage } from "@/features/approvals/components/ApprovalsPage";
import type { ApprovalTab } from "@/types/approval";

export const metadata = {
  title: "승인 관리 | 헤쳐모여",
  description: "휴가 및 퇴근 보정 승인 관리 페이지",
};

function parseTab(tab?: string): ApprovalTab {
  return tab === "manual-clock-out" ? "manual-clock-out" : "leave";
}

export default function ApprovalPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  return <ApprovalsPage initialTab={parseTab(searchParams?.tab)} />;
}
