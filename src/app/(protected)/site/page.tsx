import { FieldManagementPage } from "@/features/field/components/FieldManagementPage";

export const metadata = {
  title: "현장 관리 | 헤쳐모여",
  description: "당직 현장과 외근 현장을 통합 관리합니다.",
};

export default function SiteManagementPage() {
  return <FieldManagementPage />;
}
