export type LocationSocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "auth-error"
  | "connect-error"
  | "disconnected";

export type WorkerLocationStatus =
  | "outOfZone"
  | "missing"
  | "lowAccuracy"
  | "online";

export type WorkerLocationZone = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
};

export type LocationPingPayload = {
  siteId: string;
  attendanceId: string | null;
  workerId: string | null;
  workerName: string;
  userId: string | null;
  userName: string;
  role: number | null;
  assignmentType: string | null;
  attendanceStatus: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  battery: number | null;
  recordedAt: string | null;
  receivedAt: string | null;
  lastReceivedAt: string | null;
  status: string | null;
  accuracyStatus: string | null;
  isStale: boolean | null;
  isOutOfZone: boolean | null;
  distanceFromZoneMeters: number | null;
  zone: WorkerLocationZone | null;
};

export type SiteOnlineStatus = {
  trackedUsers: number;
  online: number;
  stale: number;
  outOfZone: number;
};

export type LocationHistoryParams = {
  siteId: string;
  workerId: string;
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
