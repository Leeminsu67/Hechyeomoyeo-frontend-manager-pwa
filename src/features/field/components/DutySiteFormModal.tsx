"use client";

import { useEffect, useState, useRef } from "react";
import { BaseModal } from "@/components/shared/BaseModal";
import {
  X,
  MapPin,
  Tag,
  Calendar,
  Users,
  Search,
  UserPlus,
  UserMinus,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateSite,
  useUpdateSite,
  useSite,
} from "@/features/site/hooks/useSites";
import { useSiteTypeList } from "@/features/site/hooks/useSiteTypes";
import { SelectDropdown } from "@/components/shared/SelectDropdown";
import { KakaoMapPicker } from "./KakaoMapPicker";
import { searchUsers } from "@/features/field/services/userApi";
import { ROLE_META } from "@/types/user";
import type { SiteItem, SiteType, SiteStatus } from "@/types/site";
import type { UserSummary } from "@/features/field/services/userApi";

// ─── Status Options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: SiteStatus; label: string; color: string }[] = [
  { value: "planned", label: "예정",   color: "#FFD8A8" },
  { value: "active",  label: "운영 중", color: "#B2F2BB" },
  { value: "closed",  label: "종료",   color: "#DEE2E6" },
];

// ─── Role Style Helper ────────────────────────────────────────────────────────

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
      ? "bg-primary/20 text-primary-foreground border border-primary/30"
      : color === "secondary"
      ? "bg-secondary/40 text-secondary-foreground border border-secondary/40"
      : "bg-success/30 text-success-foreground border border-success/40";
  return { avatarClass, badgeClass, label: meta?.label ?? "인력" };
}

