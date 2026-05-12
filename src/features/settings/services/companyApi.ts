import apiClient from "@/lib/axios";
import type { Company, UpdateCompanyDto } from "@/types/company";

interface ApiEnvelope<T> {
  data?: T;
}

interface CompanyPayload {
  company?: Company;
}

function normalizeCompany(payload: unknown): Company {
  const envelope = payload as ApiEnvelope<CompanyPayload | Company>;
  const data = envelope.data;

  if (data && "company" in data && data.company) {
    return data.company;
  }

  return data as Company;
}

export const getCompany = async (companyId: string): Promise<Company> => {
  const response = await apiClient.get(`/company/${companyId}`);
  return normalizeCompany(response.data);
};

export const updateCompany = async (
  companyId: string,
  dto: UpdateCompanyDto,
): Promise<Company> => {
  const response = await apiClient.patch(`/company/${companyId}`, dto);
  return normalizeCompany(response.data);
};
