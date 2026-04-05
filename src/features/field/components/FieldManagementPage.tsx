"use client";

import { useState } from "react";
import { MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldOutworkPage } from "./FieldOutworkPage";

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

// ─── Duty Placeholder ─────────────────────────────────────────────────────────

function DutyPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] gap-5">
      <div className="relative">
        <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20">
          <Clock className="w-12 h-12 text-primary-foreground" />
        </div>
        <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-bold rounded-full border border-secondary/50">
          준비 중
        </span>
      </div>
      <div className="text-center max-w-sm">
        <p className="text-xl font-bold text-text-strong">당직 현장 관리</p>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          당직 현장 관리 기능이 곧 추가될 예정입니다.
          <br />
          조금만 기다려 주세요.
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FieldManagementPage() {
  const [activeTab, setActiveTab] = useState<FieldTab>("outwork");

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
        <DutyPlaceholder />
      ) : (
        <FieldOutworkPage />
      )}
    </div>
  );
}
