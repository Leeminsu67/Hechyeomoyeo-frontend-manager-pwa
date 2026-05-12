import { AuditLogsPage } from "@/features/audit-logs/components/AuditLogsPage";

export const metadata = {
  title: "감사 로그 | 헤쳐모여",
  description: "관리자 작업 변경 이력 조회 페이지",
};

export default function AuditLogsRoutePage() {
  return <AuditLogsPage />;
}
