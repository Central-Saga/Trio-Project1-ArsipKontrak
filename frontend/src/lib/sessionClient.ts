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
let pendingRequestId: symbol | null = null;
// Setiap login/logout menaikkan versi. Response async dari sesi lama yang
// datang terlambat tidak boleh menimpa state pengguna baru.
let sessionVersion = 0;
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

  const version = sessionVersion;
  const requestId = Symbol("session-request");

  const request = sessionApi
    .get("")
    .then(({ data }) => {
      // Abaikan response yang sudah basi, misalnya ketika user logout atau
      // login dengan akun lain saat request ini masih berjalan.
      if (version !== sessionVersion) {
        return null;
      }

      const user = toCurrentUser(data?.user);
      publish({ user, loading: false });

      return user;
    })
    .catch(() => {
      if (version === sessionVersion) {
        publish({ user: null, loading: false });
      }

      return null;
    })
    .finally(() => {
      if (pendingRequestId === requestId) {
        pendingRequest = null;
        pendingRequestId = null;
      }
    });

  pendingRequest = request;
  pendingRequestId = requestId;

  return request;
}

export async function login(
  email: string,
  password: string,
): Promise<CurrentUser | null> {
  // Naikkan versi dan batalkan request sesi lama sebelum login baru dimulai.
  const version = ++sessionVersion;
  pendingRequest = null;
  pendingRequestId = null;

  const { data } = await sessionApi.post("", { email, password });
  const user = toCurrentUser(data?.user);

  // Bersihkan token lama dari versi aplikasi sebelumnya agar tidak tertinggal
  // di localStorage pengguna.
  clearLegacyAuthStorage();

  if (version !== sessionVersion) {
    return null;
  }

  publish({ user, loading: false });

  return user;
}

export async function logout(): Promise<void> {
  // Invalidate request sesi yang masih berjalan agar response-nya tidak
  // mengembalikan data pengguna lama setelah logout.
  sessionVersion += 1;
  pendingRequest = null;
  pendingRequestId = null;

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
  // Update lokal harus menang atas request sesi yang masih berjalan.
  sessionVersion += 1;
  pendingRequest = null;
  pendingRequestId = null;

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
