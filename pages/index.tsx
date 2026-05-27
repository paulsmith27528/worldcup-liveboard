import type { CSSProperties } from "react";

const groups = [
  ["Group A", [["MEX", 6], ["CAN", 5], ["KOR", 4], ["SWE", 3]]],
  ["Group B", [["ENG", 6], ["USA", 5], ["MAR", 4], ["JPN", 3]]],
  ["Group C", [["BRA", 6], ["GER", 5], ["SEN", 4], ["PER", 3]]],
];

const matches = [
  ["LIVE 78'", "BRA", "2", "ARG", "1"],
  ["HT", "USA", "2", "JPN", "2"],
  ["TODAY 20:00", "ENG", "-", "FRA", "-"],
];

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #0ea5e9 0%, #020617 40%, #000 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: 32,
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <p
            style={{
              color: "#67e8f9",
              letterSpacing: "0.35em",
              fontSize: 12,
            }}
          >
            FIFA WORLD CUP 2026
          </p>

          <h1 style={{ fontSize: 56, margin: 0 }}>LiveBoard</h1>
        </div>

        <a
          href="https://buy.stripe.com/test_eVq5kw6FVfCk9cL97K6oo00"
          target="_blank"
          style={{
            background: "#22d3ee",
            color: "black",
            padding: "16px 28px",
            borderRadius: 999,
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          Get Access — £4.99
        </a>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        <div style={card}>
          <span style={live}>LIVE</span>

          <h2 style={{ fontSize: 42 }}>Premium World Cup Dashboard</h2>

          <p style={muted}>
            Real-time fixtures, scores, standings and knockout routes in a
            cinematic TV dashboard.
          </p>

          <div style={row}>
            <div style={bracket}>
              <p style={muted}>Matches</p>
              <h3>104</h3>
            </div>

            <div style={bracket}>
              <p style={muted}>Teams</p>
              <h3>48</h3>
            </div>

            <div style={bracket}>
              <p style={muted}>Live</p>
              <h3>12</h3>
            </div>
          </div>
        </div>

        <div style={cardGold}>
          <p
            style={{
              color: "#fde047",
              letterSpacing: "0.3em",
              fontSize: 14,
            }}
          >
            WORLD CUP FINAL
          </p>

          <h2 style={{ fontSize: 64, marginBottom: 20 }}>
            Brazil 2 — 1 Argentina
          </h2>

          <p style={muted}>MetLife Stadium • New Jersey</p>

          <div
            style={{
              background: "rgba(0,0,0,.5)",
              borderRadius: 28,
              padding: 32,
              marginTop: 30,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={muted}>Minute</p>
              <h2 style={{ color: "#fb7185", fontSize: 64 }}>78’</h2>
            </div>

            <div>
              <p style={muted}>Status</p>
              <h2 style={{ color: "#67e8f9", fontSize: 64 }}>LIVE</h2>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          marginTop: 32,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 24,
        }}
      >
        <div style={card}>
          <h2>Live Matches</h2>

          {matches.map((m, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,.05)",
                borderRadius: 20,
                padding: 20,
                marginTop: 16,
              }}
            >
              <p style={{ color: "#22d3ee" }}>{m[0]}</p>

              <h3>
                {m[1]} {m[2]} — {m[4]} {m[3]}
              </h3>
            </div>
          ))}
        </div>

        <div style={card}>
          <h2>Group Stage</h2>

          {groups.map((g, i) => (
            <div key={i} style={{ marginTop: 24 }}>
              <h3 style={{ color: "#67e8f9" }}>{g[0]}</h3>

              {(g[1] as any[]).map((team: any, j: number) => (
                <div
                  key={j}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(255,255,255,.08)",
                  }}
                >
                  <span>{team[0]}</span>
                  <strong>{team[1]} pts</strong>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={card}>
          <h2>Knockout Bracket</h2>

          <div style={{ marginTop: 24 }}>
            <div style={bracket}>BRA 2 — 1 ARG</div>
            <div style={bracket}>ENG 3 — 2 FRA</div>
            <div style={bracket}>USA 1 — 0 GER</div>
            <div style={bracket}>POR 2 — 0 SEN</div>
          </div>
        </div>
      </section>
    </main>
  );
}

const card: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(2,6,23,.96), rgba(15,23,42,.85))",
  border: "1px solid rgba(34,211,238,.2)",
  borderRadius: 32,
  padding: 36,
  boxShadow: "0 0 40px rgba(14,165,233,.15)",
};

const cardGold: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(250,204,21,.15), rgba(8,47,73,.8))",
  border: "1px solid rgba(250,204,21,.25)",
  borderRadius: 32,
  padding: 36,
  boxShadow: "0 0 40px rgba(250,204,21,.1)",
};

const muted: CSSProperties = {
  color: "#94a3b8",
  lineHeight: 1.7,
};

const live: CSSProperties = {
  background: "#ef4444",
  display: "inline-block",
  padding: "10px 16px",
  borderRadius: 999,
  fontWeight: "bold",
};

const row: CSSProperties = {
  display: "flex",
  gap: 16,
  marginTop: 32,
};

const bracket: CSSProperties = {
  flex: 1,
  background: "rgba(15,23,42,.9)",
  border: "1px solid rgba(34,211,238,.2)",
  borderRadius: 24,
  padding: 24,
  marginBottom: 16,
};