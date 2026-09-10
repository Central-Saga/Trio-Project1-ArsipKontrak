"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, LogOut, Mail, ShieldCheck, UserCircle } from "lucide-react";
import api from "@/lib/api";

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user_data") || localStorage.getItem("user");
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");

    if (!storedUser || !token) {
      router.replace("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/logout");
    } catch {
      // Storage tetap dibersihkan jika request logout gagal.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      router.replace("/login");
    }
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0f19] text-sm text-slate-400">
        Memuat profil...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] px-6 py-6 text-slate-100 md:px-10 md:py-8">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-3 flex items-center gap-2 text-sm text-slate-400 transition hover:text-emerald-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Dashboard
        </button>

        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-8 shadow-2xl backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 mb-6 flex flex-col items-center gap-6 border-b border-emerald-500/20 pb-6 sm:flex-row">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-inner">
              <UserCircle className="h-12 w-12" aria-hidden="true" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="mt-1 flex items-center justify-center gap-1 text-sm capitalize text-emerald-400/80 sm:justify-start">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Peran Sistem: <span className="font-semibold text-emerald-300">{user.role}</span>
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Informasi Akun</h2>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                  <span className="text-sm text-slate-300">Alamat Email</span>
                </div>
                <span className="truncate text-sm font-medium text-white">{user.email}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                  <span className="text-sm text-slate-300">ID Pengguna</span>
                </div>
                <span className="text-sm font-medium text-white">#{user.id}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 flex justify-end border-t border-emerald-500/20 pt-6">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {loggingOut ? "Keluar..." : "Keluar Akun"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}