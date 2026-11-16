import Link from "next/link";

export default function DocumentNotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-7 w-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 8h8v8H8zM4 4h4m8 0h4M4 20h4m8 0h4M4 4v4m16-4v4M4 16v4m16-4v4"
            />
          </svg>
        </div>

        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
          Dokumen tidak ditemukan
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Dokumen tidak tersedia
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Dokumen mungkin sudah dihapus atau alamat yang kamu buka tidak benar.
          Periksa kembali alamatnya, atau kembali ke daftar arsip.
        </p>

        <Link
          href="/contracts"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          Kembali ke Arsip Kontrak
        </Link>
      </section>
    </main>
  );
}
