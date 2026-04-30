import apiClient from "@/lib/axios";

export interface UserSummary {
  id: string;
  loginId?: string;
  name: string;
  role: number;
  email?: string;
}

export interface AssignmentCandidateUser {
  id: string;
  loginId: string;
  role: number;
  name: string;
  assignedToSite?: boolean;
}

export interface AssignmentCandidatesResponse {
  data: {
    users: AssignmentCandidateUser[];
    total: number;
  };
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

export const getAssignmentCandidates = (
  keyword: string,
): Promise<AssignmentCandidatesResponse> =>
  apiClient
    .get("/user/assignment-candidates", {
      params: {
        ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
      },
    })
    .then((r) => r.data);

export const getSiteAssignmentCandidates = (
  siteId: string,
  keyword: string,
): Promise<AssignmentCandidatesResponse> =>
  apiClient
    .get(`/user/assignment-candidates/site/${siteId}`, {
      params: {
        ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
      },
    })
    .then((r) => r.data);
