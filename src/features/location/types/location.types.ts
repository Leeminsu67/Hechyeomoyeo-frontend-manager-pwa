export type LocationSocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "auth-error"
  | "connect-error"
  | "disconnected";

export type LocationPingPayload = {
  siteId: string;
  userId: string;
  userName: string;
  role: number;
  assignmentType: string | null;
  attendanceStatus: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  battery: number | null;
  recordedAt: string;
  isStale: boolean;
  isOutOfZone: boolean | null;
};

export type SiteOnlineStatus = {
  trackedUsers: number;
  online: number;
  stale: number;
  outOfZone: number;
};

export type LocationHistoryParams = {
  siteId: string;
  userId: string;
  from: string;
  to: string;
};

export type LocationConnectionDebug = {
  status: LocationSocketStatus;
  joinedSites: string[];
  authError: string | null;
  connectError: string | null;
  disconnectReason: string | null;
  lastEventAt: string | null;
};
