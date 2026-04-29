"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  BarChart3,
  Bell,
} from "lucide-react";
import { useSite } from "@/features/site/hooks/useSites";
import { DailyAttendanceTab } from "./DailyAttendanceTab";
import { MonthlyReportTab } from "./MonthlyReportTab";
import { AlertsTab, useUnreadAlertCount } from "./AlertsTab";
import { cn } from "@/lib/utils";

type TabKey = "daily" | "report" | "alerts";

interface TabDef {
  key: TabKey;
  icon: React.ElementType;
  label: string;
}

const TABS: TabDef[] = [
  { key: "daily", icon: ClipboardList, label: "금일 출결 현황" },
  { key: "report", icon: BarChart3, label: "월간 리포트" },
  { key: "alerts", icon: Bell, label: "이상 알림" },
];

export function AttendanceDetailPage({ siteId }: { siteId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("daily");
  const { data: site } = useSite(siteId);
  const unreadCount = useUnreadAlertCount(siteId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-5 pb-0">
            {/* Back + Title */}
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => router.push("/attendance")}
                className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-text-strong tracking-tight">
                  {site?.name ?? "현장 출결"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {site?.siteType?.name ?? ""}
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 -mb-px overflow-x-auto mt-3">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap",
                      isActive
                        ? "border-primary text-primary-foreground bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-text hover:border-border"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.key === "alerts" && unreadCount > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-danger-foreground rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "daily" && <DailyAttendanceTab siteId={siteId} />}
        {activeTab === "report" && <MonthlyReportTab siteId={siteId} />}
        {activeTab === "alerts" && <AlertsTab siteId={siteId} />}
      </div>
    </div>
  );
}
