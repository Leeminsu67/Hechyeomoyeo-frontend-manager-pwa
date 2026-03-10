"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn, Building2, User, Lock } from "lucide-react";
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
import { useLogin } from "@/features/auth/hooks/useLogin";
import { RememberMeCheckbox } from "./RememberMeCheckbox";

const REMEMBER_KEY = "login-remember";

interface SavedLoginInfo {
  companyCode: string;
  loginId: string;
}

const loginSchema = z.object({
  companyCode: z
    .string()
    .min(1, "회사 코드를 입력해주세요.")
    .max(20, "회사 코드는 20자 이하로 입력해주세요."),
  loginId: z
    .string()
    .min(1, "아이디를 입력해주세요.")
    .max(50, "아이디는 50자 이하로 입력해주세요."),
  password: z
    .string()
    .min(1, "비밀번호를 입력해주세요.")
    .min(6, "비밀번호는 6자 이상이어야 합니다."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { mutate: login, isPending, error } = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { companyCode: "", loginId: "", password: "" },
  });

  // 저장된 로그인 정보 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      const { companyCode, loginId } = JSON.parse(saved) as SavedLoginInfo;
      form.reset({ companyCode, loginId, password: "" });
      setRememberMe(true);
    }
  }, [form]);

  const onSubmit = (values: LoginFormValues) => {
    login(values, {
      onSuccess: () => {
        if (rememberMe) {
          localStorage.setItem(
            REMEMBER_KEY,
            JSON.stringify({ companyCode: values.companyCode, loginId: values.loginId })
          );
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      },
    });
  };

  // axios 에러에서 서버 메시지 추출
  const serverError = (() => {
    if (!error) return null;
    const axiosErr = error as { response?: { data?: { message?: string } } };
    const fallback = error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.";
    return axiosErr?.response?.data?.message ?? fallback;
  })();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* 회사 코드 */}
        <FormField
          control={form.control}
          name="companyCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text font-semibold text-xs tracking-wide uppercase">
                회사 코드
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <Input
                    placeholder="COMPANY-001"
                    className="pl-9 font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 아이디 */}
        <FormField
          control={form.control}
          name="loginId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text font-semibold text-xs tracking-wide uppercase">
                아이디
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <Input
                    placeholder="관리자 아이디 입력"
                    className="pl-9"
                    autoComplete="username"
                    {...field}
                  />
                </div>
              </FormControl>
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
              <FormLabel className="text-text font-semibold text-xs tracking-wide uppercase">
                비밀번호
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호 입력"
                    className="pl-9 pr-11"
                    autoComplete="current-password"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text transition-colors p-0.5"
                    tabIndex={-1}
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 아이디 저장 체크박스 */}
        <RememberMeCheckbox
          checked={rememberMe}
          onCheckedChange={setRememberMe}
        />

        {/* 서버 에러 메시지 */}
        {serverError && (
          <div className="rounded-md bg-danger/60 border border-danger px-3.5 py-2.5 text-sm text-danger-foreground flex items-start gap-2">
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>{serverError}</span>
          </div>
        )}

        {/* 로그인 버튼 */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-bold mt-2 gap-2"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
              로그인 중...
            </>
          ) : (
            <>
              <LogIn size={18} />
              로그인
            </>
          )}
        </Button>

      </form>
    </Form>
  );
}
