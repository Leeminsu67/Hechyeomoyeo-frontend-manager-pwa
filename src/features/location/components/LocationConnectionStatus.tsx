"use client";

import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationConnectionDebug, SiteOnlineStatus } from "../types/location.types";
import { getSocketStatusLabel } from "../lib/locationFormat";

export function LocationConnectionStatus({
  debug,
  onlineStatus,
}: {
  debug: LocationConnectionDebug;
  onlineStatus?: SiteOnlineStatus;
}) {
  const connected = debug.status === "connected";
  const statusText =
    debug.authError ?? debug.connectError ?? debug.disconnectReason ?? null;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              connected ? "bg-success/20 text-success-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-sm font-bold text-text-strong">
              Socket.IO {getSocketStatusLabel(debug.status)}
            </p>
            {statusText && (
              <p className="mt-0.5 text-xs text-danger-foreground">{statusText}</p>
            )}
          </div>
        </div>
        {onlineStatus && (
          <div className="text-right text-xs text-muted-foreground">
            <p>온라인 {onlineStatus.online}명</p>
            <p>추적 {onlineStatus.trackedUsers}명</p>
          </div>
        )}
      </div>
      {debug.joinedSites.length > 0 && (
        <p className="mt-3 truncate text-xs text-muted-foreground">
          joinedSites: {debug.joinedSites.join(", ")}
        </p>
      )}
    </div>
  );
}
