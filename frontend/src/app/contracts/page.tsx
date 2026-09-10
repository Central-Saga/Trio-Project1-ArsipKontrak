"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BarChart3, Eye, FileText, Folder, LayoutDashboard, LogOut, Menu, Plus } from "lucide-react";
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
  const [isSecureMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/documents");
      setDocuments(response.data?.data || response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat dokumen kontrak dan MoU.");
    } finally {
      setLoading(false);
    }
  }, []);

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
    const handleOpenUploadModal = () => setIsUploadOpen(true);
    window.addEventListener("open-upload-modal", handleOpenUploadModal);
    return () => window.removeEventListener("open-upload-modal", handleOpenUploadModal);
  }, []);

  const filteredDocuments = documents.filter((document) => {
    const matchesType = activeTab === "all" || document.document_type.toLowerCase() === activeTab;
    const matchesStatus = !statusFilter || document.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesType && matchesStatus;
  });

  const activeFilterLabel = [
    activeTab !== "all" ? (activeTab === "mou" ? "MoU" : "Kontrak") : null,
    statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : null,
  ].filter(Boolean).join(" - ");

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
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col justify-between border-r border-emerald-500/20 bg-slate-900/90 p-4 backdrop-blur-xl transition-all duration-300 ease-in-out md:flex ${isSidebarOpen ? "w-64" : "w-20"}`}>
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
        <header className="relative z-50 flex h-16 shrink-0 items-center justify-between overflow-visible border-b border-slate-800 bg-slate-900/70 px-6 backdrop-blur-xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">SAGA ARSIP</p>
            <p className="text-xs text-slate-500">Manajemen dokumen legal</p>
          </div>
          <div ref={profileMenuRef} className="relative flex items-center gap-3">
            <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 sm:inline-flex">Secure Mode Active</span>
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
              <div className="absolute right-0 top-11 z-[99] w-64 rounded-2xl border border-emerald-500/30 bg-slate-900 py-2 text-white shadow-2xl backdrop-blur-xl" role="menu">
                <div className="border-b border-slate-800 px-4 py-3">
                  <p className="text-xs text-slate-400">Masuk sebagai</p>
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

        <main className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl space-y-6">
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
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-upload-modal"))}
              className="inline-flex items-center gap-2 self-start rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 transition hover:bg-emerald-500 sm:self-auto"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Unggah Dokumen Baru
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-4">
          {(["all", "contract", "mou"] as DocumentTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-inner"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "all" ? "Semua Dokumen" : tab === "mou" ? "MoU" : "Kontrak"}
            </button>
          ))}
        </div>

        {activeFilterLabel && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <span>Filter aktif: <strong>{activeFilterLabel}</strong></span>
            <button type="button" onClick={() => router.push("/contracts")} className="text-xs font-semibold text-emerald-400 hover:text-white">Reset filter</button>
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
                  <tr className="border-b border-emerald-500/20 bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                        <tr key={document.id} className="transition hover:bg-slate-900/30">
                          <td className="p-4">
                            <div className="font-semibold text-white">{document.document_name}</div>
                            <div className="text-xs text-emerald-400/80">{document.document_number}</div>
                          </td>
                          <td className="p-4">
                            <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium capitalize text-slate-300">
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
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-emerald-500 hover:bg-emerald-600 hover:text-white"
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
      </div>
    </div>
  );
}
