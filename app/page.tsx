const matches = [
  { home: "MEX", away: "CAN", score: "1 - 0", status: "LIVE 67’" },
  { home: "USA", away: "JPN", score: "2 - 2", status: "HT" },
  { home: "BRA", away: "GER", score: "20:00", status: "TODAY" },
];

const groups = [
  ["Group A", "MEX", "CAN", "KOR", "SWE"],
  ["Group B", "ENG", "USA", "MAR", "JPN"],
  ["Group C", "BRA", "GER", "SEN", "PER"],
  ["Group D", "ARG", "FRA", "NED", "AUS"],
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#10233a_0%,#05070A_45%,#020305_100%)] text-white">
      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(0,229,255,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,.15)_1px,transparent_1px)] [background-size:44px_44px]" />
        <header className="relative z-10 flex items-center justify-between border-b border-cyan-400/20 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-cyan-300">LiveBoard 2026</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">World Cup LiveBoard 2026</h1>
          </div>
          <a href="#dashboard" className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-black shadow-[0_0_32px_rgba(0,229,255,.65)]">
            Enter LiveBoard
          </a>
        </header>

        <section className="relative z-10 grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1fr_1.35fr]">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-200">
              Premium TV dashboard • Live scores • Countdown • Bracket
            </p>
            <h2 className="text-5xl font-black leading-tight md:text-7xl">
              Turn your TV into a live World Cup command centre.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              A cinematic second-screen dashboard for fixtures, scores, groups, knockout routes and fullscreen matchday atmosphere.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#dashboard" className="rounded-full bg-cyan-300 px-7 py-4 font-black text-black shadow-[0_0_36px_rgba(0,229,255,.65)]">Get Access — £4.99</a>
              <a href="#tv" className="rounded-full border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Preview TV Mode</a>
            </div>
          </div>

          <div id="dashboard" className="rounded-3xl border border-cyan-300/20 bg-white/10 p-5 shadow-[0_0_80px_rgba(0,229,255,.16)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold text-cyan-200">LIVE MATCH CENTRE</p>
              <p className="rounded-full bg-red-500 px-3 py-1 text-xs font-black">LIVE</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {matches.map((m) => (
                <div key={m.home} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex justify-between text-sm text-slate-300"><span>{m.status}</span><span>WC26</span></div>
                  <div className="mt-4 flex items-center justify-between text-xl font-black">
                    <span>{m.home}</span><span className="text-cyan-200">{m.score}</span><span>{m.away}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {groups.map((g) => (
                <div key={g[0]} className="rounded-2xl border border-cyan-300/10 bg-slate-950/70 p-4">
                  <h3 className="mb-3 font-black text-cyan-200">{g[0]}</h3>
                  {g.slice(1).map((team, i) => (
                    <div key={team} className="flex justify-between border-t border-white/10 py-2 text-sm">
                      <span>{i + 1}. {team}</span><span>{6 - i} pts</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tv" className="relative z-10 mb-10 rounded-3xl border border-goldcup/30 bg-black/50 p-6 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-goldcup">TV Fullscreen Mode</p>
          <h2 className="mt-3 text-4xl font-black">Countdown. Fireworks. Live tournament atmosphere.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">This MVP is ready to deploy. Next step: connect Stripe, your domain and API-Football.</p>
        </section>
      </section>
    </main>
  );
}
