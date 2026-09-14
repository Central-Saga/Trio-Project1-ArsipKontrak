"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Folder, Lock, Mail, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post("/login", { email, password });
      const data = response.data;

      const token = data.token || data.access_token;
      const user = data.user;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("auth_token", token);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("user_data", JSON.stringify(user));
      }

      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Email atau kata sandi salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/70 via-white to-slate-100 p-4 lg:p-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-2">
        {/* Form Sisi Kiri */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 mb-4">
              <Folder className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Selamat datang kembali
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Masuk untuk mengakses arsip kontrak dan MoU yang tersimpan aman.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-12 text-sm text-slate-900 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Masuk ke Arsip"}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs text-slate-400">
              Akun dibuat dan dikelola oleh Administrator sistem.
            </p>
          </div>
        </div>

        {/* Banner Sisi Kanan dengan Gradasi Hijau Bersih */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-12 text-white">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md border border-white/20">
              <Folder className="h-4 w-4" /> SAGA ARSIP SECURE SYSTEM
            </span>
          </div>

          <div className="relative z-10 my-auto py-12">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
              <Lock className="h-8 w-8 text-emerald-100" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Ruang aman untuk dokumen penting.
            </h2>
            <p className="mt-3 text-emerald-100/90 leading-relaxed text-sm">
              Kelola kontrak, MoU, versi dokumen, dan aktivitas legal dalam satu
              tempat yang terkontrol dan terenkripsi.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs text-emerald-100/80">
            <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
            Enskripsi dan kontrol akses terjaga
          </div>
        </div>
      </div>
    </div>
  );
}
