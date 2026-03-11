"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Phone,
  Send,
  CheckCircle2,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import { AddressSearchInput } from "@/components/shared/AddressSearchInput";
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
import {
  useVerificationField,
  callVerification,
  formatTime,
} from "@/features/auth/hooks/useVerificationField";
import { VerificationCodeInput } from "./VerificationCodeInput";
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
  const [email, emailActions] = useVerificationField();
  const [phone, phoneActions] = useVerificationField();
  const [addressDetail, setAddressDetail] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", phone: "", address: "" },
    mode: "onChange",
  });

  // ── 이메일 인증 ────────────────────────────────────────────
  const handleSendEmail = async () => {
    const emailVal = form.getValues("email");
    if (!emailVal) {
      form.setError("email", { message: "이메일을 먼저 입력해주세요." });
      return;
    }
    if (!(await form.trigger("email"))) return;

    await callVerification(
      () => requestEmailVerification(emailVal as string),
      emailActions.setLoading,
      emailActions.setError,
      "인증 메일 발송에 실패했습니다. 다시 시도해주세요.",
      emailActions.markSent,
    );
  };

  const handleVerifyEmail = async () => {
    if (!email.code || email.code.length !== 6) {
      emailActions.setError("6자리 인증번호를 입력해주세요.");
      return;
    }
    await callVerification(
      () => verifyEmailCode(email.code),
      emailActions.setLoading,
      emailActions.setError,
      "인증 확인 중 오류가 발생했습니다.",
      emailActions.markVerified,
    );
  };

  // ── 휴대폰 인증 ────────────────────────────────────────────
  const handleSendPhone = async () => {
    if (!(await form.trigger("phone"))) return;
    const phoneVal = form.getValues("phone");

    await callVerification(
      () => requestPhoneVerification(phoneVal),
      phoneActions.setLoading,
      phoneActions.setError,
      "인증 문자 발송에 실패했습니다. 다시 시도해주세요.",
      phoneActions.markSent,
      (msg) =>
        msg.includes("이미 사용 중")
          ? "이미 가입된 휴대폰 번호입니다. 아이디 찾기를 이용해주세요."
          : "인증 문자 발송에 실패했습니다. 다시 시도해주세요.",
    );
  };

  const handleVerifyPhone = async () => {
    if (!phone.code || phone.code.length !== 6) {
      phoneActions.setError("6자리 인증번호를 입력해주세요.");
      return;
    }
    try {
      const result = await verifyPhoneCode(form.getValues("phone"), phone.code);
      if (result.verified) {
        phoneActions.markVerified();
      } else {
        phoneActions.setError("인증번호가 일치하지 않습니다.");
      }
    } catch {
      phoneActions.setError("인증 확인 중 오류가 발생했습니다.");
    }
  };

  // ── 제출 ──────────────────────────────────────────────────
  const onSubmit = (values: FormValues) => {
    if (!phone.verified) {
      phoneActions.setError("휴대폰 본인 인증을 완료해주세요.");
      return;
    }
    onNext({
      email: values.email ?? "",
      phone: values.phone,
      address: addressDetail
        ? `${values.address} ${addressDetail}`
        : values.address,
      emailVerified: email.verified,
      phoneVerified: true,
    });
  };

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
                        email.verified && "border-success ring-1 ring-success/40",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={email.verified}
                      {...field}
                    />
                    {email.verified && (
                      <CheckCircle2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-success-foreground"
                      />
                    )}
                  </div>
                  <VerificationRequestButton
                    verified={email.verified}
                    sent={email.sent}
                    timer={email.timer}
                    loading={email.loading}
                    onSend={handleSendEmail}
                  />
                </div>
              </FormControl>
              <FormMessage />
              {email.sent && !email.verified && (
                <VerificationCodeInput
                  code={email.code}
                  timer={email.timer}
                  loading={email.loading}
                  error={email.error}
                  onCodeChange={emailActions.setCode}
                  onVerify={handleVerifyEmail}
                  onResend={handleSendEmail}
                />
              )}
            </FormItem>
          )}
        />

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
                        phone.verified && "border-success ring-1 ring-success/40",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={phone.verified}
                      {...field}
                      onChange={(e) =>
                        field.onChange(formatPhone(e.target.value))
                      }
                    />
                    {phone.verified && (
                      <CheckCircle2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-success-foreground"
                      />
                    )}
                  </div>
                  <VerificationRequestButton
                    verified={phone.verified}
                    sent={phone.sent}
                    timer={phone.timer}
                    loading={phone.loading}
                    onSend={handleSendPhone}
                  />
                </div>
              </FormControl>
              <FormMessage />
              {phone.sent && !phone.verified && (
                <VerificationCodeInput
                  code={phone.code}
                  timer={phone.timer}
                  loading={phone.loading}
                  error={phone.error}
                  onCodeChange={phoneActions.setCode}
                  onVerify={handleVerifyPhone}
                  onResend={handleSendPhone}
                />
              )}
            </FormItem>
          )}
        />

        {/* ── 주소 ─────────────────────────────────────────── */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
                주소
              </FormLabel>
              <FormControl>
                <AddressSearchInput
                  value={field.value ?? ""}
                  onChange={(v) => {
                    field.onChange(v);
                    if (!v) setAddressDetail("");
                  }}
                  detailValue={addressDetail}
                  onDetailChange={setAddressDetail}
                  placeholder="주소 검색 (클릭하여 검색)"
                />
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
                {accountType === "personal" ? "가입 완료" : "다음 단계로"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ── 인증 요청 버튼 (인라인 서브 컴포넌트) ──────────────────────
function VerificationRequestButton({
  verified,
  sent,
  timer,
  loading,
  onSend,
}: {
  verified: boolean;
  sent: boolean;
  timer: number;
  loading: boolean;
  onSend: () => void;
}) {
  if (verified) {
    return (
      <div className="flex items-center h-11 px-3 text-xs font-semibold text-success-foreground bg-success/20 rounded-md border border-success/30 shrink-0">
        인증 완료
      </div>
    );
  }
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 h-11 px-3 text-xs"
      onClick={onSend}
      disabled={loading || (sent && timer > 0)}
    >
      {sent && timer > 0 ? formatTime(timer) : "인증 요청"}
    </Button>
  );
}
