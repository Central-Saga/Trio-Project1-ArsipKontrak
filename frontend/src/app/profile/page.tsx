"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("auth_token");

    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan masuk kembali.");
      setLoading(false);
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/me");
      const profile = response.data?.data ?? response.data;

      if (!profile || typeof profile !== "object" || !profile.id) {
        throw new Error("Format data profil dari server tidak valid.");
      }

      setUser(profile as CurrentUser);
      localStorage.setItem("user", JSON.stringify(profile));
      localStorage.setItem("user_data", JSON.stringify(profile));
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Gagal memuat profil dari server.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

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

  if (loading) {
    return (
      <main
        role="status"
        className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500"
      >
        Memuat profil dari server...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p role="alert" className="text-sm text-rose-600">
            {error || "Data profil belum tersedia."}
          </p>
          <button
            type="button"
            onClick={() => void loadProfile()}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Coba lagi
          </button>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="ml-2 mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ke halaman login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6 text-slate-900 md:px-10 md:py-8">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Dashboard
        </button>

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl" />

          <div className="relative z-10 mb-6 flex flex-col items-center gap-6 border-b border-slate-100 pb-6 sm:flex-row">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-inner">
              <UserCircle className="h-12 w-12" aria-hidden="true" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              <p className="mt-1 flex items-center justify-center gap-1 text-sm capitalize text-slate-500 sm:justify-start">
                <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Peran Sistem: <span className="font-semibold text-emerald-700">{user.role}</span>
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Informasi Akun</h2>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  <span className="text-sm text-slate-600">Alamat Email</span>
                </div>
                <span className="truncate text-sm font-medium text-slate-900">{user.email}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  <span className="text-sm text-slate-600">ID Pengguna</span>
                </div>
                <span className="text-sm font-medium text-slate-900">#{user.id}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 flex justify-end border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
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