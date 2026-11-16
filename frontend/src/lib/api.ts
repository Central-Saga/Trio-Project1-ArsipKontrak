import axios from "axios";

/**
 * Semua request API melewati BFF Next.js (/api/backend).
 *
 * BFF menambahkan token dari cookie httpOnly di sisi server, sehingga token
 * tidak pernah tersedia untuk JavaScript di browser.
 */
const api = axios.create({
  baseURL: "/api/backend",
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});

// Sesi kedaluwarsa atau tidak valid: hapus cookie sesi dan arahkan ke login
// dengan menyertakan halaman asal agar pengguna dapat kembali setelah masuk.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const status = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;

    if (
      typeof window !== "undefined" &&
      status === 401 &&
      window.location.pathname !== "/login"
    ) {
      const nextPath = `${window.location.pathname}${window.location.search}`;

      void fetch("/api/session", { method: "DELETE" }).catch(
        () => undefined,
      );

      window.location.replace(
        `/login?next=${encodeURIComponent(nextPath)}`,
      );
    }

    return Promise.reject(error);
  },
);

export default api;
