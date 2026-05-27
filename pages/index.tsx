import type { CSSProperties } from "react";

const stripeLink = "https://buy.stripe.com/test_eVq5kw6FVfCk9cL97K6oo00";

const leftGroups = [
  ["A", [["🇲🇽 MEX", 6], ["🇨🇦 CAN", 5], ["🇰🇷 KOR", 4], ["🇸🇪 SWE", 3]]],
  ["B", [["🏴 ENG", 6], ["🇺🇸 USA", 5], ["🇲🇦 MAR", 4], ["🇯🇵 JPN", 3]]],
  ["C", [["🇧🇷 BRA", 6], ["🇩🇪 GER", 5], ["🇸🇳 SEN", 4], ["🇵🇪 PER", 3]]],
  ["D", [["🇦🇷 ARG", 6], ["🇫🇷 FRA", 5], ["🇳🇱 NED", 4], ["🇦🇺 AUS", 3]]],
  ["E", [["🇪🇸 ESP", 6], ["🇵🇹 POR", 5], ["🇺🇾 URU", 4], ["🇹🇳 TUN", 3]]],
  ["F", [["🇨🇴 COL", 6], ["🇮🇹 ITA", 5], ["🇨🇮 CIV", 4], ["🇸🇦 KSA", 3]]],
];

const rightGroups = [
  ["G", [["🇧🇪 BEL", 6], ["🇮🇷 IRN", 5], ["🇪🇬 EGY", 4], ["🇳🇿 NZL", 3]]],
  ["H", [["🇫🇷 FRA", 6], ["🇦🇹 AUT", 5], ["🇶🇦 QAT", 4], ["🇨🇱 CHI", 3]]],
  ["I", [["🇦🇷 ARG", 6], ["🇵🇪 PER", 5], ["🇳🇬 NGA", 4], ["🇮🇸 ISL", 3]]],
  ["J", [["🏴 ENG", 6], ["🇩🇰 DEN", 5], ["🇷🇸 SRB", 4], ["🇵🇦 PAN", 3]]],
  ["K", [["🇵🇹 POR", 6], ["🇺🇿 UZB", 5], ["🇬🇭 GHA", 4], ["🇨🇭 SUI", 3]]],
  ["L", [["🇭🇷 CRO", 6], ["🇧🇾 BLR", 5], ["🇩🇿 ALG", 4], ["🇨🇳 CHN", 3]]],
];

const bracketLeft = [
  ["🇲🇽 MEX", "2", "🇲🇦 MAR", "1"],
  ["🇨🇴 COL", "3", "🇪🇸 ESP", "2"],
  ["🇨🇦 CAN", "1", "🇵🇪 PER", "0"],
  ["🇩🇪 GER", "2", "🇦🇹 AUT", "1"],
  ["🇫🇷 FRA", "3", "🇮🇷 IRN", "1"],
  ["🇧🇷 BRA", "4", "🇯🇵 JPN", "1"],
];

const bracketRight = [
  ["🏴 ENG", "2", "🇵🇹 POR", "1"],
  ["🇦🇷 ARG", "2", "🇩🇰 DEN", "0"],
  ["🇧🇪 BEL", "1", "🇮🇹 ITA", "2"],
  ["🇺🇾 URU", "0", "🇵🇹 POR", "1"],
  ["🇵🇹 POR", "2", "🇸🇳 SEN", "0"],
  ["🇰🇷 KOR", "1", "🇧🇷 BRA", "3"],
];

export default function Home() {
  return (
    <main style={page}>
      <header style={topBar}>
        <div>
          <div style={tiny}>FIFA WORLD CUP 2026</div>
          <h1 style={title}>20 FIFA WORLD CUP 26</h1>
          <div style={sub}>UNITED STATES • CANADA • MEXICO</div>
        </div>

        <a href={stripeLink} target="_blank" style={access}>
          GET ACCESS
        </a>
      </header>

      <section style={layout}>
        <aside style={side}>
          <h2 style={sectionTitle}>GROUP STAGE</h2>
          {leftGroups.map((g) => (
            <Group key={g[0] as string} group={g as any} />
          ))}
        </aside>

        <section style={center}>
          <h2 style={sectionTitle}>KNOCKOUT STAGE</h2>

          <div style={knockout}>
            <div style={bracketColumn}>
              {bracketLeft.map((m, i) => (
                <Match key={i} match={m} />
              ))}
            </div>

            <div style={finalZone}>
              <div style={trophy}>🏆</div>
              <div style={finalText}>FINAL</div>
              <div style={date}>JULY 19, 2026 • METLIFE STADIUM</div>

              <div style={scoreBox}>
                <div>
                  <div style={team}>BRAZIL 🇧🇷</div>
                  <div style={bigScore}>2</div>
                </div>

                <div style={ft}>FT</div>

                <div>
                  <div style={team}>🇦🇷 ARGENTINA</div>
                  <div style={bigScore}>1</div>
                </div>
              </div>

              <div style={smallEvent}>⚽ VINI JR. 27’ • RAPHINHA 72’</div>
            </div>

            <div style={bracketColumn}>
              {bracketRight.map((m, i) => (
                <Match key={i} match={m} />
              ))}
            </div>
          </div>

          <div style={bottomGrid}>
            <Panel title="LIVE MATCH CENTER">
              <div style={liveScore}>
                <span>🇧🇷 BRAZIL</span>
                <strong>2 - 1</strong>
                <span>ARGENTINA 🇦🇷</span>
              </div>
              <p style={red}>LIVE 78’</p>
              <p style={muted}>Possession 56% — 44% • VAR check completed</p>
            </Panel>

            <Panel title="TOP SCORERS">
              {["K. Mbappé 5", "L. Messi 4", "Vini Jr. 4", "H. Kane 3"].map((x) => (
                <div key={x} style={row}>{x}</div>
              ))}
            </Panel>

            <Panel title="TOURNAMENT STATS">
              <div style={stats}>48 matches • 128 goals • 2.67 avg</div>
            </Panel>
          </div>
        </section>

        <aside style={side}>
          <h2 style={sectionTitle}>GROUP STAGE</h2>
          {rightGroups.map((g) => (
            <Group key={g[0] as string} group={g as any} />
          ))}
        </aside>
      </section>
    </main>
  );
}

