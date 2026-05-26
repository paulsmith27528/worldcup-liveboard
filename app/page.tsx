"use client";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(0,229,255,.25),transparent_40%)]" />

      <header className="flex items-center justify-between">
        <div>
          <p className="text-cyan-300 tracking-[0.4em] text-sm">
            WORLD CUP 2026
          </p>

          <h1 className="text-6xl font-black mt-2">
            LiveBoard
          </h1>
        </div>

        <a
          href="https://buy.stripe.com/test_eVq5kw6FVfCk9cL97K6oo00"
          target="_blank"
          className="rounded-full bg-cyan-300 px-8 py-4 text-black font-black shadow-[0_0_40px_rgba(0,229,255,.4)]"
        >
          Get Access — £4.99
        </a>
      </header>

      <section className="mt-16 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-cyan-400/30 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-cyan-300 text-sm tracking-[0.3em]">
            LIVE MATCH
          </p>

          <div className="mt-6 flex items-center justify-between text-5xl font-black">
            <span>BRA</span>

            <span className="text-cyan-300">
              2 - 1
            </span>

            <span>ARG</span>
          </div>

          <div className="mt-4 text-red-400 font-bold animate-pulse">
            LIVE 78’
          </div>

          <div className="mt-6 text-slate-400">
            Vinicius Jr 27’ • Raphinha 72’
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-400/30 bg-white/5 p-6 backdrop-blur-xl lg:col-span-2">
          <h2 className="text-3xl font-black text-cyan-200">
            Tournament Bracket
          </h2>

          <div className="mt-8 grid grid-cols-5 gap-4 text-center">
            <div className="rounded-2xl bg-white/5 p-4">
              ENG
            </div>

            <div className="rounded-2xl bg-white/5 p-4">
              BRA
            </div>

            <div className="rounded-2xl bg-cyan-300/20 p-4 border border-cyan-300/40">
              FINAL
            </div>

            <div className="rounded-2xl bg-white/5 p-4">
              ARG
            </div>

            <div className="rounded-2xl bg-white/5 p-4">
              FRA
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-4">
        {["Group A", "Group B", "Group C", "Group D"].map((group) => (
          <div
            key={group}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
          >
            <h3 className="text-cyan-300 font-black">
              {group}
            </h3>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>🇧🇷 BRA</span>
                <span>6 pts</span>
              </div>

              <div className="flex justify-between">
                <span>🇦🇷 ARG</span>
                <span>4 pts</span>
              </div>

              <div className="flex justify-between">
                <span>🇫🇷 FRA</span>
                <span>3 pts</span>
              </div>

              <div className="flex justify-between">
                <span>🏴 ENG</span>
                <span>1 pt</span>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
