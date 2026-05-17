"use client";

import { useEffect, useState } from "react";
import { BaseModal } from "@/components/shared/BaseModal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  User,
  Lock,
  Phone,
  Mail,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Circle,
  HardHat,
  Shield,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddressSearchInput } from "@/components/shared/AddressSearchInput";
import { useCreateUser, useUpdateUser, useUser } from "../hooks/useUsers";
import type { UserListItem, RoleValue } from "@/types/user";
import { ROLE } from "@/types/user";
import { cn } from "@/lib/utils";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const baseSchema = z.object({
  loginId: z
    .string()
    .min(1, "아이디를 입력해주세요")
    .regex(/^[a-zA-Z0-9_]+$/, "영문, 숫자, 밑줄만 사용 가능합니다"),
  name: z
    .string()
    .min(2, "이름을 입력해주세요")
    .max(40, "이름은 40자 이하로 입력해주세요"),
  phone: z
    .string()
    .min(10, "올바른 연락처를 입력해주세요")
    .regex(/^[0-9-]+$/, "숫자와 하이픈만 입력 가능합니다"),
  address: z.string().min(1, "주소를 입력해주세요"),
  detailAddress: z.string().optional(),
  role: z.number(),
  email: z.string().email("올바른 이메일 형식이 아닙니다").optional().or(z.literal("")),
  bankName: z.string().optional(),
  bankAccountEncrypted: z
    .string()
    .regex(/^\d*$/, "계좌번호는 숫자만 입력해주세요")
    .optional(),
  phoneVerified: z.boolean(),
  emailVerified: z.boolean().optional(),
});

const createSchema = baseSchema.extend({
  password: z
    .string()
    .min(1, "비밀번호를 입력해주세요.")
    .regex(/[a-zA-Z]/, "영문을 포함해야 합니다.")
    .regex(/[0-9]/, "숫자를 포함해야 합니다.")
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "특수문자를 포함해야 합니다."),
});

const updateSchema = baseSchema.omit({
  phoneVerified: true,
  emailVerified: true,
});

type CreateFormValues = z.infer<typeof createSchema>;
type UpdateFormValues = z.infer<typeof updateSchema>;
type FormValues = CreateFormValues | UpdateFormValues;

// ─── Password Strength ───────────────────────────────────────────────────────

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getStrength(pw: string): StrengthLevel {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-zA-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) score++;
  return Math.min(4, score) as StrengthLevel;
}

const STRENGTH_META: Record<
  StrengthLevel,
  { label: string; bar: string; text: string }
> = {
  0: { label: "", bar: "bg-transparent", text: "" },
  1: { label: "취약", bar: "bg-danger", text: "text-danger-foreground" },
  2: { label: "보통", bar: "bg-secondary", text: "text-secondary-foreground" },
  3: { label: "강함", bar: "bg-success", text: "text-success-foreground" },
  4: { label: "매우 강함", bar: "bg-primary-400", text: "text-primary-foreground" },
};

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// ─── Role Selector ────────────────────────────────────────────────────────────

const SELECTABLE_ROLES: {
  value: RoleValue;
  label: string;
  description: string;
  icon: React.ElementType;
  selectedClass: string;
  iconClass: string;
  bgClass: string;
}[] = [
  {
    value: ROLE.WORKER,
    label: "일반 인력",
    description: "현장 작업 대원",
    icon: HardHat,
    selectedClass: "border-success ring-2 ring-success/40 shadow-sm",
    iconClass: "text-success-foreground",
    bgClass: "bg-success/20",
  },
  {
    value: ROLE.MANAGER,
    label: "관리자",
    description: "현장 조회 전용",
    icon: Shield,
    selectedClass: "border-secondary ring-2 ring-secondary/50 shadow-sm",
    iconClass: "text-secondary-foreground",
    bgClass: "bg-secondary/30",
  },
  {
    value: ROLE.HR_MANAGER,
    label: "인력관리자",
    description: "인력 추가·수정·삭제",
    icon: ShieldCheck,
    selectedClass: "border-primary-400 ring-2 ring-primary/40 shadow-sm",
    iconClass: "text-primary-foreground",
    bgClass: "bg-primary/20",
  },
];

