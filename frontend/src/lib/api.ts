import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1",
  headers: {
    Accept: "application/json",
  },
});

const AUTH_STORAGE_KEYS = [
  "token",
  "auth_token",
  "user",
  "user_data",
] as const;

// Gunakan token yang tersedia untuk setiap request API.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      window.localStorage.getItem("token") ||
      window.localStorage.getItem("auth_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Sesi kedaluwarsa atau tidak valid: bersihkan semua variasi key
// autentikasi yang digunakan aplikasi, lalu arahkan ke halaman login.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const status = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;

    if (typeof window !== "undefined" && status === 401) {
      void fetch("/api/document-metadata-session", {
        method: "DELETE",
      }).catch(() => undefined);
      AUTH_STORAGE_KEYS.forEach((key) => {
        window.localStorage.removeItem(key);
      });

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
