import { LocationPage } from "@/features/location/components/LocationPage";

export const metadata = {
  title: "실시간 위치 | 헤쳐모여",
  description: "현장 인력의 실시간 위치를 조회합니다.",
};

export default function LocationsPage({
  searchParams,
}: {
  searchParams?: { siteId?: string };
}) {
  return <LocationPage initialSiteId={searchParams?.siteId} />;
}
