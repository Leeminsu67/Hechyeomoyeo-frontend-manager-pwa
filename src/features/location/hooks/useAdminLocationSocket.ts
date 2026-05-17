"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  LocationConnectionDebug,
  LocationPingPayload,
} from "../types/location.types";
import { normalizeLocationPayload } from "../lib/locationState";

function getSocketUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  return baseUrl ? `${baseUrl}/ws/admin` : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseMessage(payload: unknown) {
  if (typeof payload === "string") return payload;
  if (isRecord(payload) && typeof payload.message === "string") {
    return payload.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

function parseJoinedSites(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.joinedSites)) return [];

  return payload.joinedSites.flatMap((site) => {
    if (typeof site === "string") return [site];
    if (!isRecord(site)) return [];
    const siteName = site.siteName;
    const siteId = site.siteId;
    if (typeof siteId === "string") return [siteId];
    if (typeof siteName === "string") return [siteName];
    return [];
  });
}

export function useAdminLocationSocket({
  accessToken,
  selectedSiteId,
  onPing,
}: {
  accessToken: string | null;
  selectedSiteId: string | null;
  onPing: (payload: LocationPingPayload) => void;
}) {
  const selectedSiteIdRef = useRef(selectedSiteId);
  const onPingRef = useRef(onPing);
  const [debug, setDebug] = useState<LocationConnectionDebug>({
    status: "idle",
    joinedSites: [],
    authError: null,
    connectError: null,
    disconnectReason: null,
    lastEventAt: null,
  });

  useEffect(() => {
    selectedSiteIdRef.current = selectedSiteId;
  }, [selectedSiteId]);

  useEffect(() => {
    onPingRef.current = onPing;
  }, [onPing]);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    if (!socketUrl || !accessToken) {
      setDebug((prev) => ({ ...prev, status: "idle" }));
      return;
    }

    setDebug({
      status: "connecting",
      joinedSites: [],
      authError: null,
      connectError: null,
      disconnectReason: null,
      lastEventAt: null,
    });

    const socket: Socket = io(socketUrl, {
      transports: ["websocket"],
      auth: { token: accessToken },
    });

    socket.on("connect", () => {
      setDebug((prev) => ({
        ...prev,
        status: "connected",
        connectError: null,
        disconnectReason: null,
        lastEventAt: new Date().toISOString(),
      }));
    });

    socket.on("connected", (payload: unknown) => {
      setDebug((prev) => ({
        ...prev,
        status: "connected",
        joinedSites: parseJoinedSites(payload),
        authError: null,
        connectError: null,
        disconnectReason: null,
        lastEventAt: new Date().toISOString(),
      }));
    });

    socket.on("auth:error", (payload: unknown) => {
      setDebug((prev) => ({
        ...prev,
        status: "auth-error",
        authError: parseMessage(payload),
        lastEventAt: new Date().toISOString(),
      }));
      socket.disconnect();
    });

    socket.on("connect_error", (error: Error) => {
      setDebug((prev) => ({
        ...prev,
        status: "connect-error",
        connectError: error.message,
        lastEventAt: new Date().toISOString(),
      }));
    });

    socket.on("disconnect", (reason: string) => {
      setDebug((prev) => ({
        ...prev,
        status: "disconnected",
        disconnectReason: reason,
        lastEventAt: new Date().toISOString(),
      }));
    });

    socket.on("location:ping", (payload: unknown) => {
      setDebug((prev) => ({ ...prev, lastEventAt: new Date().toISOString() }));
      const normalized = normalizeLocationPayload(payload);
      if (!normalized || normalized.siteId !== selectedSiteIdRef.current) return;
      onPingRef.current(normalized);
    });

    socket.on("location:share-status", (payload: unknown) => {
      setDebug((prev) => ({ ...prev, lastEventAt: new Date().toISOString() }));
      const normalized = normalizeLocationPayload(payload);
      if (!normalized || normalized.siteId !== selectedSiteIdRef.current) return;
      onPingRef.current(normalized);
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  return debug;
}
