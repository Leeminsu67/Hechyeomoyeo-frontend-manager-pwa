"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  ChevronLeft,
  AlertCircle,
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
import {
  requestEmailVerification,
  verifyEmailCode,
  requestPhoneVerification,
  verifyPhoneCode,
} from "@/features/auth/services/authApi";
import type { AccountType, Step2Data } from "@/features/auth/hooks/useSignupForm";

// ── 스키마 ────────────────────────────────────────────────────
const schema = z.object({
  email: z
    .string()
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "올바른 이메일 형식을 입력해주세요.",
    })
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, "올바른 형식을 입력해주세요. (010-0000-0000)"),
  address: z.string().min(1, "주소를 입력해주세요.").max(200),
});

type FormValues = z.infer<typeof schema>;

const TIMER_SECONDS = 300; // 5분

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatPhone(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

// ── Props ─────────────────────────────────────────────────────
interface Step2Props {
  accountType: AccountType;
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  isPending: boolean;
  serverError: string | null;
}

// ── 컴포넌트 ─────────────────────────────────────────────────
export function Step2Verification({
  accountType,
  onNext,
  onBack,
  isPending,
  serverError,
}: Step2Props) {
  // ── 이메일 인증 상태 ────────────────────────────────────────
  const [emailSent, setEmailSent] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // ── 휴대폰 인증 상태 ────────────────────────────────────────
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneTimer, setPhoneTimer] = useState(0);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", phone: "", address: "" },
    mode: "onChange",
  });

  // ── 이메일 타이머 ──────────────────────────────────────────
  useEffect(() => {
    if (emailTimer <= 0) return;
    const id = setInterval(() => setEmailTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [emailTimer]);

  // ── 휴대폰 타이머 ──────────────────────────────────────────
  useEffect(() => {
    if (phoneTimer <= 0) return;
    const id = setInterval(() => setPhoneTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phoneTimer]);

  // ── 이메일 인증 요청 ────────────────────────────────────────
  const handleSendEmail = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { message: "이메일을 먼저 입력해주세요." });
      return;
    }
    const valid = await form.trigger("email");
    if (!valid) return;

    setEmailLoading(true);
    setEmailError("");
    try {
      await requestEmailVerification(email as string);
      setEmailSent(true);
      setEmailVerified(false);
      setEmailTimer(TIMER_SECONDS);
    } catch {
      setEmailError("인증 메일 발송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    const email = form.getValues("email") as string;
    if (!emailCode || emailCode.length !== 6) {
      setEmailError("6자리 인증번호를 입력해주세요.");
      return;
    }
    setEmailLoading(true);
    setEmailError("");
    try {
      const result = await verifyEmailCode(email, emailCode);
      if (result.verified) {
        setEmailVerified(true);
        setEmailTimer(0);
      } else {
        setEmailError("인증번호가 일치하지 않습니다.");
      }
    } catch {
      setEmailError("인증 확인 중 오류가 발생했습니다.");
    } finally {
      setEmailLoading(false);
    }
  };

  // ── 휴대폰 인증 요청 ────────────────────────────────────────
  const handleSendPhone = async () => {
    const valid = await form.trigger("phone");
    if (!valid) return;
    const phone = form.getValues("phone");

    setPhoneLoading(true);
    setPhoneError("");
    try {
      await requestPhoneVerification(phone);
      setPhoneSent(true);
      setPhoneVerified(false);
      setPhoneTimer(TIMER_SECONDS);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message ?? "";
      if (msg.includes("이미 사용 중")) {
        setPhoneError(
          "이미 가입된 휴대폰 번호입니다. 아이디 찾기를 이용해주세요."
        );
      } else {
        setPhoneError("인증 문자 발송에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    const phone = form.getValues("phone");
    if (!phoneCode || phoneCode.length !== 6) {
      setPhoneError("6자리 인증번호를 입력해주세요.");
      return;
    }
    setPhoneLoading(true);
    setPhoneError("");
    try {
      const result = await verifyPhoneCode(phone, phoneCode);
      if (result.verified) {
        setPhoneVerified(true);
        setPhoneTimer(0);
      } else {
        setPhoneError("인증번호가 일치하지 않습니다.");
      }
    } catch {
      setPhoneError("인증 확인 중 오류가 발생했습니다.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    if (!phoneVerified) {
      setPhoneError("휴대폰 본인 인증을 완료해주세요.");
      return;
    }
    onNext({
      email: values.email ?? "",
      phone: values.phone,
      address: values.address,
      emailVerified,
      phoneVerified: true,
    });
  };

  const isPersonalSubmit = accountType === "personal";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── 이메일 인증 ──────────────────────────────────── */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
                이메일{" "}
                <span className="text-[10px] normal-case font-normal text-muted-foreground">
                  (선택)
                </span>
              </FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      className={[
                        "pl-8",
                        emailVerified && "border-success ring-1 ring-success/40",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={emailVerified}
                      {...field}
                    />
                    {emailVerified && (
                      <CheckCircle2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-success-foreground"
                      />
                    )}
                  </div>
                  {!emailVerified && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-11 px-3 text-xs"
                      onClick={handleSendEmail}
                      disabled={emailLoading || (emailSent && emailTimer > 0)}
                    >
                      {emailTimer > 0 ? formatTime(emailTimer) : "인증 요청"}
                    </Button>
                  )}
                  {emailVerified && (
                    <div className="flex items-center h-11 px-3 text-xs font-semibold text-success-foreground bg-success/20 rounded-md border border-success/30 shrink-0">
                      인증 완료
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />

              {/* 인증번호 입력 */}
              {emailSent && !emailVerified && (
                <div className="mt-2 space-y-2 animate-slide-up">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        maxLength={6}
                        placeholder="인증번호 6자리"
                        value={emailCode}
                        onChange={(e) =>
                          setEmailCode(e.target.value.replace(/\D/g, ""))
                        }
                        className="font-mono tracking-widest text-center"
                      />
                      {emailTimer > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(emailTimer)}
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 h-11 px-4"
                      onClick={handleVerifyEmail}
                      disabled={emailLoading || emailTimer === 0}
                    >
                      확인
                    </Button>
                  </div>
                  {emailTimer === 0 && (
                    <p className="text-xs text-danger-foreground flex items-center gap-1">
                      <Clock size={12} />
                      인증 시간이 만료되었습니다.{" "}
                      <button
                        type="button"
                        className="underline"
                        onClick={handleSendEmail}
                      >
                        재발송
                      </button>
                    </p>
                  )}
                  {emailError && (
                    <p className="text-xs text-danger-foreground flex items-center gap-1">
                      <AlertCircle size={12} />
                      {emailError}
                    </p>
                  )}
                </div>
              )}
            </FormItem>
          )}
        />

        {/* 구분선 */}
        <div className="border-t border-border/50" />

        {/* ── 휴대폰 인증 ──────────────────────────────────── */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
                휴대폰 번호{" "}
                <span className="text-danger-foreground text-[10px]">*필수</span>
              </FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      type="tel"
                      placeholder="010-0000-0000"
                      className={[
                        "pl-8",
                        phoneVerified && "border-success ring-1 ring-success/40",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={phoneVerified}
                      {...field}
                      onChange={(e) =>
                        field.onChange(formatPhone(e.target.value))
                      }
                    />
                    {phoneVerified && (
                      <CheckCircle2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-success-foreground"
                      />
                    )}
                  </div>
                  {!phoneVerified && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-11 px-3 text-xs"
                      onClick={handleSendPhone}
                      disabled={phoneLoading || (phoneSent && phoneTimer > 0)}
                    >
                      {phoneSent && phoneTimer > 0
                        ? formatTime(phoneTimer)
                        : "인증 요청"}
                    </Button>
                  )}
                  {phoneVerified && (
                    <div className="flex items-center h-11 px-3 text-xs font-semibold text-success-foreground bg-success/20 rounded-md border border-success/30 shrink-0">
                      인증 완료
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />

              {/* 인증번호 입력 */}
              {phoneSent && !phoneVerified && (
                <div className="mt-2 space-y-2 animate-slide-up">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        maxLength={6}
                        placeholder="인증번호 6자리"
                        value={phoneCode}
                        onChange={(e) =>
                          setPhoneCode(e.target.value.replace(/\D/g, ""))
                        }
                        className="font-mono tracking-widest text-center"
                      />
                      {phoneTimer > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(phoneTimer)}
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 h-11 px-4"
                      onClick={handleVerifyPhone}
                      disabled={phoneLoading || phoneTimer === 0}
                    >
                      확인
                    </Button>
                  </div>
                  {phoneTimer === 0 && (
                    <p className="text-xs text-danger-foreground flex items-center gap-1">
                      <Clock size={12} />
                      인증 시간이 만료되었습니다.{" "}
                      <button
                        type="button"
                        className="underline"
                        onClick={handleSendPhone}
                      >
                        재발송
                      </button>
                    </p>
                  )}
                  {phoneError && (
                    <p className="text-xs text-danger-foreground flex items-center gap-1">
                      <AlertCircle size={12} />
                      {phoneError}
                    </p>
                  )}
                </div>
              )}
            </FormItem>
          )}
        />

        {/* ── 주소 ────────────────────────────────────────── */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
                주소
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input placeholder="상세 주소 입력" className="pl-8" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 서버 에러 */}
        {serverError && (
          <div className="rounded-lg bg-danger/20 border border-danger/40 px-4 py-3 text-sm text-danger-foreground flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="h-12 px-5"
            onClick={onBack}
          >
            <ChevronLeft size={18} />
            이전
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 text-base font-bold gap-2"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                처리 중...
              </>
            ) : (
              <>
                <Send size={16} />
                {isPersonalSubmit ? "가입 완료" : "다음 단계로"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
