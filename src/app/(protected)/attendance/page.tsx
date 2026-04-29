import { AttendanceMainPage } from "@/features/attendance/components/AttendanceMainPage";

export const metadata = {
  title: "출결 관리 | 헤쳐모여",
  description: "현장별 출결 현황을 조회하고 관리합니다.",
};

export default function AttendanceManagementPage() {
  return <AttendanceMainPage />;
}
