import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          404 — Halaman tidak ditemukan
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Halaman yang kamu cari tidak tersedia
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Alamat mungkin salah, atau halaman sudah dipindahkan.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          Kembali ke Dashboard
        </Link>
      </section>
    </main>
  );
}
