"use client";

import { useParams } from "next/navigation";
import { LocationPage } from "@/features/location/components/LocationPage";

export default function SiteLocationsPage() {
  const params = useParams<{ siteId: string }>();
  return <LocationPage initialSiteId={params.siteId} />;
}
