"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { checkLoginId } from "@/features/auth/services/authApi";
import type { AccountType, Step1Data } from "@/features/auth/hooks/useSignupForm";

// ── 유효성 스키마 ─────────────────────────────────────────────
const schema = z
  .object({
    accountType: z.enum(["personal", "company"]),
    name: z
      .string()
      .min(1, "이름을 입력해주세요.")
      .max(20, "이름은 20자 이하여야 합니다."),
    loginId: z
      .string()
      .min(4, "아이디는 4자 이상이어야 합니다.")
      .max(20, "아이디는 20자 이하여야 합니다.")
      .regex(/^[a-zA-Z0-9]+$/, "영문과 숫자만 사용 가능합니다."),
    password: z
      .string()
      .min(8, "8자 이상 입력해주세요.")
      .max(16, "16자 이하로 입력해주세요.")
      .regex(/[a-zA-Z]/, "영문을 포함해야 합니다.")
      .regex(/[0-9]/, "숫자를 포함해야 합니다.")
      .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "특수문자를 포함해야 합니다."),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  })
  .refine((d) => d.loginId !== d.password, {
    message: "아이디와 동일한 비밀번호는 사용할 수 없습니다.",
    path: ["password"],
  });

type FormValues = z.infer<typeof schema>;

// ── 비밀번호 강도 계산 ──────────────────────────────────────
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

const STRENGTH_META: Record<StrengthLevel, { label: string; bar: string; text: string }> = {
  0: { label: "", bar: "bg-transparent", text: "" },
  1: { label: "취약", bar: "bg-danger", text: "text-danger-foreground" },
  2: { label: "보통", bar: "bg-secondary", text: "text-secondary-foreground" },
  3: { label: "강함", bar: "bg-success", text: "text-success-foreground" },
  4: { label: "매우 강함", bar: "bg-primary-400", text: "text-primary-foreground" },
};

// ── ID 확인 상태 타입 ─────────────────────────────────────────
type IdCheckStatus = "idle" | "checking" | "available" | "taken" | "error";

// ── Props ─────────────────────────────────────────────────────
interface Step1Props {
  onNext: (data: Step1Data) => void;
}

// ── 컴포넌트 ─────────────────────────────────────────────────
export function Step1Identity({ onNext }: Step1Props) {
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [idCheckStatus, setIdCheckStatus] = useState<IdCheckStatus>("idle");
  const [checkedId, setCheckedId] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountType: "company",
      name: "",
      loginId: "",
      password: "",
      passwordConfirm: "",
    },
    mode: "onChange",
  });

  const password = form.watch("password");
  const loginId = form.watch("loginId");
  const accountType = form.watch("accountType");
  const strength = getStrength(password);
  const meta = STRENGTH_META[strength];

  // 아이디 변경 시 확인 상태 리셋
  const handleLoginIdChange = (val: string) => {
    if (val !== checkedId) setIdCheckStatus("idle");
  };

  const handleCheckId = async () => {
    const id = form.getValues("loginId");
    const valid = await form.trigger("loginId");
    if (!valid) return;

    setIdCheckStatus("checking");
    try {
      const result = await checkLoginId(id);
      setCheckedId(id);
      setIdCheckStatus(result.available ? "available" : "taken");
    } catch {
      setIdCheckStatus("error");
    }
  };

  const onSubmit = (values: FormValues) => {
    if (idCheckStatus !== "available") {
      form.setError("loginId", { message: "아이디 중복 확인을 완료해주세요." });
      return;
    }
    onNext({
      accountType: values.accountType as AccountType,
      name: values.name,
      loginId: values.loginId,
      password: values.password,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* 가입 유형 선택 */}
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
            가입 유형
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(["personal", "company"] as const).map((type) => {
              const isActive = accountType === type;
              const Icon = type === "personal" ? User : Building2;
              const label = type === "personal" ? "개인" : "기업/회사";
              const desc = type === "personal" ? "프리랜서 · 개인사업자" : "법인 · 사업자등록";
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => form.setValue("accountType", type)}
                  className={[
                    "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200",
                    isActive
                      ? "border-primary bg-primary/10 shadow-field"
                      : "border-border bg-surface hover:border-primary/40 hover:bg-primary/5",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-text-secondary",
                    ].join(" ")}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isActive ? "text-primary-500" : "text-text-strong"}`}>
                      {label}
                    </p>
                    <p className="text-[11px] text-text-secondary leading-tight mt-0.5">{desc}</p>
                  </div>
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 size={16} className="text-primary-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {accountType === "company" && (
            <p className="text-[11px] text-primary-500 flex items-center gap-1 pl-1">
              <ShieldCheck size={12} />
              3단계에서 사업자등록번호를 입력합니다.
            </p>
          )}
        </div>

        {/* 이름 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
                이름
              </FormLabel>
              <FormControl>
                <Input placeholder="홍길동" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 아이디 + 중복 확인 */}
        <FormField
          control={form.control}
          name="loginId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
                아이디
              </FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="영문·숫자 4자 이상"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleLoginIdChange(e.target.value);
                      }}
                      className={[
                        idCheckStatus === "available" && "border-success ring-1 ring-success/40",
                        idCheckStatus === "taken" && "border-danger ring-1 ring-danger/40",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                    {idCheckStatus === "available" && (
                      <CheckCircle2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-success-foreground"
                      />
                    )}
                    {idCheckStatus === "taken" && (
                      <XCircle
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-danger-foreground"
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-11 px-3 text-xs"
                    onClick={handleCheckId}
                    disabled={idCheckStatus === "checking" || !loginId}
                  >
                    {idCheckStatus === "checking" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "중복 확인"
                    )}
                  </Button>
                </div>
              </FormControl>
              {/* 중복 확인 피드백 */}
              {idCheckStatus === "available" && (
                <p className="text-xs text-success-foreground flex items-center gap-1">
                  <CheckCircle2 size={12} /> 사용 가능한 아이디입니다.
                </p>
              )}
              {idCheckStatus === "taken" && (
                <p className="text-xs text-danger-foreground flex items-center gap-1">
                  <XCircle size={12} /> 이미 사용 중인 아이디입니다.
                </p>
              )}
              {idCheckStatus === "error" && (
                <p className="text-xs text-danger-foreground">
                  확인 중 오류가 발생했습니다. 다시 시도해주세요.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 비밀번호 */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
                비밀번호
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder="8~16자, 영문+숫자+특수문자"
                    className="pr-11"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FormControl>
              {/* 보안 강도 바 */}
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1">
                    {([1, 2, 3, 4] as const).map((i) => (
                      <div
                        key={i}
                        className={[
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          strength >= i ? meta.bar : "bg-muted",
                        ].join(" ")}
                      />
                    ))}
                  </div>
                  {meta.label && (
                    <p className={`text-[11px] font-medium ${meta.text}`}>
                      보안 강도: {meta.label}
                    </p>
                  )}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 비밀번호 확인 */}
        <FormField
          control={form.control}
          name="passwordConfirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
                비밀번호 확인
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPwConfirm ? "text" : "password"}
                    placeholder="비밀번호 재입력"
                    className="pr-11"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwConfirm((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text transition-colors"
                    tabIndex={-1}
                  >
                    {showPwConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-12 text-base font-bold mt-2">
          다음 단계로
        </Button>
      </form>
    </Form>
  );
}
