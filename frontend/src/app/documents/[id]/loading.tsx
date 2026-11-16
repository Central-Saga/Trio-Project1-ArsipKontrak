export default function DocumentDetailLoading() {
  return (
    <main
      aria-label="Memuat detail dokumen"
      aria-busy="true"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 md:py-10"
    >
      <div className="mx-auto w-full max-w-6xl animate-pulse space-y-6">
        <div className="h-4 w-32 rounded bg-slate-200" />

        <header className="space-y-3">
          <div className="h-9 w-80 max-w-full rounded-lg bg-slate-200" />
          <div className="h-4 w-96 max-w-full rounded bg-slate-200" />
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-5 w-44 rounded bg-slate-200" />
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-28 rounded bg-slate-200" />
                <div className="h-4 w-3/4 rounded bg-slate-100" />
              </div>
            ))}
          </section>

          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="h-5 w-40 rounded bg-slate-200" />
              <div className="h-9 w-28 rounded-lg bg-slate-200" />
            </div>
            <div className="h-80 rounded-xl bg-slate-100 sm:h-[28rem]" />
            <div className="h-4 w-2/3 rounded bg-slate-100" />
          </section>
        </div>
      </div>

      <p className="sr-only">Sedang memuat detail dokumen.</p>
    </main>
  );
}
