export type CompanyType = "BUSINESS" | "PERSONAL";

export interface Company {
  id: string;
  companyCode: string;
  companyName: string;
  companyAddress: string;
  businessRegistrationNumber: string | null;
  type: CompanyType;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateCompanyDto {
  companyName: string;
  companyAddress: string;
  businessRegistrationNumber?: string;
}
