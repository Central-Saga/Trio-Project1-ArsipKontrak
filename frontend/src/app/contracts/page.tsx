"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Edit,
  Eye,
  FileText,
  Folder,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import api from "@/lib/api";
import { DocumentItem } from "@/types/document";
import UploadDocumentModal from "@/components/UploadDocumentModal";

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

type DocumentTab = "all" | "contract" | "mou";

function ContractsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeTab, setActiveTab] = useState<DocumentTab>("all");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [trashedDocuments, setTrashedDocuments] = useState<DocumentItem[]>([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [trashError, setTrashError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [isSecureMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(
        err.response?.data?.message || "Gagal memuat dokumen kontrak dan MoU.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrashedDocuments = useCallback(async () => {
    if (user?.role !== "admin") return;

    try {
      setLoadingTrash(true);
      const response = await api.get("/documents/trash");
      const rawData = response.data;
      const items = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
          ? rawData.data
          : Array.isArray(rawData?.data?.data)
            ? rawData.data.data
            : [];
      setTrashedDocuments(items);
      setTrashError(null);
    } catch (err: any) {
      setTrashError(
        err.response?.data?.message || "Gagal memuat arsip terhapus.",
      );
    } finally {
      setLoadingTrash(false);
    }
  }, [user]);

  // Fungsi untuk menghapus dokumen (Soft Delete)
  const handleDeleteDocument = async (id: number) => {
    if (!window.confirm("Apakah kamu yakin ingin menghapus dokumen ini?")) {
      return;
    }
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus dokumen.");
    }
  };

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
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    setActiveTab(type === "contract" || type === "mou" ? type : "all");
    setStatusFilter(status || null);
  }, [searchParams]);

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

  useEffect(() => {
    const handleOpenUploadModal = () => {
      if (user?.role === "admin") {
        setIsUploadOpen(true);
      }
    };
    window.addEventListener("open-upload-modal", handleOpenUploadModal);
    return () =>
      window.removeEventListener("open-upload-modal", handleOpenUploadModal);
  }, [user]);

  const filteredDocuments = documents.filter((document) => {
    const matchesType =
      activeTab === "all" || document.document_type.toLowerCase() === activeTab;
    const matchesStatus =
      !statusFilter ||
      document.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesType && matchesStatus;
  });

  const activeFilterLabel = [
    activeTab !== "all" ? (activeTab === "mou" ? "MoU" : "Kontrak") : null,
    statusFilter
      ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
      : null,
  ]
    .filter(Boolean)
    .join(" - ");

  const statusFilters = [
    { value: "active", label: "Active" },
    { value: "draft", label: "Draft" },
    { value: "expired", label: "Expired" },
    { value: "terminated", label: "Terminated" },
  ];

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
  };

  const handleTabChange = (tab: DocumentTab) => {
    setActiveTab(tab);
  };

  const handleResetFilter = () => {
    setActiveTab("all");
    setStatusFilter(null);
  };

  const handleRestore = async (id: number) => {
    try {
      setRestoringId(id);
      await api.post(`/documents/${id}/restore`);
      await Promise.all([fetchDocuments(), fetchTrashedDocuments()]);
    } catch (err: any) {
      setTrashError(err.response?.data?.message || "Gagal memulihkan dokumen.");
    } finally {
      setRestoringId(null);
    }
  };

  const statusClasses: Record<string, string> = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    draft: "border-amber-200 bg-amber-50 text-amber-700",
    expired: "border-rose-200 bg-rose-50 text-rose-700",
    terminated: "border-slate-200 bg-slate-100 text-slate-700",
  };

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
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-4 transition-all duration-300 ease-in-out md:flex ${isSidebarOpen ? "w-64" : "w-20"}`}
      >
        <div>
          <div
            className={`mb-8 flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"}`}
          >
            {isSidebarOpen && (
              <div className="flex min-w-0 items-center gap-2 px-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
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
              aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
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
              className={`flex w-full items-center gap-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-left font-medium text-emerald-600 ${isSidebarOpen ? "" : "justify-center"}`}
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
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${isSidebarOpen ? "" : "justify-center"}`}
              >
                <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
                {isSidebarOpen && <span>Log Aktivitas</span>}
              </button>
            )}
          </nav>
        </div>

        {/* Tombol Keluar (Hanya Ikon) */}
        <div className="border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar"
            className="flex w-full items-center justify-center rounded-xl border border-rose-200 bg-rose-50 py-3 text-rose-600 transition hover:bg-rose-100"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div
        className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? "md:ml-64" : "md:ml-20"}`}
      >
        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between overflow-visible border-b border-slate-200 bg-white px-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              SAGA ARSIP
            </p>
            <p className="text-xs text-slate-500">Manajemen dokumen legal</p>
          </div>
          <div
            ref={profileMenuRef}
            className="relative flex items-center gap-3"
          >
            {user?.role === "admin" && (
              <>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500"
                >
                  <Plus className="h-4 w-4" /> Unggah
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTrashOpen(true);
                    fetchTrashedDocuments();
                  }}
                  title="Arsip Terhapus"
                  className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-amber-700 transition hover:bg-amber-100 shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
              aria-label="Buka profil"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500"
            >
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </button>

            {isProfileMenuOpen && (
              <div
                className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-200 bg-white py-2 text-slate-800 shadow-xl"
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
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-emerald-600"
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
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-emerald-600"
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
            <div className="border-b border-slate-200 pb-5">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-600"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Kembali ke Dashboard
              </button>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <FileText
                  className="h-7 w-7 text-emerald-600"
                  aria-hidden="true"
                />
                Manajemen Kontrak &amp; MoU
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Kelompokkan dan telusuri dokumen berdasarkan kategori hukum.
              </p>
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
              {(["all", "contract", "mou"] as DocumentTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabChange(tab)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition ${
                    activeTab === tab
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {tab === "all"
                    ? "Semua Dokumen"
                    : tab === "mou"
                      ? "MoU"
                      : "Kontrak"}
                </button>
              ))}
            </div>

            <div
              className="flex flex-wrap items-center gap-2"
              aria-label="Filter status dokumen"
            >
              <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status:
              </span>
              <button
                type="button"
                onClick={() => handleStatusFilter(null)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  !statusFilter
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Semua
              </button>
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => handleStatusFilter(filter.value)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    statusFilter === filter.value
                      ? statusClasses[filter.value]
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {activeFilterLabel && (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
                <span>
                  Filter aktif: <strong>{activeFilterLabel}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                >
                  Reset filter
                </button>
              </div>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {loading ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Memuat data kontrak dan MoU...
                </div>
              ) : error ? (
                <div className="p-10 text-center text-sm text-rose-600">
                  {error}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="p-4">Nomor / Judul Dokumen</th>
                        <th className="p-4">Tipe</th>
                        <th className="p-4">Pihak Rekanan</th>
                        <th className="p-4">Masa Berlaku</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredDocuments.length > 0 ? (
                        filteredDocuments.map((document) => {
                          const status = document.status.toLowerCase();
                          return (
                            <tr
                              key={document.id}
                              className="transition hover:bg-slate-50"
                            >
                              <td className="p-4">
                                <div className="font-semibold text-slate-900">
                                  {document.document_name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {document.document_number}
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                                  {document.document_type}
                                </span>
                              </td>
                              <td className="p-4 text-slate-700">
                                {document.partner}
                              </td>
                              <td className="p-4 text-xs text-slate-500">
                                {document.effective_date} s/d{" "}
                                {document.expiry_date}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses[status] || statusClasses.draft}`}
                                >
                                  {document.status.toUpperCase()}
                                </span>
                              </td>

                              {/* KOLOM AKSI (Hanya ikon untuk Detail, serta Edit & Hapus khusus Admin) */}
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  {/* Tombol Detail (Semua User) */}
                                  <Link
                                    href={`/documents/${document.id}`}
                                    title="Detail Dokumen"
                                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  >
                                    <Eye
                                      className="h-4 w-4"
                                      aria-hidden="true"
                                    />
                                  </Link>

                                  {/* Tombol Edit & Hapus (Khusus Admin) */}
                                  {user?.role === "admin" && (
                                    <>
                                      <Link
                                        href={`/documents/${document.id}/edit`}
                                        title="Edit Dokumen"
                                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                      >
                                        <Edit
                                          className="h-4 w-4"
                                          aria-hidden="true"
                                        />
                                      </Link>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteDocument(document.id)
                                        }
                                        title="Hapus Dokumen"
                                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      >
                                        <Trash2
                                          className="h-4 w-4"
                                          aria-hidden="true"
                                        />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-12 text-center">
                            <div className="mx-auto flex max-w-sm flex-col items-center justify-center space-y-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                                <FileText
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                />
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-900">
                                  Tidak ada dokumen ditemukan
                                </p>
                                <p className="text-xs text-slate-500">
                                  Belum ada data kontrak atau MoU yang sesuai
                                  dengan filter atau tab yang kamu pilih saat
                                  ini.
                                </p>
                              </div>
                              {activeFilterLabel && (
                                <button
                                  type="button"
                                  onClick={handleResetFilter}
                                  className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                  Reset Filter
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>

        <UploadDocumentModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={fetchDocuments}
          secureMode={isSecureMode}
        />

        {isTrashOpen && user?.role === "admin" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Arsip Terhapus
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Pulihkan dokumen yang sebelumnya dihapus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTrashOpen(false)}
                  aria-label="Tutup arsip terhapus"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  &times;
                </button>
              </div>
              <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-6">
                {loadingTrash ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Memuat arsip terhapus...
                  </p>
                ) : trashError ? (
                  <p className="py-8 text-center text-sm text-rose-600">
                    {trashError}
                  </p>
                ) : trashedDocuments.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Tempat sampah kosong.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {trashedDocuments.map((document) => (
                      <div
                        key={document.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {document.document_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {document.document_number} &middot; Dihapus{" "}
                            {document.deleted_at
                              ? new Date(
                                  document.deleted_at,
                                ).toLocaleDateString("id-ID")
                              : "-"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRestore(document.id)}
                          disabled={restoringId === document.id}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          {restoringId === document.id
                            ? "Memulihkan..."
                            : "Pulihkan"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContractsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-emerald-600">
          Memuat halaman...
        </div>
      }
    >
      <ContractsContent />
    </Suspense>
  );
}
