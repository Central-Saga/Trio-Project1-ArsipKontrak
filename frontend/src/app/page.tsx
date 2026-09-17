"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Eye,
  FileText,
  Folder,
  LayoutDashboard,
  LogOut,
  Menu,
  SquarePen,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
} from "lucide-react";
import api from "../lib/api";
import { DocumentItem } from "../types/document";
import UploadDocumentModal from "../components/UploadDocumentModal";
import NotificationBell from "@/components/NotificationBell";

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSecureMode, setIsSecureMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSuccessPopup, setDeleteSuccessPopup] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Fungsi penentuan warna indikator berdasarkan status database
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-500"; // Hijau
      case "draft":
        return "bg-amber-500"; // Oranye / Kuning
      case "expired":
        return "bg-rose-500"; // Merah
      case "terminated":
        return "bg-slate-400"; // Abu-abu
      default:
        return "bg-emerald-500";
    }
  };

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/documents");
      const rawData = response.data;
      const items = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
          ? rawData.data
          : Array.isArray(rawData?.data?.data)
            ? rawData.data.data
            : Array.isArray(rawData?.documents)
              ? rawData.documents
              : [];
      setDocuments(items);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat daftar dokumen.");
    } finally {
      setLoading(false);
    }
  }, []);

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
    fetchDocuments();
  }, [fetchDocuments]);

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

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // Ignore error
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      router.replace("/login");
    }
  };

  const confirmDelete = (doc: DocumentItem) => {
    setDocumentToDelete({
      id: doc.id,
      name: doc.title || doc.document_name || doc.document_number,
    });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!documentToDelete) return;
    try {
      await api.delete(`/documents/${documentToDelete.id}`);
      setDeleteModalOpen(false);

      setDeleteSuccessPopup(true);
      setTimeout(() => {
        setDeleteSuccessPopup(false);
        setDocumentToDelete(null);
        fetchDocuments();
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus dokumen.");
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const title = doc.title || doc.document_name || "";
    const docNumber = doc.document_number || "";
    const counterpart = doc.counterpart_name || doc.partner || "";
    const query = searchQuery.toLowerCase();

    return (
      title.toLowerCase().includes(query) ||
      docNumber.toLowerCase().includes(query) ||
      counterpart.toLowerCase().includes(query)
    );
  });

  const totalArsip = documents.length;
  const activeCount = documents.filter(
    (doc) => doc.status?.toLowerCase() === "active",
  ).length;
  const contractCount = documents.filter(
    (doc) => doc.document_type?.toLowerCase() === "contract",
  ).length;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      {deleteSuccessPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-72 rounded-2xl bg-white p-5 text-center shadow-2xl border border-slate-100 transition-all transform animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Dokumen Dihapus!
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Arsip berhasil dihapus dari sistem.
            </p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:flex ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div>
          <div
            className={`mb-8 flex items-center transition-all duration-300 ${
              isSidebarOpen ? "justify-between" : "justify-center"
            }`}
          >
            <div
              className={`flex min-w-0 items-center gap-2 px-2 overflow-hidden transition-all duration-300 ${
                isSidebarOpen
                  ? "opacity-100 max-w-[200px]"
                  : "opacity-0 max-w-0"
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transition-transform duration-300 hover:scale-105">
                <Folder className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="truncate font-bold tracking-wider text-slate-900">
                SAGA ARSIP
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
              aria-label="Toggle sidebar"
              className="rounded-lg p-2 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:scale-105"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav className="space-y-1.5 text-sm" aria-label="Navigasi utama">
            <button
              type="button"
              onClick={() => router.push("/")}
              title="Dashboard"
              className={`group flex w-full items-center gap-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-left font-medium text-emerald-600 transition-all duration-200 ${
                isSidebarOpen ? "" : "justify-center"
              }`}
            >
              <LayoutDashboard
                className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                aria-hidden="true"
              />
              <span
                className={`whitespace-nowrap transition-all duration-300 ${
                  isSidebarOpen
                    ? "opacity-100 max-w-[150px]"
                    : "opacity-0 max-w-0 overflow-hidden"
                }`}
              >
                Dashboard
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/contracts")}
              title="Kontrak & MoU"
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 ${
                isSidebarOpen ? "" : "justify-center"
              }`}
            >
              <FileText
                className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                aria-hidden="true"
              />
              <span
                className={`whitespace-nowrap transition-all duration-300 ${
                  isSidebarOpen
                    ? "opacity-100 max-w-[150px]"
                    : "opacity-0 max-w-0 overflow-hidden"
                }`}
              >
                Kontrak &amp; MoU
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/statistics")}
              title="Ringkasan"
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 ${
                isSidebarOpen ? "" : "justify-center"
              }`}
            >
              <BarChart3
                className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                aria-hidden="true"
              />
              <span
                className={`whitespace-nowrap transition-all duration-300 ${
                  isSidebarOpen
                    ? "opacity-100 max-w-[150px]"
                    : "opacity-0 max-w-0 overflow-hidden"
                }`}
              >
                Ringkasan
              </span>
            </button>

            {user?.role === "admin" && (
              <>
                {/* Menu Manajemen Pengguna */}
                <button
                  type="button"
                  onClick={() => router.push("/admin/users")}
                  title="Manajemen Pengguna"
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 ${
                    isSidebarOpen ? "" : "justify-center"
                  }`}
                >
                  <Users
                    className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <span
                    className={`whitespace-nowrap transition-all duration-300 ${
                      isSidebarOpen
                        ? "opacity-100 max-w-[150px]"
                        : "opacity-0 max-w-0 overflow-hidden"
                    }`}
                  >
                    Manajemen Pengguna
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin/logs")}
                  title="Log Aktivitas"
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 ${
                    isSidebarOpen ? "" : "justify-center"
                  }`}
                >
                  <ShieldAlert
                    className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <span
                    className={`whitespace-nowrap transition-all duration-300 ${
                      isSidebarOpen
                        ? "opacity-100 max-w-[150px]"
                        : "opacity-0 max-w-0 overflow-hidden"
                    }`}
                  >
                    Log Aktivitas
                  </span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Tombol Keluar */}
        <div className="border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar"
            className="group flex w-full items-center justify-center rounded-xl border border-rose-200 bg-rose-50 py-3 text-rose-600 transition-all duration-200 hover:bg-rose-100 hover:scale-[1.02]"
          >
            <LogOut
              className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
              aria-hidden="true"
            />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isSidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor dokumen atau rekanan..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSecureMode(!isSecureMode)}
              title="Klik untuk mengaktifkan/menonaktifkan Secure Mode"
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all duration-200 ${
                isSecureMode
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
              }`}
            >
              {isSecureMode ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                  <span>Secure Mode Active</span>
                </>
              ) : (
                <>
                  <ShieldOff className="h-3.5 w-3.5 text-slate-500" />
                  <span>Secure Mode Off</span>
                </>
              )}
            </button>

            {/* Komponen Lonceng Notifikasi */}
            <NotificationBell />

            {user?.role === "admin" && (
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:bg-emerald-500 hover:scale-[1.02] active:scale-95"
              >
                <Plus className="h-4 w-4" /> Unggah
              </button>
            )}

            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
                aria-expanded={isProfileMenuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:bg-emerald-500 hover:scale-105"
              >
                {user?.name?.slice(0, 2).toUpperCase() || "AD"}
              </button>

              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-200 bg-white py-2 text-slate-800 shadow-xl animate-in fade-in zoom-in-95 duration-150"
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
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-emerald-600"
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
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-emerald-600"
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
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Dashboard Arsip
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Kelola dan telusuri seluruh dokumen legal dengan enkripsi
                AES-256.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Arsip
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {totalArsip}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-300">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Dokumen Aktif
                </p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-700">
                  {activeCount}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Kontrak
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {contractCount}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Daftar Arsip Dokumen
                </h2>
                <span className="text-xs text-slate-500">
                  Total: {filteredDocuments.length} Dokumen
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Nama Dokumen
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Tipe
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Pihak Rekanan
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Masa Berlaku
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Aksi
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
                          Memuat daftar dokumen...
                        </td>
                      </tr>
                    ) : filteredDocuments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-slate-500"
                        >
                          Tidak ada dokumen ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredDocuments.map((doc) => {
                        const statusColor = getStatusColor(doc.status);
                        const start =
                          doc.start_date || doc.effective_date || "";
                        const expiry = doc.end_date || doc.expiry_date || "";

                        return (
                          <tr
                            key={doc.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusColor}`}
                                  title={`Status: ${doc.status}`}
                                />
                                <div className="min-w-0 max-w-xs sm:max-w-sm md:max-w-md">
                                  <div
                                    className="text-sm font-semibold text-slate-900 truncate"
                                    title={doc.title || doc.document_name}
                                  >
                                    {doc.title || doc.document_name}
                                  </div>
                                  <div className="text-xs text-slate-400 truncate">
                                    {doc.document_number}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 uppercase">
                              {doc.document_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {doc.counterpart_name || doc.partner || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {start || "-"} - {expiry || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(`/documents/${doc.id}`)
                                  }
                                  title="Detail Dokumen"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-150 hover:scale-110"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                {user?.role === "admin" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        router.push(`/documents/${doc.id}/edit`)
                                      }
                                      title="Edit Dokumen"
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 hover:scale-110"
                                    >
                                      <SquarePen className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => confirmDelete(doc)}
                                      title="Hapus Dokumen"
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-150 hover:scale-110"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

        {deleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Konfirmasi Hapus Dokumen
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tindakan ini akan menghapus dokumen dan seluruh riwayat
                    versinya.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-5 text-sm font-medium text-slate-800 truncate">
                {documentToDelete?.name}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-150"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 transition-all duration-150 hover:scale-[1.02]"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        <UploadDocumentModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={fetchDocuments}
          secureMode={isSecureMode}
        />
      </div>
    </div>
  );
}
