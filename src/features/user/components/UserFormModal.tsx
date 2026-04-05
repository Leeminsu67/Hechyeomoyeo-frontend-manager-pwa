"use client";

import { useEffect, useState } from "react";
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
import { useCreateUser, useUpdateUser } from "../hooks/useUsers";
import type { UserListItem, RoleValue } from "@/types/user";
import { ROLE } from "@/types/user";
import { cn } from "@/lib/utils";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const baseSchema = z.object({
  loginId: z
    .string()
    .min(4, "아이디는 4자 이상이어야 합니다")
    .max(20, "20자 이하이어야 합니다")
    .regex(/^[a-zA-Z0-9_]+$/, "영문, 숫자, 밑줄만 사용 가능합니다"),
  name: z.string().min(2, "이름을 입력해주세요"),
  phone: z
    .string()
    .min(10, "올바른 연락처를 입력해주세요")
    .regex(/^[0-9-]+$/, "숫자와 하이픈만 입력 가능합니다"),
  address: z.string().min(1, "주소를 입력해주세요"),
  detailAddress: z.string().optional(),
  role: z.number(),
  email: z.string().email("올바른 이메일 형식이 아닙니다").optional().or(z.literal("")),
  bankName: z.string().optional(),
  bankAccountEncrypted: z.string().optional(),
  phoneVerified: z.boolean(),
  emailVerified: z.boolean().optional(),
});

const createSchema = baseSchema.extend({
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
});

const updateSchema = baseSchema.extend({
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .optional()
    .or(z.literal("")),
});

type CreateFormValues = z.infer<typeof createSchema>;
type UpdateFormValues = z.infer<typeof updateSchema>;
type FormValues = CreateFormValues | UpdateFormValues;

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

// ─── Phone Verified Toggle ────────────────────────────────────────────────────

function PhoneVerifiedToggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
        value
          ? "bg-success/20 border-success text-success-foreground"
          : "bg-muted border-border text-muted-foreground hover:border-primary/40",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {value ? (
        <CheckCircle2 className="w-4 h-4 text-success-foreground shrink-0" />
      ) : (
        <Circle className="w-4 h-4 shrink-0" />
      )}
      {value ? "휴대폰 인증 완료" : "휴대폰 인증 미완료 (클릭하여 변경)"}
    </button>
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

  const [isEditing, setIsEditing] = useState(false);
  const isReadOnly = isEdit && !isEditing;

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
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
  const phoneVerified = watch("phoneVerified") as boolean;
  const selectedRole = watch("role") as RoleValue;

  useEffect(() => {
    setIsEditing(false);
    setErrorMsg(null);
  }, [open, editTarget]);

  useEffect(() => {
    if (editTarget) {
      reset({
        loginId: editTarget.loginId,
        name: editTarget.name,
        phone: editTarget.phone ?? "",
        address: editTarget.address ?? "",
        detailAddress: editTarget.detailAddress ?? "",
        role: editTarget.role,
        email: editTarget.email ?? "",
        bankName: editTarget.bankName ?? "",
        bankAccountEncrypted: editTarget.bankAccountEncrypted ?? "",
        phoneVerified: true,
        emailVerified: false,
        password: "",
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
  }, [editTarget, reset, open]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const onSubmit = async (data: FormValues) => {
    setErrorMsg(null);
    try {
      if (isEdit && editTarget) {
        const { password, detailAddress, ...rest } = data as UpdateFormValues;
        await updateUser.mutateAsync({
          id: editTarget.id,
          dto: {
            ...rest,
            detailAddress: detailAddress || undefined,
            role: rest.role as RoleValue,
            email: rest.email || undefined,
            password: password || undefined,
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-2xl max-h-[92vh] bg-surface rounded-2xl shadow-card-hover flex flex-col animate-slide-up pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldWrapper
                    label="아이디"
                    required
                    error={errors.loginId?.message}
                  >
                    <Input
                      {...register("loginId")}
                      placeholder="영문·숫자·밑줄, 4~20자"
                      disabled={isEdit}
                      className={cn(
                        isEdit && "bg-muted cursor-not-allowed",
                        errors.loginId && "border-danger"
                      )}
                    />
                  </FieldWrapper>

                  <FieldWrapper
                    label={isEdit ? "새 비밀번호 (변경 시 입력)" : "비밀번호"}
                    required={!isEdit}
                    error={errors.password?.message}
                  >
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        placeholder={
                          isEdit ? "변경하지 않으면 비워두세요" : "8자 이상"
                        }
                        disabled={isReadOnly}
                        className={cn(
                          "pl-9 pr-10",
                          errors.password && "border-danger"
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
                  </FieldWrapper>
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
                        {...register("phone")}
                        placeholder="010-0000-0000"
                        disabled={isReadOnly}
                        className={cn("pl-9", errors.phone && "border-danger")}
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

                  <FieldWrapper label="휴대폰 인증 상태" required>
                    <PhoneVerifiedToggle
                      value={phoneVerified}
                      onChange={(v) => setValue("phoneVerified", v)}
                      disabled={isReadOnly}
                    />
                  </FieldWrapper>
                </div>

                <div className="mt-4">
                  <FieldWrapper
                    label="주소 / 상세주소"
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
                      placeholder="예: KB국민은행"
                      disabled={isReadOnly}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="계좌번호">
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        {...register("bankAccountEncrypted")}
                        placeholder="- 없이 숫자만 입력"
                        disabled={isReadOnly}
                        className="pl-9"
                      />
                    </div>
                  </FieldWrapper>
                </div>
              </section>
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
                    {canManage && (
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
                      disabled={isPending}
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
        </div>
      </div>
    </>
  );
}
