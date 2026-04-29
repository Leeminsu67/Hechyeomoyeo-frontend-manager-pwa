"use client";

import { useParams } from "next/navigation";
import { AttendanceDetailPage } from "@/features/attendance/components/AttendanceDetailPage";

export default function AttendanceDetailRoute() {
  const params = useParams<{ siteId: string }>();
  return <AttendanceDetailPage siteId={params.siteId} />;
}
