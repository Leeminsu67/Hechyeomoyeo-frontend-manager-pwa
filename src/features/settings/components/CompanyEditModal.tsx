"use client";

import { useEffect, useState } from "react";
import { Building2, FileText, Loader2, MapPin, X } from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Company } from "@/types/company";
import { useUpdateCompany } from "../hooks/useCompany";

interface CompanyEditModalProps {
  open: boolean;
  company: Company | null;
  onClose: () => void;
}

function FieldLabel({
  icon: Icon,
  children,
  required,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-semibold text-text">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {children}
      {required && <span className="text-danger-foreground">*</span>}
    </label>
  );
}

export function CompanyEditModal({
  open,
  company,
  onClose,
}: CompanyEditModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("");
  const [error, setError] = useState("");
  const { mutate: updateCompany, isPending } = useUpdateCompany(company?.id ?? "");

  useEffect(() => {
    if (!open || !company) return;

    setCompanyName(company.companyName ?? "");
    setCompanyAddress(company.companyAddress ?? "");
    setBusinessRegistrationNumber(company.businessRegistrationNumber ?? "");
    setError("");
  }, [open, company]);

  const handleSubmit = () => {
    if (!company) return;

    if (!companyName.trim() || !companyAddress.trim()) {
      setError("회사명과 회사 주소를 입력해주세요.");
      return;
    }

    updateCompany(
      {
        companyName: companyName.trim(),
        companyAddress: companyAddress.trim(),
        businessRegistrationNumber: businessRegistrationNumber.trim(),
      },
      {
        onSuccess: onClose,
      },
    );
  };

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-primary/15 p-2 text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-text-strong">회사 정보 수정</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              회사명, 주소, 사업자 등록번호를 관리합니다
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 px-6 py-5">
        <div className="space-y-1.5">
          <FieldLabel icon={Building2} required>
            회사명
          </FieldLabel>
          <input
            value={companyName}
            onChange={(event) => {
              setCompanyName(event.target.value);
              if (error) setError("");
            }}
            onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
            className={cn(
              "w-full rounded-xl border bg-surface px-3 py-2.5 text-sm text-text transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1",
              error && !companyName.trim()
                ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                : "border-border focus:border-primary focus:ring-primary/30",
            )}
            placeholder="회사명을 입력하세요"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel icon={MapPin} required>
            회사 주소
          </FieldLabel>
          <input
            value={companyAddress}
            onChange={(event) => {
              setCompanyAddress(event.target.value);
              if (error) setError("");
            }}
            onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
            className={cn(
              "w-full rounded-xl border bg-surface px-3 py-2.5 text-sm text-text transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1",
              error && !companyAddress.trim()
                ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                : "border-border focus:border-primary focus:ring-primary/30",
            )}
            placeholder="회사 주소를 입력하세요"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel icon={FileText}>사업자 등록번호</FieldLabel>
          <input
            value={businessRegistrationNumber}
            onChange={(event) => setBusinessRegistrationNumber(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="예: 123-45-67890"
          />
        </div>

        {error && <p className="text-xs text-danger-foreground">{error}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          취소
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          저장
        </Button>
      </div>
    </BaseModal>
  );
}
