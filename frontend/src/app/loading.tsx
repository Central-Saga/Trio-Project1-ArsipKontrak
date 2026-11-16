export default function Loading() {
  return (
    <main
      aria-label="Memuat halaman"
      aria-busy="true"
      className="min-h-[60vh] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-7xl animate-pulse space-y-6">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-9 w-64 max-w-full rounded-lg bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-200" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-8 w-20 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-2/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-5 w-48 rounded bg-slate-200" />
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-12 rounded-lg bg-slate-100"
            />
          ))}
        </div>
      </div>

      <p className="sr-only">Sedang memuat halaman Arsip Kontrak.</p>
    </main>
  );
}