// ─── Field Wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text">
        {label}
        {required && <span className="text-danger-foreground ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger-foreground">{error}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DutySiteFormModalProps {
  open: boolean;
  onClose: () => void;
  editTarget?: SiteItem | null;
}

export function DutySiteFormModal({ open, onClose, editTarget }: DutySiteFormModalProps) {
  const isEdit = !!editTarget;

  // ── Basic fields ─────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [operationStartDate, setOperationStartDate] = useState("");
  const [operationEndDate, setOperationEndDate] = useState("");
  const [status, setStatus] = useState<SiteStatus>("planned");
  const [siteTypeId, setSiteTypeId] = useState<number | null>(null);

  // ── Location fields ───────────────────────────────────────────────────────
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [showMap, setShowMap] = useState(false);

  // ── User assignment ───────────────────────────────────────────────────────
  const [selectedUsers, setSelectedUsers] = useState<UserSummary[]>([]);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { data: siteTypeData } = useSiteTypeList();
  // GET /site/:id — relations: ['users'] 포함, 수정 모드에서 기존 투입 인원 로드
  const { data: editSiteDetail } = useSite(editTarget?.id ?? "");
  const { mutate: createSite, isPending: creating } = useCreateSite();
  const { mutate: updateSite, isPending: updating } = useUpdateSite();

  const siteTypes = siteTypeData?.data?.siteTypes ?? [];
  const isPending = creating || updating;

  // ── Initialise form on open ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setName(editTarget?.name ?? "");
    setOperationStartDate(editTarget?.operationStartDate?.slice(0, 10) ?? "");
    setOperationEndDate(editTarget?.operationEndDate?.slice(0, 10) ?? "");
    setStatus(editTarget?.status ?? "planned");
    setSiteTypeId(editTarget?.siteType?.id ?? null);
    setLatitude(editTarget?.latitude ?? null);
    setLongitude(editTarget?.longitude ?? null);
    setAddress("");
    setShowMap(!!(editTarget?.latitude && editTarget?.longitude));
    setErrors({});
    setUserQuery("");
    if (!isEdit) setSelectedUsers([]);

    // 전체 인원 미리 로드
    setIsSearching(true);
    searchUsers("").then((res) => {
      setAllUsers(res?.data?.users ?? res?.data ?? []);
    }).catch(() => setAllUsers([])).finally(() => setIsSearching(false));
  }, [open, editTarget, isEdit]);

  // ── Load existing users when editing ─────────────────────────────────────
  // useSite(GET /site/:id)는 relations: ['users']로 투입 인원을 포함해 반환
  useEffect(() => {
    if (!open || !isEdit) return;
    const users = editSiteDetail?.users ?? [];
    setSelectedUsers(
      users.map((u) => ({ id: u.id, name: u.name, role: u.role }))
    );
  }, [open, isEdit, editSiteDetail]);

  // ── User search with debounce (원격 검색은 쿼리가 있을 때만) ─────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!userQuery.trim()) return; // 빈 쿼리면 allUsers 그대로 사용
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchUsers(userQuery.trim());
        setAllUsers(res?.data?.users ?? res?.data ?? []);
      } catch {
        // 검색 실패 시 기존 목록 유지
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [userQuery]);

  // ── User add / remove ─────────────────────────────────────────────────────
  const addUser = (user: UserSummary) => {
    setSelectedUsers((prev) => [...prev, user]);
  };

  const removeUser = (id: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // 선택되지 않은 인원 목록 (쿼리 필터 적용)
  const selectedIds = new Set(selectedUsers.map((u) => u.id));
  const filteredCandidates = allUsers.filter(
    (u) =>
      !selectedIds.has(u.id) &&
      (!userQuery.trim() || u.name.includes(userQuery.trim()))
  );

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "현장 이름을 입력해주세요.";
    if (!operationStartDate) next.operationStartDate = "운영 시작일을 선택해주세요.";
    if (!operationEndDate) next.operationEndDate = "운영 종료일을 선택해주세요.";
    if (
      operationStartDate &&
      operationEndDate &&
      operationStartDate > operationEndDate
    ) {
      next.operationEndDate = "종료일은 시작일 이후여야 합니다.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!validate()) return;

    const userIds = selectedUsers.map((u) => u.id);

    const dto = {
      name: name.trim(),
      operationStartDate,
      operationEndDate,
      status,
      ...(userIds.length > 0 && { userIds }),
      ...(latitude !== null && { latitude }),
      ...(longitude !== null && { longitude }),
    };

    if (isEdit && editTarget) {
      const prevTypeId = editTarget.siteType?.id ?? null;
      const updateDto = {
        ...dto,
        userIds,
        ...(siteTypeId !== prevTypeId && { siteTypeId }),
      };

      updateSite(
        { id: editTarget.id, dto: updateDto },
        { onSuccess: () => onClose() }
      );
    } else {
      const createPayload = {
        ...dto,
        ...(siteTypeId == null ? {} : { siteTypeId }),
      };
      createSite(createPayload, { onSuccess: () => onClose() });
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-primary/15 rounded-xl">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text-strong">
                {isEdit ? "당직 현장 수정" : "당직 현장 등록"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEdit ? "현장 정보를 수정합니다" : "새로운 당직 현장을 등록합니다"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body: 2-column layout ── */}
        <div className="flex flex-col md:flex-row min-h-0 max-h-[70vh] overflow-y-auto md:overflow-hidden">

          {/* ── 왼쪽: 현장 정보 ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 px-6 py-5 space-y-4 md:overflow-y-auto">

            {/* 현장 이름 */}
            <Field label="현장 이름" required error={errors.name}>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="예: 광안리 해수욕장, 해운대 경비초소"
                className={cn(
                  "w-full px-3 py-2.5 border rounded-xl text-sm bg-surface text-text placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors",
                  errors.name
                    ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                    : "border-border focus:border-primary focus:ring-primary/30"
                )}
              />
            </Field>

            {/* 운영 기간 */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="운영 시작일" required error={errors.operationStartDate}>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={operationStartDate}
                    onChange={(e) => {
                      setOperationStartDate(e.target.value);
                      if (errors.operationStartDate)
                        setErrors((p) => ({ ...p, operationStartDate: "" }));
                    }}
                    className={cn(
                      "w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-surface text-text focus:outline-none focus:ring-1 transition-colors",
                      errors.operationStartDate
                        ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                        : "border-border focus:border-primary focus:ring-primary/30"
                    )}
                  />
                </div>
              </Field>

              <Field label="운영 종료일" required error={errors.operationEndDate}>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={operationEndDate}
                    min={operationStartDate || undefined}
                    onChange={(e) => {
                      setOperationEndDate(e.target.value);
                      if (errors.operationEndDate)
                        setErrors((p) => ({ ...p, operationEndDate: "" }));
                    }}
                    className={cn(
                      "w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-surface text-text focus:outline-none focus:ring-1 transition-colors",
                      errors.operationEndDate
                        ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                        : "border-border focus:border-primary focus:ring-primary/30"
                    )}
                  />
                </div>
              </Field>
            </div>

            {/* 운영 상태 */}
            <Field label="운영 상태">
              <div className="flex gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors",
                      status === opt.value
                        ? "border-2 shadow-field"
                        : "border-border bg-surface text-text hover:bg-muted"
                    )}
                    style={
                      status === opt.value
                        ? { backgroundColor: opt.color + "55", borderColor: opt.color, color: "#333" }
                        : {}
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* 사업 타입 */}
            <Field label="사업 타입">
              <SelectDropdown
                options={siteTypes.map((t: SiteType) => ({
                  value: t.id,
                  label: t.name,
                  color: t.color,
                }))}
                value={siteTypeId}
                onChange={setSiteTypeId}
                nullLabel="없음"
                placeholder="타입 선택 (선택사항)"
                align="left"
                minWidth="100%"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                <Tag className="w-3 h-3 inline mr-1" />
                색상으로 현장을 시각적으로 구분합니다
              </p>
            </Field>

            {/* 위치 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-muted-foreground" />
                  현장 위치
                  <span className="text-xs text-muted-foreground font-normal">(선택)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowMap((v) => !v)}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors",
                    showMap
                      ? "bg-primary/10 text-primary-foreground border-primary/30"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/30"
                  )}
                >
                  {showMap ? "지도 닫기" : "지도로 위치 선택"}
                </button>
              </div>

              {latitude !== null && longitude !== null && !showMap && (
                <div className="flex items-center gap-2 px-3 py-2 bg-success/20 border border-success/40 rounded-xl">
                  <MapPin className="w-4 h-4 text-success-foreground shrink-0" />
                  <p className="text-xs text-text">
                    위치 설정됨: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                </div>
              )}

              {showMap && (
                <KakaoMapPicker
                  initialLat={latitude ?? undefined}
                  initialLng={longitude ?? undefined}
                  initialAddress={address}
                  onLocationChange={(lat, lng, addr) => {
                    setLatitude(lat);
                    setLongitude(lng);
                    if (addr) setAddress(addr);
                  }}
                />
              )}
            </div>

            {/* 미리보기 */}
            {name.trim() && (
              <div className="p-3 bg-muted/50 rounded-xl border border-border/60">
                <p className="text-xs text-muted-foreground mb-2">미리보기</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-10 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        siteTypes.find((t) => t.id === siteTypeId)?.color ?? "#DEE2E6",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-strong truncate">{name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {operationStartDate && operationEndDate && (
                        <span className="text-xs text-muted-foreground">
                          {operationStartDate} ~ {operationEndDate}
                        </span>
                      )}
                      {siteTypeId && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor:
                              (siteTypes.find((t) => t.id === siteTypeId)?.color ?? "#A5D8FF") + "33",
                            color:
                              siteTypes.find((t) => t.id === siteTypeId)?.color ?? "#1C4E6E",
                          }}
                        >
                          {siteTypes.find((t) => t.id === siteTypeId)?.name}
                        </span>
                      )}
                      {latitude !== null && longitude !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success-foreground border border-success/40">
                          <Navigation className="w-3 h-3" />
                          위치 설정됨
                        </span>
                      )}
                      {selectedUsers.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/30 text-secondary-foreground border border-secondary/40">
                          <Users className="w-3 h-3" />
                          {selectedUsers.length}명
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── 구분선 (가로/세로 반응형) ───────────────────────────────── */}
          <div className="h-px md:h-auto md:w-px bg-border shrink-0" />

          {/* ── 오른쪽(모바일에서는 아래): 투입 인원 ───────────────────── */}
          <div className="w-full md:w-64 shrink-0 flex flex-col px-5 py-5 gap-3 md:overflow-hidden">

            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between shrink-0">
              <span className="text-sm font-medium text-text flex items-center gap-1.5">
                <Users className="w-4 h-4 text-muted-foreground" />
                투입 인원
                <span className="text-xs text-muted-foreground font-normal">(선택)</span>
              </span>
              {selectedUsers.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/40 text-secondary-foreground border border-secondary/40">
                  {selectedUsers.length}명
                </span>
              )}
            </div>

            {/* 배치된 인원 목록 */}
            {selectedUsers.length > 0 && (
              <ul className="space-y-1.5 shrink-0 max-h-40 overflow-y-auto">
                {selectedUsers.map((user) => {
                  const { avatarClass, badgeClass, label } = getRoleStyle(user.role);
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => removeUser(user.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 border border-border/70 rounded-xl hover:border-danger/50 hover:bg-danger/5 transition-colors group"
                      >
                        <span className="text-xs font-medium text-text-strong flex-1 truncate text-left group-hover:text-danger-foreground transition-colors">{user.name}</span>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline-flex group-hover:opacity-50 transition-opacity", badgeClass)}>
                          {label}
                        </span>
                        <UserMinus className="w-3.5 h-3.5 text-danger-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {selectedUsers.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-border/60 rounded-xl shrink-0">
                <Users className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                <p className="text-xs text-muted-foreground leading-tight">아래 목록에서<br/>인원을 선택하세요</p>
              </div>
            )}

            {/* 검색 입력 */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="이름으로 검색..."
                className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-xs bg-surface text-text placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary/60 transition-colors"
              />
            </div>

            {/* 후보 인원 목록 */}
            <div className="border border-border rounded-xl overflow-hidden md:flex-1 md:min-h-0 flex flex-col">
              {isSearching ? (
                <div className="flex-1 flex items-center justify-center py-4 text-xs text-muted-foreground">
                  불러오는 중…
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-4 text-xs text-muted-foreground text-center px-3">
                  {userQuery.trim() ? "검색 결과가 없습니다" : "배치 가능한 인원이 없습니다"}
                </div>
              ) : (
                <ul className="divide-y divide-border overflow-y-auto flex-1 max-h-48 md:max-h-none">
                  {filteredCandidates.map((user) => {
                    const { avatarClass, badgeClass, label } = getRoleStyle(user.role);
                    return (
                      <li key={user.id}>
                        <button
                          type="button"
                          onClick={() => addUser(user)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-left group"
                        >
                          <span className="text-xs font-medium text-text flex-1 truncate">{user.name}</span>
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", badgeClass)}>
                            {label}
                          </span>
                          <UserPlus className="w-3 h-3 text-muted-foreground group-hover:text-text transition-colors shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-text border border-border rounded-xl hover:bg-muted transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary-300 transition-colors shadow-field disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                저장 중…
              </>
            ) : isEdit ? (
              "수정 완료"
            ) : (
              "현장 등록"
            )}
          </button>
        </div>
    </BaseModal>
  );
}
