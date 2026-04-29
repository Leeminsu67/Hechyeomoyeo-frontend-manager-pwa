import apiClient from "@/lib/axios";

export interface UserSummary {
  id: string;
  loginId?: string;
  name: string;
  role: number;
  email?: string;
}

export const searchUsers = (name: string) =>
  apiClient
    .get("/user", {
      params: {
        ...(name.trim() ? { name: name.trim() } : {}),
        page: 1,
        take: 100,
      },
    })
    .then((r) => r.data);
