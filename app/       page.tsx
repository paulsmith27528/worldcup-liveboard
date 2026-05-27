"use client";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0ea5e9_0%,#020617_45%,#000_100%)]" />

      {/* Content */}
      <div className="relative z-10 px-6 py-10">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-cyan-500/20 pb-6">
          <div>
            <p className="text-cyan-300 tracking-[0.35em] text-xs uppercase">
              FIFA WORLD CUP 2026
            </p>

            <h1 className="mt-3 text-5xl font-black md:text-7xl">
              LiveBoard
            </h1>
          </div>

          <a
            href="https://buy.stripe.com/test_eVq5kw6FVfCk9cL97K6oo00"
            target="_blank"
            className="rounded-full bg-cyan-400 px-6 py-3 font-bold text-black shadow-[0_0_30px_rgba(34,211,238,.6)]"
          >
            Get Access — £4.99
          </a>
        </header>

        {/* Hero */}
        <section className="mt-16 grid gap-8 lg:grid-cols-2">

          {/* Left */}
          <div className="rounded-3xl border border-cyan-500/20 bg-white/5 p-8 backdrop-blur-xl">
            <p className="mb-4 inline-block rounded-full bg-red-500 px-3 py-1 text-xs font-bold">
              LIVE
            </p>

            <h2 className="text-4xl font-black leading-tight">
              Premium World Cup 2026 Dashboard
            </h2>

            <p className="mt-6 text-slate-300 leading-8">
              Real-time fixtures, knockout brackets, live match tracking,
              standings, statistics, and futuristic sports broadcast visuals.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              <div className="rounded-2xl bg-cyan-500/10 p-5 border border-cyan-400/20">
                <p className="text-sm text-cyan-200">Matches</p>
                <p className="mt-2 text-3xl font-black">104</p>
              </div>

              <div className="rounded-2xl bg-cyan-500/10 p-5 border border-cyan-400/20">
                <p className="text-sm text-cyan-200">Teams</p>
                <p className="mt-2 text-3xl font-black">48</p>
              </div>

              <div className="rounded-2xl bg-cyan-500/10 p-5 border border-cyan-400/20">
                <p className="text-sm text-cyan-200">Live</p>
                <p className="mt-2 text-3xl font-black text-red-400">
                  12
                </p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-cyan-500/10 p-8 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">
              FINAL
            </p>

            <h3 className="mt-4 text-5xl font-black">
              Brazil 2 — 1 Argentina
            </h3>

            <p className="mt-6 text-slate-300">
              MetLife Stadium • New Jersey
            </p>

            <div className="mt-10 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-6">
              <div>
                <p className="text-sm text-slate-400">Minute</p>
                <p className="text-4xl font-black text-red-400">78’</p>
              </div>

              <div className="h-16 w-px bg-white/10" />

              <div>
                <p className="text-sm text-slate-400">Status</p>
                <p className="text-4xl font-black text-cyan-300">
                  LIVE
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-white/10 pt-6 text-center text-sm text-slate-500">
          World Cup LiveBoard 2026 • Futuristic Football Dashboard
        </footer>

      </div>
    </main>
  );
}
