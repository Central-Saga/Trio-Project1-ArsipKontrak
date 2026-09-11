"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BarChart3, Eye, FileText, Folder, LayoutDashboard, LogOut, Menu, Plus, RotateCcw, Trash2 } from "lucide-react";
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

export default function ContractsPage() {
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
      setError(err.response?.data?.message || "Gagal memuat dokumen kontrak dan MoU.");
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
      setTrashError(err.response?.data?.message || "Gagal memuat arsip terhapus.");
    } finally {
      setLoadingTrash(false);
    }
  }, [user]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user_data") || localStorage.getItem("user");
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
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
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
    return () => window.removeEventListener("open-upload-modal", handleOpenUploadModal);
  }, [user]);

  const filteredDocuments = documents.filter((document) => {
    const matchesType = activeTab === "all" || document.document_type.toLowerCase() === activeTab;
    const matchesStatus = !statusFilter || document.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesType && matchesStatus;
  });

  const activeFilterLabel = [
    activeTab !== "all" ? (activeTab === "mou" ? "MoU" : "Kontrak") : null,
    statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : null,
  ].filter(Boolean).join(" - ");

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
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    draft: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    expired: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    terminated: "border-slate-700 bg-slate-800 text-slate-400",
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
    <div className="flex min-h-screen bg-transparent text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col justify-between border-r border-emerald-500/20 bg-[#07150e]/80 p-4 backdrop-blur-xl transition-all duration-300 ease-in-out md:flex ${isSidebarOpen ? "w-64" : "w-20"}`}>
        <div>
          <div className={`mb-8 flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
            {isSidebarOpen && (
              <div className="flex min-w-0 items-center gap-2 px-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
                  <Folder className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="truncate font-bold tracking-wider text-white">SAGA ARSIP</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
              aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav className="space-y-1 text-sm" aria-label="Navigasi utama">
            <button
              type="button"
              onClick={() => router.push("/")}
              title="Dashboard"
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 ${isSidebarOpen ? "" : "justify-center"}`}
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden="true" />
              {isSidebarOpen && <span>Dashboard</span>}
            </button>
            <button
              type="button"
              onClick={() => router.push("/contracts")}
              title="Kontrak & MoU"
              className={`flex w-full items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-left font-medium text-emerald-400 ${isSidebarOpen ? "" : "justify-center"}`}
            >
              <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
              {isSidebarOpen && <span>Kontrak &amp; MoU</span>}
            </button>
            <button
              type="button"
              onClick={() => router.push("/statistics")}
              title="Ringkasan"
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 ${isSidebarOpen ? "" : "justify-center"}`}
            >
              <BarChart3 className="h-5 w-5 shrink-0" aria-hidden="true" />
              {isSidebarOpen && <span>Ringkasan</span>}
            </button>
          </nav>
        </div>

        <div className="border-t border-emerald-500/20 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar"
            className={`flex w-full items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-3 text-left text-rose-400 transition hover:bg-rose-500/20 ${isSidebarOpen ? "" : "justify-center"}`}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
        <header className="relative z-50 flex h-16 shrink-0 items-center justify-between overflow-visible border-b border-emerald-500/20 bg-[#0b1f14]/65 px-6 backdrop-blur-md">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">SAGA ARSIP</p>
            <p className="text-xs text-slate-500">Manajemen dokumen legal</p>
          </div>
          <div ref={profileMenuRef} className="relative flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
              aria-label="Buka profil"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white transition hover:bg-emerald-500"
            >
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </button>
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-11 z-[99] w-56 rounded-2xl border border-emerald-500/20 bg-[#0b1f14]/95 py-2 text-emerald-100 shadow-2xl backdrop-blur-xl" role="menu">
                <div className="mb-1 border-b border-emerald-500/10 px-4 py-3">
                  <p className="text-xs text-emerald-400/60">Masuk sebagai</p>
                  <p className="truncate text-sm font-bold">{user?.name || "Administrator"}</p>
                </div>
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); router.push("/profile"); }} className="w-full px-4 py-2.5 text-left text-sm text-slate-300 transition hover:bg-emerald-500/10 hover:text-emerald-400">Profil Saya</button>
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); router.push("/contracts"); }} className="w-full px-4 py-2.5 text-left text-sm text-slate-300 transition hover:bg-emerald-500/10 hover:text-emerald-400">Kontrak &amp; MoU</button>
                <div className="mt-1 border-t border-slate-800 pt-1">
                  <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} className="w-full px-4 py-2.5 text-left text-sm font-medium text-rose-400 transition hover:bg-rose-500/10">Keluar</button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mb-3 flex items-center gap-2 text-sm text-slate-400 transition hover:text-emerald-400"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Kembali ke Dashboard
            </button>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <FileText className="h-7 w-7 text-emerald-400" aria-hidden="true" />
              Manajemen Kontrak &amp; MoU
            </h1>
            <p className="mt-1 text-sm text-slate-400">Kelompokkan dan telusuri dokumen berdasarkan kategori hukum.</p>
          </div>

          {user?.role === "admin" && (
            <div className="flex flex-wrap gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("open-upload-modal"))}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 transition hover:bg-emerald-500"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Unggah Dokumen Baru
              </button>
              <button
                type="button"
                onClick={() => { setIsTrashOpen(true); fetchTrashedDocuments(); }}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Arsip Terhapus
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-4">
          {(["all", "contract", "mou"] as DocumentTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-inner"
                  : "border-emerald-500/20 bg-[#0b1f14]/60 text-emerald-300/60 hover:text-emerald-200"
              }`}
            >
              {tab === "all" ? "Semua Dokumen" : tab === "mou" ? "MoU" : "Kontrak"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2" aria-label="Filter status dokumen">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</span>
          <button
            type="button"
            onClick={() => handleStatusFilter(null)}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
              !statusFilter
                ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                : "border-emerald-500/20 bg-[#0b1f14]/60 text-slate-400 hover:text-emerald-200"
            }`}
          >
            Semua
          </button>
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => handleStatusFilter(filter.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                statusFilter === filter.value
                  ? statusClasses[filter.value]
                  : "border-emerald-500/20 bg-[#0b1f14]/60 text-slate-400 hover:text-emerald-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {activeFilterLabel && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <span>Filter aktif: <strong>{activeFilterLabel}</strong></span>
            <button type="button" onClick={handleResetFilter} className="text-xs font-semibold text-emerald-400 hover:text-white">Reset filter</button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-950/20 shadow-2xl backdrop-blur-xl">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">Memuat data kontrak dan MoU...</div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-rose-400">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead>
                  <tr className="border-b border-emerald-500/20 bg-[#0b1f14]/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="p-4">Nomor / Judul Dokumen</th>
                    <th className="p-4">Tipe</th>
                    <th className="p-4">Pihak Rekanan</th>
                    <th className="p-4">Masa Berlaku</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/10 text-sm">
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((document) => {
                      const status = document.status.toLowerCase();
                      return (
                        <tr key={document.id} className="transition hover:bg-emerald-500/5">
                          <td className="p-4">
                            <div className="font-semibold text-white">{document.document_name}</div>
                            <div className="text-xs text-emerald-400/80">{document.document_number}</div>
                          </td>
                          <td className="p-4">
                            <span className="rounded-lg border border-emerald-500/20 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium capitalize text-emerald-100/80">
                              {document.document_type}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300">{document.partner}</td>
                          <td className="p-4 text-xs text-slate-400">
                            {document.effective_date} s/d {document.expiry_date}
                          </td>
                          <td className="p-4">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status] || statusClasses.draft}`}>
                              {document.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => router.push(`/documents/${document.id}`)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-600 hover:text-white"
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-500">
                        Tidak ada dokumen untuk kategori ini.
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-hidden rounded-3xl border border-amber-500/30 bg-[#0b1f14]/95 text-slate-100 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-amber-500/20 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Arsip Terhapus</h2>
                  <p className="mt-1 text-xs text-slate-400">Pulihkan dokumen yang sebelumnya dihapus.</p>
                </div>
                <button type="button" onClick={() => setIsTrashOpen(false)} aria-label="Tutup arsip terhapus" className="p-1 text-xl leading-none text-slate-400 hover:text-white">&times;</button>
              </div>
              <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-6">
                {loadingTrash ? (
                  <p className="py-8 text-center text-sm text-slate-400">Memuat arsip terhapus...</p>
                ) : trashError ? (
                  <p className="py-8 text-center text-sm text-rose-400">{trashError}</p>
                ) : trashedDocuments.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Tempat sampah kosong.</p>
                ) : (
                  <div className="space-y-3">
                    {trashedDocuments.map((document) => (
                      <div key={document.id} className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{document.document_name}</p>
                          <p className="mt-1 text-xs text-slate-400">{document.document_number} &middot; Dihapus {document.deleted_at ? new Date(document.deleted_at).toLocaleDateString("id-ID") : "-"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRestore(document.id)}
                          disabled={restoringId === document.id}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          {restoringId === document.id ? "Memulihkan..." : "Pulihkan"}
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
