import apiClient from "@/lib/axios";
import type { SiteAssignmentType } from "@/types/site";
import type { ScheduleDateCandidate } from "@/types/schedule";

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
  siteAssignmentType?: SiteAssignmentType | null;
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

export interface ScheduleCandidatesResponse {
  data: {
    users: ScheduleDateCandidate[];
    total: number;
  };
}

type ScheduleCandidateApiUser = Omit<
  ScheduleDateCandidate,
  "siteAssignmentType" | "unavailableReasons" | "assignedScheduleId" | "assignedZoneName"
> & {
  siteAssignmentType?: Extract<
    SiteAssignmentType,
    "regularWorker" | "substituteWorker"
  >;
  unavailableReasons?: string[];
  assignedScheduleId?: string | null;
  assignedZoneName?: string | null;
};

export const getScheduleCandidates = (
  siteId: string,
  scheduleDate: string,
): Promise<ScheduleCandidatesResponse> =>
  apiClient
    .get("/user/schedule-candidates", {
      params: { siteId, scheduleDate },
    })
    .then((r) => {
      const payload = r.data as {
        data?: { users?: ScheduleCandidateApiUser[]; total?: number };
      };
      const users = payload.data?.users ?? [];
      return {
        data: {
          users: users.map((user) => ({
            ...user,
            siteAssignmentType: user.siteAssignmentType ?? "regularWorker",
            unavailableReasons: user.unavailableReasons ?? [],
            assignedScheduleId: user.assignedScheduleId ?? null,
            assignedZoneName: user.assignedZoneName ?? null,
          })),
          total: payload.data?.total ?? users.length,
        },
      };
    });
