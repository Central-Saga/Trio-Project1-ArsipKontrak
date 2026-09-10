"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Email atau kata sandi tidak valid.");
      }

      // Simpan token & profil pengguna
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("user_data", JSON.stringify(data.user));

      // Arahkan ke dashboard utama
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal terhubung ke server backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0f19] px-4 py-6 text-slate-100 sm:px-8 lg:flex lg:items-center lg:justify-center">
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-emerald-900/40 bg-[#0b0f19] shadow-2xl lg:flex-row">
        <section className="relative flex flex-col justify-between bg-gradient-to-br from-[#0b0f19] via-[#0f1e1a] to-[#0b0f19] p-8 lg:w-1/2 lg:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 6.75A2.25 2.25 0 016 4.5h4l2 2h6A2.25 2.25 0 0120.25 8.75v8.5A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25v-10.5z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-wider text-white">SAGA ARSIP</span>
          </div>

          <div className="my-auto py-12 lg:py-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Secure document workspace</p>
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
              Kelola Arsip<br />Lebih <span className="text-emerald-400">Aman &amp; Cepat</span>
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              Sistem manajemen dokumen legal terintegrasi dengan perlindungan enkripsi tingkat tinggi untuk arsip kontrak dan MoU instansi Anda.
            </p>
          </div>

          <p className="text-xs text-slate-500">&copy; 2026 SAGA ARSIP. Secured System.</p>
        </section>

        <section className="flex flex-col justify-center border-t border-emerald-900/30 bg-[#0d1322]/80 p-8 backdrop-blur-md lg:w-1/2 lg:border-l lg:border-t-0 lg:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">Masuk</h2>
            <p className="mt-1 text-sm text-slate-400">Masukkan kredensial akun Anda untuk melanjutkan.</p>
          </div>

        {errorMsg && (
          <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center text-sm text-rose-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-slate-800 bg-[#0b0f19] px-4 py-3 text-sm text-white placeholder:text-slate-600 transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-[#0b0f19] px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-600 transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-emerald-400 transition"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex cursor-pointer items-center text-slate-400">
              <input type="checkbox" className="mr-2 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500" />
              Ingat saya
            </label>
            <a href="#forgot" className="text-emerald-400 transition hover:text-emerald-300 hover:underline">Lupa sandi?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition duration-200 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Memproses Masuk..." : "Masuk"}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800 pt-4 text-center text-xs text-slate-500">
          Akun dibuat dan dikelola oleh Administrator sistem.
        </div>
        </section>
      </div>
    </main>
  );
}
