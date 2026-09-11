"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, FileText, Folder, LayoutDashboard, LogOut, Menu, Plus, ShieldAlert } from "lucide-react";
import api from "@/lib/api";
import { DocumentItem } from "@/types/document";
import DocumentStatsChart from "@/components/DocumentStatsChart";
import DocumentStatusPieChart from "@/components/DocumentStatusPieChart";
import UploadDocumentModal from "@/components/UploadDocumentModal";

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
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
      setError(err.response?.data?.message || "Gagal memuat statistik arsip.");
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

  const totalArsip = documents.length;
  const activeCount = documents.filter((document) => document.status.toLowerCase() === "active").length;
  const contractCount = documents.filter((document) => document.document_type.toLowerCase() === "contract").length;
  const mouCount = documents.filter((document) => document.document_type.toLowerCase() === "mou").length;
  const expiredCount = documents.filter((document) => document.status.toLowerCase() === "expired").length;
  const draftCount = documents.filter((document) => document.status.toLowerCase() === "draft").length;
  const terminatedCount = documents.filter((document) => document.status.toLowerCase() === "terminated").length;

  const cards = [
    { label: "Total Arsip", value: totalArsip, icon: Folder, accent: "emerald", href: "/contracts" },
    { label: "Total Kontrak", value: contractCount, icon: ShieldAlert, accent: "amber", href: "/contracts?type=contract" },
    { label: "Total MoU", value: mouCount, icon: FileText, accent: "emerald", href: "/contracts?type=mou" },
  ];

  const accentClasses: Record<string, { glow: string; icon: string }> = {
    emerald: { glow: "bg-emerald-500/10", icon: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
    cyan: { glow: "bg-cyan-500/10", icon: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400" },
    amber: { glow: "bg-amber-500/10", icon: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  };

  const statusCards = [
    { label: "Dokumen Aktif", value: activeCount, href: "/contracts?status=active", classes: "border-emerald-500/30 hover:border-emerald-500", textClass: "text-emerald-400" },
    { label: "Draft", value: draftCount, href: "/contracts?status=draft", classes: "border-amber-500/30 hover:border-amber-500", textClass: "text-amber-400" },
    { label: "Expired", value: expiredCount, href: "/contracts?status=expired", classes: "border-rose-500/30 hover:border-rose-500", textClass: "text-rose-400" },
    { label: "Terminated", value: terminatedCount, href: "/contracts?status=terminated", classes: "border-slate-600/30 hover:border-slate-400", textClass: "text-slate-400" },
  ];

  return (
    <div className="flex min-h-screen bg-transparent text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col justify-between border-r border-emerald-500/20 bg-[#07150e]/80 p-4 backdrop-blur-xl transition-all duration-300 ease-in-out md:flex ${isSidebarOpen ? "w-64" : "w-20"}`}>
        <div>
          <div className={`mb-8 flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
            {isSidebarOpen && (
              <div className="flex min-w-0 items-center gap-2 px-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-slate-950"><Folder className="h-5 w-5" aria-hidden="true" /></div>
                <span className="truncate font-bold tracking-wider text-white">SAGA ARSIP</span>
              </div>
            )}
            <button type="button" onClick={() => setIsSidebarOpen((isOpen) => !isOpen)} aria-label="Toggle sidebar" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"><Menu className="h-5 w-5" aria-hidden="true" /></button>
          </div>
          <nav className="space-y-1 text-sm" aria-label="Navigasi utama">
            <button type="button" onClick={() => router.push("/")} title="Dashboard" className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 ${isSidebarOpen ? "" : "justify-center"}`}><LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden="true" />{isSidebarOpen && <span>Dashboard</span>}</button>
            <button type="button" onClick={() => router.push("/contracts")} title="Kontrak & MoU" className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 ${isSidebarOpen ? "" : "justify-center"}`}><FileText className="h-5 w-5 shrink-0" aria-hidden="true" />{isSidebarOpen && <span>Kontrak &amp; MoU</span>}</button>
            <button type="button" onClick={() => router.push("/statistics")} title="Ringkasan" className={`flex w-full items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-left font-medium text-emerald-400 ${isSidebarOpen ? "" : "justify-center"}`}><BarChart3 className="h-5 w-5 shrink-0" aria-hidden="true" />{isSidebarOpen && <span>Ringkasan</span>}</button>
          </nav>
        </div>
        <div className="border-t border-emerald-500/20 pt-4"><button type="button" onClick={handleLogout} title="Keluar" className={`flex w-full items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-3 text-left text-rose-400 transition hover:bg-rose-500/20 ${isSidebarOpen ? "" : "justify-center"}`}><LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />{isSidebarOpen && <span>Keluar</span>}</button></div>
      </aside>

      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
        <header className="relative z-50 flex h-16 shrink-0 items-center justify-between overflow-visible border-b border-emerald-500/20 bg-[#0b1f14]/65 px-6 backdrop-blur-md">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">SAGA ARSIP</p><p className="text-xs text-slate-500">Ringkasan dan statistik arsip</p></div>
          <div ref={profileMenuRef} className="relative">
            <button type="button" onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)} aria-expanded={isProfileMenuOpen} aria-haspopup="menu" aria-label="Buka profil" className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white transition hover:bg-emerald-500">{user?.name?.slice(0, 2).toUpperCase() || "AD"}</button>
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-11 z-[99] w-56 rounded-2xl border border-emerald-500/20 bg-[#0b1f14]/95 py-2 text-emerald-100 shadow-2xl backdrop-blur-xl" role="menu">
                <div className="mb-1 border-b border-emerald-500/10 px-4 py-3"><p className="text-xs text-emerald-400/60">Masuk sebagai</p><p className="truncate text-sm font-bold text-white">{user?.name || "Administrator"}</p></div>
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); router.push("/profile"); }} className="w-full px-4 py-2.5 text-left text-sm text-slate-300 transition hover:bg-emerald-500/10 hover:text-emerald-400">Profil Saya</button>
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); router.push("/contracts"); }} className="w-full px-4 py-2.5 text-left text-sm text-slate-300 transition hover:bg-emerald-500/10 hover:text-emerald-400">Kontrak &amp; MoU</button>
                <div className="mt-1 border-t border-slate-800 pt-1"><button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} className="w-full px-4 py-2.5 text-left text-sm font-medium text-rose-400 transition hover:bg-rose-500/10">Keluar</button></div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 border-b border-emerald-500/20 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="mb-3 flex items-center gap-2 text-sm text-slate-400 transition hover:text-emerald-400"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Kembali ke Dashboard
                </button>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><BarChart3 className="h-7 w-7 text-emerald-400" aria-hidden="true" />Ringkasan &amp; Statistik Arsip</h1>
                <p className="mt-1 text-sm text-slate-400">Analisis status dokumen, kontrak, dan MoU perusahaan.</p>
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

            {loading ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-10 text-center text-sm text-slate-400 backdrop-blur-xl">Memuat statistik...</div> : error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-10 text-center text-sm text-rose-400">{error}</div> : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {cards.map((card) => {
                    const Icon = card.icon;
                    const accent = accentClasses[card.accent];
                    return <button key={card.label} type="button" onClick={() => router.push(card.href)} className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0b1f14]/60 p-5 text-left shadow-2xl backdrop-blur-md transition hover:border-emerald-400/50 hover:bg-[#0b1f14]/80"><div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl ${accent.glow}`} /><div className="relative z-10 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p><h2 className="mt-2 text-3xl font-extrabold text-white">{card.value}</h2><p className="mt-2 text-xs text-slate-500">Lihat dokumen terkait</p></div><div className={`flex h-12 w-12 items-center justify-center rounded-xl border transition group-hover:scale-110 ${accent.icon}`}><Icon className="h-6 w-6" aria-hidden="true" /></div></div></button>;
                  })}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                  {statusCards.map((card) => (
                    <Link
                      key={card.label}
                      href={card.href}
                      className={`block rounded-3xl border bg-[#0b1f14]/60 p-5 shadow-2xl backdrop-blur-md transition ${card.classes}`}
                    >
                      <p className="text-xs text-slate-400">{card.label}</p>
                      <p className={`mt-1 text-2xl font-bold ${card.textClass}`}>{card.value}</p>
                    </Link>
                  ))}
                </div>
                <DocumentStatsChart documents={documents} />
                <DocumentStatusPieChart />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <button type="button" onClick={() => router.push("/contracts?status=draft")} className="group flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-[#0b1f14]/60 p-6 text-left shadow-2xl backdrop-blur-md transition hover:border-amber-500/50"><div><h3 className="font-semibold text-white">Dokumen Berstatus Draft</h3><p className="mt-1 text-xs text-slate-400">Menunggu persetujuan atau finalisasi.</p></div><span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-lg font-bold text-amber-400 transition group-hover:scale-105">{draftCount}</span></button>
                  <button type="button" onClick={() => router.push("/contracts?status=expired")} className="group flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-[#0b1f14]/60 p-6 text-left shadow-2xl backdrop-blur-md transition hover:border-rose-500/50"><div><h3 className="font-semibold text-white">Dokumen Kedaluwarsa</h3><p className="mt-1 text-xs text-slate-400">Memerlukan pembaruan atau adendum.</p></div><span className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-lg font-bold text-rose-400 transition group-hover:scale-105">{expiredCount}</span></button>
                </div>
              </>
            )}
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
