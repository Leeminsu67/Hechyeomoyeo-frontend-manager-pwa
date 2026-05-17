"use client";

import { Loader2, MapPinned, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectDropdown } from "@/components/shared/SelectDropdown";
import type { ScheduleSiteOption } from "@/types/schedule";

export function LocationPageHeader({
  sites,
  selectedSiteId,
  sitesLoading,
  latestLoading,
  onSelectSite,
  onRefresh,
}: {
  sites: ScheduleSiteOption[];
  selectedSiteId: string | null;
  sitesLoading: boolean;
  latestLoading: boolean;
  onSelectSite: (siteId: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <MapPinned className="h-6 w-6 text-primary-foreground" />
          <h1 className="text-2xl font-bold tracking-tight text-text-strong">
            실시간 위치
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          선택한 현장의 작업자 위치 공유 상태를 확인합니다.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SelectDropdown
          options={sites.map((site) => ({ value: site.id, label: site.name }))}
          value={selectedSiteId}
          onChange={(value) => value && onSelectSite(value)}
          align="left"
          renderLabel={(selected) =>
            selected?.label ?? (sitesLoading ? "현장 불러오는 중" : "현장 선택")
          }
          minWidth="272px"
          className="w-full sm:w-[272px]"
        />
        <Button
          type="button"
          variant="outline"
          disabled={!selectedSiteId || latestLoading}
          onClick={onRefresh}
        >
          {latestLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          최신 조회
        </Button>
      </div>
    </div>
  );
}
