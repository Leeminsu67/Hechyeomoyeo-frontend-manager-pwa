"use client";

import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationConnectionDebug } from "../types/location.types";
import { getSocketStatusLabel } from "../lib/locationFormat";

export function LocationConnectionStatus({
  debug,
  summary,
}: {
  debug: LocationConnectionDebug;
  summary: {
    total: number;
    online: number;
    missing: number;
    outOfZone: number;
    lowAccuracy: number;
  };
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
            {debug.status === "auth-error" && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                다시 로그인하거나 권한을 확인해주세요.
              </p>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>정상 {summary.online}명</p>
          <p>추적 {summary.total}명</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
        <span className="rounded-lg bg-muted px-2 py-1 text-muted-foreground">
          미수신 {summary.missing}
        </span>
        <span className="rounded-lg bg-danger/15 px-2 py-1 text-danger-foreground">
          이탈 {summary.outOfZone}
        </span>
        <span className="rounded-lg bg-secondary/20 px-2 py-1 text-secondary-foreground">
          저정확 {summary.lowAccuracy}
        </span>
      </div>
      {debug.joinedSites.length > 0 && (
        <p className="mt-3 truncate text-xs text-muted-foreground">
          joinedSites: {debug.joinedSites.join(", ")}
        </p>
      )}
    </div>
  );
}