function RoleSelector({
  value,
  onChange,
  disabled,
  error,
}: {
  value: RoleValue;
  onChange: (v: RoleValue) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text flex items-center gap-1">
        역할 <span className="text-danger-foreground text-xs">*</span>
      </label>
      <div className="grid grid-cols-3 gap-2.5">
        {SELECTABLE_ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = value === role.value;
          return (
            <button
              key={role.value}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(role.value)}
              className={cn(
                "relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 transition-all duration-150 text-center",
                isSelected
                  ? role.selectedClass
                  : "border-border hover:border-muted-foreground/30 bg-muted/30",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {/* 선택 체크 */}
              {isSelected && (
                <span className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 rounded-full bg-text-strong">
                  <Check className="w-2.5 h-2.5 text-surface" />
                </span>
              )}

              {/* 아이콘 */}
              <span
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
                  isSelected ? role.bgClass : "bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isSelected ? role.iconClass : "text-muted-foreground"
                  )}
                />
              </span>

              {/* 텍스트 */}
              <div>
                <p
                  className={cn(
                    "text-xs font-bold leading-tight",
                    isSelected ? "text-text-strong" : "text-text"
                  )}
                >
                  {role.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  {role.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-danger-foreground">{error}</p>}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  editTarget?: UserListItem | null;
  canManage: boolean;
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20">
        <Icon className="w-3.5 h-3.5 text-primary-500" />
      </span>
      <span className="text-sm font-semibold text-text">{label}</span>
    </div>
  );
}

// ─── Field Wrapper ────────────────────────────────────────────────────────────

function FieldWrapper({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text flex items-center gap-1">
        {label}
        {required && <span className="text-danger-foreground text-xs">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger-foreground">{error}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UserFormModal({
  open,
  onClose,
  editTarget,
  canManage,
}: UserFormModalProps) {
  const isEdit = !!editTarget;
  const detailUserId = editTarget?.id ?? "";

  const [isEditing, setIsEditing] = useState(false);
  const isReadOnly = isEdit && !isEditing;

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const {
    data: detailUser,
    isLoading: isDetailLoading,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useUser(detailUserId);
  const isPending = createUser.isPending || updateUser.isPending;

  const schema = isEdit ? updateSchema : createSchema;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: ROLE.WORKER,
      phoneVerified: false,
      emailVerified: false,
    },
  });

  const watchedAddress = watch("address") as string;
  const watchedAddressDetail = watch("detailAddress") as string;
  const watchedPassword = !isEdit ? ((watch("password") as string) ?? "") : "";
  const selectedRole = watch("role") as RoleValue;
  const passwordStrength = getStrength(watchedPassword);
  const passwordMeta = STRENGTH_META[passwordStrength];
  const phoneRegister = register("phone");
  const bankAccountRegister = register("bankAccountEncrypted");

  useEffect(() => {
    setIsEditing(false);
    setErrorMsg(null);
    setShowPassword(false);
  }, [open, editTarget?.id]);

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      if (!detailUser) return;

      reset({
        loginId: detailUser.loginId,
        name: detailUser.name,
        phone: formatPhone(detailUser.phone ?? ""),
        address: detailUser.address ?? "",
        detailAddress: detailUser.detailAddress ?? "",
        role: detailUser.role,
        email: detailUser.email ?? "",
        bankName: detailUser.bankName ?? "",
        bankAccountEncrypted: detailUser.bankAccountEncrypted ?? "",
      });
    } else {
      reset({
        loginId: "",
        name: "",
        phone: "",
        address: "",
        detailAddress: "",
        role: ROLE.WORKER,
        email: "",
        bankName: "",
        bankAccountEncrypted: "",
        phoneVerified: false,
        emailVerified: false,
        password: "",
      });
    }
  }, [detailUser, isEdit, reset, open]);

  const onSubmit = async (data: FormValues) => {
    setErrorMsg(null);
    try {
      if (isEdit && editTarget) {
        const updateData = data as UpdateFormValues;
        await updateUser.mutateAsync({
          id: editTarget.id,
          dto: {
            name: updateData.name,
            phone: updateData.phone,
            address: updateData.address,
            detailAddress: updateData.detailAddress || undefined,
            role: updateData.role as RoleValue,
            email: updateData.email || undefined,
            bankName: updateData.bankName,
            bankAccountEncrypted: updateData.bankAccountEncrypted || undefined,
          },
        });
        onClose();
      } else {
        const { detailAddress, ...formData } = data as CreateFormValues;
        await createUser.mutateAsync({
          ...formData,
          detailAddress: detailAddress || undefined,
          role: formData.role as RoleValue,
          email: formData.email || undefined,
          bankAccountEncrypted: formData.bankAccountEncrypted || undefined,
        });
        onClose();
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = axiosErr?.response?.data?.message;
      setErrorMsg(
        Array.isArray(msg)
          ? msg[0]
          : (msg ?? "처리 중 오류가 발생했습니다. 다시 시도해주세요.")
      );
    }
  };

  const isDetailPending = isEdit && isDetailLoading;
  const hasDetailError = isEdit && isDetailError;
  const canRenderFields = !isEdit || (!!detailUser && !isDetailPending && !hasDetailError);
  const passwordError = (
    errors as { password?: { message?: string } }
  ).password?.message;

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-2xl" panelClassName="flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div>
              <h2 className="text-lg font-bold text-text-strong">
                {isEdit
                  ? isEditing
                    ? "인력 정보 수정"
                    : "인력 정보 상세"
                  : "신규 인력 등록"}
              </h2>
              {isEdit && !isEditing && !canManage && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  조회 권한만 있습니다.
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-text"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
              {isDetailPending ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm font-medium">인력 상세 정보를 불러오는 중입니다.</p>
                </div>
              ) : hasDetailError ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
                  <p className="text-sm font-semibold text-text-strong">
                    인력 상세 정보를 불러올 수 없습니다.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    잠시 후 다시 시도해주세요.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchDetail()}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-muted"
                  >
                    다시 시도
                  </button>
                </div>
              ) : (
                <>

              {/* ── 역할 선택 ── */}
              <section>
                <SectionHeader icon={Shield} label="역할 설정" />
                <RoleSelector
                  value={selectedRole}
                  onChange={(v) => setValue("role", v)}
                  disabled={isReadOnly}
                  error={errors.role?.message}
                />
              </section>

              {/* ── 계정 정보 ── */}
              <section>
                <SectionHeader icon={User} label="계정 정보" />
                <div className={cn("grid grid-cols-1 gap-4", !isEdit && "sm:grid-cols-2")}>
                  <FieldWrapper
                    label="아이디"
                    required
                    error={errors.loginId?.message}
                  >
                    <Input
                      {...register("loginId")}
                      placeholder="아이디를 입력해 주세요"
                      disabled={isEdit}
                      className={cn(
                        isEdit && "bg-muted cursor-not-allowed",
                        errors.loginId && "border-danger"
                      )}
                    />
                  </FieldWrapper>

                  {!isEdit && (
                    <FieldWrapper
                      label="비밀번호"
                      required
                      error={passwordError}
                    >
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          {...register("password")}
                          type={showPassword ? "text" : "password"}
                          placeholder="비밀번호를 입력해 주세요"
                          className={cn(
                            "pl-9 pr-10",
                            passwordError && "border-danger"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {watchedPassword && (
                        <div className="space-y-1 pt-1">
                          <div className="flex gap-1">
                            {([1, 2, 3, 4] as const).map((level) => (
                              <div
                                key={level}
                                className={cn(
                                  "h-1 flex-1 rounded-full transition-all duration-300",
                                  passwordStrength >= level
                                    ? passwordMeta.bar
                                    : "bg-muted"
                                )}
                              />
                            ))}
                          </div>
                          {passwordMeta.label && (
                            <p
                              className={cn(
                                "text-[11px] font-medium",
                                passwordMeta.text
                              )}
                            >
                              보안 강도: {passwordMeta.label}
                            </p>
                          )}
                        </div>
                      )}
                    </FieldWrapper>
                  )}
                </div>
              </section>

              {/* ── 인적 사항 ── */}
              <section>
                <SectionHeader icon={User} label="인적 사항" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldWrapper
                    label="이름"
                    required
                    error={errors.name?.message}
                  >
                    <Input
                      {...register("name")}
                      placeholder="실명 입력"
                      disabled={isReadOnly}
                      maxLength={40}
                      className={cn(errors.name && "border-danger")}
                    />
                  </FieldWrapper>

                  <FieldWrapper
                    label="연락처"
                    required
                    error={errors.phone?.message}
                  >
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        {...phoneRegister}
                        type="tel"
                        inputMode="numeric"
                        placeholder="010-0000-0000"
                        disabled={isReadOnly}
                        className={cn("pl-9", errors.phone && "border-danger")}
                        onChange={(e) => {
                          e.target.value = formatPhone(e.target.value);
                          phoneRegister.onChange(e);
                        }}
                      />
                    </div>
                  </FieldWrapper>

                  <FieldWrapper label="이메일" error={errors.email?.message}>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        {...register("email")}
                        type="email"
                        placeholder="example@email.com (선택)"
                        disabled={isReadOnly}
                        className={cn("pl-9", errors.email && "border-danger")}
                      />
                    </div>
                  </FieldWrapper>

                  {isReadOnly && (
                    <FieldWrapper label="휴대폰 인증 상태">
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium",
                          detailUser?.phoneVerified
                            ? "border-success bg-success/20 text-success-foreground"
                            : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {detailUser?.phoneVerified ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0" />
                        )}
                        {detailUser?.phoneVerified ? "휴대폰 인증 완료" : "휴대폰 인증 미완료"}
                      </div>
                    </FieldWrapper>
                  )}
                </div>

                <div className="mt-4">
                  <FieldWrapper
                    label="주소"
                    required
                    error={errors.address?.message}
                  >
                    <AddressSearchInput
                      value={watchedAddress ?? ""}
                      onChange={(v) => {
                        setValue("address", v, { shouldValidate: true });
                        setValue("detailAddress", "");
                      }}
                      detailValue={watchedAddressDetail ?? ""}
                      onDetailChange={(v) =>
                        setValue("detailAddress", v, { shouldValidate: true })
                      }
                      detailRequired={false}
                      detailError={errors.detailAddress?.message}
                      detailLabel="상세주소"
                      detailPlaceholder="동/호수 등"
                      scrollOnOpen
                      disabled={isReadOnly}
                    />
                  </FieldWrapper>
                </div>
              </section>

              {/* ── 금융 정보 ── */}
              <section>
                <SectionHeader icon={CreditCard} label="금융 정보" />
                <p className="text-xs text-muted-foreground mb-4 bg-secondary/30 rounded-lg px-3 py-2">
                  계좌번호는 암호화하여 저장됩니다. 화면에서는 마스킹 처리됩니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldWrapper label="은행명">
                    <Input
                      {...register("bankName")}
                      placeholder="은행명을 입력해주세요"
                      disabled={isReadOnly}
                    />
                  </FieldWrapper>

                  <FieldWrapper
                    label="계좌번호"
                    error={errors.bankAccountEncrypted?.message}
                  >
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        {...bankAccountRegister}
                        inputMode="numeric"
                        placeholder="숫자만 입력해주세요"
                        disabled={isReadOnly}
                        className={cn(
                          "pl-9",
                          errors.bankAccountEncrypted && "border-danger"
                        )}
                        onChange={(e) => {
                          e.target.value = e.target.value.replace(/\D/g, "");
                          bankAccountRegister.onChange(e);
                        }}
                      />
                    </div>
                  </FieldWrapper>
                </div>
              </section>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-border bg-muted/40 flex items-center justify-between gap-3">
              {errorMsg && (
                <p className="text-xs text-danger-foreground flex-1 leading-5">
                  {errorMsg}
                </p>
              )}
              <div className="flex gap-2 ml-auto">
                {/* 신규 등록 모드 */}
                {!isEdit && (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isPending}
                      className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-300 transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[80px] justify-center"
                    >
                      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      등록
                    </button>
                  </>
                )}

                {/* 보기 모드 (수정 전) */}
                {isEdit && !isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-muted transition-colors flex items-center justify-center min-w-[80px]"
                    >
                      닫기
                    </button>
                    {canManage && canRenderFields && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-300 transition-colors flex items-center justify-center min-w-[80px]"
                      >
                        수정
                      </button>
                    )}
                  </>
                )}

                {/* 수정 모드 */}
                {isEdit && isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isPending}
                      className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                    >
                      닫기
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || !canRenderFields}
                      className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-300 transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[80px] justify-center"
                    >
                      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      저장
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
    </BaseModal>
  );
}