function Group({ group }: { group: [string, [string, number][]] }) {
  return (
    <div style={groupCard}>
      <h3 style={groupTitle}>GROUP {group[0]}</h3>
      {group[1].map((team, i) => (
        <div key={team[0]} style={tableRow}>
          <span>{i + 1}. {team[0]}</span>
          <strong>{team[1]} pts</strong>
        </div>
      ))}
    </div>
  );
}

function Match({ match }: { match: string[] }) {
  return (
    <div style={matchCard}>
      <div style={matchRow}><span>{match[0]}</span><strong>{match[1]}</strong></div>
      <div style={matchRow}><span>{match[2]}</span><strong>{match[3]}</strong></div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: any }) {
  return (
    <div style={panel}>
      <h3 style={panelTitle}>{title}</h3>
      {children}
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at center top,#062a46 0%,#020617 38%,#000 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: 18,
};

const topBar: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid rgba(34,211,238,.25)",
  borderRadius: 24,
  padding: "18px 28px",
  marginBottom: 18,
  background: "rgba(2,6,23,.7)",
};

const tiny: CSSProperties = { color: "#facc15", letterSpacing: ".25em", fontSize: 12 };
const title: CSSProperties = { margin: 0, fontSize: 42, letterSpacing: ".08em" };
const sub: CSSProperties = { color: "#22d3ee", letterSpacing: ".35em", fontSize: 12 };

const access: CSSProperties = {
  background: "#22d3ee",
  color: "black",
  padding: "14px 24px",
  borderRadius: 999,
  textDecoration: "none",
  fontWeight: "bold",
};

const layout: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "300px 1fr 300px",
  gap: 16,
};

const side: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };
const center: CSSProperties = { minWidth: 0 };
const sectionTitle: CSSProperties = { color: "#38bdf8", textAlign: "center", letterSpacing: ".18em", fontSize: 16 };

const groupCard: CSSProperties = {
  border: "1px solid rgba(34,211,238,.28)",
  borderRadius: 16,
  background: "rgba(8,47,73,.55)",
  padding: 10,
};

const groupTitle: CSSProperties = { margin: "0 0 8px", color: "#67e8f9", fontSize: 14 };
const tableRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  borderBottom: "1px solid rgba(255,255,255,.08)",
  padding: "5px 0",
  fontSize: 13,
};

const knockout: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "220px 1fr 220px",
  gap: 18,
  alignItems: "center",
  minHeight: 520,
};

const bracketColumn: CSSProperties = { display: "flex", flexDirection: "column", gap: 14 };

const matchCard: CSSProperties = {
  background: "rgba(15,23,42,.88)",
  border: "1px solid rgba(125,211,252,.35)",
  borderRadius: 14,
  padding: 10,
  boxShadow: "0 0 18px rgba(14,165,233,.18)",
};

const matchRow: CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 13 };

const finalZone: CSSProperties = {
  textAlign: "center",
  border: "1px solid rgba(250,204,21,.35)",
  borderRadius: 30,
  padding: 26,
  background: "radial-gradient(circle,rgba(250,204,21,.16),rgba(2,6,23,.8) 55%)",
  boxShadow: "0 0 80px rgba(250,204,21,.18)",
};

const trophy: CSSProperties = { fontSize: 86 };
const finalText: CSSProperties = { color: "#facc15", fontSize: 32, fontWeight: "bold" };
const date: CSSProperties = { color: "#cbd5e1", fontSize: 12, marginBottom: 20 };

const scoreBox: CSSProperties = {
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  background: "rgba(0,0,0,.45)",
  borderRadius: 18,
  padding: 22,
};

const team: CSSProperties = { color: "#e2e8f0", fontWeight: "bold" };
const bigScore: CSSProperties = { fontSize: 54, fontWeight: "bold", color: "#facc15" };
const ft: CSSProperties = { color: "#67e8f9", fontWeight: "bold" };
const smallEvent: CSSProperties = { color: "#94a3b8", marginTop: 14, fontSize: 12 };

const bottomGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr",
  gap: 14,
  marginTop: 16,
};

const panel: CSSProperties = {
  border: "1px solid rgba(34,211,238,.25)",
  borderRadius: 20,
  background: "rgba(2,6,23,.72)",
  padding: 16,
};

const panelTitle: CSSProperties = { color: "#67e8f9", marginTop: 0 };
const liveScore: CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 22 };
const red: CSSProperties = { color: "#ef4444", fontWeight: "bold" };
const muted: CSSProperties = { color: "#94a3b8" };
const row: CSSProperties = { padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.08)" };
const stats: CSSProperties = { fontSize: 22, color: "#e0f2fe" };
