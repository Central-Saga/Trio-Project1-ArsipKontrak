"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileKey2, LockKeyhole, Mail } from "lucide-react";

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

      // Arahkan ke dashboard utama
      router.push("/");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal terhubung ke server backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030905] px-4 py-8 font-sans text-slate-100">
      <div className="pointer-events-none absolute -left-40 -top-48 h-[520px] w-[520px] rounded-full bg-emerald-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-56 -right-48 h-[620px] w-[620px] rounded-full bg-teal-900/30 blur-[150px]" />

      <div className="relative z-10 flex min-h-[620px] w-full max-w-[1000px] overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-[#0b1f14]/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:h-[620px]">
        <section className="flex w-full flex-col justify-center px-7 py-12 sm:px-12 lg:w-1/2 lg:py-0">
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.12)]">
              <FileKey2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Selamat datang kembali</h1>
            <p className="mt-2 text-sm leading-6 text-emerald-100/60">Masuk untuk mengakses arsip kontrak dan MoU yang tersimpan aman.</p>
          </div>

          {errorMsg && <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-sm text-rose-300">{errorMsg}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-100/60">Alamat Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400/70" aria-hidden="true" />
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/60 px-4 py-3 pl-11 text-sm text-white outline-none transition placeholder:text-emerald-700/60 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-100/60">Kata Sandi</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400/70" aria-hidden="true" />
                <input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/60 px-4 py-3 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-emerald-700/60 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-emerald-100/40 transition hover:text-emerald-300">
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-900/40 transition-all duration-300 hover:from-emerald-400 hover:to-teal-500 disabled:cursor-wait disabled:opacity-50">
              {loading ? "Memproses Masuk..." : "MASUK KE ARSIP"}
            </button>
          </form>

          <p className="mt-7 border-t border-emerald-500/15 pt-5 text-center text-xs text-emerald-100/40 lg:text-left">Akun dibuat dan dikelola oleh Administrator sistem.</p>
        </section>

        <aside className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden rounded-l-[7rem] border-l border-emerald-500/10 bg-gradient-to-br from-emerald-950 via-[#041209] to-[#020804] px-10 text-center shadow-2xl lg:flex">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative z-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
              <FileKey2 className="h-10 w-10" aria-hidden="true" />
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400/70">SAGA ARSIP</p>
            <h2 className="text-3xl font-bold text-white">Ruang aman untuk dokumen penting.</h2>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-emerald-100/55">Kelola kontrak, MoU, versi dokumen, dan aktivitas legal dalam satu tempat yang terkontrol.</p>
            <div className="mx-auto mt-8 flex items-center justify-center gap-2 text-xs text-emerald-300/60"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> Enkripsi dan kontrol akses terjaga</div>
          </div>
        </aside>
      </div>
    </main>
  );
}
