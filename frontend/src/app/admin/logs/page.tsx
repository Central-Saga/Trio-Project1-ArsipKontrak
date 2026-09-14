"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  FileText,
  Folder,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
} from "lucide-react";
import api from "@/lib/api";

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface User {
  name: string;
  role: string;
}

interface ActivityLog {
  id: number;
  created_at: string;
  action: string;
  description: string;
  ip_address: string | null;
  user?: User;
}

export default function ActivityLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user_data") || localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/activity-logs");
      const json = response.data;
      if (json.success) {
        setLogs(json.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat log aktivitas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // Tetap bersihkan sesi lokal jika request logout gagal.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      router.replace("/login");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar Light Theme */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-4 transition-all duration-300 ease-in-out md:flex ${isSidebarOpen ? "w-64" : "w-20"}`}
      >
        <div>
          <div
            className={`mb-8 flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"}`}
          >
            {isSidebarOpen && (
              <div className="flex min-w-0 items-center gap-2 px-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Folder className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="truncate font-bold tracking-wider text-slate-900">
                  SAGA ARSIP
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
              aria-label="Toggle sidebar"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <nav className="space-y-1 text-sm" aria-label="Navigasi utama">
            <button
              type="button"
              onClick={() => router.push("/")}
              title="Dashboard"
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${isSidebarOpen ? "" : "justify-center"}`}
            >
              <LayoutDashboard
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              {isSidebarOpen && <span>Dashboard</span>}
            </button>
            <button
              type="button"
              onClick={() => router.push("/contracts")}
              title="Kontrak & MoU"
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${isSidebarOpen ? "" : "justify-center"}`}
            >
              <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
              {isSidebarOpen && <span>Kontrak &amp; MoU</span>}
            </button>
            <button
              type="button"
              onClick={() => router.push("/statistics")}
              title="Ringkasan"
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${isSidebarOpen ? "" : "justify-center"}`}
            >
              <BarChart3 className="h-5 w-5 shrink-0" aria-hidden="true" />
              {isSidebarOpen && <span>Ringkasan</span>}
            </button>
            {user?.role === "admin" && (
              <button
                type="button"
                onClick={() => router.push("/admin/logs")}
                title="Log Aktivitas"
                className={`flex w-full items-center gap-3 rounded-xl bg-blue-50 px-3 py-2.5 text-left font-medium text-blue-600 ${isSidebarOpen ? "" : "justify-center"}`}
              >
                <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
                {isSidebarOpen && <span>Log Aktivitas</span>}
              </button>
            )}
          </nav>
        </div>
        <div className="border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar"
            className={`flex w-full items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-left font-medium text-rose-600 transition hover:bg-rose-100 ${isSidebarOpen ? "" : "justify-center"}`}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? "md:ml-64" : "md:ml-20"}`}
      >
        <header className="relative z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              SAGA ARSIP
            </p>
            <p className="text-xs text-slate-500">
              Pemantauan aktivitas sistem dan pengguna
            </p>
          </div>
          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
              aria-label="Buka profil"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </button>
            {isProfileMenuOpen && (
              <div
                className="absolute right-0 top-11 z-[99] w-56 rounded-2xl border border-slate-200 bg-white py-2 text-slate-800 shadow-xl"
                role="menu"
              >
                <div className="mb-1 border-b border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-400">Masuk sebagai</p>
                  <p className="truncate text-sm font-bold text-slate-900">
                    {user?.name || "Administrator"}
                  </p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    router.push("/profile");
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
                >
                  Profil Saya
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    router.push("/contracts");
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
                >
                  Kontrak &amp; MoU
                </button>
                <div className="mt-1 border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <ShieldAlert
                    className="h-7 w-7 text-blue-600"
                    aria-hidden="true"
                  />
                  Log Aktivitas Sistem &amp; Viewer
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Pantau riwayat login pengguna dan aktivitas saat mengakses
                  dokumen.
                </p>
              </div>
            </div>

            {/* Table Container Light Theme */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Pengguna
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Aksi
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Deskripsi
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Alamat IP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        Memuat data log aktivitas...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        Belum ada aktivitas tercatat.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {log.user
                            ? `${log.user.name} (${log.user.role})`
                            : "Sistem / Tidak Diketahui"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                              log.action === "LOGIN"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                          {log.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {log.ip_address || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
