"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  loadCurrentUser,
  subscribeToSession,
} from "@/lib/sessionClient";

/**
 * Sumber tunggal data pengguna aktif di client.
 *
 * Data diambil dari cookie sesi melalui /api/session, bukan dari localStorage.
 */
export function useCurrentUser() {
  const session = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  return session;
}
