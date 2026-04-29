"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  X,
  CalendarDays,
  MapPin,
  Clock,
  FileText,
  ChevronRight,
  Users,
  Search,
  UserPlus,
  UserMinus,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { KakaoMapPicker } from "./KakaoMapPicker";
import { useFieldSiteTypeList } from "../hooks/useFieldSiteTypes";
import { registerFieldSite, updateFieldSiteRegister } from "../services/fieldSiteApi";
import { createFieldWorkLog } from "../services/fieldWorkLogApi";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE_META } from "@/types/user";
import { searchUsers, UserSummary } from "../services/userApi";
import { SCHEDULE_KEYS } from "../hooks/useFieldWorkSchedules";
import { BaseModal } from "@/components/shared/BaseModal";
import { SelectDropdown } from "@/components/shared/SelectDropdown";

// ─── 공유 타입 ─────────────────────────────────────────────────────────────────

export interface DetailWorkLog {
  id: string;
  startedAt: string | null;
  endedAt: string | null;
  description: string | null;
  user?: { id: string; name: string; role?: number };
  users?: Array<{ id: string; name: string; role?: number }>;
}

export interface DetailSchedule {
  id: string;
  startDate: string;
  endDate?: string | null;
  fieldSite: {
    id: string;
    title: string;
    latitude: number | null;
    longitude: number | null;
    fieldSiteType?: { id: number; name: string; color: string } | null;
  };
  workLogs: DetailWorkLog[];
}

// create 모드 전용: 날짜별 작업 기록 항목
interface WorkLogEntry {
  date: string;
  startedAt: string;
  endedAt: string;
  description: string;
  participants: UserSummary[]; // 참여자 → backend participantUserIds
}

