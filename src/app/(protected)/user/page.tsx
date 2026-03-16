import { Metadata } from "next";
import { UserPage } from "@/features/user/components/UserPage";

export const metadata: Metadata = {
  title: "인력 통합 관리",
};

export default function UserPageRoute() {
  return <UserPage />;
}
