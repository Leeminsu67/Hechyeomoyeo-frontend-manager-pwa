"use client";

import { X, MapPin, Tag, Calendar, Hash, Settings2, ChevronRight, Clock } from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { cn } from "@/lib/utils";
import { KakaoMapViewer } from "@/features/field/components/KakaoMapViewer";
import type { SiteItem } from "@/types/site";

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  planned: {
    label: "운영 예정",
    className: "bg-secondary/30 text-secondary-foreground border-secondary/40",
  },
  active: {
    label: "운영 중",
    className: "bg-success/30 text-success-foreground border-success/40",
  },
  closed: {
    label: "운영 종료",
    className: "bg-muted text-muted-foreground border-border",
  },
} as const;

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="text-sm text-text-strong font-medium">{children}</div>
      </div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
        {children}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SiteDetailModalProps {
  open: boolean;
  onClose: () => void;
  site: SiteItem;
  onZoneSettings: (site: SiteItem) => void;
}

export function SiteDetailModal({
  open,
  onClose,
  site,
  onZoneSettings,
}: SiteDetailModalProps) {
  const statusCfg = STATUS_CONFIG[site.status] ?? STATUS_CONFIG.planned;
  const hasLocation =
    typeof site.latitude === "number" && typeof site.longitude === "number";

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-lg" panelClassName="flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div
          className="relative flex items-start justify-between px-6 pt-5 pb-4 rounded-t-2xl overflow-hidden shrink-0"
          style={{
            background: site.siteType?.color
              ? `linear-gradient(135deg, ${site.siteType.color}22 0%, transparent 60%)`
              : undefined,
          }}
        >
          {/* Type color accent strip */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{ backgroundColor: site.siteType?.color ?? "#DEE2E6" }}
          />

          <div className="flex items-start gap-3 pl-2">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 shrink-0">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  #{site.displayCode.toString().padStart(4, "0")}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                    statusCfg.className
                  )}
                >
                  {statusCfg.label}
                </span>
              </div>
              <h2 className="text-lg font-bold text-text-strong mt-1 leading-tight">
                {site.name}
              </h2>
              {site.siteType && (
                <span
                  className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: site.siteType.color + "33",
                    borderColor: site.siteType.color + "88",
                    color: "#333",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: site.siteType.color }}
                  />
                  {site.siteType.name}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* 기본 정보 */}
          <div>
            <SectionLabel>기본 정보</SectionLabel>
            <div className="space-y-3">
              <InfoRow icon={Hash} label="현장 코드">
                #{site.displayCode.toString().padStart(4, "0")}
              </InfoRow>
              <InfoRow icon={Tag} label="사업 타입">
                {site.siteType ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border"
                    style={{
                      backgroundColor: site.siteType.color + "33",
                      borderColor: site.siteType.color + "88",
                      color: "#333",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: site.siteType.color }}
                    />
                    {site.siteType.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">미설정</span>
                )}
              </InfoRow>
              <InfoRow icon={Calendar} label="운영 기간">
                <span className="text-sm">
                  {formatDate(site.operationStartDate)}
                  <span className="mx-1.5 text-muted-foreground">~</span>
                  {formatDate(site.operationEndDate)}
                </span>
              </InfoRow>
              <InfoRow icon={Clock} label="등록일">
                {formatDate(site.createdAt)}
              </InfoRow>
            </div>
          </div>

          {/* 현장 위치 */}
          {hasLocation && (
            <div>
              <SectionLabel>현장 위치</SectionLabel>
              <KakaoMapViewer
                lat={site.latitude!}
                lng={site.longitude!}
                className="h-52"
              />
            </div>
          )}

          {/* 구역 설정 안내 */}
          <div className="p-4 rounded-xl bg-primary/8 border border-primary/20">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 shrink-0">
                <Settings2 className="w-4 h-4 text-primary-foreground" />
              </span>
              <div>
                <p className="text-sm font-semibold text-text-strong">현장 구역 관리</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  이 현장에 구역을 추가하고 각 구역의 근무 시간·위치를 설정합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-text border border-border rounded-xl hover:bg-muted transition-colors"
          >
            닫기
          </button>
          <button
            onClick={() => onZoneSettings(site)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary-300 transition-colors shadow-field"
          >
            <Settings2 className="w-4 h-4" />
            현장 구역 설정
            <ChevronRight className="w-4 h-4 -mr-1" />
          </button>
        </div>
    </BaseModal>
  );
}
