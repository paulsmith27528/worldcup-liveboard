import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "World Cup Sweepstake 2026 — Live Leaderboard & Dashboard",
  description:
    "The easiest World Cup sweepstake ever. One link, everyone registers themselves, live leaderboard updates automatically. No spreadsheets. No paper. No hats.",
};

const STRIPE = {
  sweepstake: "https://buy.stripe.com/3cI4gs5BudLndXU2aR3F601",
  dashboard: "https://buy.stripe.com/bJe4gsd3W8r39HEbLr3F600",
  bundle: "https://buy.stripe.com/7sYbIUd3WfTv9HE9Dj3F602",
};

const steps = [
  {
    number: "01",
    title: "Share one link",
    desc: "Send your join link to the group. WhatsApp, Slack, email — wherever they live.",
  },
  {
    number: "02",
    title: "Everyone registers themselves",
    desc: "No chasing. No spreadsheets. No paper. No hats. They click, they're in.",
  },
  {
    number: "03",
    title: "Watch the chaos unfold",
    desc: "The draw happens automatically. The leaderboard updates live. You just enjoy it.",
  },
];

const features = [
  { emoji: "🎯", title: "Random draw", desc: "48 teams assigned fairly and automatically. No arguments." },
  { emoji: "📊", title: "Live leaderboard", desc: "Updates automatically as matches are played. Zero admin." },
  { emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", title: "48 team cards", desc: "Every participant gets a team card with flag, group and status." },
  { emoji: "📺", title: "Live match centre", desc: "Today's fixtures, live scores and results in one place." },
  { emoji: "🎉", title: "Celebrations", desc: "Animations fire when your team scores or advances. Pure drama." },
  { emoji: "📱", title: "Any device", desc: "Phone, tablet, laptop, TV. No app. No install. Just a link." },
];

const matches = [
  { home: "ENG", away: "USA", score: "2 - 1", status: "LIVE 74'" },
  { home: "BRA", away: "ARG", score: "1 - 1", status: "HT" },
  { home: "FRA", away: "GER", score: "19:00", status: "TODAY" },
];

const groups = [
  { name: "Group A", teams: ["MEX", "CAN", "KOR", "SWE"] },
  { name: "Group B", teams: ["ENG", "USA", "MAR", "JPN"] },
  { name: "Group C", teams: ["BRA", "GER", "SEN", "PER"] },
  { name: "Group D", teams: ["ARG", "FRA", "NED", "AUS"] },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#10233a_0%,#05070A_50%,#020305_100%)] text-white">

      <div className="pointer-events-none fixed inset-0 opacity-20 [background-image:linear-gradient(rgba(0,229,255,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,.15)_1px,transparent_1px)] [background-size:44px_44px]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-b border-cyan-400/20 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.45em] text-cyan-300">LiveBoard 2026</p>
          <p className="mt-1 text-lg font-black">worldcupsweepstake-liveboard.com</p>
        </div>
        <a href={STRIPE.sweepstake} className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black shadow-[0_0_32px_rgba(0,229,255,.65)] transition hover:opacity-90">
          Start My Sweepstake
        </a>
      </header>

      <div className="relative z-10 border-b border-amber-400/20 bg-amber-400/10 py-2 text-center">
        <p className="text-sm font-bold text-amber-300">
          ⚽ Tournament starts 11 June — <span className="text-white">6 days to set up your sweepstake</span>
        </p>
      </div>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
          Be one of the first 500 groups — tournament starts in 6 days
        </div>

        <h1 className="text-6xl font-black leading-none tracking-tight md:text-8xl lg:text-9xl">
          World Cup<br />
          <span className="text-cyan-300">Sweepstake</span><br />
          2026
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-xl font-medium text-slate-300 md:text-2xl">
          48 teams. 48 nations. United by football.
        </p>

        <p className="mt-4 text-lg font-black text-white md:text-xl">
          No spreadsheets. No paper. No hats.
        </p>

        <p className="mx-auto mt-3 max-w-lg text-slate-400">
          Less than a round of drinks. Set it up in 5 minutes. Argue about it for 6 weeks.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href={STRIPE.sweepstake} className="rounded-full bg-cyan-300 px-8 py-5 text-lg font-black text-black shadow-[0_0_48px_rgba(0,229,255,.6)] transition hover:opacity-90">
            Start My Sweepstake — £4.99
          </a>
          <a href={STRIPE.bundle} className="rounded-full border border-amber-400/50 bg-amber-400/10 px-8 py-5 text-lg font-black text-amber-300 transition hover:bg-amber-400/20">
            ⚡ Bundle Deal — £5.99
          </a>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Instant access link sent to your email · Secure checkout via Stripe · Works on any device
        </p>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-cyan-300/20 bg-white/5 p-6 shadow-[0_0_100px_rgba(0,229,255,.12)] backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Live Match Centre</p>
              <p className="mt-1 text-lg font-black">World Cup 2026</p>
            </div>
            <span className="animate-pulse rounded-full bg-red-500 px-3 py-1 text-xs font-black">● LIVE</span>
          </div>
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            {matches.map((m) => (
              <div key={m.home} className="rounded-2xl border border-white/10 bg-black/50 p-4">
                <div className="mb-3 flex justify-between text-xs text-slate-400">
                  <span className={m.status.includes("LIVE") ? "text-red-400 font-bold" : ""}>{m.status}</span>
                  <span>WC26</span>
                </div>
                <div className="flex items-center justify-between text-xl font-black">
                  <span>{m.home}</span>
                  <span className="text-cyan-300">{m.score}</span>
                  <span>{m.away}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {groups.map((g) => (
              <div key={g.name} className="rounded-2xl border border-cyan-300/10 bg-black/40 p-4">
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-cyan-300">{g.name}</h3>
                {g.teams.map((team, i) => (
                  <div key={team} className="flex justify-between border-t border-white/5 py-2 text-sm">
                    <span className={i < 2 ? "text-white" : "text-slate-500"}>{i + 1}. {team}</span>
                    <span className="text-slate-400">{6 - i * 2} pts</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-slate-600">Preview — live data powered by API-Football once tournament begins</p>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.4em] text-cyan-300">How it works</p>
        <h2 className="mb-12 text-center text-4xl font-black md:text-5xl">Up and running in 5 minutes</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.number} className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <p className="mb-4 text-5xl font-black text-cyan-300/30">{s.number}</p>
              <h3 className="mb-3 text-xl font-black">{s.title}</h3>
              <p className="text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.4em] text-cyan-300">Everything included</p>
        <h2 className="mb-12 text-center text-4xl font-black md:text-5xl">Built for the tournament</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="mb-3 text-3xl">{f.emoji}</p>
              <h3 className="mb-2 text-lg font-black">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20" id="pricing">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.4em] text-cyan-300">Pricing</p>
        <h2 className="mb-4 text-center text-4xl font-black md:text-5xl">One-off. No subscription.</h2>
        <p className="mb-12 text-center text-slate-400">Pay once. Yours for the entire tournament.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">📺 Live Dashboard</p>
            <p className="mt-3 text-4xl font-black">£2.99</p>
            <p className="mt-2 text-sm text-slate-400">Live scores, full bracket, group tables, top scorers</p>
            <a href={STRIPE.dashboard} className="mt-6 block rounded-full border border-white/20 bg-white/10 py-3 text-center text-sm font-bold transition hover:bg-white/20">Get Dashboard</a>
          </div>
          <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/5 p-8">
            <p className="mb-1 text-xs uppercase tracking-wider text-cyan-300">🏆 Sweepstake</p>
            <p className="mt-3 text-4xl font-black">£4.99</p>
            <p className="mt-2 text-sm text-slate-400">Self-registration, random draw, live leaderboard, pot tracker</p>
            <a href={STRIPE.sweepstake} className="mt-6 block rounded-full bg-cyan-300 py-3 text-center text-sm font-black text-black shadow-[0_0_24px_rgba(0,229,255,.4)] transition hover:opacity-90">Start My Sweepstake</a>
          </div>
          <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-8 relative overflow-hidden">
            <div className="absolute right-4 top-4 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-black text-black">BEST VALUE</div>
            <p className="mb-1 text-xs uppercase tracking-wider text-amber-300">⚡ Bundle</p>
            <p className="mt-3 text-4xl font-black text-amber-300">£5.99</p>
            <p className="mt-2 text-sm text-slate-400">Everything. Dashboard + Sweepstake. For your whole group.</p>
            <a href={STRIPE.bundle} className="mt-6 block rounded-full bg-amber-400 py-3 text-center text-sm font-black text-black transition hover:opacity-90">Get the Bundle — £5.99</a>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">Secure checkout via Stripe · Instant access link to your email · Works on any device</p>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24 text-center">
        <div className="rounded-3xl border border-cyan-300/20 bg-white/5 p-12 shadow-[0_0_80px_rgba(0,229,255,.08)]">
          <p className="mb-4 text-5xl">⚽</p>
          <h2 className="text-4xl font-black md:text-5xl">6 days. 48 teams.<br />One sweepstake.</h2>
          <p className="mx-auto mt-4 max-w-md text-slate-400">The tournament starts 11 June. Don't be the person who nearly organised it.</p>
          <a href={STRIPE.sweepstake} className="mt-8 inline-block rounded-full bg-cyan-300 px-10 py-5 text-lg font-black text-black shadow-[0_0_48px_rgba(0,229,255,.5)] transition hover:opacity-90">
            Start My Sweepstake — £4.99
          </a>
          <p className="mt-4 text-sm text-slate-500">Less than a round of drinks. Set it up in 5 minutes. Argue about it for 6 weeks.</p>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-sm text-slate-600">
        <p>worldcupsweepstake-liveboard.com · myofficesweepstake.com</p>
        <p className="mt-1">Secure payments via Stripe · Questions? hello@worldcupsweepstake-liveboard.com</p>
      </footer>

    </main>
  );
}
