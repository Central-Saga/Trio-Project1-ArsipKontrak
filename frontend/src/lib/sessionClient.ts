"use client";

import axios from "axios";

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface SessionSnapshot {
  user: CurrentUser | null;
  loading: boolean;
}

const SERVER_SNAPSHOT: SessionSnapshot = { user: null, loading: true };
const LEGACY_AUTH_KEYS = ["token", "auth_token", "user", "user_data"] as const;

let snapshot: SessionSnapshot = SERVER_SNAPSHOT;
let pendingRequest: Promise<CurrentUser | null> | null = null;
const listeners = new Set<() => void>();

const sessionApi = axios.create({
  baseURL: "/api/session",
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});

function publish(next: SessionSnapshot): void {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function toCurrentUser(value: unknown): CurrentUser | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.id !== "number" ||
    typeof record.name !== "string" ||
    typeof record.email !== "string" ||
    typeof record.role !== "string"
  ) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
  };
}

export function getSessionSnapshot(): SessionSnapshot {
  return snapshot;
}

export function getServerSessionSnapshot(): SessionSnapshot {
  return SERVER_SNAPSHOT;
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Ambil profil pengguna aktif dari cookie sesi (via /api/session).
 */
export async function loadCurrentUser(
  force = false,
): Promise<CurrentUser | null> {
  // Bersihkan token lama dari versi sebelumnya setiap kali sesi dimuat.
  clearLegacyAuthStorage();

  if (!force && snapshot.user) {
    return snapshot.user;
  }

  if (pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = sessionApi
    .get("")
    .then(({ data }) => {
      const user = toCurrentUser(data?.user);
      publish({ user, loading: false });

      return user;
    })
    .catch(() => {
      publish({ user: null, loading: false });

      return null;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
}

export async function login(
  email: string,
  password: string,
): Promise<CurrentUser | null> {
  const { data } = await sessionApi.post("", { email, password });
  const user = toCurrentUser(data?.user);

  // Bersihkan token lama dari versi aplikasi sebelumnya agar tidak tertinggal
  // di localStorage pengguna.
  clearLegacyAuthStorage();
  publish({ user, loading: false });

  return user;
}

export async function logout(): Promise<void> {
  try {
    // Route handler mencabut token di backend lalu menghapus cookie httpOnly.
    await sessionApi.delete("");
  } catch {
    // State lokal tetap direset meskipun backend tidak dapat dihubungi.
  }

  clearLegacyAuthStorage();
  publish({ user: null, loading: false });
}

export function updateSessionUser(user: CurrentUser): void {
  publish({ user, loading: false });
}

/**
 * Hapus kunci autentikasi dari versi lama aplikasi.
 *
 * Nilai baru tidak pernah ditulis ke localStorage; fungsi ini hanya untuk
 * migrasi pengguna yang masih memiliki token lama.
 */
export function clearLegacyAuthStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    LEGACY_AUTH_KEYS.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch {
    // Storage bisa diblokir oleh kebijakan browser; abaikan.
  }
}