// edit 모드 전용: id가 있는 편집 가능한 작업 기록
interface EditableWorkLogEntry extends WorkLogEntry {
  id?: string; // undefined = 수정 모드에서 새로 추가한 기록
  displayName?: string; // 작성자 이름 (카드 헤더 표시용)
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function createEmptyLog(): WorkLogEntry {
  return { date: "", startedAt: "", endedAt: "", description: "", participants: [] };
}

function formatDateKo(dateStr: string): string {
  if (!dateStr) return "날짜 미설정";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${m}월 ${d}일 (${days[date.getDay()]})`;
}

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── 권한별 색상 헬퍼 ──────────────────────────────────────────────────────────

function getRoleStyle(role: number) {
  const meta = ROLE_META[role as keyof typeof ROLE_META];
  const color = meta?.color ?? "success";
  const avatarClass =
    color === "primary"
      ? "bg-primary/25 text-primary-foreground"
      : color === "secondary"
      ? "bg-secondary/40 text-secondary-foreground"
      : "bg-success/30 text-success-foreground";
  const badgeClass =
    color === "primary"
      ? "bg-primary/20 text-primary-foreground"
      : color === "secondary"
      ? "bg-secondary/40 text-secondary-foreground"
      : "bg-success/30 text-success-foreground";
  const cardClass =
    color === "primary"
      ? "bg-primary/10 border-primary/20"
      : color === "secondary"
      ? "bg-secondary/10 border-secondary/20"
      : "bg-success/10 border-success/20";
  return { avatarClass, badgeClass, cardClass, label: meta?.label ?? "인력" };
}

// ─── WorkLogCard (create 모드 날짜별 카드) ────────────────────────────────────

function WorkLogCard({
  entry,
  index,
  isExpanded,
  isSelected,
  minDate,
  maxDate,
  onToggle,
  onSelect,
  onRemove,
  onUpdate,
  displayName,
  hideDate,
  hideRemove,
}: {
  entry: WorkLogEntry;
  index: number;
  isExpanded: boolean;
  isSelected: boolean;
  minDate?: string;
  maxDate?: string;
  onToggle: () => void;
  onSelect: () => void;
  onRemove: () => void;
  onUpdate: (update: Partial<WorkLogEntry>) => void;
  displayName?: string;
  hideDate?: boolean;
  hideRemove?: boolean;
}) {
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all ${
        isSelected ? "border-secondary/60 shadow-sm" : "border-border"
      }`}
    >
      {/* 카드 헤더 */}
      <div
        className={`flex items-center gap-2.5 px-4 py-3 transition-colors ${
          isExpanded ? "bg-primary/5" : ""
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2.5 flex-1 text-left min-w-0"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              entry.date ? "bg-success" : "bg-border"
            }`}
          />
          <span className="text-sm font-semibold text-text truncate">
            {hideDate
              ? (displayName ? `${displayName}의 현장 기록` : `현장 기록 ${index + 1}`)
              : (entry.date ? formatDateKo(entry.date) : `현장 기록 ${index + 1}`)}
          </span>
          {entry.participants.length > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
              <Users className="w-3 h-3" />
              {entry.participants.length}
            </span>
          )}
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </button>
        {!hideRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger-foreground transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 카드 바디 (펼쳐진 상태) */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-border bg-surface">
          {/* 날짜 선택 (create 모드만) */}
          {!hideDate && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                작업 날짜 <span className="text-danger-foreground">*</span>
              </label>
              <input
                type="date"
                value={entry.date}
                min={minDate}
                max={maxDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const update: Partial<WorkLogEntry> = { date: newDate };
                  if (entry.startedAt || entry.endedAt) {
                    update.startedAt = "";
                    update.endedAt = "";
                  }
                  onUpdate(update);
                }}
                className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-colors"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={`text-xs font-medium mb-1 block ${(hideDate || entry.date) ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                시작 시간
              </label>
              <input
                type="datetime-local"
                value={entry.startedAt}
                min={hideDate ? (minDate ? `${minDate}T00:00` : undefined) : (entry.date ? `${entry.date}T00:00` : undefined)}
                max={hideDate ? (maxDate ? `${maxDate}T23:59` : undefined) : (entry.date ? `${entry.date}T23:59` : undefined)}
                disabled={!hideDate && !entry.date}
                onChange={(e) => {
                  const newStart = e.target.value;
                  const update: Partial<WorkLogEntry> = { startedAt: newStart };
                  if (entry.endedAt && entry.endedAt <= newStart) {
                    update.endedAt = "";
                  }
                  onUpdate(update);
                }}
                className={`w-full px-3 py-2 border border-border rounded-xl text-xs bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-colors ${(!hideDate && !entry.date) ? "opacity-40 cursor-not-allowed bg-muted/30" : ""}`}
              />
              {!hideDate && !entry.date && (
                <p className="text-[10px] text-muted-foreground/50 mt-1">작업 날짜를 먼저 선택하세요</p>
              )}
            </div>
            <div>
              <label className={`text-xs font-medium mb-1 block ${(hideDate || entry.date) ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                종료 시간
              </label>
              <input
                type="datetime-local"
                value={entry.endedAt}
                min={entry.startedAt || (hideDate ? (minDate ? `${minDate}T00:00` : undefined) : (entry.date ? `${entry.date}T00:00` : undefined))}
                max={hideDate ? (maxDate ? `${maxDate}T23:59` : undefined) : (entry.date ? `${entry.date}T23:59` : undefined)}
                disabled={!hideDate && !entry.date}
                onChange={(e) => onUpdate({ endedAt: e.target.value })}
                className={`w-full px-3 py-2 border border-border rounded-xl text-xs bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-colors ${(!hideDate && !entry.date) ? "opacity-40 cursor-not-allowed bg-muted/30" : ""}`}
              />
              {!hideDate && !entry.date && (
                <p className="text-[10px] text-muted-foreground/50 mt-1">작업 날짜를 먼저 선택하세요</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5 block">
              <FileText className="w-3 h-3" />
              작업 설명
            </label>
            <textarea
              value={entry.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="작업 내용, 특이사항 등"
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-surface text-text placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-colors resize-none"
            />
          </div>
          <button
            type="button"
            onClick={onSelect}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
              isSelected
                ? "bg-secondary/15 border-secondary/40 text-secondary-foreground"
                : "border-border text-muted-foreground hover:bg-muted/50 hover:border-secondary/40"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {isSelected ? "참여자 편집 중" : "참여자 설정"}
            {entry.participants.length > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground">
                ({entry.participants.length}명)
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── WorkLogPersonnelPanel (create 모드 우측 패널) ────────────────────────────

function WorkLogPersonnelPanel({
  log,
  onAddParticipant,
  onRemoveParticipant,
}: {
  log: WorkLogEntry;
  onAddParticipant: (user: UserSummary) => void;
  onRemoveParticipant: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    searchUsers("")
      .then((res) => {
        setAllUsers(res?.data?.users ?? res?.data ?? []);
      })
      .catch(() => setAllUsers([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchUsers(query.trim());
        setAllUsers(res?.data?.users ?? res?.data ?? []);
      } catch {
        // 검색 실패 시 기존 목록 유지
      }
    }, 350);
  }, [query]);

  const participantIds = new Set(log.participants.map((p) => p.id));
  const results = allUsers.filter(
    (u) => !participantIds.has(u.id) && (!query.trim() || u.name.includes(query.trim()))
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <span className="p-1.5 bg-secondary/30 rounded-lg">
          <Users className="w-4 h-4 text-secondary-foreground" />
        </span>
        <span className="text-sm font-semibold text-text">참여자 설정</span>
        <span className="text-xs text-muted-foreground/70 ml-0.5">(선택)</span>
      </div>

      {/* 참여자 현황 */}
      <div className="mb-3 shrink-0">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          참여자 {log.participants.length > 0 ? `(${log.participants.length}명)` : "없음"}
        </p>
        {log.participants.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-border rounded-xl">
            <Users className="w-4 h-4 text-muted-foreground/30 shrink-0" />
            <p className="text-xs text-muted-foreground">이름을 검색하여 추가하세요</p>
          </div>
        ) : (
          <ul className="space-y-1.5 max-h-36 overflow-y-auto">
            {log.participants.map((user) => {
              const { avatarClass, badgeClass, cardClass, label } = getRoleStyle(user.role);
              return (
                <li
                  key={user.id}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-xl ${cardClass}`}
                >
                  <span className="text-sm text-text font-medium flex-1 truncate">
                    {user.name}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${badgeClass}`}
                  >
                    {label}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(user.id)}
                    className="p-1 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger-foreground transition-colors shrink-0"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 검색창 */}
      <div className="relative shrink-0 mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름으로 검색…"
          className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-sm bg-surface text-text placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary/60 transition-colors"
        />
      </div>

      {/* 검�� 결과 */}
      {(results.length > 0 || isLoading || query.trim()) && (
        <div className="border border-border rounded-xl overflow-hidden shrink-0">
          {isLoading ? (
            <div className="px-3 py-2.5 text-xs text-muted-foreground text-center">
              불러오는 중…
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-muted-foreground text-center">
              검색 결과가 없습니다.
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-36 overflow-y-auto">
              {results.map((user) => {
                const { avatarClass, badgeClass, label } = getRoleStyle(user.role);
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => onAddParticipant(user)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-left group"
                    >
                      <span className="text-sm text-text font-medium flex-1 truncate">
                        {user.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${badgeClass}`}
                      >
                        {label}
                      </span>
                      <UserPlus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-text transition-colors shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 메인 모달 ────────────────────────────────────────────────────────────────

