import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UpdateCompanyDto } from "@/types/company";
import { getCompany, updateCompany } from "../services/companyApi";

export const COMPANY_KEYS = {
  all: ["company"] as const,
  detail: (companyId: string) => ["company", "detail", companyId] as const,
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export function useCompany(companyId?: string | null, enabled = true) {
  return useQuery({
    queryKey: COMPANY_KEYS.detail(companyId ?? ""),
    queryFn: () => getCompany(companyId ?? ""),
    enabled: enabled && !!companyId,
  });
}

export function useUpdateCompany(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateCompanyDto) => updateCompany(companyId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_KEYS.detail(companyId) });
      toast.success("회사 정보를 수정했습니다.");
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message ?? "회사 정보 수정에 실패했습니다.");
    },
  });
}
