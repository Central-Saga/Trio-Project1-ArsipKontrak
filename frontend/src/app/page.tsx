"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, CheckCircle2, FileText, Folder, LayoutDashboard, LogOut, Menu } from "lucide-react";
import api from "@/lib/api";
import { DocumentItem } from "@/types/document";
import UploadDocumentModal from "@/components/UploadDocumentModal";

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface EditFormData {
  document_number: string;
  document_name: string;
  document_type: string;
  partner: string;
  document_date: string;
  effective_date: string;
  expiry_date: string;
  status: string;
  description: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isSecureMode, setIsSecureMode] = useState<boolean>(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>("");
  const [deletingDocument, setDeletingDocument] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    document_number: "",
    document_name: "",
    document_type: "contract",
    partner: "",
    document_date: "",
    effective_date: "",
    expiry_date: "",
    status: "draft",
    description: "",
  });

  const fetchDocuments = useCallback(async (query = "") => {
    try {
      setLoading(true);
      const response = await api.get("/documents", { params: { search: query } });
      const data = response.data?.data || response.data || [];
      setDocuments(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Gagal memuat dokumen");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchDocuments(query);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user_data") || localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        // fallback
      }
    }

    fetchDocuments();
  }, [router, fetchDocuments]);

  useEffect(() => {
    const handleOpenUploadModal = () => {
      if (currentUser?.role === "admin") {
        setShowUploadModal(true);
      }
    };
    window.addEventListener("open-upload-modal", handleOpenUploadModal);
    return () => window.removeEventListener("open-upload-modal", handleOpenUploadModal);
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/logout");
    } catch {
      // lanjut bersihkan storage
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      setShowLogoutModal(false);
      setLoggingOut(false);
      router.push("/login");
    }
  };

  const handleEdit = (document: DocumentItem) => {
    if (currentUser?.role !== "admin") return;

    setEditingDocument(document);
    setEditError("");
    setEditForm({
      document_number: document.document_number,
      document_name: document.document_name,
      document_type: document.document_type,
      partner: document.partner,
      document_date: document.document_date,
      effective_date: document.effective_date,
      expiry_date: document.expiry_date,
      status: document.status,
      description: document.description || "",
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditForm((previous) => ({ ...previous, [e.target.name]: e.target.value }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== "admin" || !editingDocument) return;

    setSavingEdit(true);
    setEditError("");
    try {
      await api.put(`/documents/${editingDocument.id}`, editForm);
      setEditingDocument(null);
      await fetchDocuments(searchQuery);
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Gagal memperbarui dokumen.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = (document: DocumentItem) => {
    if (currentUser?.role !== "admin") return;

    setDeletingDocument(document);
    setError(null);
  };

  const confirmDelete = async () => {
    if (currentUser?.role !== "admin" || !deletingDocument) return;

    setDeleting(true);
    try {
      await api.delete(`/documents/${deletingDocument.id}`);
      setDeletingDocument(null);
      await fetchDocuments(searchQuery);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menghapus dokumen.");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      draft: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      expired: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      terminated: "bg-slate-800 text-slate-400 border-slate-700",
    };
    const dots: Record<string, string> = {
      active: "bg-emerald-400",
      draft: "bg-amber-400",
      expired: "bg-rose-400",
      terminated: "bg-slate-500",
    };
    const normalizedStatus = status.toLowerCase();
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colors[normalizedStatus] || colors.draft}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dots[normalizedStatus] || dots.draft} ${normalizedStatus === "active" ? "animate-pulse" : ""}`} />
        {status.toUpperCase()}
      </span>
    );
  };

  const getRoleBadge = (role?: string) => {
    const roleLabels: Record<string, string> = {
      admin: "Administrator",
      project_manager: "Project Manager",
      document_controller: "Document Controller",
      viewer: "Viewer",
    };
    return roleLabels[role || ""] || role || "Pengguna";
  };

  const activeDocuments = documents.filter((doc) => doc.status.toLowerCase() === "active").length;
  const draftDocuments = documents.filter((doc) => doc.status.toLowerCase() === "draft").length;
  const contractDocuments = documents.filter((doc) => doc.document_type.toLowerCase() === "contract").length;
  const canManageDocuments = currentUser?.role === "admin";

  return (
    <main className="min-h-screen bg-transparent text-slate-100 flex font-sans">
      <aside className={`bg-[#07150e]/80 backdrop-blur-xl border-r border-emerald-500/20 flex flex-col justify-between p-4 hidden md:flex shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-64" : "w-20"}`}>
        <div>
          <div className={`flex items-center mb-8 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
            {isSidebarOpen && (
              <div className="flex items-center gap-2 px-2 min-w-0">
                <div className="bg-emerald-500 text-slate-950 font-bold p-1.5 rounded-lg flex items-center justify-center shrink-0">
                  <Folder className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="font-bold tracking-wider text-white truncate">SAGA ARSIP</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
              aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
              title={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <nav className="space-y-1 text-sm" aria-label="Navigasi utama">
            <a href="#" title="Dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 ${isSidebarOpen ? "" : "justify-center"}`}>
              <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden="true" />{isSidebarOpen && <span>Dashboard</span>}
            </a>
            <a href="/contracts" title="Kontrak & MoU" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition ${isSidebarOpen ? "" : "justify-center"}`}>
              <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />{isSidebarOpen && <span>Kontrak &amp; MoU</span>}
            </a>
            <a href="/statistics" title="Ringkasan" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition ${isSidebarOpen ? "" : "justify-center"}`}>
              <BarChart3 className="h-5 w-5 shrink-0" aria-hidden="true" />{isSidebarOpen && <span>Ringkasan</span>}
            </a>
          </nav>
        </div>
        <div className="border-t border-emerald-500/20 pt-4 text-sm">
          <button onClick={() => setShowLogoutModal(true)} title="Keluar" aria-label="Keluar" className={`w-full flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-left text-rose-400 transition hover:bg-rose-500/20 ${isSidebarOpen ? "" : "justify-center"}`}>
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />{isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-visible">
        <header className="relative z-50 h-16 overflow-visible bg-[#0b1f14]/65 backdrop-blur-md border-b border-emerald-500/20 flex items-center justify-between px-6 shrink-0">
          <div className="hidden sm:block w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Cari nomor dokumen atau rekanan..."
              className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 px-4 py-2 text-sm text-slate-100 placeholder:text-emerald-300/60 transition focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <button
              type="button"
              onClick={() => setIsSecureMode((isSecure) => !isSecure)}
              aria-pressed={isSecureMode}
              title="Klik untuk mengubah mode keamanan"
              className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                isSecureMode
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 focus:ring-emerald-400/60"
                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 focus:ring-yellow-400/60"
              }`}
            >
              {isSecureMode ? "Secure Mode Active" : "Secure Mode Inactive"}
            </button>
            <div className="relative overflow-visible" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((isOpen) => !isOpen)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
                aria-label="Buka menu profil"
                className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs hover:bg-emerald-500 transition shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              >
                {currentUser?.name?.slice(0, 2).toUpperCase() || "AD"}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 z-[99] mt-2 w-56 rounded-2xl border border-emerald-500/20 bg-[#0b1f14]/95 py-2 text-emerald-100 shadow-2xl backdrop-blur-xl" role="menu">
                  <div className="mb-1 border-b border-emerald-500/10 px-4 py-2">
                    <p className="text-xs text-emerald-400/60">Masuk sebagai</p>
                    <p className="text-sm font-semibold truncate">{currentUser?.name || "Administrator"}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-emerald-100/80 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                  >
                    Profil Saya
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push("/contracts");
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-emerald-100/80 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                  >
                    Kontrak &amp; MoU
                  </button>
                  <div className="my-1 border-t border-emerald-500/10" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

      <div className="p-6 md:p-8 flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Dashboard & User Profile */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard Arsip</h1>
            <p className="text-xs text-slate-400 mt-1">Kelola dan telusuri seluruh dokumen legal dengan enkripsi AES-256.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {currentUser && (
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-200">{currentUser.name}</div>
                <div className="text-xs text-emerald-400 font-medium">{getRoleBadge(currentUser.role)}</div>
              </div>
            )}

            {canManageDocuments && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("open-upload-modal"))}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-900/20 transition"
              >
                + Unggah Dokumen Baru
              </button>
            )}
          </div>
        </div>

        {/* Ringkasan Dokumen */}
        <div id="statistik" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0b1f14]/60 p-5 shadow-2xl backdrop-blur-md">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Arsip</p>
                <p className="mt-1 text-3xl font-extrabold text-white">{documents.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <Folder className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0b1f14]/60 p-5 shadow-2xl backdrop-blur-md">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Dokumen Aktif</p>
                <p className="mt-1 text-3xl font-extrabold text-white">{activeDocuments}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0b1f14]/60 p-5 shadow-2xl backdrop-blur-md">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Kontrak</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-white">{contractDocuments}</p>
                  <span className="text-xs font-medium text-amber-400">({draftDocuments} draft)</span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Dokumen */}
        <div id="arsip" className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-semibold text-slate-200">Daftar Arsip Dokumen</h2>
            <span className="text-xs text-slate-500">Total: {documents.length} Dokumen</span>
          </div>

          {loading ? (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0b0f19]/80 p-8 text-center text-sm text-slate-400 shadow-2xl backdrop-blur-xl">Memuat data dokumen dari server...</div>
          ) : error ? (
            <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-[#0b0f19]/80 p-8 text-center text-sm text-rose-400 shadow-2xl backdrop-blur-xl">Terjadi kesalahan: {error}</div>
          ) : documents.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0b0f19]/80 p-8 text-center text-sm text-slate-500 shadow-2xl backdrop-blur-xl">Belum ada arsip dokumen yang tersimpan di database.</div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0b0f19]/80 p-3.5 shadow-2xl backdrop-blur-xl transition hover:border-emerald-400/40 hover:bg-[#0b0f19]/90">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-600/15 blur-3xl" />
                  <div className="relative z-10 grid grid-cols-1 items-center gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto_auto]">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-200 truncate">{doc.document_name}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                        <svg className="h-3 w-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 4.5h7l3 3v12H7a2 2 0 01-2-2v-11a2 2 0 012-2zM14 4.5v4h4" />
                        </svg>
                        <span className="truncate">{doc.document_number}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Tipe</p>
                      <p className="text-xs capitalize text-slate-300 mt-0.5">{doc.document_type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Pihak Rekanan</p>
                      <p className="text-xs text-slate-300 mt-0.5 truncate">{doc.partner}</p>
                    </div>
                    <div className="text-xs text-slate-400">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Masa Berlaku</p>
                      <p className="mt-0.5 whitespace-nowrap text-[11px]">{doc.effective_date} - {doc.expiry_date}</p>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-1.5">
                      {getStatusBadge(doc.status)}
                      <div className="flex flex-wrap gap-1.5 justify-start md:justify-end">
                        <button
                          onClick={() => router.push(`/documents/${doc.id}`)}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-[11px] rounded-lg border border-emerald-500/20 transition"
                        >
                          Detail
                        </button>
                        {canManageDocuments && (
                          <>
                            <button
                              onClick={() => handleEdit(doc)}
                              className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-medium text-[11px] rounded-lg border border-sky-500/20 transition"
                              title="Edit Dokumen"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(doc)}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium text-[11px] rounded-lg border border-rose-500/20 transition"
                              title="Hapus Dokumen"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-emerald-500/30 bg-[#0b1f14]/90 text-slate-100 shadow-[0_0_50px_rgba(4,47,27,0.5)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-emerald-500/10 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-white">Edit Metadata Dokumen</h3>
                <p className="text-xs text-slate-500 mt-1">Perbarui informasi arsip tanpa mengganti berkas versi.</p>
              </div>
              <button type="button" onClick={() => setEditingDocument(null)} className="text-slate-500 hover:text-slate-200 text-xl leading-none">&times;</button>
            </div>

            {editError && <div className="mx-6 mt-5 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">{editError}</div>}

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nomor Dokumen</label>
                  <input name="document_number" required value={editForm.document_number} onChange={handleEditChange} className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tipe Dokumen</label>
                  <select name="document_type" value={editForm.document_type} onChange={handleEditChange} className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none">
                    <option value="contract">Contract</option>
                    <option value="mou">MoU</option>
                    <option value="addendum">Addendum</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Dokumen</label>
                <input name="document_name" required value={editForm.document_name} onChange={handleEditChange} className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 px-3 py-2 text-sm text-slate-100 placeholder:text-emerald-300/60 focus:border-emerald-400 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Pihak Rekanan</label>
                <input name="partner" required value={editForm.partner} onChange={handleEditChange} className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 px-3 py-2 text-sm text-slate-100 placeholder:text-emerald-300/60 focus:border-emerald-400 focus:outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["document_date", "effective_date", "expiry_date"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{field === "document_date" ? "Tanggal Dokumen" : field === "effective_date" ? "Tanggal Efektif" : "Tanggal Berakhir"}</label>
                    <input type="date" name={field} required value={editForm[field]} onChange={handleEditChange} className="w-full rounded-xl border border-emerald-500/30 bg-[#07140c]/90 px-4 py-3 text-sm text-white shadow-inner transition focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                <select name="status" value={editForm.status} onChange={handleEditChange} className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Deskripsi</label>
                <textarea name="description" rows={3} value={editForm.description} onChange={handleEditChange} className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 px-3 py-2 text-sm text-slate-100 placeholder:text-emerald-300/60 focus:border-emerald-400 focus:outline-none" />
              </div>

              <div className="flex justify-end gap-2 border-t border-emerald-500/10 pt-4">
                <button type="button" disabled={savingEdit} onClick={() => setEditingDocument(null)} className="rounded-xl border border-emerald-500/20 bg-emerald-950/40 px-4 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-900/40">Batal</button>
                <button type="submit" disabled={savingEdit} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-950/50 transition hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50">{savingEdit ? "Menyimpan..." : "Simpan Perubahan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload Dokumen */}
      <UploadDocumentModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onSuccess={() => fetchDocuments(searchQuery)} secureMode={isSecureMode} />

      {/* Modal Konfirmasi Hapus */}
      {deletingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/20 bg-[#0b1f14]/95 p-6 text-center text-slate-100 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Konfirmasi Hapus</h3>
                <p className="text-xs text-slate-500">Dokumen dan seluruh riwayat versinya akan dihapus.</p>
              </div>
            </div>

            <p className="break-words rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-3 text-sm text-emerald-100/80">
              {deletingDocument.document_name}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeletingDocument(null)}
                className="rounded-xl border border-emerald-500/20 bg-emerald-950/40 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-900/40"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/20 bg-[#0b1f14]/95 p-6 text-center text-slate-100 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Konfirmasi Keluar</h3>
                <p className="text-xs text-slate-500">Apakah Anda yakin ingin keluar dari sistem?</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="rounded-xl border border-emerald-500/20 bg-emerald-950/40 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-900/40"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={confirmLogout}
                className="px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm disabled:opacity-50"
              >
                {loggingOut ? "Mengeluarkan..." : "Ya, Keluar"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
    </main>
  );
}