interface CreateScheduleModalProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  mode?: "create" | "edit";
  editData?: DetailSchedule | null;
}

export function CreateScheduleModal({
  open,
  onClose,
  defaultDate,
  mode = "create",
  editData,
}: CreateScheduleModalProps) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: siteTypesData } = useFieldSiteTypeList();
  const siteTypes: Array<{ id: number; name: string; color: string }> =
    siteTypesData?.data?.siteTypes ?? [];

  // ── 공통 폼 상태 ───────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState(defaultDate ?? "");
  const [endDate, setEndDate] = useState("");
  const [fieldSiteTypeId, setFieldSiteTypeId] = useState("");
  const [title, setTitle] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── create 모드: 날짜별 작업 기록 상태 ────────────────────────────────────
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>([]);
  const [selectedLogIdx, setSelectedLogIdx] = useState<number | null>(null);
  const [expandedLogIdx, setExpandedLogIdx] = useState<number | null>(null);

  // ── edit 모드: 편집 가능한 작업 기록 목록 ────────────────────────────────
  const [editLogs, setEditLogs] = useState<EditableWorkLogEntry[]>([]);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && editData) {
      setStartDate(editData.startDate);
      setEndDate(editData.endDate ?? "");
      setFieldSiteTypeId(String(editData.fieldSite.fieldSiteType?.id ?? ""));
      setTitle(editData.fieldSite.title);
      setLat(editData.fieldSite.latitude);
      setLng(editData.fieldSite.longitude);
      setAddress("");
      setEditLogs(
        editData.workLogs.map((wl) => ({
          id: wl.id,
          date: editData.startDate,
          startedAt: isoToDatetimeLocal(wl.startedAt),
          endedAt: isoToDatetimeLocal(wl.endedAt),
          description: wl.description ?? "",
          participants: (wl.users ?? []).map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role ?? 0,
          })),
          displayName: wl.user?.name,
        }))
      );
      setSelectedLogIdx(null);
      setExpandedLogIdx(null);
    } else if (mode === "create") {
      const initialDate = defaultDate ?? "";
      setStartDate(initialDate);
      setEndDate("");
      setFieldSiteTypeId("");
      setTitle("");
      setLat(null);
      setLng(null);
      setAddress("");
      setEditLogs([]);
      setWorkLogs([]);
      setSelectedLogIdx(null);
      setExpandedLogIdx(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const handleLocationChange = useCallback(
    (newLat: number, newLng: number, addr: string) => {
      setLat(newLat);
      setLng(newLng);
      setAddress(addr);
    },
    []
  );

  // create 모드 작업 기록 업데이트
  const updateWorkLog = useCallback((index: number, update: Partial<WorkLogEntry>) => {
    setWorkLogs((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...update } : l))
    );
  }, []);

  // edit 모드 작업 기록 업데이트
  const updateEditLog = useCallback((index: number, update: Partial<WorkLogEntry>) => {
    setEditLogs((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...update } : l))
    );
  }, []);

  const canSubmit = Boolean(startDate.trim() && title.trim() && lat !== null && lng !== null);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      if (mode === "edit" && editData) {
        const origTypeId = String(editData.fieldSite.fieldSiteType?.id ?? "");

        // 현장 & 스케줄 공통 변경사항
        const sharedDto: Record<string, unknown> = {};
        if (startDate !== editData.startDate) sharedDto.startDate = startDate;
        const origEndDate = editData.endDate ?? "";
        if (endDate !== origEndDate) sharedDto.endDate = endDate || null;
        if (title.trim() !== editData.fieldSite.title) sharedDto.title = title.trim();
        if (lat !== editData.fieldSite.latitude && lat !== null) sharedDto.latitude = lat;
        if (lng !== editData.fieldSite.longitude && lng !== null) sharedDto.longitude = lng;
        if (fieldSiteTypeId !== origTypeId && fieldSiteTypeId) {
          sharedDto.fieldSiteTypeId = Number(fieldSiteTypeId);
        }

        // 기존 작업 기록 변경사항 처리 (id 있는 로그만)
        const existingLogs = editLogs.filter((l) => !!l.id);
        const newEditLogs = editLogs.filter((l) => !l.id);
        let callCount = 0;
        for (let i = 0; i < existingLogs.length; i++) {
          const log = existingLogs[i];
          const origWl = editData.workLogs.find((wl) => wl.id === log.id);
          const logDto: Record<string, unknown> = {};

          const origStartedAt = isoToDatetimeLocal(origWl?.startedAt);
          const origEndedAt = isoToDatetimeLocal(origWl?.endedAt);
          if (log.startedAt !== origStartedAt && log.startedAt) {
            logDto.startedAt =
              log.startedAt.length === 16 ? log.startedAt + ":00" : log.startedAt;
          }
          if (log.endedAt !== origEndedAt && log.endedAt) {
            logDto.endedAt =
              log.endedAt.length === 16 ? log.endedAt + ":00" : log.endedAt;
          }
          const origDesc = origWl?.description ?? "";
          if (log.description.trim() !== origDesc) {
            logDto.description = log.description.trim() || undefined;
          }
          const origParticipantIds = [...(origWl?.users ?? []).map((u) => u.id)]
            .sort()
            .join(",");
          const newParticipantIds = [...log.participants.map((p) => p.id)].sort().join(",");
          if (origParticipantIds !== newParticipantIds) {
            logDto.participantUserIds = log.participants.map((p) => p.id);
          }

          // 첫 번째 기록에 현장/스케줄 변경사항 포함
          const dto = i === 0 ? { ...sharedDto, ...logDto } : logDto;
          if (Object.keys(dto).length > 0) {
            await updateFieldSiteRegister(log.id!, dto);
            callCount++;
          }
        }

        // 작업 기록 변경 없이 현장/스케줄만 변경된 경우 첫 번째 기존 기록으로 처리
        const firstExisting = existingLogs[0];
        if (callCount === 0 && Object.keys(sharedDto).length > 0 && firstExisting?.id) {
          await updateFieldSiteRegister(firstExisting.id, sharedDto);
        }

        // 새로 추가된 작업 기록 생성
        for (const log of newEditLogs) {
          const result = await createFieldWorkLog({
            scheduleId: editData.id,
            ...(log.startedAt
              ? { startedAt: log.startedAt.length === 16 ? log.startedAt + ":00" : log.startedAt }
              : {}),
            ...(log.endedAt
              ? { endedAt: log.endedAt.length === 16 ? log.endedAt + ":00" : log.endedAt }
              : {}),
            ...(log.description.trim() ? { description: log.description.trim() } : {}),
          });
          // 참여자가 있으면 생성된 기록 ID로 추가 업데이트
          const newId: string | undefined = result?.data?.log?.id ?? result?.data?.id ?? result?.id;
          if (newId && log.participants.length > 0) {
            await updateFieldSiteRegister(newId, {
              participantUserIds: log.participants.map((p) => p.id),
            });
          }
        }

        toast.success("스케줄이 수정되었습니다.");
      } else {
        // 날짜가 설정된 기록만 포함, userId는 현재 로그인한 사용자
        const validLogs = workLogs
          .filter((l) => l.date && currentUserId)
          .map((l) => ({
            userId: currentUserId!,
            ...(l.startedAt
              ? { startedAt: l.startedAt.length === 16 ? `${l.startedAt}:00` : l.startedAt }
              : {}),
            ...(l.endedAt
              ? { endedAt: l.endedAt.length === 16 ? `${l.endedAt}:00` : l.endedAt }
              : {}),
            ...(l.description.trim() ? { description: l.description.trim() } : {}),
            ...(l.participants.length
              ? { participantUserIds: l.participants.map((p) => p.id) }
              : {}),
          }));

        await registerFieldSite({
          title: title.trim(),
          startDate,
          ...(endDate ? { endDate } : {}),
          ...(lat !== null ? { latitude: lat } : {}),
          ...(lng !== null ? { longitude: lng } : {}),
          ...(fieldSiteTypeId ? { fieldSiteTypeId: Number(fieldSiteTypeId) } : {}),
          ...(validLogs.length ? { logs: validLogs } : {}),
        });
        toast.success("현장 및 스케줄이 등록되었습니다.");
      }

      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.all });
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      const text = Array.isArray(msg)
        ? msg[0]
        : (msg ?? (mode === "edit" ? "수정에 실패했습니다." : "등록에 실패했습니다."));
      toast.error(text);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = mode === "edit";

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-4xl" panelClassName="flex flex-col max-h-[92dvh] overflow-hidden shadow-2xl" padding="p-3 sm:p-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div>
              <h2 className="text-base font-bold text-text">
                {isEdit ? "현장 & 스케줄 수정" : "현장 & 스케줄 등록"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEdit
                  ? "수정할 항목만 변경하고 저장하세요"
                  : "현장 정보, 작업 일정, 담당자 및 참여자를 한 번에 등록합니다"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Body: 2컬럼 ── */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_280px]">

            {/* ── 왼쪽: 현장 & 스케줄 폼 ── */}
            <div className="overflow-y-auto px-6 py-5 space-y-5 border-r border-border">

              {/* 작업 날짜 */}
              <section className="space-y-3">
                <SectionLabel icon={<CalendarDays className="w-4 h-4" />} label="작업 날짜" required />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      시작 날짜 <span className="text-danger-foreground">*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      종료 날짜 <span className="text-muted-foreground/50">(선택)</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </section>

              {/* 현장 정보 */}
              <section className="space-y-3">
                <SectionLabel icon={<MapPin className="w-4 h-4" />} label="현장 정보" required />

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    현장 타입 <span className="text-muted-foreground/50">(선택)</span>
                  </label>
                  <SelectDropdown
                    options={siteTypes.map((t) => ({
                      value: String(t.id),
                      label: t.name,
                      color: t.color,
                    }))}
                    value={fieldSiteTypeId || null}
                    onChange={(v) => setFieldSiteTypeId(v ?? "")}
                    nullLabel="타입 없음"
                    align="left"
                    minWidth="100%"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    현장 이름 <span className="text-danger-foreground">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 김해시청 외벽 도장 공사"
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-surface text-text placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    현장 위치 <span className="text-danger-foreground">*</span>
                  </label>
                  <KakaoMapPicker
                    onLocationChange={handleLocationChange}
                    initialLat={
                      isEdit && editData?.fieldSite.latitude != null
                        ? editData.fieldSite.latitude
                        : undefined
                    }
                    initialLng={
                      isEdit && editData?.fieldSite.longitude != null
                        ? editData.fieldSite.longitude
                        : undefined
                    }
                  />
                  {lat !== null && (
                    <p className="text-xs text-success-foreground mt-1.5 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                      위치 선택 완료{address ? `: ${address}` : ""}
                    </p>
                  )}
                </div>
              </section>

              {/* 작업 기록 */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <SectionLabel icon={<Clock className="w-4 h-4" />} label="현장 기록" />
                    <span className="text-xs text-muted-foreground/60">(선택)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (isEdit) {
                        setEditLogs((prev) => [...prev, { ...createEmptyLog(), date: startDate }]);
                        setExpandedLogIdx(editLogs.length);
                      } else {
                        setWorkLogs((prev) => [...prev, createEmptyLog()]);
                        setExpandedLogIdx(workLogs.length);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary-foreground hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    기록 추가
                  </button>
                </div>

                {/* edit 모드: 기존 작업 기록 카드 (데이터 미리 채워짐) + 새로 추가한 기록 */}
                {isEdit && (
                  editLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-8">
                      <Clock className="w-8 h-8 text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground">
                        위의 [기록 추가] 버튼으로 현장 기록을 추가하세요
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editLogs.map((entry, idx) => (
                        <WorkLogCard
                          key={entry.id ?? `new-${idx}`}
                          entry={entry}
                          index={idx}
                          isExpanded={expandedLogIdx === idx}
                          isSelected={selectedLogIdx === idx}
                          onToggle={() =>
                            setExpandedLogIdx(expandedLogIdx === idx ? null : idx)
                          }
                          onSelect={() => setSelectedLogIdx(idx)}
                          onRemove={() => {
                            // 새로 추가한 기록(id 없음)만 삭제 가능
                            setEditLogs((prev) => prev.filter((_, i) => i !== idx));
                            if (selectedLogIdx === idx) setSelectedLogIdx(null);
                            if (expandedLogIdx === idx) setExpandedLogIdx(null);
                          }}
                          onUpdate={(update) => updateEditLog(idx, update)}
                          displayName={entry.displayName}
                          minDate={startDate || undefined}
                          maxDate={endDate || undefined}
                          hideDate
                          hideRemove={!!entry.id}
                        />
                      ))}
                    </div>
                  )
                )}

                {/* create 모드: 날짜별 작업 기록 아코디언 */}
                {!isEdit && (
                  workLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-8">
                      <Clock className="w-8 h-8 text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground">
                        위의 [기록 추가] 버튼으로 현장 기록을 추가하세요
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {workLogs.map((entry, idx) => (
                        <WorkLogCard
                          key={idx}
                          entry={entry}
                          index={idx}
                          isExpanded={expandedLogIdx === idx}
                          isSelected={selectedLogIdx === idx}
                          minDate={startDate || undefined}
                          maxDate={endDate || undefined}
                          onToggle={() =>
                            setExpandedLogIdx(expandedLogIdx === idx ? null : idx)
                          }
                          onSelect={() => setSelectedLogIdx(idx)}
                          onRemove={() => {
                            setWorkLogs((prev) => prev.filter((_, i) => i !== idx));
                            if (selectedLogIdx === idx) setSelectedLogIdx(null);
                            if (expandedLogIdx === idx) setExpandedLogIdx(null);
                          }}
                          onUpdate={(update) => updateWorkLog(idx, update)}
                        />
                      ))}
                    </div>
                  )
                )}
              </section>
            </div>

            {/* ── 오른쪽: 인원 패널 ── */}
            <div className="overflow-y-auto px-5 py-5 flex flex-col min-h-0 bg-muted/20">
              {isEdit ? (
                selectedLogIdx !== null && editLogs[selectedLogIdx] ? (
                  <>
                    <div className="flex items-center gap-2 mb-3 shrink-0">
                      <span className="p-1.5 bg-secondary/30 rounded-lg">
                        <Users className="w-4 h-4 text-secondary-foreground" />
                      </span>
                      <div>
                        <span className="text-sm font-semibold text-text">인원 설정</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {editLogs[selectedLogIdx].displayName
                            ? `${editLogs[selectedLogIdx].displayName}의 작업`
                            : `현장 기록 ${selectedLogIdx + 1}`}
                        </p>
                      </div>
                    </div>
                    <WorkLogPersonnelPanel
                      key={selectedLogIdx}
                      log={editLogs[selectedLogIdx]}
                      onAddParticipant={(user) =>
                        updateEditLog(selectedLogIdx, {
                          participants: [
                            ...editLogs[selectedLogIdx].participants.filter(
                              (p) => p.id !== user.id
                            ),
                            user,
                          ],
                        })
                      }
                      onRemoveParticipant={(id) =>
                        updateEditLog(selectedLogIdx, {
                          participants: editLogs[selectedLogIdx].participants.filter(
                            (p) => p.id !== id
                          ),
                        })
                      }
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="p-4 bg-muted/50 rounded-2xl">
                      <Users className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">인원 설정</p>
                      <p className="text-xs text-muted-foreground/70 px-4 leading-relaxed">
                        현장 기록 카드를 펼치고
                        <br />
                        [담당자 &amp; 참여자 설정] 버튼을 누르세요
                      </p>
                    </div>
                  </div>
                )
              ) : selectedLogIdx !== null && workLogs[selectedLogIdx] ? (
                <>
                  <div className="flex items-center gap-2 mb-3 shrink-0">
                    <span className="p-1.5 bg-secondary/30 rounded-lg">
                      <Users className="w-4 h-4 text-secondary-foreground" />
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-text">인원 설정</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDateKo(workLogs[selectedLogIdx].date)}
                      </p>
                    </div>
                  </div>
                  <WorkLogPersonnelPanel
                    key={selectedLogIdx}
                    log={workLogs[selectedLogIdx]}
                    onAddParticipant={(user) =>
                      updateWorkLog(selectedLogIdx, {
                        participants: [
                          ...workLogs[selectedLogIdx].participants.filter(
                            (p) => p.id !== user.id
                          ),
                          user,
                        ],
                      })
                    }
                    onRemoveParticipant={(id) =>
                      updateWorkLog(selectedLogIdx, {
                        participants: workLogs[selectedLogIdx].participants.filter(
                          (p) => p.id !== id
                        ),
                      })
                    }
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="p-4 bg-muted/50 rounded-2xl">
                    <Users className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">인원 설정</p>
                    <p className="text-xs text-muted-foreground/70 px-4 leading-relaxed">
                      현장 기록 카드를 펼치고
                      <br />
                      [담당자 &amp; 참여자 설정] 버튼을 누르세요
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 pb-5 pt-3.5 border-t border-border shrink-0">
            {!canSubmit && (
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                <span className="text-danger-foreground font-bold">*</span>
                작업 날짜, 현장 이름, 현장 위치(지도 클릭)는 필수입니다.
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {isEdit ? "수정 중…" : "등록 중…"}
                  </>
                ) : (
                  <>
                    {isEdit ? "수정하기" : "등록하기"}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
    </BaseModal>
  );
}

// ── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({
  icon,
  label,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="p-1.5 bg-primary/15 rounded-lg text-primary-foreground">{icon}</span>
      <span className="text-sm font-semibold text-text">{label}</span>
      {required && <span className="text-danger-foreground text-xs ml-0.5">*</span>}
    </div>
  );
}