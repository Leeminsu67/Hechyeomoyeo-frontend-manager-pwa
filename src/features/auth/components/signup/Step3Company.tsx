"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Hash, MapPin, ChevronLeft, AlertCircle, Loader2 } from "lucide-react";
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
import type { Step3Data } from "@/features/auth/hooks/useSignupForm";

// ── 스키마 ────────────────────────────────────────────────────
const schema = z.object({
  companyName: z
    .string()
    .min(1, "회사명을 입력해주세요.")
    .max(100, "회사명은 100자 이하여야 합니다."),
  businessRegistrationNumber: z
    .string()
    .regex(
      /^\d{3}-\d{2}-\d{5}$/,
      "올바른 형식으로 입력해주세요. (000-00-00000)"
    ),
  companyAddress: z
    .string()
    .min(1, "회사 주소를 입력해주세요.")
    .max(200, "주소는 200자 이하여야 합니다."),
});

type FormValues = z.infer<typeof schema>;

// ── 사업자등록번호 자동 포맷 (XXX-XX-XXXXX) ──────────────────
function formatBRN(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

// ── Props ─────────────────────────────────────────────────────
interface Step3Props {
  onNext: (data: Step3Data) => void;
  onBack: () => void;
  isPending: boolean;
  serverError: string | null;
}

// ── 컴포넌트 ─────────────────────────────────────────────────
export function Step3Company({
  onNext,
  onBack,
  isPending,
  serverError,
}: Step3Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "",
      businessRegistrationNumber: "",
      companyAddress: "",
    },
    mode: "onChange",
  });

  const onSubmit = (values: FormValues) => {
    onNext(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* 회사명 */}
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
                회사명
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="(주)회사이름"
                    className="pl-8"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 사업자등록번호 */}
        <FormField
          control={form.control}
          name="businessRegistrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
                사업자등록번호
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Hash
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="000-00-00000"
                    className="pl-8 font-mono tracking-widest"
                    inputMode="numeric"
                    maxLength={12}
                    {...field}
                    onChange={(e) =>
                      field.onChange(formatBRN(e.target.value))
                    }
                  />
                </div>
              </FormControl>
              <p className="text-[11px] text-muted-foreground pl-0.5">
                숫자 10자리를 입력하면 자동으로 형식이 맞춰집니다.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 회사 주소 */}
        <FormField
          control={form.control}
          name="companyAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
                회사 주소
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="회사 주소 입력"
                    className="pl-8"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 안내 박스 */}
        <div className="rounded-lg bg-primary/10 border border-primary/30 px-4 py-3 text-xs text-primary-500 leading-relaxed">
          <p className="font-semibold mb-1">📋 가입 완료 후 발급되는 회사 코드</p>
          <p className="text-text-secondary">
            회원가입이 완료되면 <strong className="text-text">고유한 회사 코드</strong>가 발급됩니다.
            이 코드는 직원들이 로그인할 때 필요하므로 반드시 보관해두세요.
          </p>
        </div>

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
            disabled={isPending}
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
                <Loader2 size={16} className="animate-spin" />
                가입 처리 중...
              </>
            ) : (
              "가입 완료하기"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
