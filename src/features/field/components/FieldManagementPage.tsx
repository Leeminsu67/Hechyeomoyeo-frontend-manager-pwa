"use client";

import { useState } from "react";
import { MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldOutworkPage } from "./FieldOutworkPage";
import { DutySitePage } from "./DutySitePage";

type FieldTab = "duty" | "outwork";

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap",
        active
          ? "border-primary text-primary-foreground bg-primary/5"
          : "border-transparent text-muted-foreground hover:text-text hover:border-border"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FieldManagementPage() {
  const [activeTab, setActiveTab] = useState<FieldTab>("duty");

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page Header with Tabs ── */}
      <div className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-5 pb-0">
            <h1 className="text-2xl font-bold text-text-strong tracking-tight">현장 관리</h1>
            <p className="text-sm text-muted-foreground mt-0.5 mb-4">
              당직 현장과 외근 현장을 통합 관리합니다
            </p>

            {/* Tab Navigation */}
            <div className="flex gap-1 -mb-px overflow-x-auto">
              <TabButton
                active={activeTab === "duty"}
                onClick={() => setActiveTab("duty")}
                icon={Clock}
                label="당직 현장"
              />
              <TabButton
                active={activeTab === "outwork"}
                onClick={() => setActiveTab("outwork")}
                icon={MapPin}
                label="외근 현장"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "duty" ? (
        <DutySitePage />
      ) : (
        <FieldOutworkPage />
      )}
    </div>
  );
}
