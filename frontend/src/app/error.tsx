"use client";

type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError({ error, reset }: RouteErrorProps) {
  return (
    <main
      role="alert"
      className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-12"
    >
      <section className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
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
              d="M12 8v4m0 4h.01M10.3 3.86 2.82 17a2 2 0 0 0 1.74 3h14.88a2 2 0 0 0 1.74-3L13.7 3.86a2 2 0 0 0-3.4 0Z"
            />
          </svg>
        </div>

        <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">
          Terjadi kesalahan
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Halaman belum bisa ditampilkan
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Maaf, terjadi kesalahan saat menampilkan halaman. Coba muat ulang
          bagian ini. Jika masalah terus terjadi, coba kembali beberapa saat
          lagi.
        </p>

        {error.digest ? (
          <p className="mt-4 text-xs text-slate-400">
            ID referensi: {error.digest}
          </p>
        ) : null}

        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          Coba lagi
        </button>
      </section>
    </main>
  );
}
